// Tipos para o dashboard estratégico de Monitoramento da Experimentação

export interface KpiEstrategico {
  titulo: string
  valor: string
  subtitulo: string
  variacao?: {
    valor: number   // percentual, ex: 18 = +18%
    direcao: 'up' | 'down' | 'neutral'
  }
  destaque?: boolean  // true = maior destaque visual
}

export interface BurnupDataPoint {
  mes: string       // ex: "jan/26"
  meta: number      // meta acumulada
  realizado: number // realizado acumulado
}

export interface BeneficioPorArea {
  area: string      // ex: "Marketing", "Tecnologia"
  valor: number     // benefício em R$
  pct: number       // percentual do total
}

export interface FunilEtapa {
  etapa: string
  quantidade: number
  taxaConversao: number  // percentual para próxima etapa
}

export interface ConclusaoMensal {
  mes: string
  concluidos: number
  beneficio: number   // benefício gerado no mês
}

export interface MaturidadeEstagio {
  estagio: 'Discovery' | 'MVP' | 'Piloto' | 'Escala'
  quantidade: number
  pct: number
}

export interface InsightExecutivo {
  texto: string
  tipo: 'positivo' | 'neutro' | 'alerta'
}

export interface MonitoramentoData {
  // Linha 1 — KPIs
  beneficioPotencial: number
  beneficiosAnteriores: number   // benefício do período anterior para comparação
  experimentosConcluidos: number
  totalPipeline: number
  pipelineAtivo: number           // iniciativas em andamento
  custoTotal: number              // custo total realizado/estimado
  roi: number | null              // ROI calculado, null se não houver dados

  // Linha 2
  burnup: BurnupDataPoint[]
  metaAnual: number | null        // meta anual de experimentos concluídos
  pctConclusao: number            // percentual de conclusão da meta

  beneficioPorArea: BeneficioPorArea[]

  // Linha 3
  funil: FunilEtapa[]
  conclusoesMensais: ConclusaoMensal[]

  // Linha 4
  maturidade: MaturidadeEstagio[]
  insights: InsightExecutivo[]
}