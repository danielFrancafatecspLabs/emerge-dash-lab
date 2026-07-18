import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import EvolucaoAnual from '@/components/monitoramento/EvolucaoAnual'
import CycleTimeIdeacao from '@/components/monitoramento/CycleTimeIdeacao'

export const dynamic = 'force-dynamic'

export default async function MonitoramentoPage() {
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
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2706Config, raw.epicChangelogs, raw.iniciativaChangelogs)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/jira/logobeonlabs.png" alt="BeOn Labs" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Monitoramento</h1>
              <p className="text-xs text-gray-500">Evolução da experimentação ao longo do tempo</p>
            </div>
          </div>
          <LogoutButton />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <EvolucaoAnual epics={data.allEpics} />
          <CycleTimeIdeacao data={data.cycleTimeIdeacao} />
        </div>
      </main>
    </div>
  )
}