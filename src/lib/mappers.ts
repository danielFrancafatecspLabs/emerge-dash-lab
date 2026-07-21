import {
  JiraIssue,
  JiraStatus,
  EpicDetail,
  Iniciativa,
  DashboardData,
  PipelineCount,
  MercadoAgregado,
  LeadTimeStats,
  CycleTimeEstagio,
} from './types'
import type { ChangelogEntry } from './jira'
import type { MetaCategoria } from './portfolio-classifier'
import type { SegmentoMercado } from './segmento-classifier'

// Fallback para epics sem classificação no mapa (não deve acontecer na prática)
function getSegmentoFallback(dominio: string | null | undefined): SegmentoMercado {
  const d = (dominio ?? '').toLowerCase()
  if (d === 'empresarial' || d === 'pme') return 'PME/GE/GOV'
  return 'Consumo'
}

function getSegmento(dominio: string | null | undefined): SegmentoMercado {
  if (dominio === 'Empresarial' || dominio === 'PME') return 'Corporativo'
  return 'Consumo'
}

// Status IDs confirmados via API (board 2706 — Iniciativas, board 2707 — Experimentos)
export const STATUS_PIPELINE: Record<string, keyof PipelineCount> = {
  '10004': 'BACKLOG',
  '10139': 'EM REFINAMENTO',
  '10067': 'PRONTO PARA EXECUÇÃO',
  '13045': 'AGUARDANDO PILOTO',
  '12848': 'EM EXPERIMENTAÇÃO',
  '12847': 'EM PILOTO',
  '10504': 'EM ESCALA',
  '10003': 'FINALIZADO',
  '10015': 'CANCELADO',
  // Board 2707 (Experimentos/Epics) — status específicos
  '3': 'EM EXPERIMENTAÇÃO',     // "Em andamento"
  '10204': 'EM EXPERIMENTAÇÃO', // "EM VALIDAÇÃO"
}

// Aliases de sponsors — nomes parciais ou com typo mapeados para o nome canônico
const SPONSOR_ALIASES: Record<string, string> = {
  'Assad':            'Rodrigo Assad',
  'Sidney':           'Sidney Neves',
  'Marcos Zumba':     'Marco Zumba',
  'Carla Tieme':      'Carla Tiemi',
  'Duclos':           'Rodrigo Duclos',
  'Rogerio Estrela':  'Rogério Estrela',
  'Patricia Mofato':  'Patrícia Mofato',
}

function normalizeSponsor(raw: string): string {
  const trimmed = raw.trim()
  return SPONSOR_ALIASES[trimmed] ?? trimmed
}

function mapEpicToDetail(epic: JiraIssue): EpicDetail {
  const f = epic.fields
  return {
    key: epic.key,
    nome: f.summary,
    status: f.status,
    sponsor: f.customfield_11662 ? normalizeSponsor(f.customfield_11662) : null,
    bo: f.customfield_11663 ?? null,
    complexidade: f.customfield_11664 ?? null,
    timeResponsavel: f.customfield_11665 ?? null,
    beneficioQuantitativo: f.customfield_13242 ?? null,
    beneficioQualitativo: f.customfield_13243 ?? null,
    dominio: f.customfield_16400?.value ?? null,
    custoEstimado: f.customfield_13571 ?? null,
    custoRealizado: f.customfield_11668 ?? null,
    segmento: f.customfield_11378?.value ?? null,
    portfolio: f.customfield_15919?.value ?? null,
    diretoria: f.customfield_10904 ?? null,
    metaCategoria: null,
    tipo: f.issuetype?.name ?? null,
    mercado: getSegmento(f.customfield_11661),
    descricao: f.description ?? null,
    motivoBloqueio: f.customfield_13406?.value ?? null,
    statusDetalhado: f.lastComment ?? null,
    prioridade: f.priority?.name ?? null,
    criadoEm: f.created ?? null,
  }
}

const DONUT_COLORS: Record<string, string> = {
  'BACKLOG':              '#D4D4D4',
  'EM REFINAMENTO':       '#a8a29e',
  'PRONTO PARA EXECUÇÃO': '#d4d4d4',
  'EM EXPERIMENTAÇÃO':    '#ea580c',
  'AGUARDANDO PILOTO':    '#84cc16',
  'EM PILOTO':            '#16a34a',
  'EM ESCALA':            '#22C55E',
  'FINALIZADO':           '#6b7280',
  'CANCELADO':            '#ef4444',
}

