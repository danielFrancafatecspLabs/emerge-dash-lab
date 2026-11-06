import { epicCancelado, getPipelineStage } from '@/lib/mappers'
import { getPeriodoIntervalo, isDataNoPeriodo, type PeriodoFiltro } from '@/lib/periodo-filter'
import { epicBloqueado } from '@/lib/bloqueio'
import { ehExperimentoConcluido } from '@/lib/concluido'
import { contarHipoteses, ESTAGIO_DA_ETAPA, etapaValidada } from '@/lib/hipoteses'
import type {
  DashboardData, EpicDetail, Iniciativa, MercadoAgregado, MetaCategoria, PipelineCount,
} from '@/lib/types'

/**
 * Regras do painel Estratégia (puro, roda na tela).
 *
 * Período: vale a data em que o experimento (Epic) terminou.
 * - Concluído entra no período em que foi concluído; cancelado, no período em que foi cancelado (sem o histórico do
 *   Jira, vale a data de criação).
 * - Em aberto (backlog, refinamento, andamento, validação) entra no período em que foi criado.
 * Cada experimento cai em UM período só, então os períodos somam: 1º semestre + 2º semestre = o ano todo.
 *
 * Benefício potencial: nunca soma experimentos cancelados. O que foi cancelado com benefício aparece à parte.
 *
 * Hipóteses: sempre em épicos (lib/hipoteses.ts). Validada: épico concluído no período com a iniciativa em
 * Aguardando piloto, Em piloto ou Em escala. Refutada: os demais épicos concluídos no período.
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
  // Em aberto: pela data de criação. Antes contava em todo período em que já existia, e o mesmo experimento entrava
  // no 1º e no 2º semestre: a soma dos semestres passava do ano.
  return isDataNoPeriodo(e.criadoEm, periodo)
}

// ── Hipóteses ─────────────────────────────────────────────────────────────────────────────────

export type EtapaValidada = 'AGUARDANDO PILOTO' | 'EM PILOTO' | 'EM ESCALA'

export interface Hipoteses {
  /** Épicos concluídos com a iniciativa em Aguardando piloto, Em piloto ou Em escala (lib/hipoteses.ts). */
  validadas: EpicDetail[]
  /** Épicos concluídos com a iniciativa fora dessas colunas. */
  refutadas: EpicDetail[]
  /** Iniciativas em cada etapa (como as seções do Semanal). */
  porEtapa: Record<EtapaValidada, Iniciativa[]>
}

/** Hipóteses do período, sempre em épicos: a regra oficial de lib/hipoteses.ts. */
export function hipoteses(iniciativas: Iniciativa[], epics: EpicDetail[]): Hipoteses {
  const statusDaIniciativa = new Map(iniciativas.map(i => [i.key, i.status]))
  const c = contarHipoteses(epics, e => (e.parentKey ? statusDaIniciativa.get(e.parentKey) : null))
  const naEtapa = (etapa: string) => iniciativas.filter(i => etapaValidada(i.status) === etapa)
  return {
    validadas: c.validadas,
    refutadas: c.refutadas,
    porEtapa: { 'AGUARDANDO PILOTO': naEtapa('aguardando'), 'EM PILOTO': naEtapa('piloto'), 'EM ESCALA': naEtapa('escala') },
  }
}

// ── Funil (as contagens que a tela mostra) ────────────────────────────────────────────────────

const emAndamento = (e: EpicDetail) => e.status?.id === '3' || e.status?.name === 'Em andamento'
const emValidacao = (e: EpicDetail) => e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'

export interface ContagensDoFunil {
  total: number
  emAndamento: number
  emValidacao: number
  concluidos: number
  cancelados: number
}

/** As contagens de experimentos do Funil de Experimentos (a tela e o agente de analytics usam esta mesma função). */
export function contagensDoFunil(epics: EpicDetail[]): ContagensDoFunil {
  return {
    total: epics.length,
    emAndamento: epics.filter(emAndamento).length,
    emValidacao: epics.filter(emValidacao).length,
    concluidos: epics.filter(ehExperimentoConcluido).length,
    cancelados: epics.filter(ehCancelado).length,
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

export function resultadosDaEstrategia(data: DashboardData): ResultadosEstrategia {
  const ativos = data.allEpics.filter(e => !ehCancelado(e))
  const canceladosComBeneficio = data.allEpics.filter(e => ehCancelado(e) && beneficioDe(e) > 0)
  return {
    beneficio: beneficioPotencial(data.allEpics),
    comBeneficio: ativos.filter(e => beneficioDe(e) > 0),
    cancelados: { valor: canceladosComBeneficio.reduce((s, e) => s + beneficioDe(e), 0), epics: canceladosComBeneficio },
    hipoteses: hipoteses(data.iniciativas, data.allEpics),
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
  for (const ini of iniciativas) {
    const etapa = etapaValidada(ini.status)
    pipeline[etapa ? ESTAGIO_DA_ETAPA[etapa] : getPipelineStage(ini.status) ?? 'BACKLOG']++
  }

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
