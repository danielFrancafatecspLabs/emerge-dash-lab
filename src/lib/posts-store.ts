import type { StoredPost } from './community'
import { jsonStorePath, readJsonStore, writeJsonStore } from './json-store'

function getPostsFilePath(): string {
  return jsonStorePath('POSTS_FILE_PATH', 'posts.json')
}

export function loadPosts(): StoredPost[] {
  return readJsonStore<StoredPost[]>(getPostsFilePath(), [])
}

export function savePosts(posts: StoredPost[]): void {
  writeJsonStore(getPostsFilePath(), posts)
}
