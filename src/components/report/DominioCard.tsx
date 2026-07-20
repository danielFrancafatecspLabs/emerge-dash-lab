'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, FlaskConical, Rocket, CheckCircle2 } from 'lucide-react'
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

  const pctAndamento = total > 0 ? (emAndamento / total) * 100 : 0
  const pctPiloto = total > 0 ? (emPiloto / total) * 100 : 0
  const pctConcluidos = total > 0 ? (concluidos / total) * 100 : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Cabeçalho */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${accent}0F 0%, ${accent}08 100%)`, borderBottom: `1px solid ${accent}20` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: accent }}
          >
            {nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{nome}</p>
            <p className="text-[10px] text-gray-400">{total} iniciativas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{formatCurrency(beneficioTotal)}</p>
          <p className="text-[10px] text-gray-400">benefício potencial</p>
        </div>
      </div>

      {/* Barra de progresso segmentada */}
      <div className="px-4 pt-3 pb-1">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
          {emAndamento > 0 && (
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${Math.max(pctAndamento, 2)}%`, backgroundColor: '#3B82F6' }}
              title={`Em andamento: ${emAndamento}`}
            />
          )}
          {emPiloto > 0 && (
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${Math.max(pctPiloto, 2)}%`, backgroundColor: '#EF4444' }}
              title={`Em piloto: ${emPiloto}`}
            />
          )}
          {concluidos > 0 && (
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${Math.max(pctConcluidos, 2)}%`, backgroundColor: '#22C55E' }}
              title={`Concluídos: ${concluidos}`}
            />
          )}
        </div>
      </div>

      {/* Legendas inline */}
      <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-medium text-gray-700">{emAndamento}</span>
          <span>Andamento</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-medium text-gray-700">{emPiloto}</span>
          <span>Piloto</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium text-gray-700">{concluidos}</span>
          <span>Concluídos</span>
        </div>
      </div>

      {/* Top experimentos */}
      {topEpics.length > 0 && (
        <div className="border-t border-gray-100">
          {topEpics.map((epic, idx) => (
            <div
              key={epic.key}
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
              style={{ borderBottom: idx < topEpics.length - 1 ? '1px solid #F3F4F6' : 'none' }}
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs font-medium text-gray-800 truncate">{epic.nome}</p>
                <p className="text-[10px] text-gray-400">#{epic.key}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {epic.status?.name === 'Em andamento' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-600">Ativo</span>
                )}
                {(epic.status?.name ?? '').toUpperCase().includes('PILOTO') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-50 text-red-600">Piloto</span>
                )}
                {epic.status?.name === 'Concluído' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-50 text-green-600">Concluído</span>
                )}
                <span className="text-xs font-semibold text-gray-700 min-w-[80px] text-right">
                  {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand / collapse */}
      {remainingEpics.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            {expanded ? (
              <><ChevronUp size={12} /> Recolher</>
            ) : (
              <><ChevronDown size={12} /> Ver mais {remainingEpics.length} experimentos</>
            )}
          </button>

          {expanded && (
            <div className="border-t border-gray-100">
              {remainingEpics
                .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
                .map((epic, idx) => (
                  <div
                    key={epic.key}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: idx < remainingEpics.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-xs font-medium text-gray-800 truncate">{epic.nome}</p>
                      <p className="text-[10px] text-gray-400">#{epic.key}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-right">
                      {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}