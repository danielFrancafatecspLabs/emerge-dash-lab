import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { randomUUID } from 'crypto'
import { loadUsers } from '@/lib/auth/users'
import { MAX_MESSAGE_LENGTH, conversationId, type Conversation, type DirectMessage } from '@/lib/community/messages'
import { loadConversations, saveConversations } from '@/lib/community/messages-store'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

function recipient(raw: string, me: string) {
  const username = decodeURIComponent(raw)
  if (username === me) return null
  return loadUsers().find(u => u.username === username && u.active) ?? null
}

// Abrir a conversa marca as mensagens recebidas como lidas.
export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const other = recipient(params.username, member.username)
  if (!other) return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })

  const convs = loadConversations()
  const conv = convs.find(c => c.id === conversationId(member.username, other.username))
  if (!conv) return NextResponse.json({ mensagens: [] })
  conv.lidoEm = { ...conv.lidoEm, [member.username]: new Date().toISOString() }
  saveConversations(convs)
  return NextResponse.json({ mensagens: conv.mensagens })
}

export async function POST(request: NextRequest, { params }: { params: { username: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const other = recipient(params.username, member.username)
  if (!other) return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })

  let text = ''
  try {
    const body = await request.json()
    text = typeof body.text === 'string' ? body.text.trim() : ''
  } catch {
    return badRequest('Requisição inválida')
  }
  if (!text) return badRequest('Escreva uma mensagem')
  if (text.length > MAX_MESSAGE_LENGTH) return badRequest(`A mensagem pode ter até ${MAX_MESSAGE_LENGTH} caracteres`)

  const now = new Date().toISOString()
  const message: DirectMessage = { id: randomUUID(), from: member.username, text, createdAt: now }
  const convs = loadConversations()
  const id = conversationId(member.username, other.username)
  let conv = convs.find(c => c.id === id)
  if (!conv) {
    conv = { id, participantes: [member.username, other.username].sort() as Conversation['participantes'], mensagens: [], lidoEm: {} }
    convs.push(conv)
  }
  conv.mensagens.push(message)
  conv.lidoEm = { ...conv.lidoEm, [member.username]: now }
  saveConversations(convs)
  return NextResponse.json(message, { status: 201 })
}
