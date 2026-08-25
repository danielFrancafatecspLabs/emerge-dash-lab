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
  const ordenados = [...items].sort((a, b) => b.valorPotencial - a.valorPotencial)
  const maxValor = Math.max(...ordenados.map(m => m.valorPotencial), 1)

  return (
    <div className="flex flex-col gap-1.5">
      {ordenados.map((m, i) => {
        const icon = SEGMENTO_ICONS[m.nome] ?? '📦'
        const barPct = Math.round((m.valorPotencial / maxValor) * 100)
        return (
          <div
            key={m.nome}
            className="rounded-lg p-2 border flex flex-col gap-1 overflow-hidden"
            style={{ borderColor: '#f0e0e0', background: '#FFF8F8' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                  style={{ width: 16, height: 16, fontSize: 9, background: '#CC0000' }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <p className="font-bold text-xs uppercase tracking-wide truncate" style={{ color: '#CC0000' }}>
                  {m.nome}
                </p>
              </div>
              <p className="font-bold text-gray-800 flex-shrink-0" style={{ fontSize: 12 }}>{formatBRL(m.valorPotencial)}</p>
            </div>

            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500" style={{ fontSize: 10 }}>
                <strong className="text-gray-700">{m.qtdExperimentos}</strong> experimentos
              </span>
              <span className="text-gray-400 truncate max-w-[55%] text-right" style={{ fontSize: 10 }}>
                {m.dominios.slice(0, 2).map(d => d.nome).join(' · ') || '—'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
