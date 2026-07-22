'use client'

import { ArrowDown } from 'lucide-react'
import type { FunilEtapa } from '@/lib/types'

interface Props {
  data: FunilEtapa[]
}

const COR_BARRA = '#DC2626'
const COR_BARRA_ALTA = '#991B1B'

export default function FunilExperimentacao({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Funil da Experimentação</p>
          <p className="text-xs mt-1">Sem dados disponíveis</p>
        </div>
      </div>
    )
  }

  const maxQtd = Math.max(...data.map(d => d.quantidade), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Funil da Experimentação</h3>
      </div>
      <div className="space-y-3">
        {data.map((etapa, i) => {
          const widthPct = Math.max((etapa.quantidade / maxQtd) * 100, 5)
          const isUltima = i === data.length - 1
          return (
            <div key={etapa.etapa}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">{etapa.etapa}</span>
                <span className="text-xs text-gray-400">
                  {etapa.quantidade} {!isUltima && etapa.taxaConversao > 0 ? `→ ${etapa.taxaConversao}%` : ''}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center pl-2"
                  style={{
                    width: `${widthPct}%`,
                    background: i === data.length - 1 ? COR_BARRA_ALTA : COR_BARRA,
                  }}
                >
                  <span className="text-xs font-bold text-white">{etapa.quantidade}</span>
                </div>
              </div>
              {!isUltima && (
                <div className="flex justify-center my-1">
                  <ArrowDown size={14} className="text-gray-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}