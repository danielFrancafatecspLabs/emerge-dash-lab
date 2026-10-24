import type { EpicDetail } from './types'

/**
 * Experimento concluído: a mesma regra da fase "Concluídos" da Weekly e do report Semanal (a contagem oficial). Um só
 * lugar para a regra, para a aba Estratégia e o Semanal nunca divergirem.
 */
export const STATUS_EPIC_CONCLUIDO = '10019'

export const ehExperimentoConcluido = (e: Pick<EpicDetail, 'status'>) => e.status?.id === STATUS_EPIC_CONCLUIDO
