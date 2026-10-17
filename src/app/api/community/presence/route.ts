import { NextRequest, NextResponse } from 'next/server'
import { loadPresence, savePresence } from '@/lib/chat-store'
import { ChatPresence } from '@/lib/chat'
import { verifyAuthSession } from '@/lib/auth-session'
import { loadUsers } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  const presence = loadPresence()
  // Filter out users who haven't been seen in 5 minutes
  const now = Date.now()
  const active = presence.filter(p => now - new Date(p.lastSeen).getTime() < 5 * 60 * 1000)
  return NextResponse.json(active)
}

export async function POST(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const users = loadUsers()
  const user = users.find(u => u.username === session.username)

  const presence = loadPresence()
  const now = new Date().toISOString()
  const idx = presence.findIndex(p => p.userId === session.username)

  const entry: ChatPresence = {
    userId: session.username,
    userName: user?.nome || session.username,
    userLab: user?.laboratorio || '',
    lastSeen: now,
  }

  if (idx === -1) {
    presence.push(entry)
  } else {
    presence[idx] = entry
  }

  savePresence(presence)
  return NextResponse.json({ ok: true })
}