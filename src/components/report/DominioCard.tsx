'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { EpicDetail } from '@/lib/types'

interface DominioCardProps {
  nome: string
  total: number
  emAndamento: number
  emPiloto: number
  concluidos: number
  beneficioTotal: number
  topEpics: EpicDetail[]
  allEpics: EpicDetail[]
  accent: string
}

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default function DominioCard({
  nome,
  total,
  emAndamento,
  emPiloto,
  concluidos,
  beneficioTotal,
  topEpics,
  allEpics,
  accent,
}: DominioCardProps) {
  const [expanded, setExpanded] = useState(false)
  const remainingEpics = allEpics.filter(e => !topEpics.some(t => t.key === e.key))

  const stats = [
    { label: 'Total', value: total, color: 'text-gray-800' },
    { label: 'Andamento', value: emAndamento, color: 'text-blue-600' },
    { label: 'Piloto', value: emPiloto, color: 'text-red-600' },
    { label: 'Concluídos', value: concluidos, color: 'text-green-700' },
  ]

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Cabeçalho compacto */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ backgroundColor: `${accent}0D`, borderLeft: `3px solid ${accent}` }}
      >
        <span className="text-xs font-bold text-gray-800">{nome}</span>
        <span className="text-xs text-gray-400">{total} iniciativas</span>
      </div>

      {/* Stats inline + Benefício */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-50">
        {stats.map(s => (
          <div key={s.label} className="text-center flex-1">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
        <div className="text-center flex-1 border-l border-gray-100 pl-3">
          <p className="text-sm font-bold text-gray-800 truncate">{formatCurrency(beneficioTotal)}</p>
          <p className="text-[10px] text-gray-400">Benefício</p>
        </div>
      </div>

      {/* Top experimentos compacto */}
      {topEpics.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-3 py-1 text-left text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase' }}>Experimento</th>
              <th className="px-3 py-1 text-right text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase' }}>Benefício</th>
            </tr>
          </thead>
          <tbody>
            {topEpics.map(epic => (
              <tr key={epic.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-1" style={{ fontSize: 11 }}>
                  <span className="text-gray-800">{epic.nome}</span>
                  <span className="text-gray-400 ml-1" style={{ fontSize: 9 }}>#{epic.key}</span>
                </td>
                <td className="px-3 py-1 text-right font-medium text-gray-800" style={{ fontSize: 11 }}>
                  {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Expand / collapse */}
      {remainingEpics.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-3 py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            {expanded ? (
              <><ChevronUp size={12} /> Recolher</>
            ) : (
              <><ChevronDown size={12} /> Ver todos os {total} experimentos</>
            )}
          </button>

          {expanded && (
            <table className="w-full border-t border-gray-100">
              <tbody>
                {remainingEpics
                  .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
                  .map(epic => (
                    <tr key={epic.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-1" style={{ fontSize: 11 }}>
                        <span className="text-gray-800">{epic.nome}</span>
                        <span className="text-gray-400 ml-1" style={{ fontSize: 9 }}>#{epic.key}</span>
                      </td>
                      <td className="px-3 py-1 text-right font-medium text-gray-800" style={{ fontSize: 11 }}>
                        {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}