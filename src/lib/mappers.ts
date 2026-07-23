import {
  JiraIssue,
  JiraStatus,
  EpicDetail,
  Iniciativa,
  DashboardData,
  PipelineCount,
  MercadoAgregado,
  LeadTimeStats,
  LeadTimeJornada,
  LeadTimeJornadaFase,
  CycleTimeEstagio,
  CycleTimeDiagnostico,
  MonitoramentoData,
  BeneficioPorArea,
  FunilEtapa,
  ConclusaoMensal,
  MaturidadeEstagio,
  InsightExecutivo,
  SerieMensal,
  PeriodoFiltro,
  IniciativaLab,
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

function mapEpicToDetail(epic: JiraIssue, changelog?: ChangelogEntry[]): EpicDetail {
  const f = epic.fields

  // Extrai data de conclusão do changelog: primeira vez que status mudou para "Concluído" (10003)
  let concluidoEm: string | null = null
  if (changelog && changelog.length > 0) {
    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )
    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field === 'status' && item.toString === '10003') {
          concluidoEm = entry.created
          break
        }
      }
      if (concluidoEm) break
    }
  }

  return {
    key: epic.key,
    nome: f.summary,
    status: f.status,
    sponsor: f.customfield_11662 ? normalizeSponsor(f.customfield_11662) : null,
    bo: f.customfield_11663 ?? null,
    complexidade: f.customfield_11664 ?? null,
    timeResponsavel: f.customfield_16911?.value ?? null,
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
    concluidoEm,
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
      const detail = mapEpicToDetail(e, epicChangelogs[e.key])
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

  // 2.1 Propagar timeResponsavel da Iniciativa (pai) para os Epics filhos
  const iniciativaTimeMap = new Map<string, string | null>()
  for (const ini of iniciativasRaw) {
    iniciativaTimeMap.set(ini.key, ini.fields.customfield_16911?.value ?? null)
  }
  for (const [parentKey, epics] of epicsByParent) {
    const timeResp = iniciativaTimeMap.get(parentKey)
    if (timeResp) {
      for (const epic of epics) {
        const detail = epicDetailMap.get(epic.key)
        if (detail && !detail.timeResponsavel) {
          detail.timeResponsavel = timeResp
        }
      }
    }
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
      timeResponsavel: ini.fields.customfield_16911?.value ?? null,
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

  const cycleTimeExpResult = calculateCycleTimeExperimentacaoDetalhado(epicChangelogs, epicsRaw)
  const leadTimeResult = calculateLeadTime(iniciativas, epicChangelogs, epicsRaw)
  const cycleTimeIdeacaoResult = calculateCycleTimeIdeacao(iniciativasRaw, iniciativaChangelogs)
  const leadTimeJornadaResult = calculateLeadTimeJornada(
    cycleTimeIdeacaoResult,
    cycleTimeExpResult.ciclos,
    cycleTimeExpResult.geral,
    epicChangelogs,
    epicsRaw
  )

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
    leadTime: leadTimeResult,
    cycleTimeIdeacao: cycleTimeIdeacaoResult,
    cycleTimeExperimentacao: cycleTimeExpResult.ciclos,
    cycleTimeExperimentacaoGeral: cycleTimeExpResult.geral,
    cycleTimeDiagnostico: cycleTimeExpResult.diagnostico,
    leadTimeJornada: leadTimeJornadaResult,
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

  // Blocked time específico dos Epics em experimentação
  const blockedTimeExperimentacaoDias = calculateBlockedTimeExperimentacao(epicChangelogs, epicsRaw)

  return { leadtimeTotalDias, leadtimeConcluidasDias, leadtimePorEstagio, cycleTimeExperimentacaoDias, blockedTimeDias, blockedTimeExperimentacaoDias }
}

/**
 * Calcula o Lead Time da Jornada de Adoção de Tecnologia.
 * Usa os dados de cycleTimeIdeacao (já calculados via changelog) para montar
 * as fases da jornada: Backlog → Experimentação → Transição para Piloto → Piloto → Escala.
 */
function calculateLeadTimeJornada(
  cycleTimeIdeacao: CycleTimeEstagio[],
  cycleTimeExperimentacao: CycleTimeEstagio[],
  cicloGeral: CycleTimeEstagio,
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): LeadTimeJornada {
  // Constrói um mapa: estagio → mediaDias
  const mapa: Record<string, number> = {}
  for (const c of cycleTimeIdeacao) {
    mapa[c.estagio] = c.mediaDias
  }

  // Fases da jornada (agregadas)
  // Backlog é mantido apenas para o cálculo de tempoEsperaTransicaoDias, mas NÃO entra no totalDias
  const backlogDias = (mapa['BACKLOG'] ?? 0) + (mapa['EM REFINAMENTO'] ?? 0) + (mapa['PRONTO PARA EXECUÇÃO'] ?? 0)
  const experimentacaoDias = cicloGeral.mediaDias  // usa o cycle time geral de experimentação (já desconta bloqueio)
  const transicaoPilotoDias = mapa['AGUARDANDO PILOTO'] ?? 0
  const pilotoDias = mapa['EM PILOTO'] ?? 0
  const escalaDias = mapa['EM ESCALA'] ?? 0

  // Total considera apenas as fases visíveis (Experimentação, Transição, Piloto, Escala)
  const totalDias = experimentacaoDias + transicaoPilotoDias + pilotoDias + (escalaDias > 0 ? escalaDias : 0)

  const calcPct = (d: number) => totalDias > 0 ? Math.round((d / totalDias) * 100) : 0

  // Fases exibidas (sem Backlog — começa na Experimentação)
  const fases: LeadTimeJornadaFase[] = [
    { fase: 'Experimentação', dias: experimentacaoDias, pct: calcPct(experimentacaoDias), cor: '#F59E0B', destaque: true },
    { fase: 'Transição para Piloto', dias: transicaoPilotoDias, pct: calcPct(transicaoPilotoDias), cor: '#9CA3AF' },
    { fase: 'Piloto', dias: pilotoDias, pct: calcPct(pilotoDias), cor: '#6B7280' },
    ...(escalaDias > 0 ? [{ fase: 'Escala', dias: escalaDias, pct: calcPct(escalaDias), cor: '#4B5563' }] : []),
  ]

  // Bottleneck: fase com mais dias
  const sorted = [...fases].sort((a, b) => b.dias - a.dias)
  const bottleneck = sorted[0]
    ? { fase: sorted[0].fase, dias: sorted[0].dias, pct: sorted[0].pct }
    : { fase: 'N/A', dias: 0, pct: 0 }

  // Decomposição
  const tempoGeracaoValorDias = experimentacaoDias + pilotoDias
  const tempoEsperaTransicaoDias = backlogDias + transicaoPilotoDias
  const tempoImplantacaoEscalaDias = escalaDias

  // Insights
  const insights: string[] = []
  if (bottleneck.fase === 'Backlog' && bottleneck.dias > 0) {
    insights.push(`O backlog consome ${bottleneck.pct}% do lead time total (${bottleneck.dias}d). Avalie se há excesso de iniciativas paradas nas fases iniciais.`)
  }
  if (bottleneck.fase === 'Experimentação' && bottleneck.dias > 0) {
    insights.push(`A experimentação é o maior gargalo (${bottleneck.dias}d, ${bottleneck.pct}% do total). O cycle time varia por complexidade: P=${cycleTimeExperimentacao.find(c => c.label.includes('P'))?.mediaDias ?? '?'}d, M=${cycleTimeExperimentacao.find(c => c.label.includes('M'))?.mediaDias ?? '?'}d, G=${cycleTimeExperimentacao.find(c => c.label.includes('G'))?.mediaDias ?? '?'}d.`)
  }
  if (bottleneck.fase === 'Transição para Piloto' && bottleneck.dias > 0) {
    insights.push(`A transição para piloto leva ${bottleneck.dias}d em média (${bottleneck.pct}% do total). Pode indicar dificuldade em encontrar áreas dispostas a testar.`)
  }
  if (bottleneck.fase === 'Piloto' && bottleneck.dias > 0) {
    insights.push(`O piloto consome ${bottleneck.dias}d (${bottleneck.pct}% do total). Avalie se os critérios de saída do piloto estão bem definidos.`)
  }
  if (tempoGeracaoValorDias > 0 && totalDias > 0) {
    const pctValor = Math.round((tempoGeracaoValorDias / totalDias) * 100)
    insights.push(`Apenas ${pctValor}% do lead time é dedicado à geração de valor (Experimentação + Piloto). ${100 - pctValor}% é consumido em espera e transições.`)
  }

  // ── Blocked Time: média de dias bloqueados dos experimentos concluídos ──
  const CONCLUIDO_ID = '10003'
  const epicsConcluidos = epicsRaw.filter(e => e.fields.status.id === CONCLUIDO_ID)
  const blockedTotals: number[] = []
  const lifecycleTotals: number[] = []

  for (const epic of epicsConcluidos) {
    const changelog = epicChangelogs[epic.key]
    const criadoEm = epic.fields.created ? new Date(epic.fields.created).getTime() : null
    if (!criadoEm) continue

    // Tempo total do ciclo de vida (criação → agora, ou criação → conclusão)
    let fimCiclo = Date.now()
    if (changelog && changelog.length > 0) {
      const sorted = [...changelog].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
      for (const entry of sorted) {
        for (const item of entry.items) {
          if (item.field === 'status' && item.toString === CONCLUIDO_ID) {
            fimCiclo = new Date(entry.created).getTime()
            break
          }
        }
      }
    }
    const totalDias = Math.round((fimCiclo - criadoEm) / (1000 * 60 * 60 * 24))
    if (totalDias <= 0) continue
    lifecycleTotals.push(totalDias)

    // Tempo bloqueado: soma dos períodos em que motivoBloqueio estava preenchido
    if (!changelog || changelog.length === 0) continue
    const sortedLog = [...changelog].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    let blockedDias = 0
    let bloqueioInicio: number | null = null

    for (const entry of sortedLog) {
      for (const item of entry.items) {
        if (item.field !== 'Motivo de Bloqueio' && item.field !== 'customfield_13406') continue
        const foiPreenchido = item.toString && item.toString.trim() !== ''
        const foiLimpado = !item.toString || item.toString.trim() === ''

        if (foiPreenchido && bloqueioInicio === null) {
          bloqueioInicio = new Date(entry.created).getTime()
        } else if (foiLimpado && bloqueioInicio !== null) {
          blockedDias += Math.round((new Date(entry.created).getTime() - bloqueioInicio) / (1000 * 60 * 60 * 24))
          bloqueioInicio = null
        }
      }
    }
    // Se ainda está bloqueado no final, conta até o fim do ciclo
    if (bloqueioInicio !== null) {
      blockedDias += Math.round((fimCiclo - bloqueioInicio) / (1000 * 60 * 60 * 24))
    }
    if (blockedDias > 0) {
      blockedTotals.push(blockedDias)
    }
  }

  const blockedTimeDias = blockedTotals.length > 0
    ? Math.round(blockedTotals.reduce((s, v) => s + v, 0) / blockedTotals.length)
    : 0
  const mediaTotalDias = lifecycleTotals.length > 0
    ? Math.round(lifecycleTotals.reduce((s, v) => s + v, 0) / lifecycleTotals.length)
    : 0
  const blockedTimePct = mediaTotalDias > 0
    ? Math.round((blockedTimeDias / mediaTotalDias) * 100)
    : 0

  if (blockedTimeDias > 0) {
    insights.push(`Tempo bloqueado médio: ${blockedTimeDias}d (${blockedTimePct}% do ciclo de vida dos experimentos concluídos).`)
  }

  return {
    totalDias,
    fases,
    bottleneck,
    tempoGeracaoValorDias,
    tempoEsperaTransicaoDias,
    tempoImplantacaoEscalaDias,
    blockedTimeDias,
    blockedTimePct,
    insights,
  }
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
  const EXPERIMENTACAO_NAMES = new Set(['Em andamento', 'In Progress', 'EM VALIDAÇÃO'])
  const CONCLUIDO_ID = '10003'
  const todosCycleTimes: number[] = []

  // Apenas Epics CONCLUÍDOS
  const epicsConcluidos = epicsRaw.filter(e => e.fields.status.id === CONCLUIDO_ID)

  for (const epic of epicsConcluidos) {
    const changelog = epicChangelogs[epic.key]
    if (!changelog || changelog.length === 0) continue

    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    // Coletar períodos em experimentação como intervalos { inicio, fim }
    const periodos: { inicio: number; fim: number }[] = []
    let entrouEm: number | null = null

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue

        const entrou = EXPERIMENTACAO_NAMES.has(item.toString ?? '')
        const saiu = EXPERIMENTACAO_NAMES.has(item.fromString ?? '')

        if (entrou && !saiu) {
          entrouEm = new Date(entry.created).getTime()
        } else if (saiu && !entrou) {
          if (entrouEm !== null) {
            periodos.push({ inicio: entrouEm, fim: new Date(entry.created).getTime() })
            entrouEm = null
          }
        }
      }
    }

    // NÃO considerar período aberto — só Epics concluídos

    if (periodos.length === 0) continue

    // Subtrair dias bloqueados que caem dentro dos períodos de experimentação
    const bloqueios = getPeriodosBloqueio(epic.key, epicChangelogs)
    const epicCycleTime = subtrairBloqueios(periodos, bloqueios)

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
 * Considera APENAS Epics CONCLUÍDOS (status 10003).
 * Quebra por porte (complexidade): P (Baixa), M (Média), G (Alta).
 */
function calculateCycleTimeExperimentacaoDetalhado(
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): { ciclos: CycleTimeEstagio[]; diagnostico: CycleTimeDiagnostico } {
  const EXPERIMENTACAO_NAMES = new Set(['Em andamento', 'In Progress', 'EM VALIDAÇÃO'])
  const CONCLUIDO_ID = '10003'

  // Mapeia complexidade → label de porte
  // O Jira retorna diretamente "P", "M", "G" (valores abreviados)
  const PORTE_MAP: Record<string, string> = {
    'Baixa':  'P',
    'Média':  'M',
    'Alta':   'G',
    'P':      'P',
    'M':      'M',
    'G':      'G',
  }

  // Acumulador por porte (cycle time e blocked time)
  const porteCycleTimes: Record<string, number[]> = {}
  const porteBlockedTimes: Record<string, number[]> = {}

  // Lista de Epics sem porte (para diagnóstico)
  const semPorteList: { key: string; nome: string; cycleTimeDias: number }[] = []

  // Contadores de diagnóstico
  let semChangelog = 0
  let semPeriodo = 0
  let naoConcluidos = 0

  // Filtrar apenas Epics CONCLUÍDOS
  const epicsConcluidos = epicsRaw.filter(e => e.fields.status.id === CONCLUIDO_ID)

  for (const epic of epicsConcluidos) {
    const changelog = epicChangelogs[epic.key]
    if (!changelog || changelog.length === 0) {
      semChangelog++
      continue
    }

    const sorted = [...changelog].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    // Coletar períodos em experimentação como intervalos (todos fechados, pois o Epic está concluído)
    const periodos: { inicio: number; fim: number }[] = []
    let entrouEm: number | null = null

    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue

        const entrou = EXPERIMENTACAO_NAMES.has(item.toString ?? '')
        const saiu = EXPERIMENTACAO_NAMES.has(item.fromString ?? '')

        if (entrou && !saiu) {
          entrouEm = new Date(entry.created).getTime()
        } else if (saiu && !entrou) {
          if (entrouEm !== null) {
            periodos.push({ inicio: entrouEm, fim: new Date(entry.created).getTime() })
            entrouEm = null
          }
        }
      }
    }

    // NÃO considerar período aberto — só Epics concluídos, todos os períodos são fechados

    if (periodos.length === 0) {
      semPeriodo++
      continue
    }

    // Subtrair dias bloqueados
    const bloqueios = getPeriodosBloqueio(epic.key, epicChangelogs)
    const epicCycleTime = subtrairBloqueios(periodos, bloqueios)
    // Tempo total bloqueado (soma dos períodos de bloqueio que intersectam com os períodos em experimentação)
    const epicBlockedTime = calcularTempoBloqueado(periodos, bloqueios)

    if (epicCycleTime > 0) {
      // Determinar o porte pela complexidade do Epic
      // customfield_11664 pode vir como string "Baixa" ou objeto {value: "Baixa"}
      const raw = epic.fields.customfield_11664
      const complexidadeRaw: string = (typeof raw === 'object' && raw !== null && 'value' in raw)
        ? (raw as { value: string }).value
        : (typeof raw === 'string' ? raw : 'Sem porte')
      const porte = PORTE_MAP[complexidadeRaw] ?? 'Sem porte'

      if (porte === 'Sem porte') {
        semPorteList.push({
          key: epic.key,
          nome: epic.fields.summary,
          cycleTimeDias: epicCycleTime,
        })
      }

      if (!porteCycleTimes[porte]) porteCycleTimes[porte] = []
      porteCycleTimes[porte].push(epicCycleTime)
      if (!porteBlockedTimes[porte]) porteBlockedTimes[porte] = []
      porteBlockedTimes[porte].push(epicBlockedTime)
    }
  }

  // Ordem de exibição: P, M, G, depois "Sem porte"
  const ORDEM = ['P', 'M', 'G', 'Sem porte']
  const resultado: CycleTimeEstagio[] = []

  for (const porte of ORDEM) {
    const dias = porteCycleTimes[porte]
    if (!dias || dias.length === 0) continue

    const sorted = [...dias].sort((a, b) => a - b)
    const media = Math.round(sorted.reduce((s, d) => s + d, 0) / sorted.length)
    const mediana = sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)]

    // Blocked time médio para este porte
    const bloqueiosPorte = porteBlockedTimes[porte] ?? []
    const blockedTimeMedio = bloqueiosPorte.length > 0
      ? Math.round(bloqueiosPorte.reduce((s, d) => s + d, 0) / bloqueiosPorte.length)
      : 0

    resultado.push({
      estagio: `EM EXPERIMENTAÇÃO (${porte})`,
      label: `Porte ${porte}`,
      mediaDias: media,
      medianaDias: mediana,
      qtdIniciativas: sorted.length,
      blockedTimeDias: blockedTimeMedio,
    })
  }

  const analisados = Object.values(porteCycleTimes).reduce((s, arr) => s + arr.length, 0)

  // Agregado geral (todos os Epics, sem quebra por porte) — visão antiga
  const todosDias = Object.values(porteCycleTimes).flat()
  const todosBloqueios = Object.values(porteBlockedTimes).flat()
  const sortedGeral = [...todosDias].sort((a, b) => a - b)
  const geral: CycleTimeEstagio = {
    estagio: 'EM EXPERIMENTAÇÃO',
    label: 'Geral',
    mediaDias: todosDias.length > 0 ? Math.round(sortedGeral.reduce((s, d) => s + d, 0) / sortedGeral.length) : 0,
    medianaDias: todosDias.length > 0
      ? (sortedGeral.length % 2 === 0
        ? Math.round((sortedGeral[sortedGeral.length / 2 - 1] + sortedGeral[sortedGeral.length / 2]) / 2)
        : sortedGeral[Math.floor(sortedGeral.length / 2)])
      : 0,
    qtdIniciativas: todosDias.length,
    blockedTimeDias: todosBloqueios.length > 0
      ? Math.round(todosBloqueios.reduce((s, d) => s + d, 0) / todosBloqueios.length)
      : 0,
  }

  return {
    ciclos: resultado,
    geral,
    diagnostico: {
      totalEpics: epicsRaw.length,
      analisados,
      semChangelog,
      semPeriodo,
      semPorte: semPorteList,
    },
  }
}

