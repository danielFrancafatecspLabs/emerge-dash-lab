import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MetasEstrategicas from '@/components/dashboard/MetasEstrategicas'
import ResumoPortfolio from '@/components/dashboard/ResumoPortfolio'
import PortfolioPorMercado from '@/components/dashboard/PortfolioPorMercado'
import Top5Experimentos from '@/components/dashboard/Top5Experimentos'
import SituacaoPortfolio from '@/components/dashboard/SituacaoPortfolio'
import PipelineInovacao from '@/components/dashboard/PipelineInovacao'
import GovernancaAlinhamento from '@/components/dashboard/GovernancaAlinhamento'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function PortfolioPage() {
  let data
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_16400?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11661 ?? null,
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
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-4">
            Verifique as variáveis JIRA_EMAIL, JIRA_API_TOKEN e JIRA_BASE_URL no .env.local
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0" style={{ width: 72 }}>
        <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
          <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="fixed top-0 z-10" style={{ left: 72, right: 0 }}>
          <Header />
        </div>

        {/* Content */}
        <main className="flex-1 p-3 gap-3 flex flex-col" style={{ marginTop: 52 }}>

          {/* Row 1: Metas (60%) + Resumo (40%) */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-[60fr_40fr]">
            <MetasEstrategicas data={data} />
            <ResumoPortfolio data={data} />
          </div>

          {/* Row 2: Portfólio Mercado (45%) + Top 5 (35%) + Situação (20%) */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-[45fr_35fr_20fr]">
            <PortfolioPorMercado data={data} />
            <Top5Experimentos data={data} />
            <SituacaoPortfolio data={data} />
          </div>

          {/* Row 3: Pipeline (60%) + Governança (40%) */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-[60fr_40fr]">
            <PipelineInovacao data={data} />
            <GovernancaAlinhamento data={data} />
          </div>

        </main>
      </div>
    </div>
  )
}
