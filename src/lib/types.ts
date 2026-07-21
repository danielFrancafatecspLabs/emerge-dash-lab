import type { MetaCategoria } from './portfolio-classifier'
export type { MetaCategoria }

export interface JiraStatus {
  id: string
  name: string
}

export interface JiraIssueFields {
  summary: string
  status: JiraStatus
  issuetype: { name: string }
  parent?: {
    key: string
    fields: { summary: string; issuetype: { name: string } }
  }
  created?: string
  updated?: string
  description?: string                                // Descrição (texto livre)
  // Epics — board 2707
  customfield_11661?: string                          // Domínio (Empresarial / PME / outros)
  customfield_13406?: { value: string }               // Motivo de Bloqueio
  customfield_11662?: string                          // Sponsor
  customfield_11663?: string                          // BO (Business Owner)
  customfield_11664?: string                          // Complexidade
  customfield_11665?: string                          // Time Responsável
  customfield_13242?: number                          // Benefício Quantitativo (R$)
  customfield_13243?: string                          // Benefício Qualitativo
  customfield_16400?: { value: string; id: string }   // Domínio
  customfield_13571?: number                          // Custo Estimado Experimento (R$)
  customfield_11668?: string                          // Custo Realizado Experimento
  customfield_11378?: { value: string }               // Segmento
  customfield_15919?: { value: string }               // Portfólio
  customfield_10904?: string                          // Diretoria
  // Preenchido pelo backend com o último comentário (texto plano)
  lastComment?: string | null
  // Prioridade padrão do Jira
  priority?: { id?: string; name?: string } | null
}

export interface JiraIssue {
  key: string
  fields: JiraIssueFields
}

export interface JiraBoardStatus {
  id: string
  name: string
  description?: string
}

export interface JiraBoardColumn {
  name: string
  statuses: JiraBoardStatus[]
}

export interface JiraBoardConfiguration {
  id: number
  name: string
  type: string
  columnConfig: {
    columns: JiraBoardColumn[]
    constraintType?: string
  }
}

export interface EpicDetail {
  key: string
  nome: string
  status: JiraStatus
  sponsor: string | null
  bo: string | null
  complexidade: string | null
  timeResponsavel: string | null
  beneficioQuantitativo: number | null
  beneficioQualitativo: string | null
  dominio: string | null
  custoEstimado: number | null
  custoRealizado: string | null
  segmento: string | null
  portfolio: string | null
  diretoria: string | null
  metaCategoria: string | null
  tipo: string | null
  mercado: string
  descricao: string | null
  motivoBloqueio: string | null
  statusDetalhado?: string | null
  prioridade?: string | null
  criadoEm?: string | null
}

export interface Iniciativa {
  key: string
  nome: string
  status: JiraStatus
  metaCategoria: MetaCategoria | null
  epics: EpicDetail[]
  beneficioQuantitativo: number | null     // da própria Iniciativa (customfield_13242)
  beneficioQuantitativoTotal: number       // soma dos Epics filhos
  dominios: string[]
  sponsors: string[]
  segmentos: string[]
  timeResponsavel: string | null
  sponsor: string | null
  criadoEm: string | null
}

export interface PipelineCount {
  BACKLOG: number
  'EM REFINAMENTO': number
  'PRONTO PARA EXECUÇÃO': number
  'EM EXPERIMENTAÇÃO': number
  'AGUARDANDO PILOTO': number
  'EM PILOTO': number
  'EM ESCALA': number
  FINALIZADO: number
  CANCELADO: number
}

export interface MercadoAgregado {
  nome: string
  qtdExperimentos: number
  valorPotencial: number
  dominios: { nome: string; count: number; pct: number }[]
  epics: EpicDetail[]
  alertas: {
    bloqueadosIA: number        // têm Motivo de Bloqueio preenchido
    aguardandoDelivery: number  // status PRONTO PARA EXECUÇÃO (10067)
    semSponsor: number          // sem sponsor indicado
  }
}

export interface LeadTimeStats {
  leadtimeTotalDias: number       // média de dias desde criação até hoje (iniciativas ativas)
  leadtimeConcluidasDias: number  // média de dias desde criação até updated (iniciativas FINALIZADO)
  leadtimePorEstagio: Partial<Record<keyof PipelineCount, number>>  // lead time médio até cada estágio
  cycleTimeExperimentacaoDias: number  // média de dias que os Epics ficam em "EM EXPERIMENTAÇÃO"
  blockedTimeDias: number         // média de dias no status atual para Epics com motivoBloqueio preenchido
}

export interface CycleTimeEstagio {
  estagio: string           // nome do estágio (ex.: "BACKLOG", "EM REFINAMENTO")
  label: string             // label curto para exibição
  mediaDias: number         // média de dias que as iniciativas ficam nesse estágio
  medianaDias: number       // mediana de dias
  qtdIniciativas: number    // quantas iniciativas passaram por esse estágio
}

export interface DashboardData {
  iniciativas: Iniciativa[]
  allEpics: EpicDetail[]
  totalEpicsAtivos: number
  beneficioTotal: number
  beneficioMedio: number
  pipeline: PipelineCount
  iniciativasAguardandoPiloto: number
  iniciativasEmPiloto: number
  mercados: MercadoAgregado[]
  mercadosSegmento: MercadoAgregado[]
  top5Epics: EpicDetail[]
  topSponsors: { nome: string; count: number }[]
  statusDistribuicao: { name: string; value: number; color: string }[]
  metasAgregadas: Record<'EBITDA' | 'NPS' | 'Receita', { count: number; valor: number }>
  iniciativasPorMeta: Record<'EBITDA' | 'NPS' | 'Receita', Iniciativa[]>
  leadTime: LeadTimeStats
  cycleTimeIdeacao: CycleTimeEstagio[]
  cycleTimeExperimentacao: CycleTimeEstagio[]
  /** Status IDs da coluna "EM PILOTO" no board 2706 */
  pilotoStatusIds: string[]
  /** Status IDs da coluna "EM ESCALA" no board 2706 */
  escalaStatusIds: string[]
}
