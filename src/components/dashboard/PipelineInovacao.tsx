'use client'

import { useState, useEffect } from 'react'
import { DashboardData, PipelineCount, EpicDetail } from '@/lib/types'
import { formatBRL, STATUS_PIPELINE, getPipelineStage } from '@/lib/mappers'
import { Settings, X, Clock, ArrowRight } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

const COLUNAS: { key: keyof PipelineCount; label?: string; sub: string }[] = [
  { key: 'BACKLOG',           sub: 'Ideias registradas'    },
  { key: 'EM REFINAMENTO',    sub: 'Refinamento'           },
  { key: 'EM EXPERIMENTAÇÃO', sub: 'Em execução'           },
  { key: 'AGUARDANDO PILOTO', sub: 'Aguardando escala'     },
  { key: 'EM PILOTO',         sub: 'Teste em ambiente real'},
  { key: 'EM ESCALA',         sub: 'Em escala / industrialização' },
]

const LS_KEY_KPIS    = 'pipeline-kpis-v3'
const LS_KEY_COLUNAS = 'pipeline-colunas-v1'

type Mode = 'jira' | 'fixo'
interface FieldConfig { mode: Mode; value: string }
type ColunasConfig = Partial<Record<keyof PipelineCount, FieldConfig>>

interface PipelineKpis {
  leadtimeEscala: string
  leadtimePiloto: string
}

const FUNIL_FIELDS: { key: keyof PipelineKpis; label: string; desc: string }[] = [
  { key: 'leadtimeEscala', label: 'Leadtime → Escala', desc: 'Leadtime total da esteira de Iniciativas. Média de dias desde a criação até atingir o estágio EM ESCALA, sem considerar tempos de bloqueio.' },
  { key: 'leadtimePiloto', label: 'Leadtime → Piloto', desc: 'Média de dias desde a criação até atingir o estágio EM PILOTO, sem considerar tempos de bloqueio.' },
]

function getEpicsForStage(data: DashboardData, stage: keyof PipelineCount): EpicDetail[] {
  return data.iniciativas
    .filter(ini => STATUS_PIPELINE[ini.status.id] === stage)
    .flatMap(ini => ini.epics)
}

function defaultColunas(): ColunasConfig {
  return Object.fromEntries(
    COLUNAS.map(c => [c.key, { mode: 'jira' as Mode, value: '' }])
  ) as ColunasConfig
}

