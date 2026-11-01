import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)

    return NextResponse.json({
      beneficioTotal: data.beneficioTotal,
      metasAgregadas: data.metasAgregadas,
    })
  } catch (err) {
    console.error('[strategy API] Jira indisponível:', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
}