const STATUS_NAME_PIPELINE: Record<string, keyof PipelineCount> = {
  'EM ESCALA': 'EM ESCALA',
  'ESCALA': 'EM ESCALA',
}

export function getPipelineStage(status: JiraStatus): keyof PipelineCount | undefined {
  const normalized = status.name.trim().toUpperCase()
  if (normalized.includes('ESCALA') && !normalized.includes('AGUARDANDO')) return 'EM ESCALA'
  return STATUS_PIPELINE[status.id] ?? STATUS_NAME_PIPELINE[normalized]
}

export function getPipelineConversionRate(pipeline: PipelineCount): string {
  const total = Object.values(pipeline).reduce((sum, value) => sum + value, 0)
  return total > 0 ? `${Math.round((pipeline.FINALIZADO / total) * 100)}%` : '0%'
}

export function buildDashboardData(
  iniciativasRaw: JiraIssue[],
  epicsRaw: JiraIssue[],
  portfolioClassification: Record<string, MetaCategoria> = {},
  segmentoClassification: Record<string, SegmentoMercado> = {},
  boardConfig?: JiraBoardConfiguration,
  epicChangelogs: Record<string, ChangelogEntry[]> = {},
  iniciativaChangelogs: Record<string, ChangelogEntry[]> = {}
): DashboardData {
  // 1. Mapear todos os epics com metaCategoria e segmento (LLM)
  const epicDetailMap = new Map(
    epicsRaw.map(e => {
      const detail = mapEpicToDetail(e)
      const seg = segmentoClassification[e.key]
      if (seg) detail.mercado = seg
      return [e.key, { ...detail, metaCategoria: portfolioClassification[e.key] ?? null }]
    })
  )

  // 2. Agrupar Epics por Iniciativa-mãe (via parent.key)
  const epicsByParent = new Map<string, JiraIssue[]>()
  for (const epic of epicsRaw) {
    const parentKey = epic.fields.parent?.key
    if (!parentKey) continue
    if (!epicsByParent.has(parentKey)) epicsByParent.set(parentKey, [])
    epicsByParent.get(parentKey)!.push(epic)
  }

  // 3. Montar Iniciativas com Epics agregados
  const iniciativas: Iniciativa[] = iniciativasRaw.map(ini => {
    const myEpics = (epicsByParent.get(ini.key) ?? []).map(e => epicDetailMap.get(e.key)!)
    const metaCounts = new Map<MetaCategoria, { count: number; valor: number }>()
    for (const epic of myEpics) {
      const meta = epic.metaCategoria
      if (!meta) continue
      const existing = metaCounts.get(meta) ?? { count: 0, valor: 0 }
      existing.count += 1
      existing.valor += epic.beneficioQuantitativo ?? 0
      metaCounts.set(meta, existing)
    }
    const metaCategoria = Array.from(metaCounts.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count
        return b[1].valor - a[1].valor
      })[0]?.[0] ?? null

    return {
      key: ini.key,
      nome: ini.fields.summary,
      status: ini.fields.status,
      metaCategoria,
      epics: myEpics,
      beneficioQuantitativo: ini.fields.customfield_13242 ?? null,
      beneficioQuantitativoTotal: myEpics.reduce(
        (s, e) => s + (e.beneficioQuantitativo ?? 0), 0
      ),
      dominios: Array.from(new Set(myEpics.map(e => e.dominio).filter(Boolean) as string[])),
      sponsors: Array.from(new Set(myEpics.map(e => e.sponsor).filter(Boolean) as string[])),
      segmentos: Array.from(new Set(myEpics.map(e => e.segmento).filter(Boolean) as string[])),
      timeResponsavel: ini.fields.customfield_11665 ?? null,
      sponsor: ini.fields.customfield_11662 ? normalizeSponsor(ini.fields.customfield_11662) : null,
      criadoEm: ini.fields.created ?? null,
    }
  })

  // 3. Pipeline — contagem por coluna (Iniciativas)
  // Extrai os status IDs de cada coluna do board 2706 a partir do boardConfig
  const colunaStatusIds = new Map<string, string[]>()
  const colunaNomeNormalizado = new Map<string, string>()
  if (boardConfig?.columnConfig?.columns) {
    for (const col of boardConfig.columnConfig.columns) {
      const nomeUpper = col.name.trim().toUpperCase()
      colunaNomeNormalizado.set(nomeUpper, col.name.trim())
      colunaStatusIds.set(nomeUpper, col.statuses.map(s => s.id))
    }
  }

  // Função auxiliar: dado um status, descobre a qual coluna pertence
  function getColunaPeloStatus(status: JiraStatus): string | undefined {
    for (const [colNome, ids] of colunaStatusIds.entries()) {
      if (ids.includes(status.id)) return colNome
    }
    return undefined
  }

  // Mapeia nome da coluna → chave do PipelineCount
  function colunaParaPipelineKey(colNome: string): keyof PipelineCount | undefined {
    const n = colNome.toUpperCase()
    if (n.includes('BACKLOG')) return 'BACKLOG'
    if (n.includes('REFINAMENTO')) return 'EM REFINAMENTO'
    if (n.includes('PRONTO')) return 'PRONTO PARA EXECUÇÃO'
    if (n.includes('EXPERIMENTA')) return 'EM EXPERIMENTAÇÃO'
    if (n.includes('AGUARDANDO PILOTO')) return 'AGUARDANDO PILOTO'
    if (n === 'EM PILOTO' || n.includes('PILOTO')) return 'EM PILOTO'
    if (n.includes('ESCALA')) return 'EM ESCALA'
    if (n.includes('FINALIZADO') || n.includes('CONCLUÍDO')) return 'FINALIZADO'
    if (n.includes('CANCELADO')) return 'CANCELADO'
    return undefined
  }

  // IDs das colunas EM PILOTO e EM ESCALA (para exportar no DashboardData)
  const pilotoStatusIds: string[] = colunaStatusIds.get('EM PILOTO') ?? ['12847']
  const escalaStatusIds: string[] = colunaStatusIds.get('EM ESCALA') ?? []

  const pipelineActual: PipelineCount = {
    BACKLOG: 0, 'EM REFINAMENTO': 0, 'PRONTO PARA EXECUÇÃO': 0,
    'EM EXPERIMENTAÇÃO': 0, 'AGUARDANDO PILOTO': 0, 'EM PILOTO': 0,
    'EM ESCALA': 0, FINALIZADO: 0, CANCELADO: 0,
  }
  for (const ini of iniciativas) {
    // Tenta primeiro pelo boardConfig (mais preciso)
    const colNome = getColunaPeloStatus(ini.status)
    if (colNome) {
      const key = colunaParaPipelineKey(colNome)
      if (key) { pipelineActual[key]++; continue }
    }
    // Fallback: usa o mapeamento antigo por status ID/nome
    const col = getPipelineStage(ini.status)
    if (col) pipelineActual[col]++
  }

  const pipeline: PipelineCount = { ...pipelineActual }

  // Contagens específicas por status ID para os cards do Resumo do Portfólio
  const iniciativasAguardandoPiloto = iniciativas.filter(i => i.status.id === '13045').length
  const iniciativasEmPiloto         = iniciativas.filter(i => i.status.id === '12847').length

  // 4. Métricas de Epics ativos
  const epicsAtivos = epicsRaw.filter(e =>
    e.fields.status.id !== '10015' && e.fields.status.id !== '10003'
  )
  const allEpicDetails = Array.from(epicDetailMap.values())

  // Ordenar por prioridade: itens com prioridade mais alta aparecem primeiro.
  // Definimos uma ordem de prioridade conhecida (Ex: Blocker > Critical > High > Medium > Low)
  const PRIORITY_ORDER = ['High', 'Medium', 'Low']
  allEpicDetails.sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf((a.prioridade ?? '').toString())
    const bi = PRIORITY_ORDER.indexOf((b.prioridade ?? '').toString())
    const aIndex = ai === -1 ? PRIORITY_ORDER.length : ai
    const bIndex = bi === -1 ? PRIORITY_ORDER.length : bi
    if (aIndex !== bIndex) return aIndex - bIndex
    // Fallback para ordenar por beneficio quantitativo decrescente
    return (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)
  })

  // Benefício vem dos Epics (customfield_13242 preenchido no board 2707)
  const epicsComBeneficio = allEpicDetails.filter(e => (e.beneficioQuantitativo ?? 0) > 0)
  const beneficioTotal = epicsComBeneficio.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
  const beneficioMedio = epicsComBeneficio.length ? beneficioTotal / epicsComBeneficio.length : 0

  // 5. Portfólio por mercado (via classificação LLM: EBITDA / NPS / Receita, por epic.key)
  const mercadoMap = new Map<string, EpicDetail[]>()
  for (const e of allEpicDetails) {
    const cat = portfolioClassification[e.key] ?? 'Não classificado'
    if (!mercadoMap.has(cat)) mercadoMap.set(cat, [])
    mercadoMap.get(cat)!.push(e)
  }

  const mercados: MercadoAgregado[] = Array.from(mercadoMap.entries()).map(([nome, epics]) => {
    const domCount = new Map<string, number>()
    for (const e of epics) {
      if (e.dominio) domCount.set(e.dominio, (domCount.get(e.dominio) ?? 0) + 1)
    }
    const total = epics.length
    const dominios = Array.from(domCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n, count]) => ({ nome: n, count, pct: Math.round((count / total) * 100) }))
    return {
      nome,
      qtdExperimentos: epics.length,
      valorPotencial: epics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
      dominios,
      epics,
      alertas: {
        bloqueadosIA:       epics.filter(e => !!e.motivoBloqueio).length,
        aguardandoDelivery: epics.filter(e => e.status.id === '10067').length,
        semSponsor:         epics.filter(e => !e.sponsor).length,
      },
    }
  }).sort((a, b) => b.qtdExperimentos - a.qtdExperimentos)

  // 6. Portfólio por segmento de mercado (Consumo / Corporativo / PME/GE/GOV)
  const dominioByKey = new Map(epicsRaw.map(e => [e.key, e.fields.customfield_11661 ?? null]))
  const SEGMENTOS: SegmentoMercado[] = ['Consumo', 'Corporativo', 'PME/GE/GOV']
  const segMap = new Map<SegmentoMercado, EpicDetail[]>(SEGMENTOS.map(s => [s, []]))
  for (const e of allEpicDetails) {
    const seg: SegmentoMercado =
      segmentoClassification[e.key] ?? getSegmentoFallback(dominioByKey.get(e.key))
    const bucket = segMap.get(seg)
    if (bucket) bucket.push(e)
    else segMap.get('Consumo')!.push(e)
  }
  const mercadosSegmento: MercadoAgregado[] = SEGMENTOS.map(seg => {
    const epics = segMap.get(seg)!
    const domCount = new Map<string, number>()
    for (const e of epics) {
      if (e.dominio) domCount.set(e.dominio, (domCount.get(e.dominio) ?? 0) + 1)
    }
    const total = epics.length
    const dominios = Array.from(domCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n, count]) => ({ nome: n, count, pct: Math.round((count / total) * 100) }))
    return {
      nome: seg,
      qtdExperimentos: epics.length,
      valorPotencial: epics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
      dominios,
      epics,
      alertas: {
        bloqueadosIA:       epics.filter(e => !!e.motivoBloqueio).length,
        aguardandoDelivery: epics.filter(e => e.status.id === '10067').length,
        semSponsor:         epics.filter(e => !e.sponsor).length,
      },
    }
  })

  // 7. Top 5 Epics por benefício quantitativo
  const top5Epics: EpicDetail[] = [...allEpicDetails]
    .filter(e => (e.beneficioQuantitativo ?? 0) > 0)
    .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
    .slice(0, 5)

  // 7. Top Sponsors
  const sponsorCount = new Map<string, number>()
  for (const e of allEpicDetails) {
    if (e.sponsor) sponsorCount.set(e.sponsor, (sponsorCount.get(e.sponsor) ?? 0) + 1)
  }
  const topSponsors = Array.from(sponsorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, count]) => ({ nome, count }))

  // 8. Distribuição do donut (Situação do Portfólio) — ordem e nomes customizados
  const STATUS_DONUT_ORDER: (keyof PipelineCount)[] = [
    'EM ESCALA', 'EM PILOTO', 'AGUARDANDO PILOTO', 'FINALIZADO', 'EM EXPERIMENTAÇÃO', 'PRONTO PARA EXECUÇÃO', 'EM REFINAMENTO', 'BACKLOG', 'CANCELADO',
  ]
  const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = {
    'CANCELADO':  'DESCONTINUADO',
    'FINALIZADO': 'CONCLUÍDO',
  }
  const statusDistribuicao = STATUS_DONUT_ORDER
    .map(key => {
      const baseValue = pipelineActual[key] ?? 0
      return {
        name: STATUS_DISPLAY_NAME[key] ?? key,
        value: baseValue,
        color: DONUT_COLORS[key] ?? '#888',
      }
    })
    .filter(d => d.value > 0)

  // 9. Metas agregadas por categoria LLM
  const metasAgregadas: Record<MetaCategoria, { count: number; valor: number }> = {
    EBITDA:  { count: 0, valor: 0 },
    NPS:     { count: 0, valor: 0 },
    Receita: { count: 0, valor: 0 },
  }

  const iniciativasPorMeta: Record<MetaCategoria, Iniciativa[]> = {
    EBITDA: [],
    NPS: [],
    Receita: [],
  }

  // Distribuir iniciativas para cada meta com base nos epics que carregam essa meta
  for (const iniciativa of iniciativas) {
    const seenMetas = new Set<MetaCategoria>()
    for (const epic of iniciativa.epics) {
      const meta = epic.metaCategoria
      if (!meta || seenMetas.has(meta)) continue
      seenMetas.add(meta)
      metasAgregadas[meta].count++
      metasAgregadas[meta].valor += iniciativa.beneficioQuantitativoTotal
      iniciativasPorMeta[meta].push(iniciativa)
    }
  }

  return {
    iniciativas,
    allEpics: allEpicDetails,
    totalEpicsAtivos: epicsAtivos.length,
    beneficioTotal,
    beneficioMedio,
    pipeline,
    iniciativasAguardandoPiloto,
    iniciativasEmPiloto,
    mercados,
    mercadosSegmento,
    top5Epics,
    topSponsors,
    statusDistribuicao,
    metasAgregadas,
    iniciativasPorMeta,
    leadTime: calculateLeadTime(iniciativas, epicChangelogs, epicsRaw),
    cycleTimeIdeacao: calculateCycleTimeIdeacao(iniciativasRaw, iniciativaChangelogs),
    cycleTimeExperimentacao: calculateCycleTimeExperimentacaoDetalhado(epicChangelogs, epicsRaw),
    pilotoStatusIds,
    escalaStatusIds,
  }
}

