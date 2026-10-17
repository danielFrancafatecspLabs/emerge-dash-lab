import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { CommunityPost } from './community'

function getPostsFilePath(): string {
  return process.env.POSTS_FILE_PATH ?? join(process.cwd(), 'data', 'posts.json')
}

export function loadPosts(): CommunityPost[] {
  const path = getPostsFilePath()
  if (!existsSync(path)) return []
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as CommunityPost[]
  } catch {
    return []
  }
}

export function savePosts(posts: CommunityPost[]): void {
  const path = getPostsFilePath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(posts, null, 2))
}