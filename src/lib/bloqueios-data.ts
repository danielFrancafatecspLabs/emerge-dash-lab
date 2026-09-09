export interface BloqueioItem {
  key: string
  nome: string
  categoria: string
  status: string
  bo: string
  sponsor: string
  motivo?: string
  outrosProblemas?: string[]
}

export interface BloqueioCategoria {
  id: string
  titulo: string
  descricao: string
  cor: string
  accent: string
  bg: string
  border: string
  count: number
  items: BloqueioItem[]
  footer: string
}

export interface BloqueiosResponse {
  categorias: BloqueioCategoria[]
  metricas: {
    totalProblemas: number
    totalImpactadas: number
    semBeneficio: number
    aguardandoAmbiente: number
  }
}

export const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'Em andamento': { bg: '#FEF2F2', text: '#7A1212', border: '#FECACA' },
  'Em validação': { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  Backlog: { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
}

export const RESUMO_INDICADORES = [
  {
    titulo: 'Problemas principais',
    quantidade: 5,
    descricao: 'Categorias de bloqueio identificadas no portfólio.',
  },
  {
    titulo: 'Iniciativas impactadas',
    quantidade: 12,
    descricao: 'Iniciativas com pelo menos um bloqueio associado.',
  },
  {
    titulo: 'Sem benefício identificado',
    quantidade: 4,
    descricao: 'Casos sem benefício quantitativo mapeado.',
  },
  {
    titulo: 'Aguardando ambiente',
    quantidade: 1,
    descricao: 'Iniciativas dependentes de infraestrutura.',
  },
  {
    titulo: 'Em validação',
    quantidade: 4,
    descricao: 'Itens em fase de validação com as áreas.',
  },
] as const

const CATEGORIA_BASE = {
  'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO': {
    id: 'engajamento',
    descricao: 'Iniciativas sem apoio ativo da área demandante.',
    cor: '#7A1212',
    accent: '#7A1212',
    bg: '#FFF7F7',
    border: '#F3D6D6',
    footer: 'Impacta: alinhamento com áreas de negócio e priorização executiva.',
  },
  'AMOSTRA DE DADOS PENDENTE': {
    id: 'dados',
    descricao: 'Casos aguardando base mínima para validação.',
    cor: '#A53A3A',
    accent: '#A53A3A',
    bg: '#FFF9F7',
    border: '#F5DDD6',
    footer: 'Impacta: disponibilidade e qualidade da amostra.',
  },
  'BENEFÍCIO POTENCIAL NÃO MAPEADO': {
    id: 'beneficio',
    descricao: 'Iniciativas sem benefício quantitativo estimado.',
    cor: '#B91C1C',
    accent: '#B91C1C',
    bg: '#FFF5F5',
    border: '#F4C7C7',
    footer: 'Impacta: business case e justificativa financeira.',
  },
  'OUTRAS QUESTÕES ADVERSAS': {
    id: 'adversas',
    descricao: 'Bloqueios diversos de execução.',
    cor: '#C2410C',
    accent: '#C2410C',
    bg: '#FFF8F3',
    border: '#F6DDCC',
    footer: 'Impacta: dependências operacionais e governança.',
  },
  'AGUARDANDO AMBIENTE': {
    id: 'ambiente',
    descricao: 'Casos dependentes de infraestrutura ou acesso.',
    cor: '#7C2D12',
    accent: '#7C2D12',
    bg: '#FFF8F1',
    border: '#F4D8C2',
    footer: 'Impacta: disponibilidade de ambiente e integrações.',
  },
} as const

export const BLOQUEIOS_DATA: BloqueiosResponse = {
  categorias: [
    {
      ...CATEGORIA_BASE['FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO'],
      titulo: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO',
      count: 3,
      items: [
        { key: 'GL-001', nome: 'Assistente IA Vendas', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Em andamento', bo: 'Comercial', sponsor: 'Diretoria Comercial' },
        { key: 'GL-002', nome: 'Automação SAC', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Em validação', bo: 'Atendimento', sponsor: 'Diretoria de Operações' },
        { key: 'GL-003', nome: 'Recomendação de Produtos', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Backlog', bo: 'Marketing', sponsor: 'Diretoria de Marketing' },
      ],
    },
    {
      ...CATEGORIA_BASE['AMOSTRA DE DADOS PENDENTE'],
      titulo: 'AMOSTRA DE DADOS PENDENTE',
      count: 2,
      items: [
        { key: 'GL-004', nome: 'Segmentação de Clientes', categoria: 'AMOSTRA DE DADOS PENDENTE', status: 'Em andamento', bo: 'CRM', sponsor: 'Diretoria de Dados' },
        { key: 'GL-005', nome: 'Análise de Churn', categoria: 'AMOSTRA DE DADOS PENDENTE', status: 'Em validação', bo: 'Analytics', sponsor: 'Diretoria de Dados' },
      ],
    },
    {
      ...CATEGORIA_BASE['BENEFÍCIO POTENCIAL NÃO MAPEADO'],
      titulo: 'BENEFÍCIO POTENCIAL NÃO MAPEADO',
      count: 4,
      items: [
        { key: 'GL-006', nome: 'IA para BD', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em andamento', bo: 'Dados', sponsor: 'Diretoria de Inovação' },
        { key: 'GL-007', nome: 'Lead AI Hunter', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em validação', bo: 'Growth', sponsor: 'Diretoria Comercial' },
        { key: 'GL-008', nome: 'IA Revisão Proativa', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Backlog', bo: 'Risco', sponsor: 'Diretoria de Risco' },
        { key: 'GL-009', nome: 'Troubleshooting RQUAL', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em andamento', bo: 'Qualidade', sponsor: 'Diretoria de Operações' },
      ],
    },
    {
      ...CATEGORIA_BASE['OUTRAS QUESTÕES ADVERSAS'],
      titulo: 'OUTRAS QUESTÕES ADVERSAS',
      count: 2,
      items: [
        { key: 'GL-010', nome: 'GIA Inventário Automático', categoria: 'OUTRAS QUESTÕES ADVERSAS', status: 'Em andamento', bo: 'Operações', sponsor: 'Diretoria de Operações' },
        { key: 'GL-011', nome: 'Controle do Voluntariado', categoria: 'OUTRAS QUESTÕES ADVERSAS', status: 'Em validação', bo: 'RH', sponsor: 'Diretoria de Pessoas' },
      ],
    },
    {
      ...CATEGORIA_BASE['AGUARDANDO AMBIENTE'],
      titulo: 'AGUARDANDO AMBIENTE',
      count: 1,
      items: [
        { key: 'GL-012', nome: 'Métricas da Rede Crowdsourcing', categoria: 'AGUARDANDO AMBIENTE', status: 'Backlog', bo: 'Plataforma', sponsor: 'Diretoria de Tecnologia' },
      ],
    },
  ],
  metricas: {
    totalProblemas: 5,
    totalImpactadas: 12,
    semBeneficio: 4,
    aguardandoAmbiente: 1,
  },
}

export const CATEGORIAS = BLOQUEIOS_DATA.categorias