import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { buildWeeklyData } from '@/lib/weekly'
import { buildSemanalData, SAMPLE_SEMANAL_DATA } from '@/lib/semanal'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
    const weekly = buildWeeklyData(data, raw.epicChangelogs, raw.board2735Config)
    return NextResponse.json(buildSemanalData(data, weekly))
  } catch (err) {
    console.error('[semanal API] usando dados de exemplo — Jira indisponível:', err)
    return NextResponse.json({ ...SAMPLE_SEMANAL_DATA, geradoEm: new Date().toISOString() })
  }
}
