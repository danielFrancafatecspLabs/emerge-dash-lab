import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { idDaDiscussao } from '@/lib/community/noticias-radar'
import { getProfile } from '@/lib/community/profile'
import { entrada } from '@/lib/community/push'
import { loadNormalizedPosts, unauthorized } from '@/lib/community/server'
import { edicaoDoDia } from '@/lib/newsletter/cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Chamado quando a pessoa entra (login ou abertura da Comunidade). Aplica a regra de um push por entrada: devolve o
 * que foi feito e, sem push no navegador, a notícia para o cartão do app.
 */
export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  let edicao
  try { edicao = await edicaoDoDia() } catch { return NextResponse.json({ canal: 'nenhum', motivo: 'sem-noticia' }) }
  const posts = new Map(loadNormalizedPosts().map(p => [p.id, p]))
  const resultado = await entrada(member.username, edicao, id => posts.get(idDaDiscussao(id)) ?? null, {
    querNoticias: getProfile(member.username).notificacoes.noticias !== false,
  })
  return NextResponse.json(resultado)
}
