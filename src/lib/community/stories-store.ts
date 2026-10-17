import { Story } from '@/lib/community/stories'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

function getStoriesFilePath(): string {
  return jsonStorePath('STORIES_FILE_PATH', 'stories.json')
}

export function loadStories(): Story[] {
  return readJsonStore<Story[]>(getStoriesFilePath(), [])
}

export function saveStories(stories: Story[]): void {
  writeJsonStore(getStoriesFilePath(), stories)
}
