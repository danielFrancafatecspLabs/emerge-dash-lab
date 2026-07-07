'use client'

import { useState, useEffect } from 'react'
import { DashboardData, PipelineCount, EpicDetail } from '@/lib/types'
import { formatBRL, STATUS_PIPELINE } from '@/lib/mappers'
import { Settings, X } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

const COLUNAS: { key: keyof PipelineCount; label?: string; sub: string }[] = [
  { key: 'BACKLOG',           sub: 'Ideias registradas'    },
  { key: 'EM REFINAMENTO',    sub: 'Refinamento'           },
  { key: 'EM EXPERIMENTAÇÃO', sub: 'Em execução'           },
  { key: 'AGUARDANDO PILOTO', sub: 'Aguardando escala'     },
  { key: 'EM PILOTO',         sub: 'Teste em ambiente real'},
  { key: 'FINALIZADO',        sub: 'Entregue'              },
  { key: 'CANCELADO',         label: 'DESCONTINUADO', sub: 'Interrompido' },
]

const LS_KEY = 'pipeline-kpis-v3'

interface PipelineKpis {
  taxaConversaoTotal: string
  leadtimeTotal: string
  blockedTime: string
  workingTime: string
}

const FUNIL_FIELDS: { key: keyof PipelineKpis; label: string }[] = [
  { key: 'leadtimeTotal', label: 'Leadtime total'  },
  { key: 'blockedTime',   label: 'Blocked time'    },
  { key: 'workingTime',   label: 'Working time'    },
]

function getEpicsForStage(data: DashboardData, stage: keyof PipelineCount): EpicDetail[] {
  return data.iniciativas
    .filter(ini => STATUS_PIPELINE[ini.status.id] === stage)
    .flatMap(ini => ini.epics)
}

export default function PipelineInovacao({ data }: Props) {
  const p = data.pipeline
  const total = Object.values(p).reduce((a, b) => a + b, 0) || 1
  const concluidos = p['FINALIZADO']
  const taxaConversao = total > 0 ? `${((concluidos / total) * 100).toFixed(0)}%` : '0%'

  const defaults: PipelineKpis = {
    taxaConversaoTotal: taxaConversao,
    leadtimeTotal:      '147 dias',
    blockedTime:        '12 dias',
    workingTime:        '92%',
  }

  const [kpis, setKpis] = useState<PipelineKpis>(defaults)
  const [editModal, setEditModal] = useState(false)
  const [draft, setDraft] = useState<PipelineKpis>(defaults)
  const [epicModal, setEpicModal] = useState<keyof PipelineCount | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as PipelineKpis
        setKpis(parsed)
      }
    } catch {}
  }, [])

  function openEdit() {
    setDraft({ ...kpis })
    setEditModal(true)
  }

  function save() {
    setKpis(draft)
    try { localStorage.setItem(LS_KEY, JSON.stringify(draft)) } catch {}
    setEditModal(false)
  }

  return (
    <>
      <div className="rounded-lg p-5 h-full flex flex-col" style={{ background: '#6B0000' }}>
        {/* Header com taxa de conversão em destaque */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-white/70" style={{ fontSize: 11 }}>⚡</span>
            <div>
              <p className="text-white font-semibold text-xs uppercase tracking-widest leading-none">
                Pipeline de Experimentação
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-white/50" style={{ fontSize: 9 }}>Taxa de conversão</span>
                <span className="text-white font-bold" style={{ fontSize: 13 }}>{kpis.taxaConversaoTotal}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openEdit}
              className="rounded p-1.5 transition-colors hover:bg-white/20"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              title="Editar métricas"
            >
              <Settings size={13} />
            </button>
            <button
              className="text-xs font-semibold px-3 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 10 }}
            >
              Semestre Atual ▾
            </button>
          </div>
        </div>

        {/* Colunas do pipeline */}
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${COLUNAS.length}, 1fr)` }}>
          {COLUNAS.map(c => (
            <button
              key={c.key}
              onClick={() => p[c.key] > 0 && setEpicModal(c.key)}
              className="text-center rounded py-1 transition-colors"
              style={{ background: p[c.key] > 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              title={p[c.key] > 0 ? `Ver ${p[c.key]} experimentos` : undefined}
            >
              <p className="text-white/60 uppercase" style={{ fontSize: 8, letterSpacing: '0.05em' }}>
                {c.label ?? c.key}
              </p>
              <p className={`text-white font-bold ${p[c.key] > 0 ? 'hover:text-yellow-300' : ''}`}
                style={{ fontSize: 26, lineHeight: 1.1 }}>
                {p[c.key]}
              </p>
              <p className="text-white/50" style={{ fontSize: 8 }}>{c.sub}</p>
            </button>
          ))}
        </div>

        {/* Desempenho do Funil + Valor */}
        <div className="grid gap-2" style={{ gridTemplateColumns: '3fr 1fr' }}>

          {/* Desempenho do Funil */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white/60 uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.08em' }}>
              Desempenho do Funil
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FUNIL_FIELDS.map(f => (
                <div key={f.key} className="text-center">
                  <p className="text-white/50" style={{ fontSize: 8 }}>{f.label}</p>
                  <p className="text-white font-bold text-sm">{kpis[f.key]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Valor — somente leitura */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white/60 uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.05em' }}>
              Valor
            </p>
            <div>
              <p className="text-white/50" style={{ fontSize: 8 }}>Benefício potencial</p>
              <p className="text-white font-bold text-sm">{formatBRL(data.beneficioTotal)}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setEditModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: 400, maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <p className="font-bold text-gray-800 text-sm">Editar Métricas do Pipeline</p>
              <button
                onClick={() => setEditModal(false)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 flex-1">Taxa de conversão total</label>
                <input
                  type="text"
                  value={draft.taxaConversaoTotal}
                  onChange={e => setDraft(d => ({ ...d, taxaConversaoTotal: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-red-400"
                  style={{ width: 130 }}
                />
              </div>
              {FUNIL_FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 flex-1">{f.label}</label>
                  <input
                    type="text"
                    value={draft[f.key]}
                    onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-red-400"
                    style={{ width: 130 }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="px-4 py-1.5 rounded text-sm text-white font-medium transition-colors hover:opacity-90"
                style={{ background: '#CC0000' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Epic drill-down modal */}
      {epicModal && (
        <EpicModal
          title={`Pipeline: ${epicModal}`}
          epics={getEpicsForStage(data, epicModal)}
          onClose={() => setEpicModal(null)}
        />
      )}
    </>
  )
}
