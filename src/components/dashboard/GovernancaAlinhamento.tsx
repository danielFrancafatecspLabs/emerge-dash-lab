'use client'

import { useState, useEffect } from 'react'
import { DashboardData } from '@/lib/types'
import { Settings, X } from 'lucide-react'

interface Props { data: DashboardData }

const LS_KEY = 'risco-portfolio-v1'

type Mode = 'jira' | 'fixo'
interface FieldConfig { mode: Mode; value: string }
interface RiscoConfig {
  bloqueadosIA:       FieldConfig
  aguardandoDelivery: FieldConfig
  semSponsor:         FieldConfig
}

const BLOQUEIOS = [
  'Dados e integrações',
  'Tempo de aprovação',
  'Recursos especializados',
  'Infraestrutura',
]

const DEFAULTS: RiscoConfig = {
  bloqueadosIA:       { mode: 'jira', value: '' },
  aguardandoDelivery: { mode: 'jira', value: '' },
  semSponsor:         { mode: 'jira', value: '' },
}

const FIELDS: {
  key: keyof RiscoConfig
  label: string
  cardLabel: string
  icon: string
  color: string
  bg: string
  border: string
  compute: (epics: DashboardData['allEpics']) => number
}[] = [
  {
    key: 'bloqueadosIA',
    label: 'Bloqueados em IA',
    cardLabel: 'Bloqueados\nem IA',
    icon: '🚧',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    compute: epics => epics.filter(e => !!e.motivoBloqueio).length,
  },
  {
    key: 'aguardandoDelivery',
    label: 'Aguardando Delivery',
    cardLabel: 'Ag.\nDelivery',
    icon: '⏳',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    compute: epics => epics.filter(e => e.status.id === '10067').length,
  },
  {
    key: 'semSponsor',
    label: 'Sem Sponsor',
    cardLabel: 'Sem\nSponsor',
    icon: '👤',
    color: '#6B7280',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    compute: epics => epics.filter(e => !e.sponsor).length,
  },
]

export default function GovernancaAlinhamento({ data }: Props) {
  const [config, setConfig] = useState<RiscoConfig>(DEFAULTS)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState<RiscoConfig>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setConfig(JSON.parse(saved) as RiscoConfig)
    } catch {}
  }, [])

  function openModal() {
    setDraft(structuredClone(config))
    setModal(true)
  }

  function save() {
    setConfig(draft)
    try { localStorage.setItem(LS_KEY, JSON.stringify(draft)) } catch {}
    setModal(false)
  }

  function setField(key: keyof RiscoConfig, patch: Partial<FieldConfig>) {
    setDraft(d => ({ ...d, [key]: { ...d[key], ...patch } }))
  }

  function getCount(f: typeof FIELDS[number]): number {
    const cfg = config[f.key]
    if (cfg.mode === 'fixo') {
      const n = parseInt(cfg.value, 10)
      return isNaN(n) ? 0 : n
    }
    return f.compute(data.allEpics)
  }

  return (
    <>
      <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 h-full flex flex-col gap-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Risco do Portfólio
          </p>
          <button
            onClick={openModal}
            className="rounded p-1.5 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Configurar campos"
          >
            <Settings size={13} />
          </button>
        </div>

        {/* 3 KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.map(f => {
            const count = getCount(f)
            const isFixed = config[f.key].mode === 'fixo'
            return (
              <div
                key={f.key}
                className="rounded-lg p-3 flex flex-col items-center text-center border"
                style={{ background: f.bg, borderColor: f.border }}
              >
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span
                  className="font-bold tabular-nums mt-1"
                  style={{ fontSize: 22, color: f.color, lineHeight: 1 }}
                >
                  {count}
                </span>
                <span
                  className="text-gray-500 mt-1 leading-tight whitespace-pre-line"
                  style={{ fontSize: 9 }}
                >
                  {f.cardLabel}
                </span>
                {isFixed && (
                  <span
                    className="mt-1 px-1 rounded"
                    style={{ fontSize: 8, background: '#F3F4F6', color: '#9CA3AF' }}
                  >
                    fixo
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Principais Bloqueios */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700 mb-2">Principais Bloqueios</p>
          <div className="space-y-1.5">
            {BLOQUEIOS.map(b => (
              <div key={b} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#CC0000' }}
                />
                <span className="text-gray-700" style={{ fontSize: 10 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: 440, maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <p className="font-bold text-gray-800 text-sm">Configurar — Risco do Portfólio</p>
              <button
                onClick={() => setModal(false)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-gray-400">
                Escolha a fonte de cada indicador. "Do Jira" usa dados em tempo real; "Fixo" usa o valor que você digitar.
              </p>
              {FIELDS.map(f => {
                const cfg = draft[f.key]
                return (
                  <div key={f.key} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span style={{ fontSize: 14 }}>{f.icon}</span>
                      <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          background: cfg.mode === 'jira' ? '#DCFCE7' : '#FEF3C7',
                          color:      cfg.mode === 'jira' ? '#166534' : '#92400E',
                        }}
                      >
                        {cfg.mode === 'jira'
                          ? `Jira: ${f.compute(data.allEpics)}`
                          : `Fixo: ${cfg.value || '—'}`}
                      </span>
                    </div>

                    {/* Toggle */}
                    <div className="flex gap-2">
                      {(['jira', 'fixo'] as Mode[]).map(m => (
                        <button
                          key={m}
                          onClick={() => setField(f.key, { mode: m })}
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
                          onChange={e => setField(f.key, { value: e.target.value })}
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

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
              <button
                onClick={() => setModal(false)}
                className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="px-4 py-1.5 rounded text-sm text-white font-medium hover:opacity-90 transition-opacity"
                style={{ background: '#CC0000' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
