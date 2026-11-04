import { epicCancelado, getPipelineStage } from '@/lib/mappers'
import { getPeriodoIntervalo, isDataNoPeriodo, type PeriodoFiltro } from '@/lib/periodo-filter'
import { epicBloqueado } from '@/lib/bloqueio'
import { ehExperimentoConcluido } from '@/lib/concluido'
import { contarHipoteses } from '@/lib/weekly'
import type {
  DashboardData, EpicDetail, Iniciativa, MercadoAgregado, MetaCategoria, PipelineCount,
} from '@/lib/types'

/**
 * Regras do painel Estratégia (puro, roda na tela).
 *
 * Período: vale a data em que o experimento (Epic) terminou.
 * - Concluído entra no período em que foi concluído; cancelado, no período em que foi cancelado (sem o histórico do
 *   Jira, vale a data de criação).
 * - Em aberto (backlog, refinamento, andamento, validação) entra se já existia no fim do período: estava em curso.
 *
 * Benefício potencial: nunca soma experimentos cancelados. O que foi cancelado com benefício aparece à parte.
 *
 * Hipóteses: a regra oficial do Semanal (lib/weekly.ts → contarHipoteses), sobre os experimentos e as iniciativas
 * do período. Validadas: iniciativas em Aguardando piloto, Em piloto ou Em escala. Refutadas: o restante do total
 * de experimentos (fora exploração, andamento, validadas e cancelados).
 */

/** Experimento cancelado: a mesma regra do resto do app (lib/mappers.ts). */
export const ehCancelado = epicCancelado

export const beneficioDe = (e: Pick<EpicDetail, 'beneficioQuantitativo'>) => e.beneficioQuantitativo ?? 0

/** Soma do benefício potencial, sem os cancelados. */
export const beneficioPotencial = (epics: EpicDetail[]) => epics.reduce((s, e) => s + (ehCancelado(e) ? 0 : beneficioDe(e)), 0)

/** O experimento conta no período? (ver a regra no topo) */
export function epicNoPeriodo(e: EpicDetail, periodo: PeriodoFiltro): boolean {
  if (periodo.tipo === 'tudo') return true
  if (ehExperimentoConcluido(e)) return isDataNoPeriodo(e.concluidoEm ?? e.criadoEm, periodo)
  if (ehCancelado(e)) return isDataNoPeriodo(e.canceladoEm ?? e.criadoEm, periodo)
  if (!e.criadoEm) return true
  const criado = Date.parse(e.criadoEm)
  return Number.isNaN(criado) || criado <= getPeriodoIntervalo(periodo).fim.getTime()
}

// ── Hipóteses ─────────────────────────────────────────────────────────────────────────────────

export type EtapaValidada = 'AGUARDANDO PILOTO' | 'EM PILOTO' | 'EM ESCALA'

export interface Hipoteses {
  /** Iniciativas em Aguardando piloto, Em piloto ou Em escala (a mesma regra do Semanal). */
  validadas: Iniciativa[]
  porEtapa: Record<EtapaValidada, Iniciativa[]>
  /** Experimentos que terminaram e não avançaram: o restante do total, como no Semanal. */
  refutadas: number
}

/** Hipóteses do período pela regra oficial do Semanal (lib/weekly.ts → contarHipoteses). */
export function hipoteses(iniciativas: Iniciativa[], epics: EpicDetail[], exploracaoIds: string[]): Hipoteses {
  const c = contarHipoteses(iniciativas, epics, exploracaoIds)
  return {
    validadas: c.validadas,
    porEtapa: { 'AGUARDANDO PILOTO': c.porEtapa.aguardando, 'EM PILOTO': c.porEtapa.piloto, 'EM ESCALA': c.porEtapa.escala },
    refutadas: c.refutadas,
  }
}

// ── Resultados do período ─────────────────────────────────────────────────────────────────────

