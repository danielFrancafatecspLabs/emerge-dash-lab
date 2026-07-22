import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import type { PeriodoFiltro } from '@/lib/types'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import PeriodoFiltro from '@/components/monitoramento/PeriodoFiltro'
import KpiCards from '@/components/monitoramento/KpiCards'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import BeneficioPorAreaChart from '@/components/monitoramento/BeneficioPorAreaChart'
import { InsightsExecutivos } from '@/components/monitoramento/MaturidadeInsights'
import IniciativasPorLab from '@/components/monitoramento/IniciativasPorLab'

export const dynamic = 'force-dynamic'

function parsePeriodo(raw: string | undefined): PeriodoFiltro {
  if (!raw || raw === 'ultimos12') return { tipo: 'ultimos12' }
  if (raw === 'tudo') return { tipo: 'tudo' }
  // formato: 1s2025, 2s2026, etc.
  const match = raw.match(/^([12])s(\d{4})$/)
  if (match) {
    return {
      tipo: 'semestre',
      semestre: parseInt(match[1], 10) as 1 | 2,
      ano: parseInt(match[2], 10),
    }
  }
  return { tipo: 'ultimos12' }
}

function periodoLabel(p: PeriodoFiltro): string {
  if (p.tipo === 'ultimos12') return 'Últimos 12 meses'
  if (p.tipo === 'tudo') return 'Todo o período'
  return `${p.semestre}º Semestre ${p.ano}`
}

export default async function MonitoramentoPage({
  searchParams,
}: {
  searchParams: { periodo?: string }
}) {
  const periodo = parsePeriodo(searchParams.periodo)
  let data
  let monitoramento
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
    data = buildDashboardData(
      raw.iniciativas, raw.epics, classification, segmentoClassification,
      raw.board2706Config, raw.epicChangelogs, raw.iniciativaChangelogs
    )
    monitoramento = buildMonitoramentoData(data, periodo)
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center max-w-lg">
          <p className="text-2xl font-bold mb-2 text-gray-800">Erro ao carregar dados</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fafc' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-red-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Evolução da Experimentação 2026</h1>
              <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
                Acompanhamento do desempenho do portfólio de experimentação, destacando geração de valor,
                evolução das iniciativas e indicadores estratégicos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PeriodoFiltro />
            <LogoutButton />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Linha 1 — KPIs Estratégicos */}
          <KpiCards data={monitoramento} />

          {/* Linha 2 — Burnup + Benefício por Domínio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BurnupChart data={monitoramento.burnup} />
            <BeneficioPorAreaChart data={monitoramento.beneficioPorArea} />
          </div>

          {/* Linha 3 — Iniciativas por Lab */}
          <IniciativasPorLab data={monitoramento.iniciativasPorLab} />

          {/* Linha 4 — Insights Executivos */}
          <InsightsExecutivos data={monitoramento.insights} />
        </div>
      </main>
    </div>
  )
}