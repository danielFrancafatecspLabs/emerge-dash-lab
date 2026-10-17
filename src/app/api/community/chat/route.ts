import { NextRequest, NextResponse } from 'next/server'
import { loadMessages, saveMessages } from '@/lib/chat-store'
import { ChatMessage } from '@/lib/chat'
import { verifyAuthSession } from '@/lib/auth-session'
import { loadUsers } from '@/lib/users'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const messages = loadMessages()
  return NextResponse.json(messages)
}

export async function POST(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { text } = await request.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const users = loadUsers()
    const user = users.find(u => u.username === session.username)

    const msg: ChatMessage = {
      id: randomUUID(),
      userId: user?.id || session.username,
      userName: user?.nome || session.username,
      userLab: user?.laboratorio || '',
      userAvatar: user?.avatar || '',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }

    const messages = loadMessages()
    messages.push(msg)
    saveMessages(messages)
    return NextResponse.json(msg, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}