/**
 * Extrai os períodos de bloqueio de UM Epic a partir do changelog.
 * Retorna array de intervalos { inicio, fim } em timestamps (ms).
 * Se o Epic ainda está bloqueado, o último intervalo vai até Date.now().
 */
function getPeriodosBloqueio(
  epicKey: string,
  epicChangelogs: Record<string, ChangelogEntry[]>
): { inicio: number; fim: number }[] {
  const changelog = epicChangelogs[epicKey]
  if (!changelog || changelog.length === 0) return []

  const sorted = [...changelog].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )

  const eventos: { data: number; ativou: boolean }[] = []

  for (const entry of sorted) {
    for (const item of entry.items) {
      if (item.fieldId !== 'customfield_13406') continue

      const from = item.fromString
      const to = item.toString

      const estavaBloqueado = !!from && from !== 'None' && from !== 'null'
      const ficouBloqueado = !!to && to !== 'None' && to !== 'null'

      const data = new Date(entry.created).getTime()

      if (!estavaBloqueado && ficouBloqueado) {
        eventos.push({ data, ativou: true })
      } else if (estavaBloqueado && !ficouBloqueado) {
        eventos.push({ data, ativou: false })
      }
      // troca de motivo ou ambos vazios: ignorar
    }
  }

  const periodos: { inicio: number; fim: number }[] = []
  let bloqueioAtual: number | null = null

  for (const ev of eventos) {
    if (ev.ativou) {
      bloqueioAtual = ev.data
    } else {
      if (bloqueioAtual !== null) {
        periodos.push({ inicio: bloqueioAtual, fim: ev.data })
        bloqueioAtual = null
      }
    }
  }

  // Se ainda está bloqueado, conta até agora
  if (bloqueioAtual !== null) {
    periodos.push({ inicio: bloqueioAtual, fim: Date.now() })
  }

  return periodos
}

