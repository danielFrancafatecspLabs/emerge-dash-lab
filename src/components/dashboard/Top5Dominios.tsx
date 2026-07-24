'use client'

import { useMemo } from 'react'
import { DashboardData } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface Props { data: DashboardData }

const CORES = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#F87171', '#FCA5A5', '#7F1D1D', '#450A0A']

export default function Top5Dominios({ data }: Props) {
  const dominios = useMemo(() => {
    const map = new Map<string, { count: number; valorPotencial: number }>()
    for (const epic of data.allEpics) {
      const dominio = epic.dominio || 'Não classificado'
      if (!map.has(dominio)) {
        map.set(dominio, { count: 0, valorPotencial: 0 })
      }
      const entry = map.get(dominio)!
      entry.count++
      entry.valorPotencial += epic.beneficioQuantitativo ?? 0
    }
    return Array.from(map.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [data.allEpics])

  const formatBRLCompact = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
    return `R$ ${v}`
  }

  if (dominios.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xs font-semibold uppercase tracking-widest">Top 5 Domínios</p>
          <p className="text-xs mt-1">Sem dados disponíveis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 h-full">
      <div className="flex items-center gap-2 mb-3">
        <PieChartIcon size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Top 5 Domínios
        </p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(180, dominios.length * 40 + 30)}>
        <BarChart data={dominios} layout="vertical" margin={{ top: 0, right: 70, left: 110, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="nome"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={105}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'count') return [`${value} experimentos`, 'Qtd']
              return [formatBRLCompact(value), 'Valor Potencial']
            }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {dominios.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
            <LabelList
              dataKey="valorPotencial"
              position="right"
              formatter={(v: number) => formatBRLCompact(v)}
              style={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}