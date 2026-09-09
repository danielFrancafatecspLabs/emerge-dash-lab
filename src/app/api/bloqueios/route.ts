import { NextResponse } from 'next/server'
export interface BloqueioItem {
  key: string
  nome: string
  categoria: string
  status: string
  bo: string
  sponsor: string
}

export interface BloqueioCategoria {
  id: string
  titulo: string
  descricao: string
  cor: string
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

const BLOQUEIOS_DATA: BloqueiosResponse = {
  categorias: [
    {
      id: 'engajamento',
      titulo: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO',
      descricao: 'Iniciativas sem apoio ativo da área demandante.',
      cor: '#7A1212',
      items: [
        { key: 'GL-001', nome: 'Assistente IA Vendas', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Em andamento', bo: 'Comercial', sponsor: 'Diretoria Comercial' },
        { key: 'GL-002', nome: 'Automação SAC', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Em validação', bo: 'Atendimento', sponsor: 'Diretoria de Operações' },
        { key: 'GL-003', nome: 'Recomendação de Produtos', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO', status: 'Backlog', bo: 'Marketing', sponsor: 'Diretoria de Marketing' },
      ],
      footer: 'Impacta: alinhamento com áreas de negócio e priorização executiva.',
    },
    {
      id: 'dados',
      titulo: 'AMOSTRA DE DADOS PENDENTE',
      descricao: 'Casos aguardando base mínima para validação.',
      cor: '#A53A3A',
      items: [
        { key: 'GL-004', nome: 'Segmentação de Clientes', categoria: 'AMOSTRA DE DADOS PENDENTE', status: 'Em andamento', bo: 'CRM', sponsor: 'Diretoria de Dados' },
        { key: 'GL-005', nome: 'Análise de Churn', categoria: 'AMOSTRA DE DADOS PENDENTE', status: 'Em validação', bo: 'Analytics', sponsor: 'Diretoria de Dados' },
      ],
      footer: 'Impacta: disponibilidade e qualidade da amostra.',
    },
    {
      id: 'beneficio',
      titulo: 'BENEFÍCIO POTENCIAL NÃO MAPEADO',
      descricao: 'Iniciativas sem benefício quantitativo estimado.',
      cor: '#B91C1C',
      items: [
        { key: 'GL-006', nome: 'IA para BD', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em andamento', bo: 'Dados', sponsor: 'Diretoria de Inovação' },
        { key: 'GL-007', nome: 'Lead AI Hunter', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em validação', bo: 'Growth', sponsor: 'Diretoria Comercial' },
        { key: 'GL-008', nome: 'IA Revisão Proativa', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Backlog', bo: 'Risco', sponsor: 'Diretoria de Risco' },
        { key: 'GL-009', nome: 'Troubleshooting RQUAL', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO', status: 'Em andamento', bo: 'Qualidade', sponsor: 'Diretoria de Operações' },
      ],
      footer: 'Impacta: business case e justificativa financeira.',
    },
    {
      id: 'adversas',
      titulo: 'OUTRAS QUESTÕES ADVERSAS',
      descricao: 'Bloqueios diversos de execução.',
      cor: '#C2410C',
      items: [
        { key: 'GL-010', nome: 'GIA Inventário Automático', categoria: 'OUTRAS QUESTÕES ADVERSAS', status: 'Em andamento', bo: 'Operações', sponsor: 'Diretoria de Operações' },
        { key: 'GL-011', nome: 'Controle do Voluntariado', categoria: 'OUTRAS QUESTÕES ADVERSAS', status: 'Em validação', bo: 'RH', sponsor: 'Diretoria de Pessoas' },
      ],
      footer: 'Impacta: dependências operacionais e governança.',
    },
    {
      id: 'ambiente',
      titulo: 'AGUARDANDO AMBIENTE',
      descricao: 'Casos dependentes de infraestrutura ou acesso.',
      cor: '#7C2D12',
      items: [
        { key: 'GL-012', nome: 'Métricas da Rede Crowdsourcing', categoria: 'AGUARDANDO AMBIENTE', status: 'Backlog', bo: 'Plataforma', sponsor: 'Diretoria de Tecnologia' },
      ],
      footer: 'Impacta: disponibilidade de ambiente e integrações.',
    },
  ],
  metricas: {
    totalProblemas: 5,
    totalImpactadas: 12,
    semBeneficio: 4,
    aguardandoAmbiente: 1,
  },
}
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(BLOQUEIOS_DATA)
}