import { describe, expect, it } from 'vitest'
import { conversationId, summarizeConversations, type Conversation } from './community-messages'

describe('summarizeConversations', () => {
  const conv: Conversation = {
    id: conversationId('eu', 'ana'),
    participantes: ['ana', 'eu'],
    mensagens: [
      { id: '1', from: 'ana', text: 'oi', createdAt: '2026-10-17T10:00:00Z' },
      { id: '2', from: 'eu', text: 'olá', createdAt: '2026-10-17T10:01:00Z' },
      { id: '3', from: 'ana', text: 'tudo bem?', createdAt: '2026-10-17T10:05:00Z' },
    ],
    lidoEm: { eu: '2026-10-17T10:01:00Z' },
  }

  it('usa um id estável independente da ordem', () => {
    expect(conversationId('eu', 'ana')).toBe(conversationId('ana', 'eu'))
  })

  it('mostra a outra pessoa, a última mensagem e quantas não foram lidas', () => {
    expect(summarizeConversations([conv], 'eu')).toEqual([{ id: conv.id, com: 'ana', ultima: conv.mensagens[2], naoLidas: 1 }])
    expect(summarizeConversations([conv], 'ana')[0].naoLidas).toBe(1) // ana nunca abriu a conversa
    expect(summarizeConversations([conv], 'carla')).toEqual([])
  })
})
