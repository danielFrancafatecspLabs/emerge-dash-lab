import { JiraIssue, JiraBoardConfiguration } from './types'

// Board IDs (use env vars if present, otherwise fall back to the correct defaults)
export const IDEACAO_BOARD_ID = Number(process.env.JIRA_BOARD_IDEACAO_ID ?? 2734)
export const EXPERIMENTACAO_BOARD_ID = Number(process.env.JIRA_BOARD_INICIATIVAS_ID ?? 2735)

const FIELDS_INICIATIVA = [
  'summary', 'status', 'issuetype', 'created', 'updated',
  'customfield_30216', // Benefício Quantitativo (R$) (was customfield_13242)
  'customfield_30394', // Sponsor (was customfield_11662)
  'customfield_30357', // Time Responsável (Lab) (was customfield_16911)
  'customfield_31438', // Lab Responsável (option select, NOVO)
  'customfield_11987', // Domínio (was customfield_16400)
  'customfield_11991', // PROP DOMINIO 01
  'customfield_30014', // Domínio (was customfield_11661)
  'customfield_30021', // Domínio (option select) — NOVO
].join(',')

const FIELDS_EPIC = [
  'summary', 'status', 'issuetype', 'parent', 'description', 'priority', 'created',
  'customfield_30014', // Domínio (Empresarial / PME / outros) (was customfield_11661)
  'customfield_13406', // Motivo de Bloqueio
  'customfield_30394', // Sponsor (was customfield_11662)
  'customfield_30340', // BO (was customfield_11663)
  'customfield_30358', // Complexidade (was customfield_11664)
  'customfield_30357', // Time Responsável (Lab) (was customfield_16911)
  'customfield_31438', // Lab Responsável (option select, NOVO)
  'customfield_30216', // Benefício Quantitativo (was customfield_13242)
  'customfield_30222', // Benefício Qualitativo (was customfield_13243)
  'customfield_11987', // Domínio (was customfield_16400)
  'customfield_11991', // PROP DOMINIO 01
  'customfield_30021', // Domínio (option select) — NOVO
  'customfield_30402', // Custo Estimado (was customfield_13571)
  'customfield_30453', // Custo Realizado (was customfield_11668)
  'customfield_30445', // Segmento (was customfield_11378)
  'customfield_30110', // Portfólio (was customfield_15919)
  'customfield_21499', // Diretoria (was customfield_10904)
  'attachment',          // Anexos
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

async function getBoardConfiguration(boardId: number): Promise<JiraBoardConfiguration> {
  const base = process.env.JIRA_BASE_URL
  if (!base) throw new Error('JIRA_BASE_URL é obrigatório')

  const url = `${base}/rest/agile/1.0/board/${boardId}/configuration`
  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`Jira API erro ${res.status} — board ${boardId} configuration`)
  }

  return res.json()
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
  board2734Config: JiraBoardConfiguration
  epicChangelogs: Record<string, ChangelogEntry[]>
  iniciativaChangelogs: Record<string, ChangelogEntry[]>
}> {
  const [iniciativas, epics, board2734Config] = await Promise.all([
    getAllBoardIssues(IDEACAO_BOARD_ID, FIELDS_INICIATIVA),
    getAllBoardIssues(EXPERIMENTACAO_BOARD_ID, FIELDS_EPIC),
    getBoardConfiguration(IDEACAO_BOARD_ID),
  ])

  // Buscar último comentário (texto plano) apenas para Epics em andamento (status.id === '3')
  async function getIssueLastComment(issueKey: string): Promise<string | null> {
    const base = process.env.JIRA_BASE_URL
    if (!base) throw new Error('JIRA_BASE_URL é obrigatório')
    const url = `${base}/rest/api/3/issue/${issueKey}/comment?maxResults=200`
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 300 } })
    if (!res.ok) {
      // não aborta toda a construção do dashboard por causa de um comentário
      return null
    }
    const data = await res.json()
    const comments = data.comments ?? []
    if (comments.length === 0) return null

    const last = comments[comments.length - 1]
    const body = last.body
    if (!body) return null

    // body pode vir em ADF (objeto) ou string — extrair texto plano
    function adfToText(node: any): string {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(adfToText).join('')
      if (node.type === 'text') return node.text ?? ''
      if (node.content) return adfToText(node.content)
      return ''
    }

    // Alguns comentários vêm como array/ADF, outros como objeto com content
    if (typeof body === 'string') return body.trim()
    if (Array.isArray(body)) return adfToText(body).trim() || null
    if (body.content) return adfToText(body.content).trim() || null
    return String(body).trim()
  }

  const epicsWithComments: JiraIssue[] = []
  for (const e of epics) {
    const copy = { ...e }
    try {
      if (copy.fields?.status?.id === '3') {
        copy.fields = { ...copy.fields, lastComment: await getIssueLastComment(copy.key) }
      }
    } catch (err) {
      // silencioso — preferimos continuar mesmo se um fetch falhar
      copy.fields = { ...copy.fields, lastComment: null }
    }
    epicsWithComments.push(copy)
  }

  // Buscar changelogs para TODOS os Epics (board 2735) — necessário para calcular cycle time de experimentação
  // e para TODAS as Iniciativas (board 2734) — necessário para cycle time por etapa.
  // Rodamos ambos em paralelo com timeout individual de 8s por chamada.
  const BATCH_SIZE = 8
  const CHANGELOG_TIMEOUT_MS = 8000

  async function fetchChangelogsBatch(issues: JiraIssue[]): Promise<Record<string, ChangelogEntry[]>> {
    const result: Record<string, ChangelogEntry[]> = {}
    for (let i = 0; i < issues.length; i += BATCH_SIZE) {
      const batch = issues.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(e => getIssueChangelog(e.key, CHANGELOG_TIMEOUT_MS))
      )
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          result[batch[idx].key] = r.value
        }
      })
    }
    return result
  }

  const [epicChangelogs, iniciativaChangelogs] = await Promise.all([
    fetchChangelogsBatch(epics),
    fetchChangelogsBatch(iniciativas),
  ])

  return { iniciativas, epics: epicsWithComments, board2734Config, epicChangelogs, iniciativaChangelogs }
}

export interface ChangelogEntry {
  created: string
  items: { field: string; fieldId: string; fromString: string | null; toString: string | null }[]
}

export async function getIssueChangelog(issueKey: string, timeoutMs = 8000): Promise<ChangelogEntry[]> {
  const base = process.env.JIRA_BASE_URL
  if (!base) throw new Error('JIRA_BASE_URL é obrigatório')

  const all: ChangelogEntry[] = []
  const maxResults = 100
  let startAt = 0
  let total = Infinity

  while (startAt < total) {
    const url = `${base}/rest/api/3/issue/${issueKey}/changelog?maxResults=${maxResults}&startAt=${startAt}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        headers: getHeaders(),
        signal: controller.signal,
        next: { revalidate: 300 },
      })

      if (!res.ok) return all // silencioso — retorna o que conseguiu

      const data = await res.json()
      total = data.total ?? 0
      const values: ChangelogEntry[] = data.values ?? []
      all.push(...values)
      startAt += values.length
      if (values.length === 0) break
    } catch {
      return all // timeout ou erro de rede — retorna o que conseguiu
    } finally {
      clearTimeout(timer)
    }
  }

  return all
}
