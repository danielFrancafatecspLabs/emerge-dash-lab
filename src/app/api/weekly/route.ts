import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { buildWeeklyData, SAMPLE_WEEKLY_DATA } from '@/lib/weekly'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
    return NextResponse.json(buildWeeklyData(data))
  } catch (err) {
    console.error('[weekly API] usando dados de exemplo — Jira indisponível:', err)
    return NextResponse.json(SAMPLE_WEEKLY_DATA)
  }
}
