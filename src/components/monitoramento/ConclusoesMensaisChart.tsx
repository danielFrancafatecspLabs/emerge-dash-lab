'use client'

import { useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from 'recharts'
import type { ConclusaoMensal } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'

interface Props {
  data: ConclusaoMensal[]
}

export default function ConclusoesMensaisChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      mes: d.mes,
      'Concluídos': d.quantidade,
      'Benefício (R$)': d.beneficio,
    }))
  }, [data])

  const temBeneficio = data.some(d => d.beneficio > 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Concluídos vs Benefício Gerado</h3>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          {temBeneficio && (
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          )}
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) =>
              name === 'Benefício (R$)' ? [formatBRL(value), name] : [String(value), name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="Concluídos" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={24}>
            <LabelList dataKey="Concluídos" position="top" fontSize={10} fill="#991B1B" fontWeight={600} />
          </Bar>
          {temBeneficio && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Benefício (R$)"
              stroke="#DC2626"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: '#DC2626' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}