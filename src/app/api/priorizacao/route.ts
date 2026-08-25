import { NextResponse } from 'next/server'
import { JiraIssue } from '@/lib/types'
import { EXPERIMENTACAO_BOARD_ID } from '@/lib/jira'

const BASE_URL = process.env.JIRA_BASE_URL
const EMAIL = process.env.JIRA_EMAIL
const TOKEN = process.env.JIRA_API_TOKEN

function getHeaders(): HeadersInit {
  if (!EMAIL || !TOKEN) throw new Error('JIRA_EMAIL e JIRA_API_TOKEN são obrigatórios')
  const credentials = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')
  return {
    Authorization: `Basic ${credentials}`,
    Accept: 'application/json',
  }
}

const FIELDS = [
  'summary', 'status', 'issuetype', 'parent', 'priority', 'created',
  'customfield_30216',  // Benefício Quantitativo (R$) (was customfield_13242)
  'customfield_30222',  // Benefício Qualitativo (was customfield_13243)
  'customfield_30358',  // Complexidade (was customfield_11664)
  'customfield_30394',  // Sponsor (was customfield_11662)
  'customfield_30340',  // BO (was customfield_11663)
  'customfield_30357',  // Time Responsável (Lab) — campo da iniciativa (pai) e do próprio épico (was customfield_16911 / customfield_11665)
  'customfield_31438',  // Lab Responsável (option select, NOVO)
  'customfield_11987',  // Domínio (was customfield_16400)
  'customfield_30021',  // Domínio (option select) — NOVO
  'customfield_30445',  // Segmento (was customfield_11378)
  'customfield_30110',  // Portfólio (was customfield_15919)
  'customfield_13406',  // Motivo de Bloqueio
].join(',')

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
  return {
    key: issue.key,
    nome: f.summary,
    statusId: f.status.id,
    statusNome: f.status.name,
    parentKey: f.parent?.key ?? null,
    parentNome: f.parent?.fields?.summary ?? null,
    complexidade: f.customfield_30358 ?? null,
    beneficioQuantitativo: f.customfield_30216 ?? null,
    beneficioQualitativo: f.customfield_30222 ?? null,
    sponsor: f.customfield_30394 ?? null,
    bo: f.customfield_30340 ?? null,
    timeResponsavel: f.parent?.fields?.customfield_31438?.value ?? f.parent?.fields?.customfield_30357 ?? f.customfield_31438?.value ?? f.customfield_30357 ?? null,
    dominio: f.customfield_30021?.value ?? f.customfield_11987?.value ?? null,
    segmento: f.customfield_30445?.value ?? null,
    portfolio: f.customfield_30110?.value ?? null,
    motivoBloqueio: f.customfield_13406?.value ?? null,
    prioridade: f.priority?.name ?? null,
    criadoEm: f.created ?? null,
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    if (!BASE_URL) throw new Error('JIRA_BASE_URL é obrigatório')

    // Buscar todos os Epics do board 2735
    const allIssues: JiraIssue[] = []
    const maxResults = 50
    let startAt = 0
    let total = Infinity

    while (startAt < total) {
      const url = `${BASE_URL}/rest/agile/1.0/board/${EXPERIMENTACAO_BOARD_ID}/issue?maxResults=${maxResults}&startAt=${startAt}&fields=${FIELDS}`
      const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 300 } })
      if (!res.ok) throw new Error(`Jira API erro ${res.status}`)
      const data = await res.json()
      total = data.total ?? 0
      const issues: JiraIssue[] = data.issues ?? []
      allIssues.push(...issues)
      startAt += issues.length
      if (issues.length === 0) break
    }

    // Filtrar apenas Epics nos status relevantes
    const experimentos = allIssues
      .filter(i => STATUS_PRIORIZACAO.has(i.fields.status.id))
      .map(mapToPriorizacao)

    return NextResponse.json({ experimentos, total: experimentos.length })
  } catch (err) {
    console.error('[priorizacao API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}