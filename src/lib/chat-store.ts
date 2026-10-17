import { ChatPresence } from './chat'
import { jsonStorePath, readJsonStore, writeJsonStore } from './json-store'

function getPresencePath(): string {
  return jsonStorePath('CHAT_PRESENCE_PATH', 'chat-presence.json')
}

export function loadPresence(): ChatPresence[] {
  return readJsonStore<ChatPresence[]>(getPresencePath(), [])
}

export function savePresence(presence: ChatPresence[]): void {
  writeJsonStore(getPresencePath(), presence)
}