function calculateLeadTime(iniciativas: Iniciativa[], epicChangelogs: Record<string, ChangelogEntry[]>, epicsRaw: JiraIssue[]): LeadTimeStats {
  const agora = Date.now()
  const MS_POR_DIA = 1000 * 60 * 60 * 24

  // Lead time por estágio: média de dias desde created até agora para cada estágio
  const leadtimePorEstagio: Partial<Record<keyof PipelineCount, number>> = {}
  const estagioDias: Record<string, number[]> = {}

  for (const ini of iniciativas) {
    if (!ini.criadoEm) continue
    const criado = new Date(ini.criadoEm).getTime()
    if (isNaN(criado)) continue
    const dias = Math.round((agora - criado) / MS_POR_DIA)

    const estagio = getPipelineStage(ini.status)
    if (estagio) {
      if (!estagioDias[estagio]) estagioDias[estagio] = []
      estagioDias[estagio].push(dias)
    }
  }

  for (const [estagio, diasArr] of Object.entries(estagioDias)) {
    if (diasArr.length > 0) {
      const avg = Math.round(diasArr.reduce((s, d) => s + d, 0) / diasArr.length)
      leadtimePorEstagio[estagio as keyof PipelineCount] = avg
    }
  }

  // Lead time total: média para todas as iniciativas ativas (não CANCELADO, não FINALIZADO)
  const ativas = iniciativas.filter(i => {
    const stage = getPipelineStage(i.status)
    return stage && stage !== 'CANCELADO' && stage !== 'FINALIZADO' && i.criadoEm
  })
  const diasAtivas = ativas.map(i => {
    const criado = new Date(i.criadoEm!).getTime()
    return Math.round((agora - criado) / MS_POR_DIA)
  }).filter(d => !isNaN(d))

  const leadtimeTotalDias = diasAtivas.length > 0
    ? Math.round(diasAtivas.reduce((s, d) => s + d, 0) / diasAtivas.length)
    : 0

  // Lead time concluídas: média de dias desde created até agora para FINALIZADO
  const concluidas = iniciativas.filter(i => {
    const stage = getPipelineStage(i.status)
    return stage === 'FINALIZADO' && i.criadoEm
  })
  const diasConcluidas = concluidas.map(i => {
    const criado = new Date(i.criadoEm!).getTime()
    return Math.round((agora - criado) / MS_POR_DIA)
  }).filter(d => !isNaN(d))

  const leadtimeConcluidasDias = diasConcluidas.length > 0
    ? Math.round(diasConcluidas.reduce((s, d) => s + d, 0) / diasConcluidas.length)
    : 0

  // Cycle time de experimentação: analisa changelogs para calcular dias no status "EM EXPERIMENTAÇÃO"
  const cycleTimeExperimentacaoDias = calculateCycleTimeExperimentacao(epicChangelogs, epicsRaw)

  // Blocked time: média de dias no status atual para Epics com motivoBloqueio preenchido
  const blockedTimeDias = calculateBlockedTime(epicChangelogs, epicsRaw)

  return { leadtimeTotalDias, leadtimeConcluidasDias, leadtimePorEstagio, cycleTimeExperimentacaoDias, blockedTimeDias }
}

