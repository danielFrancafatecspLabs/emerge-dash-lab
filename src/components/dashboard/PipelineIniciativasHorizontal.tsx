'use client'

import { useState } from 'react'
import { DashboardData, PipelineCount, EpicDetail } from '@/lib/types'
import { getPipelineStage, STATUS_PIPELINE } from '@/lib/mappers'
import EpicModal from './EpicModal'
import { Layers } from 'lucide-react'

interface Props { data: DashboardData }

interface MicroCard {
  key: keyof PipelineCount
  label: string
  cor: string
  bg: string
  border: string
  emoji: string
}

const MICRO_CARDS: MicroCard[] = [
  { key: 'BACKLOG',            label: 'Backlog',              cor: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', emoji: '📋' },
  { key: 'EM REFINAMENTO',     label: 'Em Refinamento',       cor: '#78716C', bg: '#FAFAF9', border: '#D6D3D1', emoji: '🔍' },
  { key: 'EM EXPERIMENTAÇÃO',  label: 'Em Experimentação',    cor: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', emoji: '🧪' },
  { key: 'EM PILOTO',          label: 'Em Piloto',            cor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🚀' },
  { key: 'AGUARDANDO PILOTO',  label: 'Aguardando Piloto',    cor: '#9333EA', bg: '#FAF5FF', border: '#D8B4FE', emoji: '⏸️' },
  { key: 'EM ESCALA',          label: 'Em Escala',            cor: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', emoji: '📈' },
]

function getEpicsForStage(data: DashboardData, stage: keyof PipelineCount): EpicDetail[] {
  return data.iniciativas
    .filter(ini => STATUS_PIPELINE[ini.status.id] === stage)
    .flatMap(ini => ini.epics)
}

export default function PipelineIniciativasHorizontal({ data }: Props) {
  const [modal, setModal] = useState<{ title: string; epics: EpicDetail[] } | null>(null)

  const total = data.iniciativas.length

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Pipeline das Iniciativas
          </h3>
          <span className="text-[10px] text-gray-400 ml-auto">
            {total} iniciativa{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Barra horizontal com microcards */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MICRO_CARDS.map(card => {
            const count = data.pipeline[card.key] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <button
                key={card.key}
                onClick={() => {
                  const epics = getEpicsForStage(data, card.key)
                  if (epics.length > 0) {
                    setModal({ title: `${card.label} (${count})`, epics })
                  }
                }}
                disabled={count === 0}
                className="flex-1 min-w-[100px] rounded-lg border p-3 text-left transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-default"
                style={{ background: card.bg, borderColor: card.border }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{card.emoji}</span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: card.cor }}
                  >
                    {card.label}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-extrabold" style={{ color: card.cor }}>
                    {count}
                  </span>
                  <span className="text-[10px] text-gray-400">{pct}%</span>
                </div>
                {/* Mini barra de progresso */}
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 2)}%`, background: card.cor }}
                  />
                </div>
              </button>
            )
          })}
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