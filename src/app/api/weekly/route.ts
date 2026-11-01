import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { buildWeeklyData } from '@/lib/weekly'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
    const weekly = buildWeeklyData(data, raw.epicChangelogs, raw.board2735Config)
    return NextResponse.json(weekly)
  } catch (err) {
    console.error('[weekly API] Jira indisponível:', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
}