/**
 * Calcula o cycle time médio de experimentação (board 2707).
 * Para cada Epic, analisa o changelog e encontra períodos em que o status era
 * "Em andamento" (id=3) ou "EM VALIDAÇÃO" (id=10204).
 * Calcula a diferença entre a data de entrada e saída desse status.
 */
function calculateCycleTimeExperimentacao(
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  const EXPERIMENTACAO_NAMES = new Set(['Em andamento', 'In Progress', 'EM VALIDAÇÃO'])
  const todosCycleTimes: number[] = []

  for (const epic of epicsRaw) {
    const changelog = epicChangelogs[epic.key]
    if (!changelog || changelog.length === 0) continue

    // Ordenar changelog por data (mais antigo primeiro)
    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    let entrouEm: number | null = null
    let epicCycleTime = 0

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue

        const entrou = EXPERIMENTACAO_NAMES.has(item.toString ?? '')
        const saiu = EXPERIMENTACAO_NAMES.has(item.fromString ?? '')

        if (entrou && !saiu) {
          // Entrou em experimentação
          entrouEm = new Date(entry.created).getTime()
        } else if (saiu && !entrou) {
          // Saiu de experimentação
          if (entrouEm !== null) {
            const saiuEm = new Date(entry.created).getTime()
            const dias = Math.round((saiuEm - entrouEm) / MS_POR_DIA)
            if (dias > 0) {
              epicCycleTime += dias
            }
            entrouEm = null
          }
        }
      }
    }

    // Se ainda está em experimentação (entrouEm não foi fechado), conta até hoje
    if (entrouEm !== null && EXPERIMENTACAO_NAMES.has(epic.fields.status.name)) {
      const dias = Math.round((Date.now() - entrouEm) / MS_POR_DIA)
      if (dias > 0) epicCycleTime += dias
    }

    if (epicCycleTime > 0) {
      todosCycleTimes.push(epicCycleTime)
    }
  }

  if (todosCycleTimes.length === 0) return 0
  return Math.round(todosCycleTimes.reduce((s, d) => s + d, 0) / todosCycleTimes.length)
}

