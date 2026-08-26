'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa } from '@/lib/types'
import { formatBRL, getPipelineStage, META_LABELS } from '@/lib/mappers'
import { TrendingUp, DollarSign, Heart, Rocket, Target } from 'lucide-react'
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
      <div className="flex flex-col gap-2 h-full">
        {/* ═══ HERO: Benefício Potencial ═══ */}
        <div
          className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2 cursor-pointer hover:shadow-sm transition-all duration-200 group"
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
          <div className="mt-1.5 pt-1.5 border-t border-emerald-100/60 flex items-center justify-between">
            <div className="flex gap-3">
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
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Rocket size={10} className="text-gray-300" />
              <span>conv. piloto <strong className="text-gray-600">{taxaPiloto}%</strong> · escala <strong className="text-gray-600">{taxaEscala}%</strong></span>
            </div>
          </div>
        </div>

        {/* ═══ Metas Estratégicas ═══ */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Target size={11} className="text-gray-400" />
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Metas Estratégicas
          </p>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {metasKeys.map(meta => {
            const color = META_COLORS[meta]
            const stats = metasAgregadas[meta]
            const pct = totalMetasValor > 0 ? Math.round((stats.valor / totalMetasValor) * 100) : 0
            const Icon = META_ICONS[meta]
            return (
              <div
                key={meta}
                className={`rounded-lg border px-2 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-sm group flex items-center gap-2 ${color.bg} border-gray-100`}
                onClick={() => {
                  const items = data.iniciativasPorMeta[meta] ?? []
                  if (items.length > 0) setModal({ title: META_LABELS[meta] ?? meta, items })
                }}
              >
                <Icon size={11} className={`${color.text} flex-shrink-0`} />
                <span className="text-[11px] font-bold text-gray-800 flex-shrink-0 w-[118px] truncate">{META_LABELS[meta] ?? meta}</span>
                <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-400 w-7 text-right flex-shrink-0">{pct}%</span>
                <span className={`text-[10px] font-semibold flex-shrink-0 w-11 text-right ${color.text}`}>
                  {stats.valor > 0 ? formatBRL(stats.valor) : '—'}
                </span>
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