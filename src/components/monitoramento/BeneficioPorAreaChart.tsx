'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { BeneficioPorArea } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'

interface Props {
  data: BeneficioPorArea[]
}

const CORES = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#F87171', '#FCA5A5', '#7F1D1D', '#450A0A']

export default function BeneficioPorAreaChart({ data }: Props) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.valor - a.valor), [data])

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Benefício Potencial por Domínio</p>
          <p className="text-xs mt-1">Sem dados disponíveis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Benefício Potencial por Domínio</h3>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="area"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [formatBRL(value), 'Benefício']}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
            <LabelList dataKey="valor" position="right" fontSize={10} fill="#374151" fontWeight={500}
              formatter={(v: number) => formatBRL(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}