/**
 * Versão detalhada do cycle time de experimentação.
 * Retorna um CycleTimeEstagio[] com média, mediana e quantidade de Epics
 * que passaram pelo status "Em andamento" / "EM VALIDAÇÃO" (board 2707).
 * Agrupa os dois status em um único estágio "EM EXPERIMENTAÇÃO".
 */
function calculateCycleTimeExperimentacaoDetalhado(
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): CycleTimeEstagio[] {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  const EXPERIMENTACAO_NAMES = new Set(['Em andamento', 'In Progress', 'EM VALIDAÇÃO'])
  const todosCycleTimes: number[] = []

  for (const epic of epicsRaw) {
    const changelog = epicChangelogs[epic.key]
    if (!changelog || changelog.length === 0) continue

    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    let entrouEm: number | null = null
    let epicCycleTime = 0

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue

        const entrou = EXPERIMENTACAO_NAMES.has(item.toString ?? '')
        const saiu = EXPERIMENTACAO_NAMES.has(item.fromString ?? '')

        if (entrou && !saiu) {
          entrouEm = new Date(entry.created).getTime()
        } else if (saiu && !entrou) {
          if (entrouEm !== null) {
            const saiuEm = new Date(entry.created).getTime()
            const dias = Math.round((saiuEm - entrouEm) / MS_POR_DIA)
            if (dias > 0) {
              epicCycleTime += dias
            }
            entrouEm = null
          }
        }
      }
    }

    if (entrouEm !== null && EXPERIMENTACAO_NAMES.has(epic.fields.status.name)) {
      const dias = Math.round((Date.now() - entrouEm) / MS_POR_DIA)
      if (dias > 0) epicCycleTime += dias
    }

    if (epicCycleTime > 0) {
      todosCycleTimes.push(epicCycleTime)
    }
  }

  if (todosCycleTimes.length === 0) return []

  const sorted = [...todosCycleTimes].sort((a, b) => a - b)
  const media = Math.round(sorted.reduce((s, d) => s + d, 0) / sorted.length)
  const mediana = sorted.length % 2 === 0
    ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : sorted[Math.floor(sorted.length / 2)]

  return [{
    estagio: 'EM EXPERIMENTAÇÃO',
    label: 'Experimentação',
    mediaDias: media,
    medianaDias: mediana,
    qtdIniciativas: sorted.length,
  }]
}

