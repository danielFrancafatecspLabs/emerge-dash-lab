'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa, EpicDetail } from '@/lib/types'
import { formatBRL, getPipelineStage, META_LABELS } from '@/lib/mappers'
import {
  TrendingUp, DollarSign, Heart, Wallet, List,
  Beaker, BarChart3, ExternalLink, ArrowUpRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import IniciativaModal from './IniciativaModal'
import EpicModal from './EpicModal'

interface Props { data: DashboardData; beneficioValidadoTotal: number }

const META_ICONS: Record<string, LucideIcon> = {
  EBITDA:  TrendingUp,
  Receita: DollarSign,
  NPS:     Heart,
}

const META_STYLE: Record<string, { bar: string; dot: string; from: string; via: string; label: string }> = {
  EBITDA:  { bar: 'bg-gradient-to-r from-red-700 to-red-500', dot: 'bg-red-700', from: 'from-red-700/10', via: 'via-red-500/5', label: 'text-red-800' },
  Receita: { bar: 'bg-gradient-to-r from-red-600 to-red-400', dot: 'bg-red-600', from: 'from-red-600/10', via: 'via-red-400/5', label: 'text-red-700' },
  NPS:     { bar: 'bg-gradient-to-r from-red-500 to-red-300', dot: 'bg-red-500', from: 'from-red-500/10', via: 'via-red-300/5', label: 'text-red-600' },
}

export default function ResumoExecutivo({ data, beneficioValidadoTotal }: Props) {
  const [modal, setModal] = useState<{ title: string; items: Iniciativa[] } | null>(null)
  const [epicModal, setEpicModal] = useState<{ title: string; epics: EpicDetail[] } | null>(null)
  const pctValidado = data.beneficioTotal > 0 ? Math.round((beneficioValidadoTotal / data.beneficioTotal) * 100) : 0

  const metasKeys = ['EBITDA', 'Receita', 'NPS'] as const
  const metasAgregadas = data.metasAgregadas
  const totalMetasValor = metasKeys.reduce((s, k) => s + metasAgregadas[k].valor, 0)

  return (
    <>
      <div className="flex flex-col gap-2.5 h-full select-none">
        {/* ════════════════════════════════════════
            CARD PRINCIPAL — Benefício Potencial
            ════════════════════════════════════════ */}
        <div
          className="relative rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 p-3 cursor-pointer hover:shadow-lg hover:border-gray-200 transition-all duration-300 group overflow-hidden"
          onClick={() => {
            const items = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
            if (items.length > 0) setModal({ title: 'Iniciativas em escala', items })
          }}
        >
          {/* Glow decorativo */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-400/20 transition-all duration-500" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-red-300/10 rounded-full blur-xl pointer-events-none" />

          {/* Linha superior: label + ações */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-gradient-to-br from-red-600 to-red-800 shadow-md shadow-red-200/50 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <TrendingUp size={13} color="white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                  Benefício Potencial
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); setEpicModal({ title: 'Experimentos que contribuem para o Benefício Potencial', epics: data.allEpics.filter(e => (e.beneficioQuantitativo ?? 0) > 0) }) }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex-shrink-0"
                title="Ver experimentos que contribuem para o benefício potencial"
              >
                <List size={9} /> Ver experimentos
              </button>
              <Link
                href="/beneficios"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all flex-shrink-0"
                title="Abrir Controle Financeiro de Benefícios"
              >
                <Wallet size={9} /> Financeiro
              </Link>
            </div>
          </div>

          {/* Valor principal */}
          <div className="mt-2 relative z-10">
            <p
              className="text-xl font-black text-gray-900 tracking-tight leading-none"
              title="Os números de benefícios exibidos consideram as estimativas fornecidas pelos usuários na etapa de cadastro do experimento."
            >
              {formatBRL(data.beneficioTotal)}
            </p>
            <Link
              href="/beneficios"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-1 group/link"
              title="Ver detalhamento no Controle Financeiro"
            >
              <span className="text-[9px] text-gray-400 group-hover/link:text-gray-600 transition-colors">
                <strong className="text-red-600 font-bold">{formatBRL(beneficioValidadoTotal)}</strong> validado pelo financeiro
              </span>
              <span className="text-[9px] text-gray-300 group-hover/link:text-red-500 transition-colors">
                ({pctValidado}%)
              </span>
              <ExternalLink size={8} className="text-gray-300 group-hover/link:text-red-500 transition-colors" />
            </Link>
          </div>

          {/* Barra de progresso validação */}
          <div className="mt-2.5 relative z-10">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
                style={{ width: `${Math.max(pctValidado, 2)}%` }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[7px] text-gray-300">0%</span>
              <span className="text-[7px] text-gray-300">100%</span>
            </div>
          </div>

          {/* Separador */}
          <div className="my-2.5 border-t border-gray-100 relative z-10" />

          {/* Apenas: experimentos com benefício potencial identificado */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-gradient-to-br from-red-500 to-red-700 shadow-sm flex-shrink-0">
                  <Beaker size={11} color="white" />
                </div>
                <div>
                  <p className="text-[9px] font-medium text-gray-500">
                    Experimentos com benefício potencial
                  </p>
                  <p className="text-lg font-black text-gray-900 tracking-tight leading-none mt-0.5">
                    {data.allEpics.filter(e => (e.beneficioQuantitativo ?? 0) > 0 && e.status?.id !== '10015').length}
                  </p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setEpicModal({ title: 'Experimentos com Benefício Potencial Identificado', epics: data.allEpics.filter(e => (e.beneficioQuantitativo ?? 0) > 0 && e.status?.id !== '10015') }) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex-shrink-0"
              >
                <List size={10} /> Listar
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            METAS ESTRATÉGICAS
            ════════════════════════════════════════ */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-3 w-0.5 rounded-full bg-gradient-to-b from-gray-300 to-gray-200" />
          <BarChart3 size={10} className="text-gray-400" />
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">
            Metas Estratégicas
          </p>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-100 to-transparent" />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          {metasKeys.map(meta => {
            const style = META_STYLE[meta]
            const stats = metasAgregadas[meta]
            const pct = totalMetasValor > 0 ? Math.round((stats.valor / totalMetasValor) * 100) : 0
            const Icon = META_ICONS[meta]
            const temValor = stats.valor > 0
            return (
              <div
                key={meta}
                className="group relative rounded-xl border border-gray-100 bg-white px-2.5 py-2 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => {
                  const items = data.iniciativasPorMeta[meta] ?? []
                  if (items.length > 0) setModal({ title: META_LABELS[meta] ?? meta, items })
                }}
              >
                {/* Faixa decorativa lateral */}
                <div className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${style.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="flex items-center gap-2.5">
                  {/* Ícone */}
                  <div className={`rounded-lg p-1.5 flex-shrink-0 bg-gradient-to-br ${style.from} ${style.via} border border-gray-100 group-hover:scale-105 transition-transform duration-200`}>
                    <Icon size={11} className={style.label} />
                  </div>

                  {/* Label + barra */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-gray-700 truncate">
                        {META_LABELS[meta] ?? meta}
                      </span>
                      <span className={`text-[9px] font-extrabold flex-shrink-0 ${temValor ? style.label : 'text-gray-300'}`}>
                        {temValor ? formatBRL(stats.valor) : '—'}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[8px] text-gray-400 font-medium">
                        {stats.count} {stats.count === 1 ? 'iniciativa' : 'iniciativas'}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400">{pct}%</span>
                    </div>
                  </div>

                  {/* Seta indicadora */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowUpRight size={10} className="text-gray-300" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal de Iniciativas ── */}
      {modal && (
        <IniciativaModal
          title={modal.title}
          iniciativas={modal.items}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal de Experimentos ── */}
      {epicModal && (
        <EpicModal
          title={epicModal.title}
          epics={epicModal.epics}
          onClose={() => setEpicModal(null)}
        />
      )}
    </>
  )
}