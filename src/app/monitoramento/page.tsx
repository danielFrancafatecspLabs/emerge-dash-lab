import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import type { PeriodoFiltro as PeriodoFiltroType } from '@/lib/types'
import { PortalShell } from '@/components/portal/PortalShell'
import PeriodoFiltro from '@/components/monitoramento/PeriodoFiltro'
import KpiCards from '@/components/monitoramento/KpiCards'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import BeneficioPorAreaChart from '@/components/monitoramento/BeneficioPorAreaChart'
import { InsightsExecutivos } from '@/components/monitoramento/MaturidadeInsights'
import IniciativasPorLab from '@/components/monitoramento/IniciativasPorLab'
import CycleTimeEstrategia from '@/components/dashboard/CycleTimeEstrategia'
import { PortalDataError } from '@/components/portal/PortalDataError'

export const dynamic = 'force-dynamic'

function parsePeriodo(raw: string | undefined): PeriodoFiltroType {
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

function periodoLabel(p: PeriodoFiltroType): string {
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
    data = buildDashboardData(
      raw.iniciativas, raw.epics, classification, segmentoClassification,
      raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs
    )
    monitoramento = buildMonitoramentoData(data, periodo)
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
    return <PortalDataError title="Evolução da Experimentação 2026" error={error} />
  }

  return (
    <PortalShell
      title="Evolução da Experimentação 2026"
      description="Desempenho do portfólio: geração de valor, evolução das iniciativas e indicadores estratégicos"
      refreshable
      actions={<PeriodoFiltro />}
    >
        <div className="p-6 space-y-6">
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

          {/* Linha 5 — Cycle Time Experimentação (por porte) */}
          {monitoramento.cycleTimeExperimentacaoGeral && monitoramento.cycleTimeExperimentacaoGeral.qtdIniciativas > 0 && (
            <CycleTimeEstrategia
              porPorte={monitoramento.cycleTimeExperimentacao ?? []}
              geral={monitoramento.cycleTimeExperimentacaoGeral}
            />
          )}
        </div>
    </PortalShell>
  )
}