/**
 * Dado um array de períodos (ex.: períodos em experimentação) e um array de
 * períodos de bloqueio, retorna o total de dias dos períodos subtraindo
 * a sobreposição com os bloqueios.
 */
function subtrairBloqueios(
  periodos: { inicio: number; fim: number }[],
  bloqueios: { inicio: number; fim: number }[]
): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  let totalDias = 0

  for (const p of periodos) {
    let inicio = p.inicio
    const fim = p.fim

    // Para cada bloqueio que intersecta este período, "pular" o trecho bloqueado
    // Ordenar bloqueios por inicio para processar em ordem
    const relevantes = bloqueios
      .filter(b => b.inicio < fim && b.fim > inicio)
      .sort((a, b) => a.inicio - b.inicio)

    for (const b of relevantes) {
      // Parte não-bloqueada antes deste bloqueio
      if (inicio < b.inicio) {
        totalDias += (b.inicio - inicio) / MS_POR_DIA
      }
      // Avançar inicio para depois do bloqueio
      if (b.fim > inicio) {
        inicio = b.fim
      }
    }

    // Parte restante depois do último bloqueio
    if (inicio < fim) {
      totalDias += (fim - inicio) / MS_POR_DIA
    }
  }

  return Math.round(totalDias)
}

/**
 * Dado um array de períodos (ex.: períodos em experimentação) e um array de
 * períodos de bloqueio, retorna o total de dias BLOQUEADOS (soma da interseção).
 * Diferente de subtrairBloqueios, esta função retorna o tempo perdido com bloqueios.
 */
