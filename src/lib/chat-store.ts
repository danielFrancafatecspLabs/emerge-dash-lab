import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { ChatMessage, ChatPresence } from './chat'

const MAX_MESSAGES = 200

function getMessagesPath(): string {
  return process.env.CHAT_MESSAGES_PATH ?? join(process.cwd(), 'data', 'chat-messages.json')
}

function getPresencePath(): string {
  return process.env.CHAT_PRESENCE_PATH ?? join(process.cwd(), 'data', 'chat-presence.json')
}

export function loadMessages(): ChatMessage[] {
  const path = getMessagesPath()
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ChatMessage[]
  } catch {
    return []
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  const path = getMessagesPath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  // Keep only last MAX_MESSAGES
  const trimmed = messages.slice(-MAX_MESSAGES)
  writeFileSync(path, JSON.stringify(trimmed, null, 2))
}

export function loadPresence(): ChatPresence[] {
  const path = getPresencePath()
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ChatPresence[]
  } catch {
    return []
  }
}

export function savePresence(presence: ChatPresence[]): void {
  const path = getPresencePath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(presence, null, 2))
}