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
}

const iconMap: Record<string, ReactNode> = {
  positivo: <Lightbulb size={13} className="text-emerald-500 shrink-0 mt-0.5" />,
  neutro: <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />,
  alerta: <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />,
}

/**
 * Wrapper que adiciona um insight gerado por LLM abaixo de qualquer gráfico/card.
 * NÃO adiciona header próprio — o filho já tem seu próprio título.
 */
export default function GraficoComInsight({ children, insight, loading }: Props) {
  return (
    <div className="flex flex-col gap-0 min-w-0">
      {/* Conteúdo original do gráfico */}
      {children}

      {/* Insight LLM abaixo */}
      <div className="shrink-0 mt-1 px-3 md:px-4 py-2 bg-gray-50 rounded-b-xl border border-gray-100 border-t-0 -mt-[1px] overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 animate-pulse">
            <Sparkles size={12} className="flex-shrink-0" />
            <span className="truncate">Gerando insight...</span>
          </div>
        ) : insight ? (
          <div className="flex items-start gap-1.5 text-xs text-gray-600 leading-relaxed">
            {iconMap[insight.tipo] ?? iconMap.neutro}
            <span className="min-w-0">{insight.texto}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <Sparkles size={12} className="flex-shrink-0" />
            <span>Insight indisponível</span>
          </div>
        )}
      </div>
    </div>
  )
}