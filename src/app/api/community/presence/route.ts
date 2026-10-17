import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { loadPresence, savePresence } from '@/lib/community/presence'
import { unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

/** Sinal de vida da pessoa conectada (a lista de quem está ativo vem em /api/community/members). */
export async function POST(request: NextRequest) {
  const me = await getSessionUser(request)
  if (!me) return unauthorized()
  const entry = {
    userId: me.username,
    userName: me.user?.nome || me.username,
    userLab: me.user?.laboratorio || '',
    lastSeen: new Date().toISOString(),
  }
  savePresence([...loadPresence().filter(p => p.userId !== me.username), entry])
  return NextResponse.json({ ok: true })
}
