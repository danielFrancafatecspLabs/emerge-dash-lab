import { cookies } from 'next/headers'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { loadValidacoes } from '@/lib/beneficios'
import Sidebar from '@/components/layout/Sidebar'
import BeneficiosClient, { type BeneficioEpicRow } from '@/components/beneficios/BeneficiosClient'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function BeneficiosPage() {
  let data
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const validacoes = loadValidacoes()

  // Universo do controle: todo Epic com benefício quantitativo potencial informado,
  // OU que já tenha algum registro de validação financeira (mesmo que o valor
  // potencial original tenha sido zerado/removido depois no Jira).
  const epicsRelevantes = data.allEpics.filter(
    e => (e.beneficioQuantitativo ?? 0) > 0 || validacoes[e.key] !== undefined
  )

  // Lab responsável: quando o Epic não tem o campo preenchido, usa o da Iniciativa-mãe
  const labPorEpic = new Map<string, string>()
  for (const ini of data.iniciativas) {
    for (const epic of ini.epics) {
      if (!labPorEpic.has(epic.key)) labPorEpic.set(epic.key, epic.timeResponsavel || ini.timeResponsavel || '—')
    }
  }

  const rows: BeneficioEpicRow[] = epicsRelevantes.map(e => ({
    key: e.key,
    nome: e.nome,
    status: e.status.name,
    dominio: e.dominio,
    segmento: e.segmento,
    sponsor: e.sponsor,
    labResponsavel: labPorEpic.get(e.key) ?? e.timeResponsavel ?? '—',
    prioridade: e.prioridade ?? null,
    beneficioPotencial: e.beneficioQuantitativo,
    beneficioQualitativo: e.beneficioQualitativo,
    custoEstimado: e.custoEstimado,
    custoRealizado: e.custoRealizado,
    criadoEm: e.criadoEm ?? null,
    concluidoEm: e.concluidoEm ?? null,
    validacao: validacoes[e.key] ?? null,
  }))

  const cookieStore = await cookies()
  const currentRole = cookieStore.get('user_role')?.value ?? null
  const currentUsername = cookieStore.get('username')?.value ?? null

  return (
    <div className="flex min-h-dvh" style={{ background: '#f5f5f5' }}>
      <div className="flex-shrink-0">
        <div className="fixed top-0 left-0 h-full z-20" style={{ width: 72 }}>
          <Sidebar />
        </div>
      </div>
      <div className="flex-1 min-w-0" style={{ marginLeft: 72 }}>
        <BeneficiosClient rows={rows} currentRole={currentRole} currentUsername={currentUsername} />
      </div>
    </div>
  )
}
