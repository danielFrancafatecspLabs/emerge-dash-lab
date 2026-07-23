'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { Clock } from 'lucide-react'
import type { CycleTimeEstagio, LeadTimeStats } from '@/lib/types'

// Cores por porte
const CORES_PORTE: Record<string, string> = {
  'P': '#22C55E',
  'M': '#F59E0B',
  'G': '#EF4444',
}

interface Props {
  /** Cycle time quebrado por porte (P/M/G) */
  porPorte: CycleTimeEstagio[]
  /** Agregado geral */
  geral: CycleTimeEstagio
  leadTime?: LeadTimeStats
}

export default function CycleTimeEstrategia({ porPorte, geral, leadTime }: Props) {
  const chartData = useMemo(() => {
    // Combina: geral primeiro, depois portes P, M, G
    const result: (CycleTimeEstagio & { cor: string })[] = []

    if (geral && geral.qtdIniciativas > 0) {
      result.push({ ...geral, cor: '#FCD34D' })
    }

    for (const item of porPorte) {
      // Extrai porte do label: "Porte P" → "P"
      const porteMatch = item.label.match(/Porte ([PMG])/)
      const porte = porteMatch ? porteMatch[1] : null
      const cor = porte ? (CORES_PORTE[porte] ?? '#888') : '#888'

      // Label mais amigável
      const labelMap: Record<string, string> = { 'P': 'Baixa', 'M': 'Média', 'G': 'Alta' }
      const friendlyLabel = porte ? `${labelMap[porte]} (${porte})` : item.label

      result.push({ ...item, label: friendlyLabel, cor })
    }

    return result
  }, [porPorte, geral])

  // Soma dos blocked times para exibição no header
  const totalBlockedTime = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.blockedTimeDias ?? 0), 0)
  }, [chartData])

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
            Tempo médio em execução (dias), descontando bloqueios • por complexidade
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Cycle Time</p>
            <p className="text-lg font-bold text-emerald-700">{geral.mediaDias}d</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Bloqueado</p>
            <p className="text-lg font-bold text-amber-700">{geral.blockedTimeDias ?? leadTime?.blockedTimeExperimentacaoDias ?? 0}d</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 70, bottom: 0 }}
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
              width={65}
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
                if (name === 'mediaDias') return [`${value}d`, 'Cycle Time (líquido)']
                if (name === 'blockedTimeDias') return [`${value}d`, 'Tempo Bloqueado']
                return [value, name]
              }}
            />
            {/* Barra de blocked time (atrás) */}
            <Bar
              dataKey="blockedTimeDias"
              stackId="ct"
              barSize={22}
              name="blockedTimeDias"
              radius={[0, 0, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell key={`bt-${entry.estagio}`} fill="#FCD34D" fillOpacity={0.5} />
              ))}
            </Bar>
            {/* Barra de cycle time (frente) */}
            <Bar
              dataKey="mediaDias"
              stackId="ct"
              barSize={22}
              name="mediaDias"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry) => (
                <Cell key={entry.estagio} fill={entry.cor} fillOpacity={0.85} />
              ))}
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
              <th className="text-left py-1 font-medium">Complexidade</th>
              <th className="text-right py-1 font-medium">Média</th>
              <th className="text-right py-1 font-medium">Mediana</th>
              <th className="text-right py-1 font-medium">Bloqueio</th>
              <th className="text-right py-1 font-medium">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.estagio} className="border-b border-gray-50">
                <td className="py-1 text-gray-500 flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.cor }}
                  />
                  {item.label}
                </td>
                <td className="py-1 text-right font-semibold text-gray-800">{item.mediaDias}d</td>
                <td className="py-1 text-right text-gray-600">{item.medianaDias}d</td>
                <td className="py-1 text-right text-amber-600 font-medium">
                  {item.blockedTimeDias != null && item.blockedTimeDias > 0 ? `${item.blockedTimeDias}d` : '—'}
                </td>
                <td className="py-1 text-right text-gray-600">{item.qtdIniciativas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}