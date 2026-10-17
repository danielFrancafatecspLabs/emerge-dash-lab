import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { summarizeConversations } from '@/lib/community/messages'
import { loadConversations } from '@/lib/community/messages-store'
import { unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const conversas = summarizeConversations(loadConversations(), member.username)
  return NextResponse.json({ conversas, naoLidas: conversas.reduce((n, c) => n + c.naoLidas, 0) })
}
