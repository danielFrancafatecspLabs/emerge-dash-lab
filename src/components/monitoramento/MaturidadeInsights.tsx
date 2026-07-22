'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { Lightbulb, AlertTriangle, Info } from 'lucide-react'
import type { MaturidadeEstagio, InsightExecutivo } from '@/lib/types'

interface MaturidadeProps {
  data: MaturidadeEstagio[]
}

export function MaturidadePortfolio({ data }: MaturidadeProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Maturidade do Portfólio</p>
          <p className="text-xs mt-1">Sem dados disponíveis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Maturidade do Portfólio</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis dataKey="estagio" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
            <LabelList dataKey="quantidade" position="top" fontSize={11} fill="#374151" fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface InsightsProps {
  data: InsightExecutivo[]
}

export function InsightsExecutivos({ data }: InsightsProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Insights Executivos</p>
          <p className="text-xs mt-1">Nenhum insight gerado</p>
        </div>
      </div>
    )
  }

  const iconMap: Record<string, React.ReactNode> = {
    positivo: <Lightbulb size={14} className="text-red-500 shrink-0 mt-0.5" />,
    neutro: <Info size={14} className="text-red-300 shrink-0 mt-0.5" />,
    alerta: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full bg-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Insights Executivos</h3>
      </div>
      <div className="space-y-2.5">
        {data.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
            {iconMap[insight.tipo] ?? iconMap.neutro}
            <span>{insight.texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}