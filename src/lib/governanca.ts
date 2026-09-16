import { DashboardData, EpicDetail, Iniciativa, JiraStatus } from './types'

type JiraBoardConfiguration = any

/**
 * Dados para o slide "Governança beOn Labs" (slide 1 da Weekly) — um
 * swimlane com uma linha por Domínio e uma coluna por fase da jornada,
 * cada Epic aparecendo como uma bolinha na célula correspondente.
 *
 * As 3 primeiras colunas olham só para o status do próprio Epic (board de
 * Experimentação). As 3 últimas olham para o status da Iniciativa-mãe
 * (board de Ideação) — um Epic só aparece nelas depois de concluído, então
 * a fase do Epic sozinho já não diz mais nada útil: o que importa é onde a
 * Iniciativa está no funil de validação de campo.
 */

export interface GovernancaDot {
  epic: EpicDetail
  prioridade: boolean   // sub-status ⭐
  bloqueio: boolean     // sub-status 🔒
}

export interface GovernancaColumn {
  id: string
  label: string
  dots: GovernancaDot[]
}

export interface GovernancaDomainRow {
  dominio: string
  total: number
  columns: GovernancaColumn[]
}

export interface GovernancaData {
  columns: { id: string; label: string; total: number }[]
  domains: GovernancaDomainRow[]
  totalEpics: number
  isSample: boolean
}

const COLUMN_DEFS: { id: string; label: string }[] = [
  { id: 'pre-analise', label: 'Pré-análise' },
  { id: 'prospeccao', label: 'Prospecção' },
  { id: 'em-andamento', label: 'Em andamento' },
  { id: 'concluidos', label: 'Concluídos' },
  { id: 'piloto-andamento', label: 'Piloto' },
  { id: 'em-escala', label: 'Em Escala' },
]

const PRIORIDADE_ALTA = new Set(['highest', 'high', 'alta', 'urgente', 'crítica', 'critica'])

function isPrioridadeAlta(epic: EpicDetail): boolean {
  const p = (epic.prioridade ?? '').toString().trim().toLowerCase()
  return PRIORIDADE_ALTA.has(p)
}

function isBloqueado(epic: EpicDetail): boolean {
  return !!epic.flagged || !!(epic.motivoBloqueio && epic.motivoBloqueio.trim())
}

function buildDot(epic: EpicDetail): GovernancaDot {
  return {
    epic,
    prioridade: isPrioridadeAlta(epic),
    bloqueio: isBloqueado(epic),
  }
}

// Checagens por id+nome EXATAS — usadas como FALLBACK caso a configuração
// live do board 2735 não esteja disponível. Não usar como fonte primária:
// hardcodar status IDs já causou classificação errada de Epics cancelados
// aparecendo em Pré-análise, porque a coluna real de um status no board pode
// divergir do que está fixo aqui. Preferir sempre buildColunaPorStatusId().
function statusIs(status: JiraStatus | undefined, ids: string[], names: string[]): boolean {
  if (!status) return false
  return ids.includes(status.id) || names.includes(status.name)
}

function columnForFallback(status: JiraStatus | undefined): 'pre-analise' | 'prospeccao' | 'em-andamento' | 'concluido' | 'cancelado' | null {
  if (statusIs(status, ['10004'], ['BACKLOG'])) return 'pre-analise'
  if (statusIs(status, ['10139'], ['Em refinamento', 'EM REFINAMENTO'])) return 'prospeccao'
  if (statusIs(status, ['3'], ['Em andamento'])) return 'em-andamento'
  if (statusIs(status, ['10204'], ['EM VALIDAÇÃO', 'Em validação'])) return 'em-andamento'
  if (statusIs(status, ['10015'], ['Cancelado', 'CANCELADO'])) return 'cancelado'
  if (statusIs(status, ['10019'], [])) return 'concluido'
  return null
}

/**
 * Mapa status.id -> nome REAL da coluna no board 2735 (Experimentação), a
 * partir da configuração live do board (GET /board/2735/configuration).
 * É a fonte de verdade sobre "esse status pertence a qual coluna hoje" —
 * mais confiável do que qualquer lista fixa de IDs, porque reflete a
 * reconfiguração atual do board (ex.: um status pode ter sido movido para a
 * coluna CANCELADO sem que o nome/ID do status em si tenha mudado).
 */
function buildColunaPorStatusId(boardConfig?: JiraBoardConfiguration): Map<string, string> {
  const map = new Map<string, string>()
  const columns = boardConfig?.columnConfig?.columns
  if (!Array.isArray(columns)) return map
  for (const col of columns) {
    const nome = (col?.name ?? '').toString().trim().toUpperCase()
    for (const s of col?.statuses ?? []) {
      if (s?.id) map.set(s.id, nome)
    }
  }
  return map
}

