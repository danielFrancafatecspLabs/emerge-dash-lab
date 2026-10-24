import { fetchDashboardRaw } from '@/lib/jira'
import { montarComparativo } from '@/lib/comparativo/montar'
import { buildDashboardData } from '@/lib/mappers'
import { buildWeeklyData } from '@/lib/weekly'
import { PortalPage } from '@/components/shell/PortalPage'
import { PortalDataError } from '@/components/shell/PortalDataError'
import ComparativoClient from '@/components/comparativo/ComparativoClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // os changelogs dos dois boards levam alguns segundos

const TITULO = 'Comparativo'

export default async function ComparativoPage() {
  let dados
  let error: string | null = null
  try {
    const raw = await fetchDashboardRaw()
    // "Hipóteses validadas" vem da mesma conta do Semanal, para os dois mostrarem os mesmos experimentos.
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
    const weekly = buildWeeklyData(data, raw.epicChangelogs, raw.board2735Config)
    const hipotesesValidadas = weekly.epicsConsiderados.filter(e => e.grupo === 'validada')
    dados = montarComparativo({ ...raw, hipotesesValidadas }, new Date(), process.env.JIRA_BASE_URL ?? null)
  } catch (e) {
    error = String(e)
  }
  if (error || !dados) return <PortalDataError title={TITULO} error={error} />

  return (
    <PortalPage title={TITULO} description="Evolução anual 2025 × 2026 dos indicadores-chave do processo" refreshable>
      <ComparativoClient dados={dados} />
    </PortalPage>
  )
}