function calcularTempoBloqueado(
  periodos: { inicio: number; fim: number }[],
  bloqueios: { inicio: number; fim: number }[]
): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24
  let totalDias = 0

  for (const p of periodos) {
    for (const b of bloqueios) {
      // Interseção entre o período e o bloqueio
      const overlapInicio = Math.max(p.inicio, b.inicio)
      const overlapFim = Math.min(p.fim, b.fim)
      if (overlapInicio < overlapFim) {
        totalDias += (overlapFim - overlapInicio) / MS_POR_DIA
      }
    }
  }

  return Math.round(totalDias)
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
  const STATUS_FINAIS = new Set(['10015', '10003'])
  const diasPorEpic: number[] = []

  for (const epic of epicsRaw) {
    if (STATUS_FINAIS.has(epic.fields.status.id)) continue

    const periodos = getPeriodosBloqueio(epic.key, epicChangelogs)
    if (periodos.length === 0) continue

    const total = subtrairBloqueios(periodos, []) // sem subtração, só soma
    if (total > 0) diasPorEpic.push(total)
  }

  if (diasPorEpic.length === 0) return 0
  return Math.round(diasPorEpic.reduce((s, d) => s + d, 0) / diasPorEpic.length)
}

/**
 * Calcula o blocked time médio apenas dos Epics que estão EM EXPERIMENTAÇÃO
 * (status "Em andamento" id=3 ou "EM VALIDAÇÃO" id=10204).
 * Retorna a média de dias bloqueados desses Epics.
 */
