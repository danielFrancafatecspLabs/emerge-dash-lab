// Mensagens diretas entre duas pessoas da Comunidade (regras puras, usadas também no navegador).
// A persistência fica em community-messages-store.ts; a interface consulta o servidor periodicamente.

export interface DirectMessage {
  id: string
  from: string
  text: string
  createdAt: string
}

export interface Conversation {
  id: string
  participantes: [string, string]
  mensagens: DirectMessage[]
  lidoEm: Record<string, string>
}

export interface ConversationSummary {
  id: string
  com: string
  ultima: DirectMessage | null
  naoLidas: number
}

export const MAX_MESSAGE_LENGTH = 2000

export function conversationId(a: string, b: string): string {
  return [a, b].sort().join('::')
}

export function unreadCount(conv: Conversation, username: string): number {
  const lido = conv.lidoEm[username] ? Date.parse(conv.lidoEm[username]) : 0
  return conv.mensagens.filter(m => m.from !== username && Date.parse(m.createdAt) > lido).length
}

export function summarizeConversations(convs: Conversation[], username: string): ConversationSummary[] {
  return convs
    .filter(c => c.participantes.includes(username) && c.mensagens.length > 0)
    .map(c => ({
      id: c.id,
      com: c.participantes[0] === username ? c.participantes[1] : c.participantes[0],
      ultima: c.mensagens[c.mensagens.length - 1] ?? null,
      naoLidas: unreadCount(c, username),
    }))
    .sort((a, b) => Date.parse(b.ultima?.createdAt ?? '0') - Date.parse(a.ultima?.createdAt ?? '0'))
}
