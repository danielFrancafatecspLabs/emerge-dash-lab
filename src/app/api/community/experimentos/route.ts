import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { experimentosAtivos } from '@/lib/community/experimentos-ativos'
import { unauthorized } from '@/lib/community/server'
import { dashboardRawAtualizadoEm, fetchDashboardRaw } from '@/lib/jira'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Experimentos em andamento para a Comunidade: só o nome da Iniciativa, a Diretoria e a fase. Usa os mesmos dados do
 * Jira, já em cache, das visões executivas.
 */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  try {
    const { epics, iniciativas } = await fetchDashboardRaw()
    const salvo = dashboardRawAtualizadoEm()
    return NextResponse.json({ itens: experimentosAtivos(epics, iniciativas), atualizadoEm: salvo?.toISOString() ?? null })
  } catch (err) {
    console.error('[experimentos-ativos]', err)
    return NextResponse.json({ error: 'Não foi possível ler os experimentos do Jira agora.' }, { status: 503 })
  }
}
