/**
 * Tipos da aba Portfólio: as Iniciativas (board de Ideação) e os Experimentos/Epics (board de
 * Experimentação/Piloto) achatados para a tela, com as colunas dos dois boards do Jira.
 */

export type Entidade = 'iniciativa' | 'experimento'

/** Situação macro de um item, a partir do status no Jira (usada nos filtros e nos indicadores). */
export type Situacao = 'nao-iniciado' | 'em-execucao' | 'concluido' | 'cancelado'

export const SITUACAO_LABEL: Record<Situacao, string> = {
  'nao-iniciado': 'Não iniciado',
  'em-execucao': 'Em execução',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const SITUACOES: Situacao[] = ['nao-iniciado', 'em-execucao', 'concluido', 'cancelado']

/** Uma coluna do board no Jira, com os status que ela agrupa. */
export interface ColunaBoard {
  id: string
  nome: string
  /** O que significa estar nesta coluna (texto de apoio para quem lê o quadro). */
  descricao: string
  situacao: Situacao
  statusIds: string[]
}

interface ItemComum {
  key: string
  nome: string
  /** Nome do status no Jira. */
  status: string
  /** Id da coluna do board em que o item está. */
  coluna: string
  situacao: Situacao
  lab: string | null
  sponsor: string | null
  dominio: string | null
  /** Impacto na meta: EBITDA, Receita ou NPS. */
  impacto: string | null
  /** Benefício potencial em R$. */
  beneficio: number | null
  criadoEm: string | null
  /** Data limite (Experimento) ou o próximo prazo entre os Experimentos abertos (Iniciativa). */
  prazo: string | null
  descricao: string | null
  bloqueado: boolean
}

export interface IniciativaItem extends ItemComum {
  tipo: 'iniciativa'
  /** Keys dos Experimentos (Epics) filhos. */
  experimentos: string[]
}

export interface ExperimentoItem extends ItemComum {
  tipo: 'experimento'
  iniciativaKey: string | null
  bo: string | null
  complexidade: string | null
  segmento: string | null
  portfolio: string | null
  diretoria: string | null
  mercado: string | null
  tecnologia: string | null
  prioridade: string | null
  motivoBloqueio: string | null
  tipoImpedimento: string | null
  custoEstimado: number | null
  custoRealizado: string | null
  concluidoEm: string | null
  beneficioQualitativo: string | null
  ultimoComentario: string | null
  anexos: { nome: string; url: string }[]
}

export type ItemPortfolio = IniciativaItem | ExperimentoItem

export interface BoardInfo {
  id: number
  nome: string
  colunas: ColunaBoard[]
}

export interface PortfolioDados {
  iniciativas: IniciativaItem[]
  experimentos: ExperimentoItem[]
  boards: Record<Entidade, BoardInfo>
  /** URL do Jira para os links "Abrir no Jira" (sem barra no fim). */
  jiraUrl: string | null
  geradoEm: string
}
