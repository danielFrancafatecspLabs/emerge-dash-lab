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

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Cabeçalho do domínio */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ backgroundColor: `${accent}08`, borderLeft: `3px solid ${accent}` }}
      >
        <span className="text-sm font-bold text-gray-800">{nome}</span>
        <span className="text-xs text-gray-400">· {total} iniciativas</span>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{emAndamento}</p>
          <p className="text-xs text-gray-400">Em Andamento</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{emPiloto}</p>
          <p className="text-xs text-gray-400">Em Piloto</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-700">{concluidos}</p>
          <p className="text-xs text-gray-400">Concluídos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">{formatCurrency(beneficioTotal)}</p>
          <p className="text-xs text-gray-400">Benefício Total</p>
        </div>
      </div>

      {/* Top 3 experimentos por benefício */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="px-4 py-1.5 text-left text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experimento</th>
            <th className="px-4 py-1.5 text-left text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sponsor</th>
            <th className="px-4 py-1.5 text-left text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>BO</th>
            <th className="px-4 py-1.5 text-right text-gray-400 font-medium" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benefício</th>
          </tr>
        </thead>
        <tbody>
          {topEpics.map(epic => (
            <tr key={epic.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-1.5" style={{ fontSize: 11 }}>
                <span className="text-gray-800">{epic.nome}</span>
                <span className="text-gray-400 ml-1" style={{ fontSize: 9 }}>#{epic.key}</span>
              </td>
              <td className="px-4 py-1.5 text-gray-600" style={{ fontSize: 11 }}>
                {epic.sponsor || '—'}
              </td>
              <td className="px-4 py-1.5 text-gray-600" style={{ fontSize: 11 }}>
                {epic.bo || '—'}
              </td>
              <td className="px-4 py-1.5 text-right font-medium text-gray-800" style={{ fontSize: 11 }}>
                {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
              </td>
            </tr>
          ))}
          {topEpics.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-3 text-center text-gray-400 text-xs">
                Nenhum experimento com benefício registrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Expand / collapse all */}
      {remainingEpics.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            {expanded ? (
              <><ChevronUp size={14} /> Recolher</>
            ) : (
              <><ChevronDown size={14} /> Ver todos os {total} experimentos</>
            )}
          </button>

          {expanded && (
            <table className="w-full border-t border-gray-100">
              <tbody>
                {remainingEpics
                  .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
                  .map(epic => (
                    <tr key={epic.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1.5" style={{ fontSize: 11 }}>
                        <span className="text-gray-800">{epic.nome}</span>
                        <span className="text-gray-400 ml-1" style={{ fontSize: 9 }}>#{epic.key}</span>
                      </td>
                      <td className="px-4 py-1.5 text-gray-600" style={{ fontSize: 11 }}>
                        {epic.sponsor || '—'}
                      </td>
                      <td className="px-4 py-1.5 text-gray-600" style={{ fontSize: 11 }}>
                        {epic.bo || '—'}
                      </td>
                      <td className="px-4 py-1.5 text-right font-medium text-gray-800" style={{ fontSize: 11 }}>
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