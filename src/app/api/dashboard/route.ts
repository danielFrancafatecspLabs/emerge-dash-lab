import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { iniciativas, epics } = await fetchDashboardRaw()

    // Inputs para classificação de portfólio (usa customfield_16400 — Domínio estruturado)
    const epicInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_16400?.value ?? null,
    }))

    // Inputs para classificação de segmento (usa customfield_11661 — Domínio string: Empresarial/PME/outros)
    const segmentoInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11661 ?? null,
    }))

    const [portfolioClassification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])

    const data = buildDashboardData(iniciativas, epics, portfolioClassification, segmentoClassification)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[dashboard API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
