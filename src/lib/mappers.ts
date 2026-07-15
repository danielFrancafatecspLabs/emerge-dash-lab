import {
  JiraIssue,
  JiraStatus,
  EpicDetail,
  Iniciativa,
  DashboardData,
  PipelineCount,
  MercadoAgregado,
} from './types'
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

// Status IDs confirmados via API (board 2706 — Iniciativas)
export const STATUS_PIPELINE: Record<string, keyof PipelineCount> = {
  '10004': 'BACKLOG',
  '10139': 'EM REFINAMENTO',
  '10067': 'PRONTO PARA EXECUÇÃO',
  '13045': 'AGUARDANDO PILOTO',
  '12848': 'EM EXPERIMENTAÇÃO',
  '12847': 'EM PILOTO',
  '10003': 'FINALIZADO',
  '10015': 'CANCELADO',
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
  'EM REFINAMENTO':       '#60A5FA',
  'PRONTO PARA EXECUÇÃO': '#F97316',
  'EM EXPERIMENTAÇÃO':    '#FCD34D',
  'AGUARDANDO PILOTO':    '#A78BFA',
  'EM PILOTO':            '#EF4444',
  'EM ESCALA':            '#22C55E',
  'FINALIZADO':           '#134E4A',
  'CANCELADO':            '#6B7280',
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
  boardConfig?: JiraBoardConfiguration
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
  const pipelineActual: PipelineCount = {
    BACKLOG: 0, 'EM REFINAMENTO': 0, 'PRONTO PARA EXECUÇÃO': 0,
    'EM EXPERIMENTAÇÃO': 0, 'AGUARDANDO PILOTO': 0, 'EM PILOTO': 0,
    'EM ESCALA': 0, FINALIZADO: 0, CANCELADO: 0,
  }
  for (const ini of iniciativas) {
    const col = getPipelineStage(ini.status)
    if (col) pipelineActual[col]++
  }

  const pipeline: PipelineCount = { ...pipelineActual }
  // Hardcoded values para métricas de conversão quando o Jira não traz EM ESCALA
  pipeline['EM ESCALA'] = 8
  pipeline['BACKLOG'] = 54

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
    'EM ESCALA', 'EM PILOTO', 'AGUARDANDO PILOTO', 'FINALIZADO', 'EM EXPERIMENTAÇÃO', 'EM REFINAMENTO', 'BACKLOG', 'CANCELADO',
  ]
  const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = {
    'CANCELADO':  'DESCONTINUADO',
    'FINALIZADO': 'CONCLUÍDO',
  }
  const statusDistribuicao = STATUS_DONUT_ORDER
    .map(key => {
      const baseValue = pipelineActual[key] ?? 0
      // Hardcoded overrides for Situação do Portfólio per request
      const overridden = key === 'BACKLOG' ? 52 : key === 'EM ESCALA' ? 8 : baseValue
      return {
        name: STATUS_DISPLAY_NAME[key] ?? key,
        value: overridden,
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
  }
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
