import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { PortalShell } from '@/components/portal/PortalShell'
import MbrContent from '@/components/report/MbrContent'
import { PortalDataError } from '@/components/portal/PortalDataError'

export const dynamic = 'force-dynamic'

export default async function MBRPage() {
  let data
  let monitoramento
  let error: string | null = null
  try {
    const raw = await fetchDashboardRaw()
    data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
    monitoramento = buildMonitoramentoData(data, { tipo: 'tudo' })
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
    return <PortalDataError title="MBR" error={error} />
  }

  return (
    <PortalShell title="MBR" description="Monthly Business Review do portfólio de experimentação" refreshable>
      <div className="p-6 space-y-6">
        <MbrContent data={data} monitoramento={monitoramento} />
      </div>
    </PortalShell>
  )
}