function calculateBlockedTimeExperimentacao(
  epicChangelogs: Record<string, ChangelogEntry[]>,
  epicsRaw: JiraIssue[]
): number {
  const EXPERIMENTACAO_STATUS_IDS = new Set(['3', '10204'])
  const diasPorEpic: number[] = []

  for (const epic of epicsRaw) {
    // Só considera Epics que estão atualmente em experimentação
    if (!EXPERIMENTACAO_STATUS_IDS.has(epic.fields.status.id)) continue

    const periodos = getPeriodosBloqueio(epic.key, epicChangelogs)
    if (periodos.length === 0) continue

    const total = subtrairBloqueios(periodos, [])
    if (total > 0) diasPorEpic.push(total)
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
    'BACKLOG': 'BACKLOG',
    'Em refinamento': 'EM REFINAMENTO',
    'EM REFINAMENTO': 'EM REFINAMENTO',
    'Pronto para Execução': 'PRONTO PARA EXECUÇÃO',
    'PRONTO PARA EXECUÇÃO': 'PRONTO PARA EXECUÇÃO',
    'Aguardando Piloto': 'AGUARDANDO PILOTO',
    'AGUARDANDO PILOTO': 'AGUARDANDO PILOTO',
    'Em experimentação': 'EM EXPERIMENTAÇÃO',
    'EM EXPERIMENTAÇÃO': 'EM EXPERIMENTAÇÃO',
    'Em piloto': 'EM PILOTO',
    'EM PILOTO': 'EM PILOTO',
    'Finalizado': 'FINALIZADO',
    'FINALIZADO': 'FINALIZADO',
    'Cancelado': 'CANCELADO',
    'CANCELADO': 'CANCELADO',
    'Done': 'FINALIZADO',  // "Done" aparece em algumas transições como nome de status
  }

  // Status ID 10504 = EM ESCALA (coluna "EM ESCALA" no board 2706, reusa nome "Finalizado")
  const EM_ESCALA_STATUS_ID = '10504'
  const FINALIZADO_STATUS_ID = '10003'

  /**
   * Resolve o estágio do pipeline a partir do nome do status e do contexto da iniciativa.
   * O status "Finalizado" é ambíguo: pode ser EM ESCALA (id=10504) ou FINALIZADO (id=10003).
   * Usamos o status atual da iniciativa para desambiguar.
   */
  function resolveEstagio(nomeStatus: string, iniciativaStatusId: string): string | undefined {
    if (nomeStatus === 'Finalizado' || nomeStatus === 'FINALIZADO' || nomeStatus === 'Done') {
      if (iniciativaStatusId === EM_ESCALA_STATUS_ID) return 'EM ESCALA'
      return 'FINALIZADO'
    }
    return STATUS_NOME_PIPELINE[nomeStatus]
  }

  // Ordem de exibição (pipeline order)
  const ESTAGIOS_ORDEM = [
    'BACKLOG', 'EM REFINAMENTO', 'PRONTO PARA EXECUÇÃO',
    'EM EXPERIMENTAÇÃO', 'AGUARDANDO PILOTO', 'EM PILOTO',
    'EM ESCALA', 'FINALIZADO',
  ]

  // Labels curtos
  const LABELS: Record<string, string> = {
    'BACKLOG': 'Backlog',
    'EM REFINAMENTO': 'Refinamento',
    'PRONTO PARA EXECUÇÃO': 'Pronto p/ Execução',
    'EM EXPERIMENTAÇÃO': 'Experimentação',
    'AGUARDANDO PILOTO': 'Ag. Piloto',
    'EM PILOTO': 'Piloto',
    'EM ESCALA': 'Escala',
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
    const iniciativaStatusId = ini.fields.status.id

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
            const estagio = resolveEstagio(fromNome, iniciativaStatusId)
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
          const estagio = resolveEstagio(nomeStatus, iniciativaStatusId)
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

// ── Monitoramento Estratégico ──

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/**
 * Retorna true se a data está dentro do período especificado.
 */
function dataEstaNoPeriodo(dataStr: string | null | undefined, periodo: PeriodoFiltro): boolean {
  if (!dataStr) return false
  const d = new Date(dataStr)
  if (isNaN(d.getTime())) return false

  const hoje = new Date()

  if (periodo.tipo === 'tudo') return true

  if (periodo.tipo === 'ultimos12') {
    const corte = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)
    return d >= corte
  }

  if (periodo.tipo === 'semestre') {
    const mesInicio = periodo.semestre === 1 ? 0 : 6
    const mesFim = periodo.semestre === 1 ? 5 : 11
    const inicio = new Date(periodo.ano, mesInicio, 1)
    const fim = new Date(periodo.ano, mesFim + 1, 0, 23, 59, 59)
    return d >= inicio && d <= fim
  }

  return true
}

/**
 * Retorna os meses que compõem o período (para gráficos).
 */
function getMesesDoPeriodo(periodo: PeriodoFiltro): { mes: string; ano: number; mesIdx: number }[] {
  const hoje = new Date()
  const resultado: { mes: string; ano: number; mesIdx: number }[] = []

  if (periodo.tipo === 'tudo') {
    // Do início de 2024 até o mês atual
    for (let ano = 2024; ano <= hoje.getFullYear(); ano++) {
      const maxMes = ano === hoje.getFullYear() ? hoje.getMonth() : 11
      for (let m = 0; m <= maxMes; m++) {
        resultado.push({ mes: MESES_ABREV[m], ano, mesIdx: m })
      }
    }
    return resultado
  }

  if (periodo.tipo === 'ultimos12') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      resultado.push({
        mes: MESES_ABREV[d.getMonth()],
        ano: d.getFullYear(),
        mesIdx: d.getMonth(),
      })
    }
    return resultado
  }

  if (periodo.tipo === 'semestre') {
    const inicio = periodo.semestre === 1 ? 0 : 6
    const fim = periodo.semestre === 1 ? 5 : 11
    for (let m = inicio; m <= fim; m++) {
      resultado.push({ mes: MESES_ABREV[m], ano: periodo.ano, mesIdx: m })
    }
    return resultado
  }

  return resultado
}