export interface ResultadosEstrategia {
  beneficio: number
  /** Experimentos não cancelados com benefício informado. */
  comBeneficio: EpicDetail[]
  cancelados: { valor: number; epics: EpicDetail[] }
  hipoteses: Hipoteses
  /** Experimentos não cancelados sem meta estratégica (a IA ainda não classificou). */
  semMeta: EpicDetail[]
}

export function resultadosDaEstrategia(data: DashboardData, exploracaoIds: string[] = ['10004', '10139']): ResultadosEstrategia {
  const ativos = data.allEpics.filter(e => !ehCancelado(e))
  const canceladosComBeneficio = data.allEpics.filter(e => ehCancelado(e) && beneficioDe(e) > 0)
  return {
    beneficio: beneficioPotencial(data.allEpics),
    comBeneficio: ativos.filter(e => beneficioDe(e) > 0),
    cancelados: { valor: canceladosComBeneficio.reduce((s, e) => s + beneficioDe(e), 0), epics: canceladosComBeneficio },
    hipoteses: hipoteses(data.iniciativas, data.allEpics, exploracaoIds),
    semMeta: ativos.filter(e => !e.metaCategoria),
  }
}

// ── Dashboard do período ──────────────────────────────────────────────────────────────────────

const STATUS_DONUT_ORDER: (keyof PipelineCount)[] = [
  'EM ESCALA', 'EM PILOTO', 'AGUARDANDO PILOTO', 'FINALIZADO',
  'EM EXPERIMENTAÇÃO', 'PRONTO PARA EXECUÇÃO', 'EM REFINAMENTO', 'BACKLOG', 'CANCELADO',
]
const DONUT_COLORS: Record<string, string> = {
  'EM ESCALA': '#22c55e', 'EM PILOTO': '#16a34a', 'AGUARDANDO PILOTO': '#84cc16',
  FINALIZADO: '#6b7280', 'EM EXPERIMENTAÇÃO': '#ea580c', 'PRONTO PARA EXECUÇÃO': '#d4d4d4',
  'EM REFINAMENTO': '#a8a29e', BACKLOG: '#9ca3af', CANCELADO: '#ef4444',
}
const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = { CANCELADO: 'DESCONTINUADO', FINALIZADO: 'CONCLUÍDO' }

function agregarMercado<T extends { epics: EpicDetail[] }>(base: T, epics: EpicDetail[]) {
  const domCount = new Map<string, number>()
  for (const e of epics) if (e.dominio) domCount.set(e.dominio, (domCount.get(e.dominio) ?? 0) + 1)
  const total = epics.length
  return {
    ...base,
    epics,
    qtdExperimentos: epics.length,
    valorPotencial: beneficioPotencial(epics),
    dominios: [...domCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([nome, count]) => ({ nome, count, pct: total ? Math.round((count / total) * 100) : 0 })),
    alertas: {
      bloqueadosIA: epics.filter(epicBloqueado).length,
      aguardandoDelivery: epics.filter(e => e.status.id === '10067').length,
      semSponsor: epics.filter(e => !e.sponsor).length,
    },
  }
}

/**
 * O DashboardData do período: os experimentos que contam nele (pela conclusão), as iniciativas desses experimentos
 * e todos os agregados recalculados, com o benefício potencial sempre sem os cancelados.
 */
