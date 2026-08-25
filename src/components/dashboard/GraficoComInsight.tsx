'use client'

import { ReactNode } from 'react'
import { Lightbulb, AlertTriangle, Info, Sparkles } from 'lucide-react'
import type { InsightExecutivo } from '@/lib/types'

interface Props {
  titulo: string
  subtitulo?: string
  children: ReactNode
  insight?: InsightExecutivo | null
  loading?: boolean
  step?: number
}

const iconMap: Record<string, ReactNode> = {
  positivo: <Lightbulb size={13} className="text-emerald-500 shrink-0 mt-0.5" />,
  neutro: <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />,
  alerta: <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />,
}

/**
 * Wrapper que adiciona header + insight LLM abaixo de qualquer gráfico/card.
 */
export default function GraficoComInsight({ titulo, subtitulo, children, insight, loading, step }: Props) {
  return (
    <div className="flex flex-col min-w-0 h-full">
      {/* Card wrapper */}
      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden h-full transition-shadow hover:shadow-md">
        {/* Header do card */}
        <div className="px-3 md:px-4 pt-2.5 pb-2 border-b border-gray-100 flex items-start gap-2">
          {step !== undefined && (
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
              style={{ width: 17, height: 17, fontSize: 9, background: '#CC0000', marginTop: 1 }}
            >
              {step}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-gray-800 leading-tight">{titulo}</h3>
            {subtitulo && (
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{subtitulo}</p>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 px-3 md:px-4 py-2 min-w-0">
          {children}
        </div>

        {/* Insight LLM */}
        <div className="shrink-0 px-3 md:px-4 py-1.5 bg-gray-50/80 border-t border-gray-100">
          {loading ? (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 animate-pulse">
              <Sparkles size={11} className="flex-shrink-0" />
              <span className="truncate">Gerando insight...</span>
            </div>
          ) : insight ? (
            <div className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-snug">
              {iconMap[insight.tipo] ?? iconMap.neutro}
              <span className="min-w-0 line-clamp-2">{insight.texto}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
              <Sparkles size={11} className="flex-shrink-0" />
              <span>Insight indisponível</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}