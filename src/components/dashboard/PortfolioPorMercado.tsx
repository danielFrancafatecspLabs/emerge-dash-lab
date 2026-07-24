'use client'

import { formatBRL } from '@/lib/mappers'
import type { MercadoAgregado } from '@/lib/types'

const SEGMENTO_ICONS: Record<string, string> = {
  'Consumo':     '👤',
  'Corporativo': '🏛️',
  'PME/GE/GOV':  '🏢',
}

interface Props {
  data: MercadoAgregado[]
}

const HARDCODED_MARKETS: MercadoAgregado[] = [
  {
    nome: 'Consumo',
    qtdExperimentos: 63,
    valorPotencial: 69_000_000,
    dominios: [
      { nome: 'Digital', count: 7, pct: 78 },
      { nome: 'TI', count: 2, pct: 22 },
    ],
    epics: [],
    alertas: { bloqueadosIA: 0, aguardandoDelivery: 0, semSponsor: 0 },
  },
  {
    nome: 'Corporativo',
    qtdExperimentos: 131,
    valorPotencial: 307_000_000,
    dominios: [
      { nome: 'Financeiro / ADM', count: 13, pct: 68 },
      { nome: 'Jurídico', count: 6, pct: 32 },
    ],
    epics: [],
    alertas: { bloqueadosIA: 0, aguardandoDelivery: 0, semSponsor: 0 },
  },
  {
    nome: 'PME/GE/GOV',
    qtdExperimentos: 9,
    valorPotencial: 2_000_000,
    dominios: [
      { nome: 'Atendimento', count: 1, pct: 50 },
      { nome: 'Vendas', count: 1, pct: 50 },
    ],
    epics: [],
    alertas: { bloqueadosIA: 0, aguardandoDelivery: 0, semSponsor: 0 },
  },
]

export default function PortfolioPorMercado({ data }: Props) {
  const items: MercadoAgregado[] = (Array.isArray(data) && data.length > 0) ? data : HARDCODED_MARKETS

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Portfólio
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map(m => {
          const icon = SEGMENTO_ICONS[m.nome] ?? '📦'
          return (
            <div
              key={m.nome}
              className="rounded-lg p-3 border flex flex-col gap-2.5 overflow-hidden"
              style={{ borderColor: '#f0e0e0', background: '#FFF8F8' }}
            >
              <div className="flex items-center">
                <span style={{ fontSize: 14 }}>{icon}</span>
                <p className="font-bold text-xs uppercase tracking-wide ml-2" style={{ color: '#CC0000' }}>
                  {m.nome}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-2 text-xs">
                <div>
                  <p className="text-gray-500" style={{ fontSize: 10 }}>Experimentos</p>
                  <p className="font-bold text-gray-800">{m.qtdExperimentos}</p>
                </div>
                <div>
                  <p className="text-gray-500" style={{ fontSize: 10 }}>Benefício potencial</p>
                  <p className="font-bold text-gray-800">{formatBRL(m.valorPotencial)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-gray-400 uppercase font-semibold tracking-widest" style={{ fontSize: 10 }}>
                  Principais Domínios
                </p>
                {m.dominios.length > 0 ? m.dominios.map(d => (
                  <div key={d.nome}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-gray-600 truncate" style={{ fontSize: 10 }}>{d.nome}</span>
                      <span className="font-bold text-gray-700 ml-1 tabular-nums" style={{ fontSize: 10 }}>{d.count}</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full">
                      <div className="h-1 rounded-full" style={{ width: `${d.pct}%`, background: '#CC0000' }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400" style={{ fontSize: 10 }}>—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