// Classifica pelo NOME real da coluna (substring, robusto a variações de
// grafia) em vez de comparar o nome inteiro — mesmo padrão já usado em
// mappers.ts (colunaParaPipelineKey) para o board 2734.
function classifyColumnName(nome: string): 'pre-analise' | 'prospeccao' | 'em-andamento' | 'concluido' | 'cancelado' | null {
  if (nome.includes('CANCEL')) return 'cancelado'
  if (nome.includes('BACKLOG')) return 'pre-analise'
  if (nome.includes('REFINAMENTO')) return 'prospeccao'
  if (nome.includes('CONCLU')) return 'concluido'
  if (nome.includes('VALID') || nome.includes('ANDAMENTO')) return 'em-andamento'
  return null
}

export function buildGovernancaData(data: DashboardData, board2735Config?: JiraBoardConfiguration): GovernancaData {
  const iniciativaByKey = new Map<string, Iniciativa>(data.iniciativas.map(i => [i.key, i]))
  const colunaPorStatusId = buildColunaPorStatusId(board2735Config)

  function columnFor(epic: EpicDetail): string | null {
    const status = epic.status
    const colNome = status ? colunaPorStatusId.get(status.id) : undefined
    const bucket = colNome ? classifyColumnName(colNome) : null
    const efetivo = bucket ?? columnForFallback(status)

    if (efetivo === 'pre-analise') return 'pre-analise'
    if (efetivo === 'prospeccao') return 'prospeccao'
    if (efetivo === 'em-andamento') return 'em-andamento'
    if (efetivo === 'cancelado' || efetivo === null) return null   // cancelados e status não mapeados não fazem parte desta visão

    // A partir daqui o Epic já foi concluído — o que importa agora é onde
    // a Iniciativa-mãe está no funil de validação de campo (board de Ideação).
    const parent = epic.parentKey ? iniciativaByKey.get(epic.parentKey) : undefined
    if (!parent) return null
    const parentStatus = parent.status
    if (statusIs(parentStatus, ['13045'], ['Aguardando Piloto'])) return 'concluidos'
    if (statusIs(parentStatus, ['12847'], ['EM PILOTO', 'Em Piloto'])) return 'piloto-andamento'
    if (statusIs(parentStatus, ['12848'], ['EM ESCALA', 'Em Escala', 'Em escala', 'FINALIZADO', 'Finalizado'])) return 'em-escala'
    return null
  }

  const domainMap = new Map<string, Map<string, GovernancaDot[]>>()

  for (const epic of data.allEpics) {
    const columnId = columnFor(epic)
    if (!columnId) continue
    const dominio = epic.dominio?.trim() || 'Sem Domínio'
    if (!domainMap.has(dominio)) domainMap.set(dominio, new Map())
    const cols = domainMap.get(dominio)!
    if (!cols.has(columnId)) cols.set(columnId, [])
    cols.get(columnId)!.push(buildDot(epic))
  }

  const domains: GovernancaDomainRow[] = [...domainMap.entries()]
    .map(([dominio, cols]) => {
      const columns: GovernancaColumn[] = COLUMN_DEFS.map(def => ({ ...def, dots: cols.get(def.id) ?? [] }))
      const total = columns.reduce((sum, c) => sum + c.dots.length, 0)
      return { dominio, total, columns }
    })
    .filter(row => row.total > 0)
    .sort((a, b) => {
      const aOutras = a.dominio === 'Sem Domínio' || /outra/i.test(a.dominio)
      const bOutras = b.dominio === 'Sem Domínio' || /outra/i.test(b.dominio)
      if (aOutras !== bOutras) return aOutras ? 1 : -1
      return a.dominio.localeCompare(b.dominio, 'pt-BR')
    })

  const columns = COLUMN_DEFS.map(def => ({
    ...def,
    total: domains.reduce((sum, row) => sum + (row.columns.find(c => c.id === def.id)?.dots.length ?? 0), 0),
  }))
  const totalEpics = columns.reduce((sum, c) => sum + c.total, 0)

  return { columns, domains, totalEpics, isSample: false }
}

/**
 * Filtra uma GovernancaData já pronta para conter só os Epics bloqueados —
 * usado no slide "Bloqueios", que mostra exatamente os pontos onde o
 * executivo precisa ajudar a destravar. Reaproveita a classificação de
 * Domínio/Fase já feita em buildGovernancaData em vez de refazer o
 * agrupamento do zero, então os dois slides nunca podem divergir sobre
 * "em qual fase esse Epic está".
 */
export function filterBloqueados(data: GovernancaData): GovernancaData {
  const domains: GovernancaDomainRow[] = data.domains
    .map(row => {
      const columns: GovernancaColumn[] = row.columns.map(col => ({
        ...col,
        dots: col.dots.filter(d => d.bloqueio),
      }))
      const total = columns.reduce((sum, c) => sum + c.dots.length, 0)
      return { dominio: row.dominio, total, columns }
    })
    .filter(row => row.total > 0)

  const columns = COLUMN_DEFS.map(def => ({
    ...def,
    total: domains.reduce((sum, row) => sum + (row.columns.find(c => c.id === def.id)?.dots.length ?? 0), 0),
  }))
  const totalEpics = columns.reduce((sum, c) => sum + c.total, 0)

  return { columns, domains, totalEpics, isSample: data.isSample }
}

