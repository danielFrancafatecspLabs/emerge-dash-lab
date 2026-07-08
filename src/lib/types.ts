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
}

export interface JiraIssue {
  key: string
  fields: JiraIssueFields
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
}

export interface Iniciativa {
  key: string
  nome: string
  status: JiraStatus
  epics: EpicDetail[]
  beneficioQuantitativo: number | null     // da própria Iniciativa (customfield_13242)
  beneficioQuantitativoTotal: number       // soma dos Epics filhos
  dominios: string[]
  sponsors: string[]
  segmentos: string[]
  timeResponsavel: string | null
  sponsor: string | null
}

export interface PipelineCount {
  BACKLOG: number
  'EM REFINAMENTO': number
  'PRONTO PARA EXECUÇÃO': number
  'EM EXPERIMENTAÇÃO': number
  'AGUARDANDO PILOTO': number
  'EM PILOTO': number
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
}