/**
 * Calcula o blocked time médio dos Epics ATIVOS (não cancelados, não concluídos).
 * Analisa o changelog do campo customfield_13406 (Motivo de Bloqueio):
 * - [None/null] -> [qualquer valor] = bloqueio ATIVADO
 * - [qualquer valor] -> [None/vazio] = bloqueio REMOVIDO
 * - [motivo1] -> [motivo2] = troca de motivo (mantém bloqueado)
 *
 * Soma todos os períodos em que o Epic ficou bloqueado.
 * Se está bloqueado agora, conta do último bloqueio até hoje.
 * Retorna a MÉDIA de dias bloqueados entre os Epics ativos.
 */
function calculateBlockedTime(
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  const agora = Date.now()

  // Status finais: não considerar cancelados nem concluídos
  const STATUS_FINAIS = new Set(['10015', '10003'])

  const diasPorEpic: number[] = []

  for (const epic of epicsRaw) {
    // Só considerar epics ativos
    if (STATUS_FINAIS.has(epic.fields.status.id)) continue

    const changelog = epicChangelogs[epic.key]
    if (!changelog || changelog.length === 0) continue

    // Ordenar changelog por data (mais antigo primeiro)
    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    // Extrair todas as mudanças do customfield_13406
    const bloqueios: { data: number; ativou: boolean }[] = []

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.fieldId !== 'customfield_13406') continue

        const from = item.fromString // null, None, ou string vazia = não bloqueado
        const to = item.toString     // null, None, ou string vazia = não bloqueado

        const estavaBloqueado = !!from && from !== 'None' && from !== 'null'
        const ficouBloqueado = !!to && to !== 'None' && to !== 'null'

        const data = new Date(entry.created).getTime()

        if (!estavaBloqueado && ficouBloqueado) {
          // Bloqueio ativado
          bloqueios.push({ data, ativou: true })
        } else if (estavaBloqueado && !ficouBloqueado) {
          // Bloqueio removido
          bloqueios.push({ data, ativou: false })
        } else if (estavaBloqueado && ficouBloqueado) {
          // Troca de motivo — mantém bloqueado, não gera evento
        }
        // !estavaBloqueado && !ficouBloqueado = ambos vazios, ignorar
      }
    }

    if (bloqueios.length === 0) continue

    // Calcular períodos bloqueados
    let totalBloqueado = 0
    let bloqueioAtual: number | null = null

    for (const evento of bloqueios) {
      if (evento.ativou) {
        bloqueioAtual = evento.data
      } else {
        // Bloqueio removido: fecha o período
        if (bloqueioAtual !== null) {
          const dias = Math.round((evento.data - bloqueioAtual) / MS_POR_DIA)
          if (dias > 0) totalBloqueado += dias
          bloqueioAtual = null
        }
      }
    }

    // Se ainda está bloqueado (bloqueioAtual não foi fechado), conta até hoje
    if (bloqueioAtual !== null) {
      const dias = Math.round((agora - bloqueioAtual) / MS_POR_DIA)
      if (dias > 0) totalBloqueado += dias
    }

    if (totalBloqueado > 0) {
      diasPorEpic.push(totalBloqueado)
    }
  }

  if (diasPorEpic.length === 0) return 0
  return Math.round(diasPorEpic.reduce((s, d) => s + d, 0) / diasPorEpic.length)
}

