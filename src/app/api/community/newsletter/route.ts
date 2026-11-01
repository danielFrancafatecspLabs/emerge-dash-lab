import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { edicaoDoDia } from '@/lib/newsletter/cache'
import { talvezSincronizarNoticiasRadar } from '@/lib/community/noticias-radar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  try {
    const edicao = await edicaoDoDia()
    // As notícias da edição abrem discussões no fórum (sem segurar a resposta).
    talvezSincronizarNoticiasRadar()
    return NextResponse.json(edicao)
  } catch (err) {
    console.error('[newsletter]', err)
    return NextResponse.json({ error: 'A edição de hoje ainda não pôde ser montada: as fontes de notícias não responderam.' }, { status: 503 })
  }
}
