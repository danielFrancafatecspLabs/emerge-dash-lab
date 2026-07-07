'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardData, EpicDetail } from '@/lib/types'
import { STATUS_PIPELINE } from '@/lib/mappers'
import EpicModal from './EpicModal'

function getEpicsForStage(data: DashboardData, stage: string): EpicDetail[] {
  return data.iniciativas
    .filter(ini => STATUS_PIPELINE[ini.status.id] === stage)
    .flatMap(ini => ini.epics)
}

interface Props { data: DashboardData }

export default function SituacaoPortfolio({ data }: Props) {
  const [modal, setModal] = useState<string | null>(null)
  const total = data.statusDistribuicao.reduce((s, d) => s + d.value, 0)

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full flex flex-col">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Situação do Portfólio
        </p>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.statusDistribuicao.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v} (${Math.round((v / total) * 100)}%)`, '']}
                  contentStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-bold text-gray-900" style={{ fontSize: 22, lineHeight: 1 }}>
                {total}
              </span>
              <span className="text-gray-500" style={{ fontSize: 9 }}>Ativos</span>
            </div>
          </div>

          <div className="mt-3 w-full space-y-1">
            {data.statusDistribuicao.map(d => (
              <button
                key={d.name}
                onClick={() => setModal(d.name)}
                className="flex items-center justify-between w-full rounded px-1 py-0.5 hover:bg-gray-50 transition-colors group"
                style={{ fontSize: 10 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="rounded-sm flex-shrink-0" style={{ width: 8, height: 8, background: d.color }} />
                  <span className="text-gray-700 group-hover:text-gray-900">{d.name}</span>
                </div>
                <span className="text-gray-500 font-medium">
                  {d.value} ({Math.round((d.value / total) * 100)}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <EpicModal
          title={`Status: ${modal}`}
          epics={getEpicsForStage(data, modal)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
