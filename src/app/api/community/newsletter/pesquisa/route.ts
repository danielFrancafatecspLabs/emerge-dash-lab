import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { edicaoDoDia } from '@/lib/newsletter/cache'
import type { Edicao } from '@/lib/newsletter/edicao'
import { montarPainel } from '@/lib/newsletter/pesquisa-ia'
import { dadosDePesquisa } from '@/lib/newsletter/pesquisa-ia-fontes'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Edição do dia para achar os pesquisadores nas notícias, sem segurar a resposta se ela ainda estiver sendo montada. */
function edicaoSeJaPronta(): Promise<Edicao | null> {
  return Promise.race([
    edicaoDoDia().catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 2_000)),
  ])
}

/** Pesquisa em IA do beOn Radar: pesquisadores (com foto e novidades) e papers em destaque. */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  try {
    const [dados, edicao] = await Promise.all([dadosDePesquisa(), edicaoSeJaPronta()])
    return NextResponse.json(montarPainel(dados, edicao))
  } catch (err) {
    console.error('[pesquisa-ia]', err)
    return NextResponse.json({ error: 'Os papers e pesquisadores não puderam ser lidos agora: o arXiv e o Hugging Face não responderam.' }, { status: 503 })
  }
}
