'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { Info } from 'lucide-react'
import type { CycleTimeEstagio } from '@/lib/types'

interface Props {
  data: CycleTimeEstagio[]
}

// Cores por estágio (consistentes com o pipeline)
const CORES: Record<string, string> = {
  'BACKLOG':              '#D4D4D4',
  'EM REFINAMENTO':       '#60A5FA',
  'PRONTO PARA EXECUÇÃO': '#F97316',
  'EM EXPERIMENTAÇÃO':    '#FCD34D',
  'AGUARDANDO PILOTO':    '#A78BFA',
  'EM PILOTO':            '#EF4444',
  'FINALIZADO':           '#134E4A',
}

function getCor(estagio: string): string {
  return CORES[estagio] ?? '#888'
}

export default function CycleTimeIdeacao({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-400">
        Sem dados de cycle time disponíveis.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Cycle Time por Etapa — Board de Ideação</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Tempo médio (dias) que as iniciativas permanecem em cada estágio do pipeline
        </p>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              label={{ value: 'Dias', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#9CA3AF' }}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'mediaDias') return [`${value} dias`, 'Média']
                if (name === 'medianaDias') return [`${value} dias`, 'Mediana']
                return [value, name]
              }}
              labelFormatter={(label: string) => `Estágio: ${label}`}
            />
            <Bar
              dataKey="mediaDias"
              radius={[0, 4, 4, 0]}
              barSize={28}
              name="mediaDias"
            >
              {data.map((entry) => (
                <Cell key={entry.estagio} fill={getCor(entry.estagio)} fillOpacity={0.85} />
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

      {/* Tabela resumo */}
      <div className="px-5 pb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">Etapa</th>
              <th className="text-right py-1.5 font-medium">Média (dias)</th>
              <th className="text-right py-1.5 font-medium">Mediana (dias)</th>
              <th className="text-right py-1.5 font-medium">Qtd. Iniciativas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.estagio} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-1.5 flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: getCor(item.estagio) }}
                  />
                  <span className="text-gray-700">{item.label}</span>
                </td>
                <td className="text-right py-1.5 font-semibold text-gray-800">{item.mediaDias}d</td>
                <td className="text-right py-1.5 text-gray-500">{item.medianaDias}d</td>
                <td className="text-right py-1.5 text-gray-500">{item.qtdIniciativas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Funil de Iniciativas ── */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-bold text-gray-800">Funil de Iniciativas</h4>
          <div className="relative group">
            <Info size={12} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-1.5 w-56 p-2 rounded-lg bg-gray-900 text-white text-[10px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
              Quantidade de iniciativas que passaram por cada estágio. O funil mostra o fluxo real: quantas iniciativas já transitaram por cada etapa do pipeline de ideação.
              <div className="absolute top-full left-3 -mt-px border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Funil visual */}
        <div className="flex flex-col items-center gap-1">
          {data.map((item, idx) => {
            const maxQtd = Math.max(...data.map(d => d.qtdIniciativas), 1)
            const widthPct = Math.max((item.qtdIniciativas / maxQtd) * 100, 8)
            const isLast = idx === data.length - 1
            return (
              <div key={item.estagio} className="flex flex-col items-center w-full">
                {/* Barra do funil */}
                <div className="flex items-center gap-3 w-full justify-center">
                  <span className="text-[10px] text-gray-500 w-24 text-right truncate">{item.label}</span>
                  <div
                    className="h-7 rounded flex items-center justify-center transition-all duration-500 relative"
                    style={{
                      width: `${widthPct}%`,
                      maxWidth: '400px',
                      minWidth: '60px',
                      background: getCor(item.estagio),
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-white font-bold text-xs drop-shadow-sm">
                      {item.qtdIniciativas}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 w-16 text-left">
                    {Math.round((item.qtdIniciativas / maxQtd) * 100)}%
                  </span>
                </div>
                {/* Conector (seta para baixo) */}
                {!isLast && (
                  <div className="text-gray-300 text-xs leading-none my-0.5">▼</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda compacta */}
        <div className="flex flex-wrap gap-3 justify-center mt-3 pt-2 border-t border-gray-50">
          {data.map(item => (
            <div key={item.estagio} className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: getCor(item.estagio) }}
              />
              <span className="text-[9px] text-gray-500">{item.label}</span>
              <span className="text-[9px] font-semibold text-gray-700">{item.qtdIniciativas}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}