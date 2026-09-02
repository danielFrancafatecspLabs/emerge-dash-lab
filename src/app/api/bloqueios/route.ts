import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface BloqueioItem {
  key: string
  nome: string
  categoria: string
}

export interface BloqueioCategoria {
  titulo: string
  count: number
  accent: string
  bg: string
  border: string
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

const CATEGORIA_CONFIG: Record<string, { accent: string; bg: string; border: string }> = {
  'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO': { accent: '#E86A6A', bg: '#FDF1F1', border: '#E9C4C4' },
  'AMOSTRA DE DADOS PENDENTE':               { accent: '#D4A649', bg: '#FFF8EA', border: '#E9D7A7' },
  'BENEFÍCIO POTENCIAL NÃO MAPEADO':         { accent: '#F97316', bg: '#FFF4EC', border: '#F7C7A6' },
  'OUTRAS QUESTÕES ADVERSAS':                { accent: '#7C3AED', bg: '#F4F1FF', border: '#D8C8FA' },
  'AGUARDANDO AMBIENTE':                     { accent: '#2F80ED', bg: '#EEF6FF', border: '#B7D8FF' },
}

const FOOTER_POR_CATEGORIA: Record<string, string> = {
  'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO': 'Impacta: atrasos em validações e aprovações necessárias para evolução das iniciativas.',
  'AMOSTRA DE DADOS PENDENTE': 'Impacta: impossibilidade de testes e validações por ausência de dados confiáveis.',
  'BENEFÍCIO POTENCIAL NÃO MAPEADO': 'Impacta: dificuldade em medir valor e priorizar investimento em experimentação.',
  'OUTRAS QUESTÕES ADVERSAS': 'Impacta: despriorizações, ajustes de escopo e riscos de execução.',
  'AGUARDANDO AMBIENTE': 'Impacta: dependência de ambiente para início do ciclo e continuidade dos testes.',
}

const DADOS_HARDCODED: BloqueiosResponse = {
  categorias: [
    {
      titulo: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO',
      count: 3,
      ...CATEGORIA_CONFIG['FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO'],
      items: [
        { key: 'GL-001', nome: 'Assistente IA Vendas', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO' },
        { key: 'GL-002', nome: 'Automação SAC', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO' },
        { key: 'GL-003', nome: 'Recomendação de Produtos', categoria: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO' },
      ],
      footer: FOOTER_POR_CATEGORIA['FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO'],
    },
    {
      titulo: 'AMOSTRA DE DADOS PENDENTE',
      count: 2,
      ...CATEGORIA_CONFIG['AMOSTRA DE DADOS PENDENTE'],
      items: [
        { key: 'GL-004', nome: 'Segmentação de Clientes', categoria: 'AMOSTRA DE DADOS PENDENTE' },
        { key: 'GL-005', nome: 'Análise de Churn', categoria: 'AMOSTRA DE DADOS PENDENTE' },
      ],
      footer: FOOTER_POR_CATEGORIA['AMOSTRA DE DADOS PENDENTE'],
    },
    {
      titulo: 'BENEFÍCIO POTENCIAL NÃO MAPEADO',
      count: 4,
      ...CATEGORIA_CONFIG['BENEFÍCIO POTENCIAL NÃO MAPEADO'],
      items: [
        { key: 'GL-006', nome: 'IA para BD', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO' },
        { key: 'GL-007', nome: 'Lead AI Hunter', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO' },
        { key: 'GL-008', nome: 'IA Revisão Proativa', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO' },
        { key: 'GL-009', nome: 'Troubleshooting RQUAL', categoria: 'BENEFÍCIO POTENCIAL NÃO MAPEADO' },
      ],
      footer: FOOTER_POR_CATEGORIA['BENEFÍCIO POTENCIAL NÃO MAPEADO'],
    },
    {
      titulo: 'OUTRAS QUESTÕES ADVERSAS',
      count: 2,
      ...CATEGORIA_CONFIG['OUTRAS QUESTÕES ADVERSAS'],
      items: [
        { key: 'GL-010', nome: 'GIA Inventário Automático', categoria: 'OUTRAS QUESTÕES ADVERSAS' },
        { key: 'GL-011', nome: 'Controle do Voluntariado', categoria: 'OUTRAS QUESTÕES ADVERSAS' },
      ],
      footer: FOOTER_POR_CATEGORIA['OUTRAS QUESTÕES ADVERSAS'],
    },
    {
      titulo: 'AGUARDANDO AMBIENTE',
      count: 1,
      ...CATEGORIA_CONFIG['AGUARDANDO AMBIENTE'],
      items: [
        { key: 'GL-012', nome: 'Métricas da Rede Crowdsourcing', categoria: 'AGUARDANDO AMBIENTE' },
      ],
      footer: FOOTER_POR_CATEGORIA['AGUARDANDO AMBIENTE'],
    },
  ],
  metricas: {
    totalProblemas: 5,
    totalImpactadas: 12,
    semBeneficio: 4,
    aguardandoAmbiente: 1,
  },
}

export async function GET() {
  return NextResponse.json(DADOS_HARDCODED)
}

// Export para consumo interno do servidor (fonte de verdade dos "quadrantes" de bloqueio)
export const BLOQUEIOS_DATA = DADOS_HARDCODED