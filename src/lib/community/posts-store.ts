import type { StoredPost } from '@/lib/community/model'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

function getPostsFilePath(): string {
  return jsonStorePath('POSTS_FILE_PATH', 'posts.json')
}

export function loadPosts(): StoredPost[] {
  return readJsonStore<StoredPost[]>(getPostsFilePath(), [])
}

export function savePosts(posts: StoredPost[]): void {
  writeJsonStore(getPostsFilePath(), posts)
}
