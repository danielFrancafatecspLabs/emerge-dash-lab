'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { Clock } from 'lucide-react'
import type { CycleTimeEstagio, LeadTimeStats } from '@/lib/types'

interface Props {
  geral: CycleTimeEstagio
  leadTime?: LeadTimeStats
}

export default function CycleTimeEstrategia({ geral, leadTime }: Props) {
  const chartData = useMemo(() => {
    if (!geral || geral.qtdIniciativas === 0) return []
    return [{
      label: 'Cycle Time Experimentação',
      mediaDias: geral.mediaDias,
      medianaDias: geral.medianaDias,
      qtdIniciativas: geral.qtdIniciativas,
    }]
  }, [geral])

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center text-gray-400 text-xs">
        Sem dados de cycle time disponíveis.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Cycle Time — Experimentação</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Tempo médio em execução (dias), descontando bloqueios
          </p>
        </div>
        {leadTime && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Cycle Time</p>
              <p className="text-lg font-bold text-emerald-700">{leadTime.cycleTimeExperimentacaoDias}d</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Bloqueado</p>
              <p className="text-lg font-bold text-amber-700">{leadTime.blockedTimeExperimentacaoDias}d</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 50, left: 140, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                fontSize: 11,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'mediaDias') return [`${value} dias`, 'Média']
                if (name === 'medianaDias') return [`${value} dias`, 'Mediana']
                return [value, name]
              }}
            />
            <Bar
              dataKey="mediaDias"
              radius={[0, 4, 4, 0]}
              barSize={24}
              name="mediaDias"
            >
              <Cell fill="#FCD34D" fillOpacity={0.85} />
              <LabelList
                dataKey="mediaDias"
                position="right"
                formatter={(v: number) => `${v}d`}
                style={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini tabela */}
      <div className="px-4 pb-3">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-1 font-medium">Métrica</th>
              <th className="text-right py-1 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-1 text-gray-500">Média</td>
              <td className="py-1 text-right font-semibold text-gray-800">{geral.mediaDias}d</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-1 text-gray-500">Mediana</td>
              <td className="py-1 text-right text-gray-600">{geral.medianaDias}d</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-500">Epics analisados</td>
              <td className="py-1 text-right text-gray-600">{geral.qtdIniciativas}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}