export function filtrarDashboardData(data: DashboardData, periodo: PeriodoFiltro): DashboardData {
  const allEpics = data.allEpics.filter(e => epicNoPeriodo(e, periodo))
  const doPeriodo = new Set(allEpics.map(e => e.key))

  // Iniciativas: as que têm experimento no período; sem experimento nenhum, pela data de criação.
  const iniciativas: Iniciativa[] = data.iniciativas
    .filter(ini => (ini.epics.length
      ? ini.epics.some(e => doPeriodo.has(e.key))
      : periodo.tipo === 'tudo' || isDataNoPeriodo(ini.criadoEm, periodo)))
    .map(ini => {
      const epics = ini.epics.filter(e => doPeriodo.has(e.key))
      const ativos = epics.filter(e => !ehCancelado(e))
      return {
        ...ini,
        epics,
        beneficioQuantitativoTotal: beneficioPotencial(epics),
        dominios: [...new Set(ativos.map(e => e.dominio).filter((v): v is string => !!v))],
        sponsors: [...new Set(ativos.map(e => e.sponsor).filter((v): v is string => !!v))],
        segmentos: [...new Set(ativos.map(e => e.segmento).filter((v): v is string => !!v))],
      }
    })

  const pipeline: PipelineCount = {
    BACKLOG: 0, 'EM REFINAMENTO': 0, 'PRONTO PARA EXECUÇÃO': 0, 'EM EXPERIMENTAÇÃO': 0, 'AGUARDANDO PILOTO': 0,
    'EM PILOTO': 0, 'EM ESCALA': 0, FINALIZADO: 0, CANCELADO: 0,
  }
  for (const ini of iniciativas) pipeline[getPipelineStage(ini.status) ?? 'BACKLOG']++

  const ativos = allEpics.filter(e => !ehCancelado(e))
  const comBeneficio = ativos.filter(e => beneficioDe(e) > 0)
  const beneficioTotal = beneficioPotencial(allEpics)

  const sponsorCount = new Map<string, number>()
  for (const e of allEpics) if (e.sponsor) sponsorCount.set(e.sponsor, (sponsorCount.get(e.sponsor) ?? 0) + 1)

  const mercadoMap = new Map<string, EpicDetail[]>()
  for (const e of allEpics) {
    const cat = e.metaCategoria ?? 'Não classificado'
    mercadoMap.set(cat, [...(mercadoMap.get(cat) ?? []), e])
  }
  const mercados: MercadoAgregado[] = [...mercadoMap.entries()]
    .map(([nome, epics]) => agregarMercado({ nome, epics } as MercadoAgregado, epics))
    .sort((a, b) => b.qtdExperimentos - a.qtdExperimentos)

  // Metas: cada experimento (não cancelado) conta na meta em que a IA o classificou, com o próprio benefício.
  const metasAgregadas: Record<MetaCategoria, { count: number; valor: number }> = {
    EBITDA: { count: 0, valor: 0 }, NPS: { count: 0, valor: 0 }, Receita: { count: 0, valor: 0 },
  }
  const epicsPorMeta: Record<MetaCategoria, EpicDetail[]> = { EBITDA: [], NPS: [], Receita: [] }
  for (const e of ativos) {
    const meta = e.metaCategoria as MetaCategoria | null
    if (!meta || !(meta in metasAgregadas)) continue
    epicsPorMeta[meta].push(e)
    metasAgregadas[meta].count++
    metasAgregadas[meta].valor += beneficioDe(e)
  }

  return {
    ...data,
    iniciativas,
    allEpics,
    totalEpicsAtivos: allEpics.filter(e => !ehCancelado(e) && !ehExperimentoConcluido(e)).length,
    beneficioTotal,
    beneficioMedio: comBeneficio.length ? beneficioTotal / comBeneficio.length : 0,
    pipeline,
    iniciativasAguardandoPiloto: iniciativas.filter(i => getPipelineStage(i.status) === 'AGUARDANDO PILOTO').length,
    iniciativasEmPiloto: iniciativas.filter(i => getPipelineStage(i.status) === 'EM PILOTO').length,
    mercados,
    mercadosSegmento: (data.mercadosSegmento ?? []).map(ms => agregarMercado(ms, ms.epics.filter(e => doPeriodo.has(e.key)))),
    top5Epics: [...comBeneficio].sort((a, b) => beneficioDe(b) - beneficioDe(a)).slice(0, 5),
    topSponsors: [...sponsorCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, count]) => ({ nome, count })),
    statusDistribuicao: STATUS_DONUT_ORDER
      .map(key => ({
        name: STATUS_DISPLAY_NAME[key] ?? key,
        value: allEpics.filter(e => getPipelineStage(e.status) === key).length,
        color: DONUT_COLORS[key] ?? '#888',
      }))
      .filter(d => d.value > 0),
    metasAgregadas,
    epicsPorMeta,
  }
}
