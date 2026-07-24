import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import OperacionalClient from '@/components/dashboard/OperacionalClient'
import type { MonitoramentoData } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 300
export const maxDuration = 60

export default async function OperacionalPage() {
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
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2706Config, raw.epicChangelogs, raw.iniciativaChangelogs)
    monitoramento = buildMonitoramentoData(data)
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
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

  return <OperacionalClient data={data} monitoramento={monitoramento} />
}