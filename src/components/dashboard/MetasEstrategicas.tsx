'use client'

import { useState } from 'react'
import { DashboardData } from '@/lib/types'
import { formatBRL, META_LABELS } from '@/lib/mappers'
import { TrendingUp, DollarSign, Heart, List } from 'lucide-react'
import IniciativaModal from './IniciativaModal'

interface Props { data: DashboardData }

export default function MetasEstrategicas({ data }: Props) {
  const [modal, setModal] = useState<string | null>(null)
  const { metasAgregadas } = data

  const hardcodedCounts: Record<'EBITDA' | 'NPS' | 'Receita', number> = {
    EBITDA: 91,
    Receita: 24,
    NPS: 88,
  }

  const hardcodedValues: Record<'EBITDA' | 'NPS' | 'Receita', string> = {
    EBITDA: 'R$ 273M',
    Receita: 'R$ 14M',
    NPS: '—',
  }

  const cards = [
    { icon: TrendingUp, cor: '#CC0000', key: 'EBITDA',  label: META_LABELS['EBITDA'],  stats: metasAgregadas.EBITDA, hardcodedCount: hardcodedCounts.EBITDA, hardcodedValue: hardcodedValues.EBITDA },
    { icon: DollarSign, cor: '#E05000', key: 'Receita', label: META_LABELS['Receita'], stats: metasAgregadas.Receita, hardcodedCount: hardcodedCounts.Receita, hardcodedValue: hardcodedValues.Receita },
    { icon: Heart,      cor: '#C0007B', key: 'NPS',     label: META_LABELS['NPS'],     stats: metasAgregadas.NPS,     hardcodedCount: hardcodedCounts.NPS,     hardcodedValue: hardcodedValues.NPS },
  ]

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Contribuição para as Metas Estratégicas
        </p>
        <div className="grid grid-cols-3 gap-3">
          {cards.map(c => (
            <div key={c.label} className="rounded-lg p-3 border"
              style={{ borderColor: '#f0e0e0', background: '#FFF5F5' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full p-1.5" style={{ background: c.cor }}>
                    <c.icon size={12} color="white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{c.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModal(c.key)}
                  className="rounded p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  title="Ver detalhe"
                >
                  <List size={13} />
                </button>
              </div>
              <p className="text-gray-500 mt-2" style={{ fontSize: 10 }}>Iniciativas</p>
              <p className="font-bold text-gray-900 text-xl">{c.hardcodedCount ?? c.stats.count}</p>
              <p className="text-gray-500 mt-1" style={{ fontSize: 10 }}>Benefício potencial estimado</p>
              <p className="font-semibold" style={{ fontSize: 12, color: c.cor }}>
                {c.hardcodedValue ?? (c.stats.valor > 0 ? formatBRL(c.stats.valor) : '—')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <IniciativaModal
          title={META_LABELS[modal] ?? modal}
          iniciativas={data.iniciativasPorMeta[modal]}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
