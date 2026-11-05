/**
 * Hipóteses: a regra oficial do beOn Labs, a mesma em todas as telas (Semanal, Estratégia, Portfólio, Operacional,
 * Comparativo e o agente de analytics). Sempre contada em ÉPICOS (experimentos):
 *
 * - Hipótese validada: épico concluído cuja iniciativa-mãe está em Aguardando piloto, Em piloto ou Em escala.
 * - Hipótese refutada: épico concluído cuja iniciativa-mãe não está nessas colunas (ou que não tem iniciativa).
 *
 * "Finalizado" é o status antigo de Em escala e conta como Em escala enquanto ainda houver iniciativa com ele.
 */

import { nomeDeCancelado } from './concluido'

export type EtapaValidada = 'aguardando' | 'piloto' | 'escala'
export const ETAPAS_VALIDADAS: EtapaValidada[] = ['aguardando', 'piloto', 'escala']

type Status = { id: string; name: string }

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim()

/** Etapa da iniciativa que valida a hipótese: Aguardando piloto, Em piloto ou Em escala (Finalizado incluído). */
export function etapaValidada(status: Status | null | undefined): EtapaValidada | null {
  if (!status) return null
  const nome = normal(status.name ?? '')
  if (status.id === '13045' || status.id === '14468' || nome === 'AGUARDANDO PILOTO') return 'aguardando'
  if (status.id === '12847' || status.id === '14459' || nome === 'EM PILOTO') return 'piloto'
  if (status.id === '13562' || status.id === '10504' || nome === 'EM ESCALA' || nome === 'FINALIZADO') return 'escala'
  return null
}

/** O estágio do pipeline de cada etapa validada (para as telas que contam por estágio, como o Operacional). */
export const ESTAGIO_DA_ETAPA = { aguardando: 'AGUARDANDO PILOTO', piloto: 'EM PILOTO', escala: 'EM ESCALA' } as const

const STATUS_CONCLUIDO = '10019'
/** Concluído pelo id, desde que o nome do status não diga cancelado. */
export const epicConcluido = (e: { status: Status }) => e.status?.id === STATUS_CONCLUIDO && !nomeDeCancelado(e.status?.name)

export interface ContagemHipoteses<E> {
  /** Épicos concluídos com a iniciativa em Aguardando piloto, Em piloto ou Em escala. */
  validadas: E[]
  /** Épicos concluídos com a iniciativa fora dessas colunas (ou sem iniciativa). */
  refutadas: E[]
}

/**
 * Classifica os épicos concluídos. `statusDaMae` devolve o status da iniciativa-mãe do épico (ou null sem mãe).
 */
export function contarHipoteses<E extends { status: Status }>(epics: E[], statusDaMae: (e: E) => Status | null | undefined): ContagemHipoteses<E> {
  const validadas: E[] = []
  const refutadas: E[] = []
  for (const e of epics) {
    if (!epicConcluido(e)) continue
    if (etapaValidada(statusDaMae(e))) validadas.push(e)
    else refutadas.push(e)
  }
  return { validadas, refutadas }
}
