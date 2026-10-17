import type { Conversation } from '@/lib/community/messages'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

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
