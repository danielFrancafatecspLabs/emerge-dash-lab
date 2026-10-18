import { cookies } from 'next/headers'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { loadValidacoes } from '@/lib/beneficios'
import BeneficiosClient, { type BeneficioEpicRow } from '@/components/beneficios/BeneficiosClient'
import { PortalDataError } from '@/components/shell/PortalDataError'

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
    return <PortalDataError title="Controle financeiro de benefícios" error={error} />
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
    <BeneficiosClient rows={rows} currentRole={currentRole} currentUsername={currentUsername} />
  )
}
