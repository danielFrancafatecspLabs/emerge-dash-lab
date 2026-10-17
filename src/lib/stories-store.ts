import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { Story } from './stories'

function getStoriesFilePath(): string {
  return process.env.STORIES_FILE_PATH ?? join(process.cwd(), 'data', 'stories.json')
}

export function loadStories(): Story[] {
  const path = getStoriesFilePath()
  if (!existsSync(path)) return []
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as Story[]
  } catch {
    return []
  }
}

export function saveStories(stories: Story[]): void {
  const path = getStoriesFilePath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(stories, null, 2))
}