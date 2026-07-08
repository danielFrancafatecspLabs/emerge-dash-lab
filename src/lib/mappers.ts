import {
  JiraIssue,
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

const DONUT_COLORS: Record<string, string> = {
  'BACKLOG':              '#D4D4D4',
  'EM REFINAMENTO':       '#60A5FA',
  'PRONTO PARA EXECUÇÃO': '#F97316',
  'EM EXPERIMENTAÇÃO':    '#FCD34D',
  'AGUARDANDO PILOTO':    '#A78BFA',
  'EM PILOTO':            '#EF4444',
  'FINALIZADO':           '#22C55E',
  'CANCELADO':            '#6B7280',
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
  }
}

export function buildDashboardData(
  iniciativasRaw: JiraIssue[],
  epicsRaw: JiraIssue[],
  portfolioClassification: Record<string, MetaCategoria> = {},
  segmentoClassification: Record<string, SegmentoMercado> = {}
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
    return {
      key: ini.key,
      nome: ini.fields.summary,
      status: ini.fields.status,
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
    }
  })

  // 3. Pipeline — contagem por coluna (Iniciativas)
  const pipeline: PipelineCount = {
    BACKLOG: 0, 'EM REFINAMENTO': 0, 'PRONTO PARA EXECUÇÃO': 0,
    'EM EXPERIMENTAÇÃO': 0, 'AGUARDANDO PILOTO': 0, 'EM PILOTO': 0,
    FINALIZADO: 0, CANCELADO: 0,
  }
  for (const ini of iniciativas) {
    const col = STATUS_PIPELINE[ini.status.id]
    if (col) pipeline[col]++
  }

  // Contagens específicas por status ID para os cards do Resumo do Portfólio
  const iniciativasAguardandoPiloto = iniciativas.filter(i => i.status.id === '13045').length
  const iniciativasEmPiloto         = iniciativas.filter(i => i.status.id === '12847').length

  // 4. Métricas de Epics ativos
  const epicsAtivos = epicsRaw.filter(e =>
    e.fields.status.id !== '10015' && e.fields.status.id !== '10003'
  )
  const allEpicDetails = Array.from(epicDetailMap.values())

  // Benefício vem das Iniciativas (customfield_13242 preenchido lá, não nos Epics)
  const iniBeneficios = iniciativas
    .map(i => i.beneficioQuantitativo)
    .filter((v): v is number => v !== null && v > 0)
  const beneficioTotal = iniBeneficios.reduce((s, v) => s + v, 0)
  const beneficioMedio = iniBeneficios.length ? beneficioTotal / iniBeneficios.length : 0

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

  // 7. Top 5 Iniciativas por benefício (benefício real está na Iniciativa, não no Epic)
  const top5Epics: EpicDetail[] = [...iniciativas]
    .filter(i => (i.beneficioQuantitativo ?? 0) > 0)
    .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
    .slice(0, 5)
    .map(ini => ({
      key: ini.key,
      nome: ini.nome,
      status: ini.status,
      sponsor: ini.sponsor,
      bo: null,
      complexidade: null,
      timeResponsavel: ini.timeResponsavel ?? ini.epics[0]?.timeResponsavel ?? null,
      beneficioQuantitativo: ini.beneficioQuantitativo,
      beneficioQualitativo: null,
      dominio: ini.dominios[0] ?? null,
      custoEstimado: null,
      custoRealizado: null,
      segmento: ini.segmentos[0] ?? null,
      portfolio: null,
      diretoria: null,
      metaCategoria: ini.epics[0]?.metaCategoria ?? null,
      tipo: 'Iniciativa',
      mercado: ini.epics[0]?.mercado ?? 'Consumo',
      descricao: null,
      motivoBloqueio: null,
    }))

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
    'FINALIZADO', 'EM PILOTO', 'AGUARDANDO PILOTO', 'CANCELADO',
    'EM EXPERIMENTAÇÃO', 'EM REFINAMENTO',
  ]
  const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = {
    'CANCELADO': 'DESCONTINUADO',
  }
  const statusDistribuicao = STATUS_DONUT_ORDER
    .map(key => ({
      name: STATUS_DISPLAY_NAME[key] ?? key,
      value: pipeline[key] ?? 0,
      color: DONUT_COLORS[key] ?? '#888',
    }))
    .filter(d => d.value > 0)

  // 9. Metas agregadas por categoria LLM
  const metasAgregadas: Record<MetaCategoria, { count: number; valor: number }> = {
    EBITDA:  { count: 0, valor: 0 },
    NPS:     { count: 0, valor: 0 },
    Receita: { count: 0, valor: 0 },
  }
  // Contagem por epic classificado
  for (const e of allEpicDetails) {
    const meta = portfolioClassification[e.key]
    if (!meta) continue
    metasAgregadas[meta].count++
  }
  // Valor: propaga benefício da Iniciativa proporcionalmente aos seus epics classificados
  for (const ini of iniciativas) {
    const ben = ini.beneficioQuantitativo ?? 0
    if (!ben) continue
    const catCounts: Partial<Record<MetaCategoria, number>> = {}
    for (const e of ini.epics) {
      const meta = portfolioClassification[e.key] as MetaCategoria | undefined
      if (meta) catCounts[meta] = (catCounts[meta] ?? 0) + 1
    }
    const total = Object.values(catCounts).reduce((s, v) => s + (v ?? 0), 0)
    if (!total) continue
    for (const [meta, count] of Object.entries(catCounts) as [MetaCategoria, number][]) {
      metasAgregadas[meta].valor += ben * (count / total)
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