export default function PipelineInovacao({ data }: Props) {
  const p = data.pipeline
  const totalIdeas = data.iniciativas.length
  const totalPipelineCount = totalIdeas

  const countExperimentacao = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM EXPERIMENTAÇÃO').length
  const countEmPiloto = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM PILOTO').length
  const countEmEscala = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA').length
  const countFinalizado = data.iniciativas.filter(i => getPipelineStage(i.status) === 'FINALIZADO').length
  const countRefinamento = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM REFINAMENTO').length

  const totalExperimentosRealizados = (
    countExperimentacao + countEmPiloto + countRefinamento + countEmEscala + countFinalizado
  )

  const concludedCount = countEmPiloto + countFinalizado + countEmEscala

  const percentOfTotal = (value: number) =>
    totalPipelineCount > 0 ? Math.round((value / totalPipelineCount) * 100) : 0
  const conversionEscala = totalPipelineCount > 0
    ? `${Math.round((countEmEscala / totalPipelineCount) * 100)}%`
    : '0%'
  const conversionPiloto = totalPipelineCount > 0
    ? `${Math.round(((countEmPiloto + countEmEscala) / totalPipelineCount) * 100)}%`
    : '0%'

  const kpiDefaults: PipelineKpis = {
    leadtimeEscala: data.leadTime.leadtimePorEstagio?.['EM ESCALA'] ? `${data.leadTime.leadtimePorEstagio['EM ESCALA']} dias` : '-',
    leadtimePiloto: data.leadTime.leadtimePorEstagio?.['EM PILOTO'] ? `${data.leadTime.leadtimePorEstagio['EM PILOTO']} dias` : '-',
  }

  const [kpis, setKpis] = useState<PipelineKpis>(kpiDefaults)
  const [colunasConfig, setColunasConfig] = useState<ColunasConfig>(defaultColunas)
  const [editModal, setEditModal] = useState(false)
  const [draftKpis, setDraftKpis] = useState<PipelineKpis>(kpiDefaults)
  const [draftColunas, setDraftColunas] = useState<ColunasConfig>(defaultColunas)
  const [epicModal, setEpicModal] = useState<keyof PipelineCount | null>(null)

  useEffect(() => {
    try {
      const savedKpis = localStorage.getItem(LS_KEY_KPIS)
      if (savedKpis) setKpis(JSON.parse(savedKpis) as PipelineKpis)
      const savedColunas = localStorage.getItem(LS_KEY_COLUNAS)
      if (savedColunas) setColunasConfig(JSON.parse(savedColunas) as ColunasConfig)
    } catch {}
  }, [])

  function openEdit() {
    setDraftKpis({ ...kpis })
    setDraftColunas(structuredClone(colunasConfig))
    setEditModal(true)
  }

  function save() {
    setKpis(draftKpis)
    setColunasConfig(draftColunas)
    try {
      localStorage.setItem(LS_KEY_KPIS, JSON.stringify(draftKpis))
      localStorage.setItem(LS_KEY_COLUNAS, JSON.stringify(draftColunas))
    } catch {}
    setEditModal(false)
  }

  function setColField(key: keyof PipelineCount, patch: Partial<FieldConfig>) {
    setDraftColunas(d => ({ ...d, [key]: { ...d[key], ...patch } }))
  }

  function getColCount(key: keyof PipelineCount): number {
    const cfg = colunasConfig[key]
    if (cfg?.mode === 'fixo') {
      const n = parseInt(cfg.value, 10)
      return isNaN(n) ? 0 : n
    }
    return p[key]
  }

  return (
    <>
      <div className="rounded-lg p-5 h-full flex flex-col" style={{ background: '#6B0000' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-white/70" style={{ fontSize: 11 }}>⚡</span>
            <div>
              <p className="text-white font-semibold text-xs uppercase tracking-widest leading-none">
                Pipeline de Iniciativas
              </p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/50" style={{ fontSize: 9 }}>Escala</span>
                  <span className="text-white font-bold" style={{ fontSize: 13 }}>{conversionEscala}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/50" style={{ fontSize: 9 }}>Piloto</span>
                  <span className="text-white font-bold" style={{ fontSize: 13 }}>{conversionPiloto}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openEdit}
              className="rounded p-1.5 transition-colors hover:bg-white/20"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              title="Configurar métricas"
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

        {/* Fluxo de conversão removido conforme pedido */}
        {/* Colunas do pipeline */}
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${COLUNAS.length}, 1fr)` }}>
          {COLUNAS.map(c => {
            const count = getColCount(c.key)
            const isFixed = colunasConfig[c.key]?.mode === 'fixo'
            return (
              <button
                key={c.key}
                onClick={() => count > 0 && !isFixed ? setEpicModal(c.key) : undefined}
                className="text-center rounded py-1 transition-colors relative"
                style={{ background: count > 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                title={count > 0 && !isFixed ? `Ver ${count} experimentos` : undefined}
              >
                <p className="text-white/60 uppercase" style={{ fontSize: 8, letterSpacing: '0.05em' }}>
                  {c.label ?? c.key}
                </p>
                <p
                  className={`text-white font-bold ${count > 0 && !isFixed ? 'hover:text-yellow-300' : ''}`}
                  style={{ fontSize: 26, lineHeight: 1.1 }}
                >
                  {count}
                </p>
                <p className="text-white/50" style={{ fontSize: 8 }}>{c.sub}</p>
                {isFixed && (
                  <span
                    className="absolute top-0.5 right-0.5 px-1 rounded"
                    style={{ fontSize: 7, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)' }}
                  >
                    fixo
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Lead Time — Esteira de Iniciativas */}
        <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Leadtime → Escala */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-white/50" />
              <p className="text-white/60 uppercase" style={{ fontSize: 9, letterSpacing: '0.08em' }}>
                Leadtime → Escala
              </p>
            </div>
            <p className="text-white font-bold" style={{ fontSize: 22, lineHeight: 1.1 }}>{kpis.leadtimeEscala}</p>
            <p className="text-white/40 mt-0.5" style={{ fontSize: 8 }}>
              Esteira completa: Backlog → Escala
            </p>
          </div>

          {/* Leadtime → Piloto */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRight size={12} className="text-white/50" />
              <p className="text-white/60 uppercase" style={{ fontSize: 9, letterSpacing: '0.08em' }}>
                Leadtime → Piloto
              </p>
            </div>
            <p className="text-white font-bold" style={{ fontSize: 22, lineHeight: 1.1 }}>{kpis.leadtimePiloto}</p>
            <p className="text-white/40 mt-0.5" style={{ fontSize: 8 }}>
              Backlog → Piloto
            </p>
          </div>
        </div>

        {/* Cycle Time — Experimentação (geral) */}
        <div className="mt-2">
          <p className="text-white/50 uppercase mb-1.5" style={{ fontSize: 8, letterSpacing: '0.08em' }}>
            Cycle Time (Experimentação)
          </p>
          <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white font-bold" style={{ fontSize: 22, lineHeight: 1.1 }}>
              {data.cycleTimeExperimentacaoGeral?.mediaDias ? `${data.cycleTimeExperimentacaoGeral.mediaDias}d` : '-'}
            </p>
            <p className="text-white/40 mt-0.5" style={{ fontSize: 9 }}>
              {data.cycleTimeExperimentacaoGeral?.qtdIniciativas
                ? `${data.cycleTimeExperimentacaoGeral.qtdIniciativas} epics · mediana ${data.cycleTimeExperimentacaoGeral.medianaDias}d`
                : 'sem dados'}
            </p>
          </div>
        </div>

        {/* Diagnóstico resumido */}
        {data.cycleTimeDiagnostico && (
          <p className="text-white/30 mt-1.5" style={{ fontSize: 8 }}>
            {data.cycleTimeDiagnostico.analisados}/{data.cycleTimeDiagnostico.totalEpics} epics analisados
            {data.cycleTimeDiagnostico.semChangelog > 0 && ` · ${data.cycleTimeDiagnostico.semChangelog} sem changelog`}
          </p>
        )}

        {/* Valor */}
        <div className="rounded-lg p-3 mt-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <p className="text-white/60 uppercase mb-1" style={{ fontSize: 9, letterSpacing: '0.05em' }}>
            Benefício Potencial
          </p>
          <p className="text-white font-bold" style={{ fontSize: 18 }}>{formatBRL(data.beneficioTotal)}</p>
        </div>
      </div>

      {/* Config Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setEditModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: 480, maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <p className="font-bold text-gray-800 text-sm">Configurar — Pipeline de Iniciativas</p>
              <button
                onClick={() => setEditModal(false)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
              <p className="text-xs text-gray-400">
                Escolha a fonte de cada indicador. "Do Jira" usa dados em tempo real; "Fixo" usa o valor que você digitar.
              </p>

              {/* Colunas do Pipeline */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Colunas do Pipeline</p>
                <div className="space-y-2">
                  {COLUNAS.map(c => {
                    const cfg = draftColunas[c.key] ?? { mode: 'jira' as Mode, value: '' }
                    return (
                      <div key={c.key} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <p className="text-sm font-semibold text-gray-800 flex-1">{c.label ?? c.key}</p>
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              background: cfg.mode === 'jira' ? '#DCFCE7' : '#FEF3C7',
                              color:      cfg.mode === 'jira' ? '#166534' : '#92400E',
                            }}
                          >
                            {cfg.mode === 'jira' ? `Jira: ${p[c.key]}` : `Fixo: ${cfg.value || '—'}`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {(['jira', 'fixo'] as Mode[]).map(m => (
                            <button
                              key={m}
                              onClick={() => setColField(c.key, { mode: m })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors"
                              style={{
                                borderColor: cfg.mode === m ? '#CC0000' : '#E5E7EB',
                                background:  cfg.mode === m ? '#FFF0F0' : '#F9FAFB',
                                color:       cfg.mode === m ? '#CC0000' : '#6B7280',
                              }}
                            >
                              <span
                                className="rounded-full border flex-shrink-0"
                                style={{
                                  width: 10, height: 10,
                                  borderColor: cfg.mode === m ? '#CC0000' : '#D1D5DB',
                                  background:  cfg.mode === m ? '#CC0000' : 'white',
                                }}
                              />
                              {m === 'jira' ? 'Do Jira' : 'Valor fixo'}
                            </button>
                          ))}
                          {cfg.mode === 'fixo' && (
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={cfg.value}
                              onChange={e => setColField(c.key, { value: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-red-400 ml-auto"
                              style={{ width: 80 }}
                              autoFocus
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Métricas de Lead Time */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Time (Esteira de Iniciativas)</p>
                <p className="text-xs text-gray-400 mb-2">Tempo médio desde a criação até atingir cada estágio, sem considerar bloqueios.</p>
                <div className="space-y-2">
                  {FUNIL_FIELDS.map(f => (
                    <div key={f.key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <label className="text-sm text-gray-700 flex-1">{f.label}</label>
                      <input
                        type="text"
                        value={draftKpis[f.key]}
                        onChange={e => setDraftKpis(d => ({ ...d, [f.key]: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-red-400"
                        style={{ width: 130 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
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
