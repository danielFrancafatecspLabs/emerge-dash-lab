import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import { montarPortfolio } from '@/lib/portfolio/dados'
import { estadoDaQuery } from '@/lib/portfolio/filtros'
import { PortalPage } from '@/components/shell/PortalPage'
import { PortalDataError } from '@/components/shell/PortalDataError'
import PortfolioExplorer from '@/components/portfolio/PortfolioExplorer'

export const dynamic = 'force-dynamic'

const TITULO = 'Portfólio'

export default async function PortfolioPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  let dados
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(epicInputs),
    ])
    const data = buildDashboardData(
      raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs,
    )
    dados = montarPortfolio(data, { iniciativa: raw.board2734Config, experimento: raw.board2735Config }, process.env.JIRA_BASE_URL ?? null)
  } catch (e) {
    error = String(e)
  }

  if (error || !dados) {
    return <PortalDataError title={TITULO} error={error} />
  }

  const d = searchParams.d
  return (
    <PortalPage
      title={TITULO}
      description="Iniciativas e experimentos dos boards de Ideação e de Experimentação/Piloto do Jira"
      refreshable
      fit
    >
      <PortfolioExplorer dados={dados} estadoInicial={estadoDaQuery(searchParams)} detalheInicial={typeof d === 'string' ? d : null} />
    </PortalPage>
  )
}
