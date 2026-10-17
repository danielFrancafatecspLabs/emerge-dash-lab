import type { Conversation } from './community-messages'
import { jsonStorePath, readJsonStore, writeJsonStore } from './json-store'

// Conversas diretas persistidas em data/community-messages.json.

function messagesPath(): string {
  return jsonStorePath('COMMUNITY_MESSAGES_PATH', 'community-messages.json')
}

export function loadConversations(): Conversation[] {
  return readJsonStore<Conversation[]>(messagesPath(), [])
}

export function saveConversations(convs: Conversation[]): void {
  writeJsonStore(messagesPath(), convs)
}
