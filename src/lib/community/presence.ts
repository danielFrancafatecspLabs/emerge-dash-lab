import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

// Último acesso de cada pessoa à Comunidade (base de "ativo agora" e "visto há…").

export interface Presence {
  userId: string // username
  userName: string
  userLab: string
  lastSeen: string
}

function presencePath(): string {
  return jsonStorePath('CHAT_PRESENCE_PATH', 'chat-presence.json')
}

export function loadPresence(): Presence[] {
  return readJsonStore<Presence[]>(presencePath(), [])
}

export function savePresence(presence: Presence[]): void {
  writeJsonStore(presencePath(), presence)
}
