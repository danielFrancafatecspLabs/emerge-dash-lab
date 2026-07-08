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

const ALERTAS_CONFIG = [
  {
    key: 'bloqueadosIA' as const,
    label: 'Bloqueados em IA',
    icon: '🚧',
    dotColor: '#EF4444',
    bg: '#FEF2F2',
    text: '#991B1B',
  },
  {
    key: 'aguardandoDelivery' as const,
    label: 'Ag. Delivery',
    icon: '⏳',
    dotColor: '#F59E0B',
    bg: '#FFFBEB',
    text: '#92400E',
  },
  {
    key: 'semSponsor' as const,
    label: 'Sem Sponsor',
    icon: '👤',
    dotColor: '#9CA3AF',
    bg: '#F9FAFB',
    text: '#4B5563',
  },
]

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

                {/* Alertas */}
                <div className="flex flex-col gap-1">
                  {ALERTAS_CONFIG.map(cfg => {
                    const count = m.alertas[cfg.key]
                    return (
                      <div
                        key={cfg.key}
                        className="flex items-center justify-between rounded px-2 py-1"
                        style={{ background: count > 0 ? cfg.bg : '#F9FAFB' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded-full flex-shrink-0"
                            style={{
                              width: 6, height: 6,
                              background: count > 0 ? cfg.dotColor : '#D1D5DB',
                              display: 'inline-block',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              color: count > 0 ? cfg.text : '#9CA3AF',
                              fontWeight: count > 0 ? 600 : 400,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <span
                          className="font-bold tabular-nums"
                          style={{
                            fontSize: 11,
                            color: count > 0 ? cfg.dotColor : '#D1D5DB',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    )
                  })}
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
