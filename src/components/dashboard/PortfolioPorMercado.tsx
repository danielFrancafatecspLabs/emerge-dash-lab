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
            const maxDom = m.dominios[0]?.count ?? 1
            return (
              <div
                key={m.nome}
                className="rounded-lg p-3 border flex flex-col gap-2 overflow-hidden"
                style={{ borderColor: '#f0e0e0', background: '#FFF8F8' }}
              >
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
                <div className="grid grid-cols-2 gap-x-2 text-xs">
                  <div>
                    <p className="text-gray-500" style={{ fontSize: 9 }}>Experimentos</p>
                    <p className="font-bold text-gray-800">{m.qtdExperimentos}</p>
                  </div>
                  <div>
                    <p className="text-gray-500" style={{ fontSize: 9 }}>Benefício potencial estimado</p>
                    <p className="font-bold text-gray-800">{formatBRL(m.valorPotencial)}</p>
                  </div>
                </div>
                {m.dominios.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-1" style={{ fontSize: 9 }}>Principais Domínios</p>
                    {m.dominios.slice(0, 3).map(d => (
                      <div key={d.nome} className="mb-1">
                        <div className="flex justify-between" style={{ fontSize: 9 }}>
                          <span className="text-gray-700 truncate" style={{ maxWidth: '70%' }}>• {d.nome}</span>
                          <span className="text-gray-500">({d.count})</span>
                        </div>
                        <div className="h-1 rounded-full bg-gray-200 mt-0.5">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${(d.count / maxDom) * 100}%`, background: '#CC0000' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
