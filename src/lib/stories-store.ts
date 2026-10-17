import { Story } from './stories'
import { jsonStorePath, readJsonStore, writeJsonStore } from './json-store'

function getStoriesFilePath(): string {
  return jsonStorePath('STORIES_FILE_PATH', 'stories.json')
}

export function loadStories(): Story[] {
  return readJsonStore<Story[]>(getStoriesFilePath(), [])
}

export function saveStories(stories: Story[]): void {
  writeJsonStore(getStoriesFilePath(), stories)
}
