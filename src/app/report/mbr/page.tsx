import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MbrContent from '@/components/report/MbrContent'

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
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header />
        <div className="p-6 space-y-6">
          <MbrContent data={data} monitoramento={monitoramento} />
        </div>
      </main>
    </div>
  )
}
