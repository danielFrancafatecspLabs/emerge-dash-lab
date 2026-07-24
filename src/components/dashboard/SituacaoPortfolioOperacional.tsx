'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardData, EpicDetail, PipelineCount } from '@/lib/types'
import { getPipelineStage } from '@/lib/mappers'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

const DONUT_COLORS: Record<string, string> = {
  'CONCLUÍDO':      '#6B7280',
  'EM ANDAMENTO':   '#EA580C',
  'EM REFINAMENTO': '#A8A29E',
  'BACKLOG':        '#9CA3AF',
  'DESCONTINUADO':  '#EF4444',
}

const DONUT_ORDER = ['CONCLUÍDO', 'EM ANDAMENTO', 'EM REFINAMENTO', 'BACKLOG', 'DESCONTINUADO']

// Agrupa status em 5 categorias para o donut
function buildDonutData(data: DashboardData) {
  const epics = data.allEpics

  const concluido = epics.filter(e => e.status?.id === '10003').length
  const descontinuado = epics.filter(e => e.status?.id === '10015').length
  const emRefinamento = epics.filter(e => e.status?.id === '10139').length
  const backlog = epics.filter(e => e.status?.id === '10004').length
  // Em andamento: tudo que não é concluído, cancelado, backlog, refinamento
  const emAndamento = epics.filter(e =>
    e.status?.id !== '10003' &&
    e.status?.id !== '10015' &&
    e.status?.id !== '10139' &&
    e.status?.id !== '10004'
  ).length

  return DONUT_ORDER.map(name => ({
    name,
    value: name === 'CONCLUÍDO' ? concluido
         : name === 'EM ANDAMENTO' ? emAndamento
         : name === 'EM REFINAMENTO' ? emRefinamento
         : name === 'BACKLOG' ? backlog
         : descontinuado,
    color: DONUT_COLORS[name],
  })).filter(d => d.value > 0)
}

function getEpicsForDonutSlice(data: DashboardData, name: string): EpicDetail[] {
  const epics = data.allEpics
  switch (name) {
    case 'CONCLUÍDO':      return epics.filter(e => e.status?.id === '10003')
    case 'DESCONTINUADO':  return epics.filter(e => e.status?.id === '10015')
    case 'EM REFINAMENTO': return epics.filter(e => e.status?.id === '10139')
    case 'BACKLOG':        return epics.filter(e => e.status?.id === '10004')
    case 'EM ANDAMENTO':   return epics.filter(e =>
      e.status?.id !== '10003' && e.status?.id !== '10015' &&
      e.status?.id !== '10139' && e.status?.id !== '10004'
    )
    default: return []
  }
}

export default function SituacaoPortfolioOperacional({ data }: Props) {
  const [modal, setModal] = useState<{ title: string; epics: EpicDetail[] } | null>(null)

  const donutData = buildDonutData(data)
  const total = data.allEpics.length

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Situação do Portfólio
        </h3>

        <div className="flex items-center gap-4">
          {/* Donut chart */}
          <div className="relative" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => {
                    const epics = getEpicsForDonutSlice(data, entry.name)
                    if (epics.length > 0) {
                      setModal({ title: `${entry.name} (${entry.value})`, epics })
                    }
                  }}
                >
                  {donutData.map(d => (
                    <Cell key={d.name} fill={d.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} experimentos`, name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Número central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-extrabold text-gray-800">{total}</span>
                <p className="text-[9px] text-gray-400 leading-tight">experimentos</p>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex-1 flex flex-col gap-1.5">
            {DONUT_ORDER.map(name => {
              const item = donutData.find(d => d.name === name)
              const count = item?.value ?? 0
              const epics = getEpicsForDonutSlice(data, name)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0

              return (
                <button
                  key={name}
                  onClick={() => {
                    if (epics.length > 0) {
                      setModal({ title: `${name} (${count})`, epics })
                    }
                  }}
                  disabled={count === 0}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-default"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: DONUT_COLORS[name] }}
                  />
                  <span className="text-[11px] text-gray-600 flex-1">{name}</span>
                  <span className="text-[11px] font-semibold text-gray-800">{count}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {modal && (
        <EpicModal
          title={modal.title}
          epics={modal.epics}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}