/**
 * Constrói os dados para o dashboard de Monitoramento Estratégico a partir
 * dos mesmos dados reais usados pelo DashboardData.
 * @param periodo Filtro de período (ultimos12, semestre, tudo)
 */
export function buildMonitoramentoData(data: DashboardData, periodo: PeriodoFiltro = { tipo: 'ultimos12' }): MonitoramentoData {
  const allEpics = data.allEpics

  // Filtrar epics pelo período (usando criadoEm)
  const epicsNoPeriodo = periodo.tipo === 'tudo'
    ? allEpics
    : allEpics.filter(e => dataEstaNoPeriodo(e.criadoEm, periodo))

  // ── KPIs ──
  const experimentosConcluidos = epicsNoPeriodo.filter(e =>
    e.status.id === '10003'
  ).length

  const totalPipeline = Object.values(data.pipeline).reduce((s, v) => s + v, 0)
  const taxaConversao = totalPipeline > 0 ? Math.round((experimentosConcluidos / totalPipeline) * 100) : 0

  const pipelineAtivo = data.totalEpicsAtivos

  const custoTotal = epicsNoPeriodo.reduce((s, e) => s + (e.custoEstimado ?? 0), 0)
  const beneficioNoPeriodo = epicsNoPeriodo.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
  const roi = custoTotal > 0 ? beneficioNoPeriodo / custoTotal : null

  // ── Burnup: acumulado mês a mês de TODOS os experimentos (criados no período) ──
  // Usa criadoEm como referência para posicionar cada experimento no mês
  const meses = getMesesDoPeriodo(periodo)
  const realizado: { mes: string; ano: number; valor: number }[] = []
  const beneficioAcumulado: { mes: string; ano: number; valor: number }[] = []
  let acumulado = 0
  let acumuladoBeneficio = 0
  for (const { mes, ano, mesIdx } of meses) {
    const epicsNoMes = epicsNoPeriodo.filter(e => {
      if (!e.criadoEm) return false
      const d = new Date(e.criadoEm)
      return d.getFullYear() === ano && d.getMonth() === mesIdx
    })
    acumulado += epicsNoMes.length
    realizado.push({ mes, ano, valor: acumulado })

    // Benefício acumulado: soma o benefício de TODOS os epics até o mês
    acumuladoBeneficio += epicsNoMes.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
    beneficioAcumulado.push({ mes, ano, valor: acumuladoBeneficio })
  }
  const burnup: SerieMensal = { realizado, beneficio: beneficioAcumulado }

  // ── Benefício por Área (via domínio) ──
  const areaMap = new Map<string, number>()
  for (const e of epicsNoPeriodo) {
    const area = e.dominio ?? 'Não classificado'
    areaMap.set(area, (areaMap.get(area) ?? 0) + (e.beneficioQuantitativo ?? 0))
  }
  const totalBeneficio = Array.from(areaMap.values()).reduce((s, v) => s + v, 0)
  const beneficioPorArea: BeneficioPorArea[] = Array.from(areaMap.entries())
    .map(([area, valor]) => ({
      area,
      valor,
      percentual: totalBeneficio > 0 ? Math.round((valor / totalBeneficio) * 100) : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)

  // ── Funil da Experimentação ──
  const funil: FunilEtapa[] = buildFunil(data)

  // ── Conclusões mensais (quantidade + benefício) ──
  const conclusoesMensais: ConclusaoMensal[] = meses.map(({ mes, ano, mesIdx }) => {
    const epicsMes = epicsNoPeriodo.filter(e => {
      // Usa concluidoEm como referência para data de conclusão
      const dataRef = e.concluidoEm ?? e.criadoEm
      if (!dataRef) return false
      const d = new Date(dataRef)
      return d.getFullYear() === ano && d.getMonth() === mesIdx && e.status.id === '10003'
    })
    return {
      mes: periodo.tipo === 'tudo' ? `${mes}/${String(ano).slice(2)}` : mes,
      quantidade: epicsMes.length,
      beneficio: epicsMes.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
    }
  })

  // ── Maturidade do portfólio ──
  const maturidade: MaturidadeEstagio[] = buildMaturidade(data)

  // ── Insights ──
  const insights: InsightExecutivo[] = buildInsights(data, conclusoesMensais, beneficioPorArea)

  // ── Iniciativas por Lab ──
  const iniciativasFiltradas = periodo.tipo === 'tudo'
    ? data.iniciativas
    : data.iniciativas.filter(ini => dataEstaNoPeriodo(ini.criadoEm, periodo))
  const iniciativasPorLab: IniciativaLab[] = iniciativasFiltradas.map(ini => ({
    key: ini.key,
    nome: ini.nome,
    status: ini.status.name,
    timeResponsavel: ini.timeResponsavel,
    sponsor: ini.sponsor,
    criadoEm: ini.criadoEm,
  }))

  return {
    beneficioPotencial: beneficioNoPeriodo,
    experimentosConcluidos,
    taxaConversao,
    pipelineAtivo,
    custoTotal,
    roi,
    burnup,
    beneficioPorArea,
    funil,
    conclusoesMensais,
    maturidade,
    insights,
    iniciativasPorLab,
    cycleTimeExperimentacao: data.cycleTimeExperimentacao,
    cycleTimeExperimentacaoGeral: data.cycleTimeExperimentacaoGeral,
  }
}

function buildFunil(data: DashboardData): FunilEtapa[] {
  const p = data.pipeline
  const ideias = p.BACKLOG + p['EM REFINAMENTO']
  const emAvaliacao = p['PRONTO PARA EXECUÇÃO']
  const emExecucao = p['EM EXPERIMENTAÇÃO'] + p['AGUARDANDO PILOTO'] + p['EM PILOTO']
  const concluidos = p.FINALIZADO
  const escalados = p['EM ESCALA']

  const etapas: { etapa: string; qtd: number }[] = [
    { etapa: 'Ideias', qtd: ideias },
    { etapa: 'Em avaliação', qtd: emAvaliacao },
    { etapa: 'Em execução', qtd: emExecucao },
    { etapa: 'Concluídos', qtd: concluidos },
    { etapa: 'Escalados', qtd: escalados },
  ]

  return etapas.map((e, i) => {
    const proxima = etapas[i + 1]
    const taxa = proxima ? (e.qtd > 0 ? Math.round((proxima.qtd / e.qtd) * 100) : 0) : 0
    return { etapa: e.etapa, quantidade: e.qtd, taxaConversao: taxa }
  })
}

function buildMaturidade(data: DashboardData): MaturidadeEstagio[] {
  const p = data.pipeline
  // Discovery: backlog + refinamento
  // MVP: pronto para execução + experimentação
  // Piloto: aguardando piloto + em piloto
  // Escala: em escala + finalizado
  return [
    { estagio: 'Discovery', quantidade: p.BACKLOG + p['EM REFINAMENTO'], cor: '#94A3B8' },
    { estagio: 'MVP', quantidade: p['PRONTO PARA EXECUÇÃO'] + p['EM EXPERIMENTAÇÃO'], cor: '#60A5FA' },
    { estagio: 'Piloto', quantidade: p['AGUARDANDO PILOTO'] + p['EM PILOTO'], cor: '#F59E0B' },
    { estagio: 'Escala', quantidade: p['EM ESCALA'] + p.FINALIZADO, cor: '#10B981' },
  ]
}

function buildInsights(
  data: DashboardData,
  conclusoesMensais: ConclusaoMensal[],
  beneficioPorArea: BeneficioPorArea[]
): InsightExecutivo[] {
  const insights: InsightExecutivo[] = []

  // Mês com mais conclusões
  const mesTop = [...conclusoesMensais].sort((a, b) => b.quantidade - a.quantidade)[0]
  if (mesTop && mesTop.quantidade > 0) {
    insights.push({
      texto: `${mesTop.mes} concentrou o maior número de experimentos concluídos (${mesTop.quantidade}).`,
      tipo: 'positivo',
    })
  }

  // Área com maior benefício
  const areaTop = beneficioPorArea[0]
  if (areaTop && areaTop.valor > 0) {
    insights.push({
      texto: `${areaTop.area} representa o maior benefício financeiro (${formatBRL(areaTop.valor)}).`,
      tipo: 'positivo',
    })
  }

  // Pipeline ativo
  if (data.totalEpicsAtivos > 0) {
    insights.push({
      texto: `${data.totalEpicsAtivos} experimentos ativos no pipeline.`,
      tipo: 'neutro',
    })
  }

  // Cycle time
  if (data.cycleTimeExperimentacaoGeral?.mediaDias) {
    const ct = data.cycleTimeExperimentacaoGeral.mediaDias
    insights.push({
      texto: `Cycle time médio de experimentação: ${ct} dias.`,
      tipo: 'neutro',
    })
  }

  // Alerta: muitos bloqueados
  const bloqueados = data.allEpics.filter(e => !!e.motivoBloqueio).length
  if (bloqueados > 5) {
    insights.push({
      texto: `${bloqueados} experimentos estão bloqueados — requer atenção.`,
      tipo: 'alerta',
    })
  }

  // Se não tem custo, mencionar
  if (data.allEpics.filter(e => (e.custoEstimado ?? 0) > 0).length === 0) {
    insights.push({
      texto: 'Custos dos experimentos ainda não foram preenchidos. Atualize para calcular o ROI.',
      tipo: 'neutro',
    })
  }

  return insights.slice(0, 6)
}
