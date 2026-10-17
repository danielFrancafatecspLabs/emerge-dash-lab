import { NextRequest, NextResponse } from 'next/server'
import { deriveNotifications } from '@/lib/community'
import { getProfile } from '@/lib/community-profile'
import { summarizeConversations } from '@/lib/community-messages'
import { loadConversations } from '@/lib/community-messages-store'
import { getMember, loadNormalizedPosts, unauthorized } from '@/lib/community-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const member = await getMember(request)
  if (!member) return unauthorized()
  const profile = getProfile(member.username)
  const itens = deriveNotifications(loadNormalizedPosts(), member.username, profile.notificacoesVistasEm, profile.notificacoes).slice(0, 30)
  const mensagensNaoLidas = profile.notificacoes.mensagens
    ? summarizeConversations(loadConversations(), member.username).reduce((n, c) => n + c.naoLidas, 0)
    : 0
  return NextResponse.json({ itens, naoLidas: itens.filter(i => !i.lida).length, mensagensNaoLidas })
}
