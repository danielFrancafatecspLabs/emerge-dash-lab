'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SerieMensal } from '@/lib/types'

interface Props {
  data: SerieMensal
}

export default function BurnupChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.realizado.map((p) => ({
      label: `${p.mes}/${String(p.ano).slice(2)}`,
      Acumulado: p.valor,
      epics: p.epics ?? [],
    }))
  }, [data])

  const totalRealizado = data.realizado[data.realizado.length - 1]?.valor ?? 0

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header com total */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] text-gray-500">
          Total acumulado: <strong className="text-gray-800">{totalRealizado}</strong> experimentos
        </span>
      </div>

      {/* Gráfico — ocupa todo espaço disponível */}
      <div className="flex-1 min-h-0 max-h-[400px]" style={{ minHeight: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: 11,
                padding: '6px 10px',
              }}
              formatter={(value: number) => [String(value), 'Acumulado']}
              labelStyle={{ fontWeight: 600, marginBottom: 2 }}
            />
            <Bar
              dataKey="Acumulado"
              fill="#CC0000"
              radius={[3, 3, 0, 0]}
              barSize={24}
              label={{
                position: 'top',
                fontSize: 10,
                fill: '#6B7280',
                fontWeight: 500,
                formatter: (value: number) => value,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}