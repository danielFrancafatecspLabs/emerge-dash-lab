import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { idDaDiscussao } from '@/lib/community/noticias-radar'
import { loadNormalizedPosts, unauthorized } from '@/lib/community/server'
import { historicoDoMes, lerArquivo } from '@/lib/newsletter/historico'

export const dynamic = 'force-dynamic'

/** Histórico do beOn Radar: as notícias que mais impactaram no mês (?mes=AAAA-MM), pelo Índice de Impacto. */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  const posts = new Map(loadNormalizedPosts().map(p => [p.id, p]))
  const conversaDe = (id: string) => {
    const post = posts.get(idDaDiscussao(id))
    return { comentarios: post?.comments.length ?? 0, uteis: post?.likes.length ?? 0, discussaoId: post?.id ?? null }
  }
  return NextResponse.json(historicoDoMes(lerArquivo(), conversaDe, request.nextUrl.searchParams.get('mes')))
}
