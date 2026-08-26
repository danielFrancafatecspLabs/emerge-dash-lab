'use client'

import { useMemo } from 'react'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts'
import { Target } from 'lucide-react'
import type { SerieMensal } from '@/lib/types'

interface Props {
  data: SerieMensal
  meta?: number
  height?: number
}

export default function BurnupChart({ data, meta, height = 280 }: Props) {
  const chartData = useMemo(() => {
    return data.realizado.map((p, i) => ({
      label: `${p.mes}/${String(p.ano).slice(2)}`,
      Realizado: p.valor,
      ...(meta ? { Meta: meta } : {}),
    }))
  }, [data, meta])

  const totalRealizado = data.realizado[data.realizado.length - 1]?.valor ?? 0
  const pctConclusao = meta && meta > 0 ? Math.round((totalRealizado / meta) * 100) : null

  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        {pctConclusao !== null && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50">
            <Target size={12} className="text-red-500" />
            <span className="text-[11px] font-semibold text-red-700">{pctConclusao}% da meta</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-400 mb-1.5 flex gap-4">
        <span>Realizado: <strong className="text-gray-700">{totalRealizado}</strong></span>
        {meta && <span>Meta: <strong className="text-gray-700">{meta}</strong></span>}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) => [String(value), name]}
          />
          {meta && (
            <ReferenceLine
              y={meta}
              yAxisId="left"
              stroke="#9CA3AF"
              strokeDasharray="6 4"
              label={{ value: `Meta: ${meta}`, position: 'right', fontSize: 10, fill: '#9CA3AF' }}
            />
          )}
          <Bar yAxisId="left" dataKey="Realizado" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={28}>
            <LabelList
              dataKey="Realizado"
              position="top"
              offset={6}
              fontSize={11}
              fill="#991B1B"
              fontWeight={700}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </>
  )
}