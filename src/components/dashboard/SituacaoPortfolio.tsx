'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardData, EpicDetail, PipelineCount } from '@/lib/types'
import { getPipelineStage } from '@/lib/mappers'
import EpicModal from './EpicModal'

// Mapeamento do nome exibido → chave do pipeline (para aplicar overrides do localStorage)
const NAME_TO_KEY: Record<string, keyof PipelineCount> = {
  'CONCLUÍDO':            'FINALIZADO',
  'FINALIZADO':           'FINALIZADO',
  'DESCONTINUADO':        'CANCELADO',
  'CANCELADO':            'CANCELADO',
  'EM PILOTO':            'EM PILOTO',
  'EM ESCALA':            'EM ESCALA',
  'AGUARDANDO PILOTO':    'AGUARDANDO PILOTO',
  'EM EXPERIMENTAÇÃO':    'EM EXPERIMENTAÇÃO',
  'EM REFINAMENTO':       'EM REFINAMENTO',
  'BACKLOG':              'BACKLOG',
  'PRONTO PARA EXECUÇÃO': 'PRONTO PARA EXECUÇÃO',
}

// Retorna os Epics filtrados pelo estágio de pipeline (board 2735)
function getEpicsForStage(data: DashboardData, stage: string): EpicDetail[] {
  // Mapeia o nome de exibição de volta para a chave do pipeline
  const DISPLAY_TO_KEY: Record<string, string> = {
    'CONCLUÍDO': 'FINALIZADO', 'FINALIZADO': 'FINALIZADO',
    'DESCONTINUADO': 'CANCELADO', 'CANCELADO': 'CANCELADO',
    'EM PILOTO': 'EM PILOTO', 'EM ESCALA': 'EM ESCALA',
    'AGUARDANDO PILOTO': 'AGUARDANDO PILOTO',
    'EM EXPERIMENTAÇÃO': 'EM EXPERIMENTAÇÃO',
    'EM REFINAMENTO': 'EM REFINAMENTO',
    'BACKLOG': 'BACKLOG', 'PRONTO PARA EXECUÇÃO': 'PRONTO PARA EXECUÇÃO',
  }
  const pipelineKey = DISPLAY_TO_KEY[stage] ?? stage

  return data.allEpics.filter(e => getPipelineStage(e.status) === pipelineKey)
}

interface Props { data: DashboardData }

export default function SituacaoPortfolio({ data }: Props) {
  const [modal, setModal] = useState<string | null>(null)
  // key do pipeline → valor fixo
  const [fixos, setFixos] = useState<Partial<Record<keyof PipelineCount, number>>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pipeline-colunas-v1')
      if (!saved) return
      const cfg = JSON.parse(saved) as Record<string, { mode: string; value: string }>
      const map: Partial<Record<keyof PipelineCount, number>> = {}
      for (const [key, field] of Object.entries(cfg)) {
        if (field.mode === 'fixo') {
          const n = parseInt(field.value, 10)
          if (!isNaN(n)) map[key as keyof PipelineCount] = n
        }
      }
      setFixos(map)
    } catch {}
  }, [])

  // Aplica overrides: se a coluna está em modo fixo no pipeline, usa esse número
  const distribuicao = data.statusDistribuicao
    .map(d => {
      const pKey = NAME_TO_KEY[d.name]
      const override = pKey !== undefined ? fixos[pKey] : undefined
      return { ...d, value: override !== undefined ? override : d.value, isFixed: override !== undefined }
    })
    .filter(d => d.value > 0)

  const total = distribuicao.reduce((s, d) => s + d.value, 0)

  // Total de experimentos (Epics) para o número central do gráfico
  const totalEpicsCount = data.allEpics.length

  const displayRows = distribuicao.map(d => ({
    ...d,
    displayName: d.name === 'EM ESCALA' ? 'Em Escala' : d.name,
    stage: d.name,
  }))

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full flex flex-col">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Situação do Portfólio (experimentos)
        </p>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {distribuicao.map((entry, i) => (
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
                {totalEpicsCount}
              </span>
              <span className="text-gray-500" style={{ fontSize: 9 }}>Experimentos</span>
            </div>
          </div>

          <div className="mt-3 w-full space-y-1">
            {displayRows.map(d => (
              <button
                key={d.name}
                onClick={() => setModal(d.stage)}
                className="flex items-center justify-between w-full rounded px-1 py-0.5 transition-colors hover:bg-gray-50"
                style={{ fontSize: 10 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="rounded-sm flex-shrink-0" style={{ width: 8, height: 8, background: d.color }} />
                  <span className="text-gray-700 group-hover:text-gray-900">{d.displayName}</span>
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
