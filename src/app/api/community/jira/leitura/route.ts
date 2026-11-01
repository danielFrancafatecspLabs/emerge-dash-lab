import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { lidoHoje, situacaoDoJira } from '@/lib/jira'

export const dynamic = 'force-dynamic'

/** Quando os dados do Jira foram lidos (a leitura é uma por dia), se está lendo agora e se a última tentativa falhou. */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  const s = situacaoDoJira()
  return NextResponse.json({ ...s, lidoHoje: !!s.salvoEm && lidoHoje(Date.parse(s.salvoEm)) })
}
