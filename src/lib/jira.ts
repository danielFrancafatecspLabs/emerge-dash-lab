import https from 'https'
import { JiraIssue, JiraBoardConfiguration } from './types'
import { CAMPOS_BLOQUEIO_PADRAO, ehCampoDeBloqueio, textoDoValor } from './bloqueio'
import { comCache, invalidarCache, salvoEm } from './cache-dados'

// Board IDs (use env vars if present, otherwise fall back to the correct defaults)
export const IDEACAO_BOARD_ID = Number(process.env.JIRA_BOARD_IDEACAO_ID ?? 2734)
export const EXPERIMENTACAO_BOARD_ID = Number(process.env.JIRA_BOARD_INICIATIVAS_ID ?? 2735)

/**
 * Wrapper em torno de fetch() que usa o https module como fallback.
 * Necessário porque o fetch nativo do Node.js 22 falha em algumas
 * redes corporativas com proxy ou SSL inspeccionado.
 */
function jiraFetch(url: string, headers: HeadersInit, signal?: AbortSignal): Promise<Response> {
  // Tentativa 1: fetch nativo. Se falhar (rede corporativa), cairá no catch e tentará com https. Um timeout (signal
  // abortado) não cai no fallback. Sempre `no-store`: o cache dos dados é o de fetchDashboardRaw (cache-dados.ts); o
  // cache de fetch do Next.js, fora de uma requisição (atualização em segundo plano), devolveria respostas antigas.
  return fetch(url, { headers, signal, cache: 'no-store' }).catch(err => {
    if (signal?.aborted) throw err
    return jiraFetchHttps(url, headers)
  })
}

/**
 * Fallback que usa https.get + Buffer para montar uma Response falsa.
 */
function jiraFetchHttps(url: string, headers: HeadersInit): Promise<Response> {
  const urlObj = new URL(url)
  const opts: https.RequestOptions = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    headers: headers as Record<string, string>,
    rejectUnauthorized: false,
  }
  return new Promise((resolve, reject) => {
    https.get(opts, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8')
        // Monta um objeto Response falso que satisfaz a interface esperada
        const response = {
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers: new Headers(res.headers as Record<string, string>),
          json: () => Promise.resolve(JSON.parse(body)),
          text: () => Promise.resolve(body),
        } as Response
        resolve(response)
      })
    }).on('error', reject)
  })
}

