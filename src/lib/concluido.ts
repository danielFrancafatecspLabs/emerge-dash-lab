import type { EpicDetail } from './types'

/**
 * Experimento concluído: a mesma regra da fase "Concluídos" da Weekly e do report Semanal (a contagem oficial). Um só
 * lugar para a regra, para a aba Estratégia, o Semanal, o Comparativo e os reports nunca divergirem.
 */
export const STATUS_EPIC_CONCLUIDO = '10019'

/**
 * O nome do status diz que está cancelado ("Cancelado", "CANCELADO", "Cancelled", "Descontinuado")? Vale mais que o id:
 * o Jira reaproveita ids entre boards, então um "Cancelado" pode vir com o id de outra etapa.
 */
export const nomeDeCancelado = (nome: string | null | undefined) => {
  const n = (nome ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  return n.includes('CANCEL') || n.includes('DESCONTINU')
}

/** Concluído pelo id, desde que o nome não diga cancelado. */
export const ehExperimentoConcluido = (e: Pick<EpicDetail, 'status'>) =>
  e.status?.id === STATUS_EPIC_CONCLUIDO && !nomeDeCancelado(e.status?.name)
