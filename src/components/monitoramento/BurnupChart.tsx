'use client'

import { useMemo } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot, LabelList, Legend,
} from 'recharts'
import { Target } from 'lucide-react'
import type { SerieMensal } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'

function detectOutliersMoM(values: number[], thresholdPct: number = 100): Set<number> {
  const outliers = new Set<number>()
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1]
    const curr = values[i]
    if (prev > 0 && curr > 0) {
      const pctChange = Math.abs(curr - prev) / prev * 100
      if (pctChange > thresholdPct) {
        outliers.add(curr)
      }
    }
  }
  return outliers
}

interface Props {
  data: SerieMensal
  meta?: number
}

export default function BurnupChart({ data, meta }: Props) {
  const chartData = useMemo(() => {
    return data.realizado.map((p, i) => ({
      label: `${p.mes}/${String(p.ano).slice(2)}`,
      Realizado: p.valor,
      'Benefício (R$)': data.beneficio[i]?.valor ?? 0,
      ...(meta ? { Meta: meta } : {}),
    }))
  }, [data, meta])

  const outliers = useMemo(() => {
    return detectOutliersMoM(data.beneficio.map(b => b?.valor ?? 0))
  }, [data])

  const outlierDots = useMemo(() => {
    return chartData
      .filter(d => outliers.has(d['Benefício (R$)']))
      .map((d, i) => ({ ...d, idx: i }))
  }, [chartData, outliers])

  const totalRealizado = data.realizado[data.realizado.length - 1]?.valor ?? 0
  const pctConclusao = meta && meta > 0 ? Math.round((totalRealizado / meta) * 100) : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-red-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-800">Crescimento da Experimentação no Período</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Acumulado de experimentos no período
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pctConclusao !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50">
              <Target size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-red-700">{pctConclusao}% da meta</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-1 flex gap-4">
        <span>Realizado: <strong className="text-gray-700">{totalRealizado}</strong></span>
        {meta && <span>Meta: <strong className="text-gray-700">{meta}</strong></span>}
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 28, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) =>
              name === 'Benefício (R$)' ? [formatBRL(value), name] : [String(value), name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
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
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Benefício (R$)"
            stroke="#F59E0B"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            label={{
              position: 'top',
              offset: 12,
              angle: -30,
              fontSize: 9,
              fill: '#B45309',
              fontWeight: 600,
              formatter: (v: number) => (v > 0 ? formatBRL(v) : ''),
            }}
            dot={(props: { cx?: number; cy?: number; payload?: { 'Benefício (R$)': number } }) => {
              const { cx = 0, cy = 0, payload } = props
              const isOutlier = payload ? outliers.has(payload['Benefício (R$)']) : false
              if (isOutlier) {
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={12} fill="none" stroke="#F59E0B" strokeWidth={2.5} opacity={0.35} />
                    <circle cx={cx} cy={cy} r={6} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={2} />
                  </g>
                )
              }
              return <circle cx={cx} cy={cy} r={4} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={2} />
            }}
          />
          {meta && (
            <Line yAxisId="left" type="monotone" dataKey="Meta" stroke="#D1D5DB" strokeWidth={2} dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}