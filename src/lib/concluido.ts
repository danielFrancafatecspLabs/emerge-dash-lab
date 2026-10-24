import type { EpicDetail } from './types'

/**
 * Experimento concluído: a mesma regra da fase "Concluídos" da Weekly e do report Semanal (a contagem oficial). Um só
 * lugar para a regra, para a aba Estratégia, o Semanal, o Comparativo e os reports nunca divergirem.
 */
export const STATUS_EPIC_CONCLUIDO = '10019'

/**
 * Experimentos que estão em Concluído no Jira mas não contam como concluídos (reabertos ou movidos indevidamente).
 * Por nome, como no Jira; a comparação ignora acentos, caixa e espaços.
 */
export const EXCLUIDOS_DOS_CONCLUIDOS = [
  'Otimiza APP - Ciclo 1 (Análise de comentários das lojas de apps)',
  "IA para IP'S de rede",
  'Assistente IA Ágil - Ciclo 2',
  'Sumarização dos Contratos',
  'Jurisquery - Consulta de Pareceres Juridicos',
]

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
const EXCLUIDOS = new Set(EXCLUIDOS_DOS_CONCLUIDOS.map(normalizar))

/** O experimento está na lista dos que não contam como concluídos. */
export const ehExcluidoDosConcluidos = (nome: string | null | undefined) => !!nome && EXCLUIDOS.has(normalizar(nome))

export const ehExperimentoConcluido = (e: Pick<EpicDetail, 'status' | 'nome'>) =>
  e.status?.id === STATUS_EPIC_CONCLUIDO && !ehExcluidoDosConcluidos(e.nome)
