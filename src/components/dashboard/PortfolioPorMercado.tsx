'use client'

import { useState } from 'react'
import { DashboardData, MercadoAgregado } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import { List } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

const SEGMENTO_ICONS: Record<string, string> = {
  'Consumo':     '👤',
  'Corporativo': '🏛️',
  'PME/GE/GOV':  '🏢',
}

export default function PortfolioPorMercado({ data }: Props) {
  const [selected, setSelected] = useState<MercadoAgregado | null>(null)
  const top3 = data.mercadosSegmento

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Portfólio
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map(m => {
            const icon = SEGMENTO_ICONS[m.nome] ?? '📦'
            return (
              <div
                key={m.nome}
                className="rounded-lg p-3 border flex flex-col gap-2.5 overflow-hidden"
                style={{ borderColor: '#f0e0e0', background: '#FFF8F8' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <p className="font-bold text-xs uppercase tracking-wide" style={{ color: '#CC0000' }}>
                      {m.nome}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(m)}
                    className="rounded p-1 hover:bg-red-100 transition-colors"
                    style={{ color: '#CC0000' }}
                    title="Ver detalhe"
                  >
                    <List size={13} />
                  </button>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-x-2 text-xs">
                  <div>
                    <p className="text-gray-500" style={{ fontSize: 9 }}>Experimentos</p>
                    <p className="font-bold text-gray-800">{m.qtdExperimentos}</p>
                  </div>
                  <div>
                    <p className="text-gray-500" style={{ fontSize: 9 }}>Benefício potencial</p>
                    <p className="font-bold text-gray-800">{formatBRL(m.valorPotencial)}</p>
                  </div>
                </div>

                {/* Principais Domínios */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-gray-400 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>
                    Principais Domínios
                  </p>
                  {m.dominios.length > 0 ? m.dominios.map(d => (
                    <div key={d.nome}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-gray-600 truncate" style={{ fontSize: 9 }}>{d.nome}</span>
                        <span className="font-bold text-gray-700 ml-1 tabular-nums" style={{ fontSize: 10 }}>{d.count}</span>
                      </div>
                      <div className="h-1 bg-gray-200 rounded-full">
                        <div className="h-1 rounded-full" style={{ width: `${d.pct}%`, background: '#CC0000' }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-400" style={{ fontSize: 9 }}>—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <EpicModal
          title={`${SEGMENTO_ICONS[selected.nome] ?? ''} ${selected.nome}`}
          epics={selected.epics}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