// ── Dados de exemplo (usados quando o Jira está indisponível) ──

let sampleSeq = 0
function sampleEpic(nome: string, dominio: string, tecnologia: string, opts: Partial<EpicDetail> = {}): EpicDetail {
  sampleSeq += 1
  return {
    key: `GL-${2000 + sampleSeq}`,
    nome,
    status: { id: '10019', name: 'Concluído' },
    parentKey: null,
    tecnologia,
    sponsor: 'Rodrigo Assad',
    bo: 'Sidney Neves',
    complexidade: 'Alta',
    timeResponsavel: 'BeOn Labs',
    beneficioQuantitativo: 1200000,
    beneficioQualitativo: 'Reduz esforço manual da operação',
    dominio,
    custoEstimado: 350000,
    custoRealizado: 'R$ 310 mil',
    segmento: 'Consumo',
    portfolio: 'Automação',
    diretoria: 'Diretoria Digital',
    metaCategoria: null,
    tipo: 'Epic',
    mercado: 'Consumo',
    descricao: 'Experimento ilustrativo — dado de exemplo (Jira indisponível).',
    motivoBloqueio: null,
    flagged: null,
    tipoImpedimento: null,
    statusDetalhado: null,
    prioridade: null,
    duedate: null,
    criadoEm: null,
    concluidoEm: null,
    anexos: null,
    ...opts,
  }
}

// [domínio, contagens por coluna] — só a forma aproximada da referência,
// para o slide não ficar vazio quando o Jira estiver fora do ar.
// Volume alto e desbalanceado de propósito (~110 épicos, domínios e fases
// bem desiguais entre si) — dado de exemplo precisa estressar o mesmo
// cenário do Jira real: uma célula pode ter 1 épico ou 20+, e o layout
// precisa se comportar igual nos dois casos (ver SummaryTile em
// GovernancaSlide.tsx).
const SAMPLE_SHAPE: [string, number[]][] = [
  ['RH', [0, 0, 0, 0, 0, 1]],
  ['Jurídico', [2, 1, 3, 1, 0, 2]],
  ['DAC', [3, 2, 4, 1, 0, 1]],
  ['Canais Remotos', [1, 3, 5, 0, 0, 0]],
  ['Técnica', [2, 4, 6, 1, 0, 0]],
  ['BeOn Labs', [0, 0, 1, 2, 0, 0]],
  ['Digital', [4, 5, 9, 3, 1, 2]],
  ['HITSS', [1, 1, 3, 0, 1, 0]],
  ['Outras Frentes', [8, 6, 15, 4, 0, 3]],
]
const TECNOLOGIAS = ['Web 3', 'A.I e Analytics', 'Future Network', 'Outras Tecnologias']
const NOMES_EXEMPLO = [
  'Triagem de Chamados', 'Score de Churn', 'Clarinha 2.0', 'Roteirização IA',
  'Copiloto de Vendas', 'Detector de Fraude', 'Gestão de Incidentes', 'Speech Analytics',
  'URA Cognitiva', 'Alarme de Rede', 'Chatbot Jurídico', 'Onboarding Digital',
  'Auto-Reparo de Rede', 'Previsão de Demanda', 'Busca Inteligente', 'Validação de SD',
]
let nomeSeq = 0
function proximoNomeExemplo(): string {
  nomeSeq += 1
  return NOMES_EXEMPLO[nomeSeq % NOMES_EXEMPLO.length]
}

export const SAMPLE_GOVERNANCA_DATA: GovernancaData = (() => {
  const domains: GovernancaDomainRow[] = SAMPLE_SHAPE.map(([dominio, counts]) => {
    const columns: GovernancaColumn[] = COLUMN_DEFS.map((def, i) => ({
      ...def,
      dots: Array.from({ length: counts[i] }, (_, j) => buildDot(sampleEpic(
        proximoNomeExemplo(),
        dominio,
        TECNOLOGIAS[(i + j) % TECNOLOGIAS.length],
        {
          // Espalha alguns bloqueios por fases diferentes (não só "Em
          // andamento") para o slide de Bloqueios ter exemplo variado.
          flagged: (j === 0 && (i === 2 || i === 4)) || (i === 0 && j === 1) ? true : null,
          motivoBloqueio: (j === 0 && i === 2) ? 'Aguardando priorização da área'
            : (j === 0 && i === 4) ? 'Time de negócio sem disponibilidade para validar'
              : (i === 0 && j === 1) ? 'Falta acesso ao ambiente de dados' : null,
          prioridade: j === 0 ? 'Alta' : null,
        }
      ))),
    }))
    const total = columns.reduce((sum, c) => sum + c.dots.length, 0)
    return { dominio, total, columns }
  }).filter(row => row.total > 0)

  const columns = COLUMN_DEFS.map(def => ({
    ...def,
    total: domains.reduce((sum, row) => sum + (row.columns.find(c => c.id === def.id)?.dots.length ?? 0), 0),
  }))
  const totalEpics = columns.reduce((sum, c) => sum + c.total, 0)

  return { columns, domains, totalEpics, isSample: true }
})()
