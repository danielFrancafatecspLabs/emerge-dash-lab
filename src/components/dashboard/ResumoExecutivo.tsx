'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa } from '@/lib/types'
import { formatBRL, getPipelineStage, META_LABELS } from '@/lib/mappers'
import { TrendingUp, DollarSign, Heart, Rocket, ArrowUpRight, Target } from 'lucide-react'
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

  // ── Pipeline stats (base: experimentos do board 2735, mesma lógica do funil) ──
  const totalExperimentos = data.allEpics.filter(e => e.status?.id !== '10015').length
  const concluidos = data.allEpics.filter(e => e.status?.id === '10019').length
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
      <div className="flex flex-col gap-3 h-full">
        {/* ═══ HERO: Benefício Potencial ═══ */}
        <div
          className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2.5 cursor-pointer hover:shadow-sm transition-all duration-200 group"
          onClick={() => {
            const items = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
            if (items.length > 0) setModal({ title: 'Iniciativas em escala', items })
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-md p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
              <TrendingUp size={12} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Benefício Potencial</p>
              <p
                className="text-lg font-extrabold text-gray-900 tracking-tight leading-tight"
                title="Os números de benefícios exibidos consideram as estimativas fornecidas pelos usuários na etapa de cadastro do experimento."
              >
                {formatBRL(data.beneficioTotal)}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100/60 flex gap-3">
            {[
              { label: 'Exp.', count: data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM EXPERIMENTAÇÃO').length, color: 'text-emerald-700' },
              { label: 'Piloto', count: data.pipeline['EM PILOTO'], color: 'text-amber-700' },
              { label: 'Escala', count: data.pipeline['EM ESCALA'], color: 'text-red-700' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">{s.label}</span>
                <span className={`text-xs font-bold ${s.color}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Conversão de pipeline ═══ */}
        <div className="flex items-center gap-1.5">
          <Rocket size={12} className="text-gray-400" />
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            Conversão de Pipeline
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-lg border border-red-100 bg-gradient-to-br from-red-50 to-white p-2 cursor-pointer hover:shadow-sm transition-all duration-200"
            onClick={() => {
              const items = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
              if (items.length > 0) setModal({ title: 'Iniciativas em escala', items })
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Escala</p>
              <span className="text-sm font-extrabold text-gray-900">{taxaEscala}%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(taxaEscala, 2)}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 flex-shrink-0">{emEscala}/{totalExperimentos}</span>
            </div>
          </div>

          <div
            className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-2 cursor-pointer hover:shadow-sm transition-all duration-200"
            onClick={() => {
              const items = data.iniciativas.filter(i => {
                const s = getPipelineStage(i.status)
                return s === 'EM PILOTO' || s === 'EM ESCALA'
              })
              if (items.length > 0) setModal({ title: 'Iniciativas em piloto/escala', items })
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Piloto</p>
              <span className="text-sm font-extrabold text-gray-900">{taxaPiloto}%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(taxaPiloto, 2)}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 flex-shrink-0">{emPilotoEscala}/{totalExperimentos}</span>
            </div>
          </div>
        </div>

        {/* ═══ Metas Estratégicas ═══ */}
        <div className="flex items-center gap-1.5">
          <Target size={12} className="text-gray-400" />
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
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
                className={`rounded-lg border p-2 cursor-pointer transition-all duration-200 hover:shadow-sm group ${color.bg} border-gray-100`}
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
                  <span className={`text-[10px] font-semibold ${color.text}`}>
                    {stats.valor > 0 ? formatBRL(stats.valor) : '—'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 w-7 text-right">{pct}%</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5">
                    {stats.count}
                    <ArrowUpRight size={9} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            )
          })}
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