const FIELDS_INICIATIVA = [
  'summary', 'status', 'issuetype', 'created', 'updated', 'description',
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
  'updated', // permite reaproveitar changelog e comentário de quem não mudou (atualização incremental)
  'customfield_30014', // Domínio (Empresarial / PME / outros) (was customfield_11661)
  'customfield_13406', // Motivo de Bloqueio
  'customfield_10021', // Flagged (Impediment)
  'customfield_30437', // Tipo de Impedimento
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
  'duedate',             // Data limite
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

/**
 * Valida a estrutura básica de uma resposta da API Jira.
 * Previne que dados malformados propaguem erros obscuros.
 */
function validateJiraResponse(data: unknown, context: string): void {
  if (!data || typeof data !== 'object') {
    throw new Error(`Resposta inválida da API Jira (${context}): resposta não é um objeto`)
  }
  const obj = data as Record<string, unknown>
  // Apenas respostas de listas de issues têm campo "total"
  if (context.includes('issues') && typeof obj.total !== 'number') {
    throw new Error(`Resposta inválida da API Jira (${context}): campo "total" ausente`)
  }
}

async function getBoardConfiguration(boardId: number): Promise<JiraBoardConfiguration> {
  const base = process.env.JIRA_BASE_URL
  if (!base) throw new Error('JIRA_BASE_URL é obrigatório')

  const url = `${base}/rest/agile/1.0/board/${boardId}/configuration`
  const res = await jiraFetch(url, getHeaders())

  if (!res.ok) {
    throw new Error(`Jira API erro ${res.status} — board ${boardId} configuration`)
  }

  const data = await res.json()
  validateJiraResponse(data, `board ${boardId} configuration`)
  return data
}

// Resolve em runtime, pelo NOME, os campos cujo customfield_ID varia por instância ou mudou na migração:
// a "Tecnologia" e os campos de bloqueio/impedimento ("Flagged", "Motivo de Bloqueio", "Tipo de
// Impedimento"…). Usa /rest/api/3/field (todos os campos, com nome e id). Cacheado no módulo.
interface CamposDinamicos {
  tecnologia: string | null
  bloqueio: { id: string; nome: string }[]
  /** De onde vieram os campos de bloqueio (para o diagnóstico). */
  origem: 'jira' | 'padrao'
}
let cachedCampos: CamposDinamicos | undefined

export async function resolverCamposDinamicos(): Promise<CamposDinamicos> {
  if (cachedCampos) return cachedCampos
  const padrao: CamposDinamicos = { tecnologia: null, bloqueio: CAMPOS_BLOQUEIO_PADRAO, origem: 'padrao' }
  const base = process.env.JIRA_BASE_URL
  if (!base) return padrao
  try {
    const res = await jiraFetch(`${base}/rest/api/3/field`, getHeaders())
    if (!res.ok) {
      console.warn(`[jira] /rest/api/3/field respondeu ${res.status}: usando os ids conhecidos dos campos de bloqueio.`)
      return padrao
    }
    const fields: Array<{ id: string; name: string }> = await res.json()
    const tecnologia = fields.find(f => f.name?.trim().toLowerCase() === 'tecnologia')?.id ?? null
    if (!tecnologia) console.warn('[jira] Campo "Tecnologia" não encontrado via /rest/api/3/field — cor por tecnologia ficará vazia.')
    const porNome = fields.filter(f => f.id && f.name && ehCampoDeBloqueio(f.name)).map(f => ({ id: f.id, nome: f.name.trim() }))
    const ids = new Set(porNome.map(f => f.id))
    const bloqueio = [...porNome, ...CAMPOS_BLOQUEIO_PADRAO.filter(c => !ids.has(c.id))]
    cachedCampos = { tecnologia, bloqueio, origem: 'jira' }
  } catch (err) {
    console.warn('[jira] Falha ao listar os campos do Jira:', err)
    return padrao
  }
  return cachedCampos
}

/** Campos pedidos à API para detectar bloqueio: os de bloqueio resolvidos, etiquetas e vínculos. */
export function camposParaBloqueio(c: CamposDinamicos): string[] {
  return [...c.bloqueio.map(b => b.id), 'labels', 'issuelinks']
}

/** Copia para `fields.bloqueioCampos` os campos de bloqueio preenchidos (com o nome), para o mapper. */
export function anexarCamposDeBloqueio(issues: JiraIssue[], c: CamposDinamicos): JiraIssue[] {
  return issues.map(issue => {
    const f = issue.fields as unknown as Record<string, unknown>
    const bloqueioCampos = c.bloqueio
      .map(b => ({ ...b, valor: textoDoValor(f[b.id]) }))
      .filter(b => b.valor)
    return { ...issue, fields: { ...issue.fields, bloqueioCampos } }
  })
}

export async function getAllBoardIssues(boardId: number, fields: string): Promise<JiraIssue[]> {
  const base = process.env.JIRA_BASE_URL
  if (!base) throw new Error('JIRA_BASE_URL é obrigatório')

  const all: JiraIssue[] = []
  const maxResults = 50
  let startAt = 0
  let total = Infinity
  let emptyPageCount = 0

  while (startAt < total) {
    const url =
      `${base}/rest/agile/1.0/board/${boardId}/issue` +
      `?maxResults=${maxResults}&startAt=${startAt}&fields=${fields}`

    const res = await jiraFetch(url, getHeaders())

    if (!res.ok) {
      throw new Error(`Jira API erro ${res.status} — board ${boardId} startAt ${startAt}`)
    }

    const data = await res.json()
    validateJiraResponse(data, `board ${boardId} issues`)

    total = data.total ?? 0
    const issues: JiraIssue[] = data.issues ?? []
    all.push(...issues)
    startAt += issues.length

    // Proteção contra loop infinito
    if (issues.length === 0) {
      emptyPageCount++
      if (emptyPageCount >= 3) break // 3 páginas vazias consecutivas = algo errado
    } else {
      emptyPageCount = 0
    }
  }

  return all
}

export interface DashboardRaw {
  iniciativas: JiraIssue[]
  epics: JiraIssue[]
  board2734Config: JiraBoardConfiguration
  board2735Config: JiraBoardConfiguration
  epicChangelogs: Record<string, ChangelogEntry[]>
  iniciativaChangelogs: Record<string, ChangelogEntry[]>
}

const CHAVE_CACHE_DASHBOARD = 'jira-dashboard'
const segundos = (v: string | undefined, padrao: number) => (Number(v) > 0 ? Number(v) : padrao) * 1000

/**
 * Dados brutos do Jira usados por todas as visões (Estratégia, Portfólio, Comparativo, Semanal…), com cache no
 * servidor: dentro de JIRA_CACHE_TTL_SECONDS (padrão 5 min) não há nenhuma chamada ao Jira; depois disso a página abre
 * com a última versão e o Jira é consultado em segundo plano, buscando changelog e comentário só das issues que mudaram.
 */
export function fetchDashboardRaw(): Promise<DashboardRaw> {
  return comCache(CHAVE_CACHE_DASHBOARD, buscarDashboardRaw, {
    frescoPorMs: segundos(process.env.JIRA_CACHE_TTL_SECONDS, 300),
    maximoObsoletoMs: segundos(process.env.JIRA_CACHE_MAX_STALE_SECONDS, 24 * 60 * 60),
  })
}

/** "Atualizar dados": o próximo pedido busca no Jira (de forma incremental) em vez de servir o cache. */
export const invalidarDashboardRaw = () => invalidarCache(CHAVE_CACHE_DASHBOARD)

/** Quando os dados em cache foram lidos do Jira. */
export const dashboardRawAtualizadoEm = () => salvoEm(CHAVE_CACHE_DASHBOARD)

/** Executa `tarefa` para cada item com no máximo `limite` em paralelo (sem esperar o mais lento de cada lote). */
async function emParalelo<T>(itens: T[], limite: number, tarefa: (item: T) => Promise<void>) {
  let proximo = 0
  const trabalhador = async () => {
    while (proximo < itens.length) await tarefa(itens[proximo++])
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador))
}

