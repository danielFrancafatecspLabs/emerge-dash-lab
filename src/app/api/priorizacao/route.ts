import { NextResponse } from 'next/server'
import { JiraIssue } from '@/lib/types'
import { dashboardRawAtualizadoEm, fetchDashboardRaw } from '@/lib/jira'
import { sinaisDeBloqueio } from '@/lib/bloqueio'

// Priorização: os Epics do board de Experimentação vêm da leitura diária do Jira (fetchDashboardRaw), que já traz
// todos os campos usados aqui; esta rota não chama o Jira por conta própria.

export interface ExperimentoPriorizacao {
  key: string
  nome: string
  statusId: string
  statusNome: string
  parentKey: string | null
  parentNome: string | null
  complexidade: string | null        // "Baixa", "Média", "Alta"
  beneficioQuantitativo: number | null
  beneficioQualitativo: string | null
  sponsor: string | null
  bo: string | null
  timeResponsavel: string | null
  dominio: string | null
  segmento: string | null
  portfolio: string | null
  motivoBloqueio: string | null
  prioridade: string | null
  criadoEm: string | null
}

// Status que devem aparecer na priorização
const STATUS_PRIORIZACAO = new Set([
  '10004',  // BACKLOG
  '10139',  // Em refinamento
  '10067',  // PRONTO PARA EXECUÇÃO
  '3',      // Em andamento
  '10204',  // EM VALIDAÇÃO
])

function mapToPriorizacao(issue: JiraIssue): ExperimentoPriorizacao {
  const f = issue.fields
  const complexidade = typeof f.customfield_30358 === 'object' && f.customfield_30358 !== null
    ? f.customfield_30358.value ?? null
    : f.customfield_30358 ?? null
  const parentFields = f.parent?.fields as any
  const timeResponsavel = parentFields?.customfield_31438?.value
    ?? parentFields?.customfield_30357
    ?? (typeof f.customfield_31438 === 'object' && f.customfield_31438 !== null ? f.customfield_31438.value ?? null : null)
    ?? f.customfield_30357
    ?? null
  return {
    key: issue.key,
    nome: f.summary,
    statusId: f.status.id,
    statusNome: f.status.name,
    parentKey: f.parent?.key ?? null,
    parentNome: f.parent?.fields?.summary ?? null,
    complexidade,
    beneficioQuantitativo: f.customfield_30216 ?? null,
    beneficioQualitativo: f.customfield_30222 ?? null,
    sponsor: f.customfield_30394 ?? null,
    bo: f.customfield_30340 ?? null,
    timeResponsavel,
    dominio: f.customfield_30021?.value ?? f.customfield_11987?.value ?? null,
    segmento: f.customfield_30445?.value ?? null,
    portfolio: f.customfield_30110?.value ?? null,
    motivoBloqueio: (() => { const b = sinaisDeBloqueio(f); return b.motivo ?? b.sinais[0] ?? null })(),
    prioridade: f.priority?.name ?? null,
    criadoEm: f.created ?? null,
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const { epics } = await fetchDashboardRaw()
    const experimentos = (epics as JiraIssue[])
      .filter(i => STATUS_PRIORIZACAO.has(i.fields.status.id))
      .map(mapToPriorizacao)
    return NextResponse.json({ experimentos, total: experimentos.length, lidoDoJiraEm: dashboardRawAtualizadoEm()?.toISOString() ?? null })
  } catch (err) {
    console.error('[priorizacao API]', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
}
