import { writeFile } from "node:fs/promises";

const BASE_URL = "https://jsonplaceholder.typicode.com";
const CHOSEN_USER_IDS = [1, 2, 3];
const DEFAULT_PASSWORD = "123456";
const RESOURCE_NAMES = ["users", "todos", "posts", "comments", "albums", "photos"];

const fetchResource = async (resourceName) => {
  const response = await fetch(`${BASE_URL}/${resourceName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resourceName}: ${response.status}`);
  }
  return response.json();
};

const isChosenUser = (userId) => CHOSEN_USER_IDS.includes(userId);

const buildDb = async () => {
  const [allUsers, allTodos, allPosts, allComments, allAlbums, allPhotos] =
    await Promise.all(RESOURCE_NAMES.map(fetchResource));

  const users = allUsers
    .filter((user) => isChosenUser(user.id))
    .map((user) => ({ ...user, password: DEFAULT_PASSWORD }));

  const todos = allTodos.filter((todo) => isChosenUser(todo.userId));
  const posts = allPosts.filter((post) => isChosenUser(post.userId));
  const albums = allAlbums.filter((album) => isChosenUser(album.userId));

  const postIds = new Set(posts.map((post) => post.id));
  const ownerByAlbumId = new Map(albums.map((album) => [album.id, album.userId]));
  const getUserByIndex = (index) => users[index % users.length];

  const comments = allComments
    .filter((comment) => postIds.has(comment.postId))
    .map((comment, index) => {
      const author = getUserByIndex(index);
      return { ...comment, userId: author.id, email: author.email };
    });

  const photos = allPhotos
    .filter((photo) => ownerByAlbumId.has(photo.albumId))
    .map((photo) => ({
      ...photo,
      userId: ownerByAlbumId.get(photo.albumId),
      url: `https://picsum.photos/seed/${photo.id}/600`,
      thumbnailUrl: `https://picsum.photos/seed/${photo.id}/150`,
    }));

  return { users, todos, posts, comments, albums, photos };
};

const db = await buildDb();
const dbText = JSON.stringify(db, null, 2);
await writeFile("server/db.seed.json", dbText);
await writeFile("server/db.json", dbText);
console.log(
  "db ready:",
  Object.fromEntries(Object.entries(db).map(([name, items]) => [name, items.length]))
);