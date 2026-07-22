import { NextResponse } from 'next/server'
import { JiraIssue } from '@/lib/types'

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
  'customfield_11664',  // Complexidade
  'customfield_13242',  // Benefício Quantitativo (R$)
  'customfield_13243',  // Benefício Qualitativo
  'customfield_11662',  // Sponsor
  'customfield_11663',  // BO
  'customfield_11665',  // Time Responsável
  'customfield_16400',  // Domínio
  'customfield_11378',  // Segmento
  'customfield_15919',  // Portfólio
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
    complexidade: f.customfield_11664 ?? null,
    beneficioQuantitativo: f.customfield_13242 ?? null,
    beneficioQualitativo: f.customfield_13243 ?? null,
    sponsor: f.customfield_11662 ?? null,
    bo: f.customfield_11663 ?? null,
    timeResponsavel: f.customfield_11665 ?? null,
    dominio: f.customfield_16400?.value ?? null,
    segmento: f.customfield_11378?.value ?? null,
    portfolio: f.customfield_15919?.value ?? null,
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

    // Buscar todos os Epics do board 2707
    const allIssues: JiraIssue[] = []
    const maxResults = 50
    let startAt = 0
    let total = Infinity

    while (startAt < total) {
      const url = `${BASE_URL}/rest/agile/1.0/board/2707/issue?maxResults=${maxResults}&startAt=${startAt}&fields=${FIELDS}`
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