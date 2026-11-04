import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import { loadValidacoes } from '@/lib/beneficios'
import EstrategiaClient from '@/components/dashboard/EstrategiaClient'
import type { MonitoramentoData } from '@/lib/types'
import { PortalDataError } from '@/components/shell/PortalDataError'

export const dynamic = 'force-dynamic'
export const revalidate = 300
export const maxDuration = 60 // 60 segundos para acomodar fetch de changelogs

export default async function PortfolioPage() {
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
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
    monitoramento = buildMonitoramentoData(data)
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
    return <PortalDataError title="Estratégia" error={error} />
  }

  // Benefício já validado pelo Financeiro (controle em /beneficios), por Epic: a tela soma só os do período e
  // deixa de fora os cancelados.
  const validacoes = loadValidacoes()
  const beneficioValidadoPorEpic: Record<string, number> = {}
  for (const e of data.allEpics) {
    const v = validacoes[e.key]
    if (v?.statusValidacao === 'validado') beneficioValidadoPorEpic[e.key] = v.beneficioValidado ?? e.beneficioQuantitativo ?? 0
  }

  return <EstrategiaClient data={data} monitoramento={monitoramento} beneficioValidadoPorEpic={beneficioValidadoPorEpic} />
}