/** A issue não mudou desde a leitura anterior (mesmo `updated`), então o changelog e o comentário dela também não. */
function semMudanca(issue: JiraIssue, anteriores: Map<string, JiraIssue>): JiraIssue | undefined {
  const antes = anteriores.get(issue.key)
  const atual = issue.fields?.updated
  return antes && atual && antes.fields?.updated === atual ? antes : undefined
}

async function buscarDashboardRaw(anterior?: DashboardRaw): Promise<DashboardRaw> {
  const campos = await resolverCamposDinamicos()
  const tecnologiaFieldId = campos.tecnologia
  const fieldsEpicComTecnologia = [...new Set([
    ...FIELDS_EPIC.split(','), ...(tecnologiaFieldId ? [tecnologiaFieldId] : []), ...camposParaBloqueio(campos),
  ])].join(',')

  const [iniciativas, epicsRaw, board2734Config, board2735Config] = await Promise.all([
    getAllBoardIssues(IDEACAO_BOARD_ID, FIELDS_INICIATIVA),
    getAllBoardIssues(EXPERIMENTACAO_BOARD_ID, fieldsEpicComTecnologia),
    getBoardConfiguration(IDEACAO_BOARD_ID),
    getBoardConfiguration(EXPERIMENTACAO_BOARD_ID),
  ])

  // Normaliza o valor do campo "Tecnologia" (customfield_ID resolvido acima)
  // para uma chave fixa `tecnologia` — assim o resto do código não precisa
  // conhecer o ID dinâmico do campo.
  const epics: JiraIssue[] = anexarCamposDeBloqueio(tecnologiaFieldId
    ? epicsRaw.map(e => ({ ...e, fields: { ...e.fields, tecnologia: (e.fields as any)[tecnologiaFieldId] ?? null } }))
    : epicsRaw, campos)

  // Buscar último comentário (texto plano) apenas para Epics em refinamento/andamento/validação
  async function getIssueLastComment(issueKey: string): Promise<string | null> {
    const base = process.env.JIRA_BASE_URL
    if (!base) throw new Error('JIRA_BASE_URL é obrigatório')
    const url = `${base}/rest/api/3/issue/${issueKey}/comment?maxResults=200`
    const res = await jiraFetch(url, getHeaders())
    // Falha não aborta o dashboard: o epic segue sem comentário (ver o catch abaixo).
    if (!res.ok) throw new Error(`comentários ${issueKey}: Jira respondeu ${res.status}`)
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

  // Status IDs de Epic para os quais buscamos o último comentário (usado como "status
  // detalhado" no Report): Em refinamento, Em andamento e Em validação — inclui aliases
  // legados/migrados vistos no board 2735 (ver STATUS_PIPELINE em mappers.ts).
  const EPIC_STATUS_NEEDS_COMMENT = new Set(['10139', '14538', '3', '10204', '11201'])

  const epicsAnteriores = new Map((anterior?.epics ?? []).map(e => [e.key, e]))
  const epicsWithComments: JiraIssue[] = await Promise.all(
    epics.map(async e => {
      const copy = { ...e }
      if (!EPIC_STATUS_NEEDS_COMMENT.has(copy.fields?.status?.id ?? '')) return copy
      const antes = semMudanca(copy, epicsAnteriores)
      if (antes && antes.fields && 'lastComment' in antes.fields) {
        copy.fields = { ...copy.fields, lastComment: antes.fields.lastComment }
        return copy
      }
      try {
        copy.fields = { ...copy.fields, lastComment: await getIssueLastComment(copy.key) }
      } catch {
        // Silencioso: o epic segue sem comentário nesta leitura, sem `lastComment`, para ser buscado de novo na próxima.
      }
      return copy
    })
  )

  // Changelogs de TODOS os Epics (cycle time de experimentação, data de conclusão) e de TODAS as Iniciativas (cycle
  // time por etapa). Só busca os de issues novas ou alteradas desde a leitura anterior; os demais são reaproveitados.
  const CONCORRENCIA = 8
  const CHANGELOG_TIMEOUT_MS = 8000

  async function fetchChangelogs(issues: JiraIssue[], anteriores: JiraIssue[], logsAnteriores: Record<string, ChangelogEntry[]>) {
    const result: Record<string, ChangelogEntry[]> = {}
    const porChave = new Map(anteriores.map(i => [i.key, i]))
    const faltando = issues.filter(i => {
      const reaproveitavel = semMudanca(i, porChave) && logsAnteriores[i.key]
      if (reaproveitavel) result[i.key] = reaproveitavel
      return !reaproveitavel
    })
    await emParalelo(faltando, CONCORRENCIA, async issue => {
      // Uma falha deixa a issue sem histórico nesta leitura; ela é buscada de novo na próxima.
      try { result[issue.key] = await getIssueChangelog(issue.key, CHANGELOG_TIMEOUT_MS) } catch { /* segue sem */ }
    })
    return { result, buscados: faltando.length }
  }

  const [epicLogs, iniciativaLogs] = await Promise.all([
    fetchChangelogs(epics, anterior?.epics ?? [], anterior?.epicChangelogs ?? {}),
    fetchChangelogs(iniciativas, anterior?.iniciativas ?? [], anterior?.iniciativaChangelogs ?? {}),
  ])
  const epicChangelogs = epicLogs.result
  const iniciativaChangelogs = iniciativaLogs.result
  console.log(`[jira] changelogs buscados: ${epicLogs.buscados}/${epics.length} epics, ${iniciativaLogs.buscados}/${iniciativas.length} iniciativas`)

  return { iniciativas, epics: epicsWithComments, board2734Config, board2735Config, epicChangelogs, iniciativaChangelogs }
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
  let tentativas = 0

  while (startAt < total) {
    const url = `${base}/rest/api/3/issue/${issueKey}/changelog?maxResults=${maxResults}&startAt=${startAt}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response
    try {
      res = await jiraFetch(url, getHeaders(), controller.signal)
    } catch (err) {
      // Timeout ou erro de rede: uma nova tentativa; depois disso o histórico conta como indisponível.
      if (++tentativas > 2) throw new Error(`changelog ${issueKey}: ${String(err)}`)
      continue
    } finally {
      clearTimeout(timer)
    }

    // Limite de requisições (429) ou instabilidade (5xx): espera e tenta de novo, em vez de devolver o histórico vazio.
    if (res.status === 429 || res.status >= 500) {
      if (++tentativas > 3) throw new Error(`changelog ${issueKey}: Jira respondeu ${res.status}`)
      const espera = Number(res.headers.get('retry-after'))
      await new Promise(r => setTimeout(r, Math.min(10_000, (espera > 0 ? espera * 1000 : 1000 * 2 ** (tentativas - 1)))))
      continue
    }
    if (!res.ok) throw new Error(`changelog ${issueKey}: Jira respondeu ${res.status}`)

    const data = await res.json()
    total = data.total ?? 0
    const values: ChangelogEntry[] = data.values ?? []
    all.push(...values)
    startAt += values.length
    if (values.length === 0) break
  }

  return all
}
