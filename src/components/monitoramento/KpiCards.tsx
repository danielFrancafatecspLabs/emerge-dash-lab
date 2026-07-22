'use client'

import { useMemo } from 'react'
import { TrendingUp, CheckCircle, Activity } from 'lucide-react'
import type { MonitoramentoData } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'

interface Props {
  data: MonitoramentoData
}

export default function KpiCards({ data }: Props) {
  const cards = useMemo(() => {
    const b = data.beneficioPotencial
    const concluidos = data.experimentosConcluidos
    const taxa = data.taxaConversao
    const ativos = data.pipelineAtivo

    return [
      {
        label: 'Benefício Potencial',
        valor: formatBRL(b),
        sub: 'Benefício financeiro estimado',
        variacao: null,
        icon: TrendingUp,
        destaque: true,
        color: '#DC2626',
        bg: '#FEF2F2',
        ring: 'ring-red-200',
      },
      {
        label: 'Experimentos Concluídos',
        valor: String(concluidos),
        sub: `${taxa}% do pipeline`,
        variacao: null,
        icon: CheckCircle,
        destaque: false,
        color: '#DC2626',
        bg: '#FFF5F5',
        ring: '',
      },
      {
        label: 'Pipeline Ativo',
        valor: String(ativos),
        sub: 'Iniciativas em andamento',
        variacao: null,
        icon: Activity,
        destaque: false,
        color: '#DC2626',
        bg: '#FFF5F5',
        ring: '',
      },
    ]
  }, [data])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`
            rounded-xl p-5 border transition-all duration-300 hover:shadow-lg
            ${card.destaque ? `ring-2 ${card.ring} shadow-md` : 'border-gray-100 shadow-sm'}
          `}
          style={{ background: card.destaque ? card.bg : '#fff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {card.label}
            </span>
            <div className="p-1.5 rounded-lg" style={{ background: card.bg }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
          </div>
          <p
            className="font-extrabold tracking-tight mb-1"
            style={{ fontSize: card.destaque ? 34 : 28, color: '#111827' }}
          >
            {card.valor}
          </p>
          <p className="text-xs text-gray-400">{card.sub}</p>
          {card.variacao && (
            <p className="text-xs mt-1.5 font-medium text-red-600">{card.variacao}</p>
          )}
        </div>
      ))}
    </div>
  )
}