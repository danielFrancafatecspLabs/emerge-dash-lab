'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa } from '@/lib/types'
import { formatBRL, getPipelineStage, META_LABELS } from '@/lib/mappers'
import { TrendingUp, DollarSign, Heart, Zap, Rocket, ArrowUpRight, Target, Eye } from 'lucide-react'
import IniciativaModal from './IniciativaModal'

interface Props { data: DashboardData }

const META_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  EBITDA:  TrendingUp,
  Receita: DollarSign,
  NPS:     Heart,
}

const META_COLORS: Record<string, { bg: string; bar: string; text: string; glow: string }> = {
  EBITDA:  { bg: 'bg-red-50',   bar: 'bg-red-500',   text: 'text-red-700',   glow: 'shadow-red-200' },
  Receita: { bg: 'bg-blue-50',  bar: 'bg-blue-500',  text: 'text-blue-700',  glow: 'shadow-blue-200' },
  NPS:     { bg: 'bg-pink-50',  bar: 'bg-pink-500',  text: 'text-pink-700',  glow: 'shadow-pink-200' },
}

export default function ResumoExecutivo({ data }: Props) {
  const [modal, setModal] = useState<{ title: string; items: Iniciativa[] } | null>(null)

  // ── Pipeline stats (base: experimentos do board 2707, mesma lógica do funil) ──
  const totalExperimentos = data.allEpics.filter(e => e.status?.id !== '10015').length
  const concluidos = data.allEpics.filter(e => e.status?.id === '10003').length
  const emPilotoEscala = data.pipeline['EM PILOTO'] + data.pipeline['EM ESCALA']
  const emEscala = data.pipeline['EM ESCALA']

  const taxaEscala = totalExperimentos > 0 ? Math.round((emEscala / totalExperimentos) * 100) : 0
  const taxaPiloto = totalExperimentos > 0 ? Math.round((emPilotoEscala / totalExperimentos) * 100) : 0

  // ── Metas stats ──
  const metasKeys = ['EBITDA', 'Receita', 'NPS'] as const
  const metasAgregadas = data.metasAgregadas
  const totalMetasValor = metasKeys.reduce((s, k) => s + metasAgregadas[k].valor, 0)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* ── Cabeçalho ── */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1">
              <div className="w-2 h-5 rounded-full bg-red-500" />
              <div className="w-2 h-5 rounded-full bg-blue-500" />
              <div className="w-2 h-5 rounded-full bg-pink-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Resumo Executivo</h2>
              <p className="text-xs text-gray-400">
                Metas estratégicas & pipeline • {data.iniciativas.length} iniciativas (board 2706)
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal({ title: 'Todas as Iniciativas', items: data.iniciativas })}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Eye size={13} />
            Ver todas
          </button>
        </div>

        {/* ── Grid principal: 2 colunas ── */}
        <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* ═══ COLUNA 1: METAS ESTRATÉGICAS ═══ */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Target size={12} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Metas Estratégicas
              </p>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {metasKeys.map(meta => {
                const color = META_COLORS[meta]
                const stats = metasAgregadas[meta]
                const pct = totalMetasValor > 0 ? Math.round((stats.valor / totalMetasValor) * 100) : 0
                const Icon = META_ICONS[meta]
                return (
                  <div
                    key={meta}
                    className={`rounded-lg border p-2.5 cursor-pointer transition-all duration-200 hover:shadow-sm group ${color.bg} border-gray-100`}
                    onClick={() => {
                      const items = data.iniciativasPorMeta[meta] ?? []
                      if (items.length > 0) setModal({ title: META_LABELS[meta] ?? meta, items })
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md p-1 bg-white shadow-sm">
                          <Icon size={11} className={color.text} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{META_LABELS[meta] ?? meta}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-semibold text-gray-500">{stats.count}</span>
                        <ArrowUpRight size={10} className="text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 w-7 text-right">{pct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Iniciativas <strong className="text-gray-700">{stats.count}</strong></span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className={`text-[10px] font-semibold ${color.text}`}>
                        {stats.valor > 0 ? formatBRL(stats.valor) : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ═══ COLUNA 2: PIPELINE DE CONVERSÃO ═══ */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Rocket size={12} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Pipeline de Conversão
              </p>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">

              {/* Card: Benefício Total */}
              <div
                className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2.5 cursor-pointer hover:shadow-sm transition-all duration-200 group"
                onClick={() => {
                  const items = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
                  if (items.length > 0) setModal({ title: 'Iniciativas em escala', items })
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                    <TrendingUp size={12} color="white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Benefício Potencial</p>
                    <p className="text-base font-extrabold text-gray-900 tracking-tight">{formatBRL(data.beneficioTotal)}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">Os números de benefícios exibidos consideram as estimativas fornecidas pelos usuários na etapa de cadastro do experimento.</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-100/60 flex gap-3">
                  {[
                    { label: 'Exp.', count: data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM EXPERIMENTAÇÃO').length, color: 'text-emerald-700' },
                    { label: 'Piloto', count: data.pipeline['EM PILOTO'], color: 'text-amber-700' },
                    { label: 'Escala', count: data.pipeline['EM ESCALA'], color: 'text-red-700' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1">
                      <span className="text-[9px] text-gray-400">{s.label}</span>
                      <span className={`text-xs font-bold ${s.color}`}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: Conversão p/ Escala */}
              <div
                className="rounded-lg border border-red-100 bg-gradient-to-br from-red-50 to-white p-2.5 cursor-pointer hover:shadow-sm transition-all duration-200 group"
                onClick={() => {
                  const items = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
                  if (items.length > 0) setModal({ title: 'Iniciativas em escala', items })
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md p-1.5 bg-gradient-to-br from-red-500 to-red-700 shadow-sm">
                    <Rocket size={12} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Conversão p/ Escala</p>
                      <span className="text-sm font-extrabold text-gray-900">{taxaEscala}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-gray-400">{emEscala} de {totalExperimentos}</span>
                      <div className="w-20 h-1.5 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(taxaEscala, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Conversão p/ Piloto */}
              <div
                className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-2.5 cursor-pointer hover:shadow-sm transition-all duration-200 group"
                onClick={() => {
                  const items = data.iniciativas.filter(i => {
                    const s = getPipelineStage(i.status)
                    return s === 'EM PILOTO' || s === 'EM ESCALA'
                  })
                  if (items.length > 0) setModal({ title: 'Iniciativas em piloto/escala', items })
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                    <Zap size={12} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Conversão p/ Piloto</p>
                      <span className="text-sm font-extrabold text-gray-900">{taxaPiloto}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-gray-400">{emPilotoEscala} de {totalExperimentos}</span>
                      <div className="w-20 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(taxaPiloto, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <IniciativaModal
          title={modal.title}
          iniciativas={modal.items}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}