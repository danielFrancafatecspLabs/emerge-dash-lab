import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 segundos para acomodar fetch de changelogs

export async function GET() {
  try {
    const { iniciativas, epics, board2734Config, epicChangelogs, iniciativaChangelogs } = await fetchDashboardRaw()

    // Inputs para classificação de portfólio (usa customfield_11987 — Domínio estruturado) (was customfield_16400)
    const epicInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))

    // Inputs para classificação de segmento (usa customfield_30014 — Domínio string: Empresarial/PME/outros, was customfield_11661)
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
    console.error('[dashboard API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
