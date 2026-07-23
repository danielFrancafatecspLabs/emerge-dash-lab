'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { Users } from 'lucide-react'
import type { IniciativaLab } from '@/lib/types'

interface Props {
  data: IniciativaLab[]
}

const CORES = ['#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#F87171', '#FCA5A5', '#7F1D1D', '#450A0A']

export default function IniciativasPorLab({ data }: Props) {
  // Agrupa por time responsável
  const agrupado = useMemo(() => {
    const map = new Map<string, IniciativaLab[]>()
    for (const ini of data) {
      const lab = ini.timeResponsavel || 'Sem lab definido'
      if (!map.has(lab)) map.set(lab, [])
      map.get(lab)!.push(ini)
    }
    // Ordena: labs com mais iniciativas primeiro
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [data])

  // Dados para o gráfico
  const chartData = useMemo(() =>
    agrupado.map(([lab, iniciativas]) => ({
      lab,
      qtd: iniciativas.length,
    })),
    [agrupado]
  )

  const totalLabs = agrupado.length
  const totalIniciativas = data.length

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Iniciativas por Lab</p>
          <p className="text-xs mt-1">Sem dados disponíveis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-red-500" />
          <h3 className="text-sm font-bold text-gray-800">Iniciativas por Lab</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Users size={14} />
          <span>{totalLabs} labs · {totalIniciativas} iniciativas</span>
        </div>
      </div>

      {/* Gráfico de barras horizontal */}
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36 + 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 130, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
            allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="lab"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={125}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [`${value} iniciativa${value !== 1 ? 's' : ''}`, 'Quantidade']}
          />
          <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={24}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
            <LabelList dataKey="qtd" position="right" fontSize={11} fill="#374151" fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}