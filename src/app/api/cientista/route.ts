import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { iniciativas, epics, board2734Config, epicChangelogs, iniciativaChangelogs } = await fetchDashboardRaw()

    const epicInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))

    const segmentoInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_30014 ?? null,
    }))

    const [portfolioClassification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])

    const data = buildDashboardData(
      iniciativas, epics, portfolioClassification, segmentoClassification,
      board2734Config, epicChangelogs, iniciativaChangelogs
    )
    return NextResponse.json(data)
  } catch (err) {
    console.error('[cientista API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}