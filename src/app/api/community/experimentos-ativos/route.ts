import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { experimentosDetalhados } from '@/lib/community/experimentos-ativos'
import { lerLinks } from '@/lib/community/experimentos-links'
import { unauthorized } from '@/lib/community/server'
import { dashboardRawAtualizadoEm, fetchDashboardRaw } from '@/lib/jira'
import { normalizeSponsor } from '@/lib/mappers'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Experimentos ativos para a aba da Comunidade: nome, Iniciativa, descrição, fase, sponsor, diretoria e os links de
 * ficha e relatório cadastrados pelos admins. Nada de custos, benefícios ou do restante do portfólio.
 */
export async function GET(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  try {
    const { epics, iniciativas } = await fetchDashboardRaw()
    return NextResponse.json({
      itens: experimentosDetalhados(epics, iniciativas, lerLinks(), normalizeSponsor),
      atualizadoEm: dashboardRawAtualizadoEm()?.toISOString() ?? null,
      podeEditarLinks: member.role === 'admin',
    })
  } catch (err) {
    console.error('[experimentos-ativos]', err)
    return NextResponse.json({ error: 'Não foi possível ler os experimentos do Jira agora.' }, { status: 503 })
  }
}