/**
 * Calcula o cycle time por etapa do board de ideação (2706).
 * Para cada Iniciativa, analisa o changelog e mede quanto tempo ficou em cada status.
 * Retorna um array ordenado pela ordem do pipeline.
 */
function calculateCycleTimeIdeacao(
  iniciativasRaw: JiraIssue[],
  iniciativaChangelogs: Record<string, ChangelogEntry[]>
): CycleTimeEstagio[] {
  const MS_POR_DIA = 1000 * 60 * 60 * 24

  // Mapeia nome do status (do changelog) → nome do estágio no pipeline
  const STATUS_NOME_PIPELINE: Record<string, string> = {
    'Backlog': 'BACKLOG',
    'Em refinamento': 'EM REFINAMENTO',
    'Pronto para Execução': 'PRONTO PARA EXECUÇÃO',
    'Aguardando Piloto': 'AGUARDANDO PILOTO',
    'Em experimentação': 'EM EXPERIMENTAÇÃO',
    'Em piloto': 'EM PILOTO',
    'Finalizado': 'FINALIZADO',
    'Cancelado': 'CANCELADO',
  }

  // Ordem de exibição (pipeline order)
  const ESTAGIOS_ORDEM = [
    'BACKLOG', 'EM REFINAMENTO', 'PRONTO PARA EXECUÇÃO',
    'EM EXPERIMENTAÇÃO', 'AGUARDANDO PILOTO', 'EM PILOTO',
    'FINALIZADO',
  ]

  // Labels curtos
  const LABELS: Record<string, string> = {
    'BACKLOG': 'Backlog',
    'EM REFINAMENTO': 'Refinamento',
    'PRONTO PARA EXECUÇÃO': 'Pronto p/ Execução',
    'EM EXPERIMENTAÇÃO': 'Experimentação',
    'AGUARDANDO PILOTO': 'Ag. Piloto',
    'EM PILOTO': 'Piloto',
    'FINALIZADO': 'Concluído',
  }

  // Acumulador: para cada estágio, array de dias que as iniciativas ficaram nele
  const estagioDias: Record<string, number[]> = {}
  for (const estagio of ESTAGIOS_ORDEM) {
    estagioDias[estagio] = []
  }

  for (const ini of iniciativasRaw) {
    const changelog = iniciativaChangelogs[ini.key]
    if (!changelog || changelog.length === 0) continue

    // Ordenar changelog por data (mais antigo primeiro)
    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    // Rastreia: para cada nome de status, quando a iniciativa entrou nele
    const entradas: Record<string, number> = {} // nomeStatus → timestamp de entrada

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue

        const fromNome = item.fromString ?? ''
        const toNome = item.toString ?? ''
        const ts = new Date(entry.created).getTime()

        // Saiu de um status
        if (fromNome && entradas[fromNome] !== undefined) {
          const dias = Math.round((ts - entradas[fromNome]) / MS_POR_DIA)
          if (dias > 0) {
            const estagio = STATUS_NOME_PIPELINE[fromNome]
            if (estagio && estagioDias[estagio]) {
              estagioDias[estagio].push(dias)
            }
          }
          delete entradas[fromNome]
        }

        // Entrou em um status
        if (toNome) {
          entradas[toNome] = ts
        }
      }
    }

    // Para status onde a iniciativa ainda está (não saiu), conta até hoje
    const agora = Date.now()
    for (const [nomeStatus, entradaTs] of Object.entries(entradas)) {
      if (nomeStatus === ini.fields.status.name) {
        const dias = Math.round((agora - entradaTs) / MS_POR_DIA)
        if (dias > 0) {
          const estagio = STATUS_NOME_PIPELINE[nomeStatus]
          if (estagio && estagioDias[estagio]) {
            estagioDias[estagio].push(dias)
          }
        }
      }
    }
  }

  // Monta resultado
  return ESTAGIOS_ORDEM
    .filter(estagio => estagioDias[estagio].length > 0)
    .map(estagio => {
      const dias = estagioDias[estagio].sort((a, b) => a - b)
      const media = Math.round(dias.reduce((s, d) => s + d, 0) / dias.length)
      const mediana = dias.length % 2 === 0
        ? Math.round((dias[dias.length / 2 - 1] + dias[dias.length / 2]) / 2)
        : dias[Math.floor(dias.length / 2)]
      return {
        estagio,
        label: LABELS[estagio] ?? estagio,
        mediaDias: media,
        medianaDias: mediana,
        qtdIniciativas: dias.length,
      }
    })
}

export const META_LABELS: Record<string, string> = {
  'EBITDA':  'Eficiencia Operacional',
  'Receita': 'Receita',
  'NPS':     'Experiencia do Cliente',
}

export function formatBRL(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
  return `R$ ${value.toFixed(0)}`
}
