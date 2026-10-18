import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import { PortalPage } from '@/components/shell/PortalPage'
import PortfolioList from '@/components/portfolio/PortfolioList'
import { PortalDataError } from '@/components/shell/PortalDataError'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  let data
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return <PortalDataError title="Portfólio de experimentos" error={error} />
  }

  return (
    <PortalPage title="Portfólio de experimentos" description="Lista completa com filtros por mercado, sponsor, lab e status" refreshable>
      <div className="flex-1 p-3 flex flex-col gap-3">
        <PortfolioList data={data} />
      </div>
    </PortalPage>
  )
}
