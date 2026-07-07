import { JiraIssue } from './types'

const FIELDS_INICIATIVA = [
  'summary', 'status', 'issuetype', 'created', 'updated',
  'customfield_13242', // Benefício Quantitativo (R$) — campo preenchido na Iniciativa
  'customfield_11662', // Sponsor
  'customfield_11665', // Time Responsável
  'customfield_11661', // Domínio
].join(',')

const FIELDS_EPIC = [
  'summary', 'status', 'issuetype', 'parent',
  'customfield_11661', // Domínio (Empresarial / PME / outros)
  'customfield_11662', // Sponsor
  'customfield_11663', // BO
  'customfield_11664', // Complexidade
  'customfield_11665', // Time Responsável
  'customfield_13242', // Benefício Quantitativo
  'customfield_13243', // Benefício Qualitativo
  'customfield_16400', // Domínio
  'customfield_13571', // Custo Estimado
  'customfield_11668', // Custo Realizado
  'customfield_11378', // Segmento
  'customfield_15919', // Portfólio
  'customfield_10904', // Diretoria
].join(',')

function getHeaders(): HeadersInit {
  const email = process.env.JIRA_EMAIL
  const token = process.env.JIRA_API_TOKEN
  if (!email || !token) throw new Error('JIRA_EMAIL e JIRA_API_TOKEN são obrigatórios')
  const credentials = Buffer.from(`${email}:${token}`).toString('base64')
  return {
    Authorization: `Basic ${credentials}`,
    Accept: 'application/json',
  }
}

async function getAllBoardIssues(boardId: number, fields: string): Promise<JiraIssue[]> {
  const base = process.env.JIRA_BASE_URL
  if (!base) throw new Error('JIRA_BASE_URL é obrigatório')

  const all: JiraIssue[] = []
  const maxResults = 50
  let startAt = 0
  let total = Infinity

  while (startAt < total) {
    const url =
      `${base}/rest/agile/1.0/board/${boardId}/issue` +
      `?maxResults=${maxResults}&startAt=${startAt}&fields=${fields}`

    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      throw new Error(`Jira API erro ${res.status} — board ${boardId} startAt ${startAt}`)
    }

    const data = await res.json()
    total = data.total ?? 0
    const issues: JiraIssue[] = data.issues ?? []
    all.push(...issues)
    startAt += issues.length

    // Proteção contra loop infinito
    if (issues.length === 0) break
  }

  return all
}

export async function fetchDashboardRaw(): Promise<{
  iniciativas: JiraIssue[]
  epics: JiraIssue[]
}> {
  const [iniciativas, epics] = await Promise.all([
    getAllBoardIssues(2706, FIELDS_INICIATIVA),
    getAllBoardIssues(2707, FIELDS_EPIC),
  ])
  return { iniciativas, epics }
}
