'use client'

import { useRef, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Database,
  Gauge,
  Lightbulb,
  Clock3,
  BarChart3,
  CircleAlert,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { SlideDownloadButtons } from './slideExport'
import type { BloqueiosResponse, BloqueioCategoria, BloqueioItem } from '@/app/api/bloqueios/route'

/* ── Paleta executiva (design system dos slides) ── */
const RED_PRIMARY = '#7A1212'
const RED_MUTED = '#A53A3A'
const RED_ACCENT = '#B91C1C'
const RED_BORDER = '#E0D0D0'
const RED_LIGHT = '#FDF2F2'

/* ── Estilo consistente de cards ── */
const CARD_BASE = 'rounded-xl border p-5 flex flex-col gap-3 bg-white'
const CARD_BORDER = 'border-[#E0D0D0]'

/* ── Mapa de ícones por categoria ── */
const ICON_MAP: Record<string, React.ElementType> = {
  'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO': AlertTriangle,
  'AMOSTRA DE DADOS PENDENTE': Database,
  'BENEFÍCIO POTENCIAL NÃO MAPEADO': BarChart3,
  'OUTRAS QUESTÕES ADVERSAS': CircleAlert,
  'AGUARDANDO AMBIENTE': Clock3,
}

export default function BloqueiosPorProblemaSlide() {
  const slideRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<BloqueiosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/bloqueios')
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        return res.json()
      })
      .then((json: BloqueiosResponse) => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="no-print flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Slide 1 de 1</p>
          <SlideDownloadButtons targetRef={slideRef} filename="bloqueios-das-iniciativas-por-problema" />
        </div>
        <div className="bg-white rounded-2xl p-8 flex items-center justify-center" style={{ minWidth: 1180, minHeight: 500 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: RED_PRIMARY }} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-2">
        <div className="no-print flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Slide 1 de 1</p>
          <SlideDownloadButtons targetRef={slideRef} filename="bloqueios-das-iniciativas-por-problema" />
        </div>
        <div className="bg-white rounded-2xl p-8 flex items-center justify-center" style={{ minWidth: 1180, minHeight: 500 }}>
          <p className="text-sm text-red-600">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  const { categorias, metricas } = data

  const metricCards = [
    { label: 'problemas principais', value: metricas.totalProblemas, icon: Lightbulb },
    { label: 'iniciativas impactadas', value: metricas.totalImpactadas, icon: Gauge },
    { label: 'iniciativas sem benefício identificado', value: metricas.semBeneficio, icon: TrendingUp },
    { label: 'iniciativas com ambiente dependente', value: metricas.aguardandoAmbiente, icon: Clock3 },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="no-print flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Slide 1 de 1
        </p>
        <SlideDownloadButtons targetRef={slideRef} filename="bloqueios-das-iniciativas-por-problema" />
      </div>

      {/* ═══ Slide exportável ═══ */}
      <div
        ref={slideRef}
        className="relative bg-white rounded-2xl p-8"
        style={{ minWidth: 1180 }}
      >
        {/* ── Cabeçalho: barra vermelha com logo ── */}
        <div
          className="flex items-center justify-between rounded-xl px-6 py-4 mb-6"
          style={{ backgroundColor: RED_PRIMARY }}
        >
          <div className="flex items-center gap-3">
            <CircleAlert size={22} className="text-white/80" />
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Bloqueios das Iniciativas por Problema
            </h2>
          </div>
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-9 w-auto brightness-0 invert" />
        </div>

        {/* ── Resumo Executivo (4 cards) ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: RED_MUTED }}>
            Comitê BeOn Labs
          </p>
          <div className="flex gap-3">
            {metricCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className={`${CARD_BASE} ${CARD_BORDER} flex-row items-center gap-3 p-3 min-w-[140px]`}>
                <div
                  className="flex-shrink-0 rounded-xl p-2 shadow-sm"
                  style={{ backgroundColor: RED_PRIMARY }}
                >
                  <Icon size={16} color="white" />
                </div>
                <div>
                  <p className="text-xl font-extrabold leading-none" style={{ color: RED_PRIMARY }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-tight mt-0.5" style={{ color: RED_MUTED }}>
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Grid de cards de bloqueio (dinâmico) ── */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {categorias.map((cat: any) => {
            const Icon = ICON_MAP[cat.titulo] ?? CircleAlert
            return (
              <div
                key={cat.titulo}
                className="rounded-xl border p-3 flex flex-col"
                style={{ background: cat.bg, borderColor: cat.border, minHeight: 380 }}
              >
                <div className="flex items-start gap-2 mb-3">
                  <div className="flex-shrink-0 rounded-full border border-white/80 p-2 shadow-sm" style={{ background: cat.accent }}>
                    <Icon size={16} color="white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: cat.accent }}>
                      {cat.titulo}
                    </div>
                    <div className="mt-1 text-[26px] font-black leading-none" style={{ color: cat.accent }}>
                      {cat.count}
                    </div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em]" style={{ color: RED_MUTED }}>
                      iniciativas
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-[10px] leading-[1.35] text-[#374151] flex-1 overflow-hidden">
                  {cat.items.map((item: BloqueioItem) => (
                    <div key={item.key} className="flex gap-2 items-start">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: cat.accent }} />
                      <span className="font-semibold">{item.nome}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-3 rounded-xl border px-2 py-2 text-[9px] leading-[1.4]"
                  style={{ background: 'rgba(255,255,255,0.6)', borderColor: cat.border, color: '#374151' }}
                >
                  <span className="font-bold" style={{ color: cat.accent }}>Impacta:</span> {cat.footer.replace('Impacta: ', '')}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Cards inferiores: Amostra de Dados + Lista ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${CARD_BASE} ${CARD_BORDER}`}>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-xl p-2.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <AlertTriangle size={18} color="white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: RED_MUTED }}>
                Amostra de Dados
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-[#374151]">
              {[
                { label: 'Em Validação', value: 4 },
                { label: 'Em Andamento', value: 10 },
                { label: 'Em Experimentação', value: 15 },
                { label: 'Total', value: metricas.totalImpactadas },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2 text-center">
                  <div className="text-[20px] font-black leading-none" style={{ color: RED_PRIMARY }}>{value}</div>
                  <div className="mt-1 uppercase tracking-[0.08em] text-[#4b5563]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD_BASE} ${CARD_BORDER}`}>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-xl p-2.5 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <BarChart3 size={18} color="white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: RED_MUTED }}>
                Iniciativas em Experimentação (sem benefício quantitativo)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-[#374151]">
              {(() => {
                // Pega os nomes dos epics sem benefício da categoria BENEFÍCIO POTENCIAL NÃO MAPEADO
                const semBeneficio = categorias
                  .find((c: BloqueioCategoria) => c.titulo === 'BENEFÍCIO POTENCIAL NÃO MAPEADO')
                  ?.items.slice(0, 8) ?? []
                const metade = Math.ceil(semBeneficio.length / 2)
                const col1 = semBeneficio.slice(0, metade)
                const col2 = semBeneficio.slice(metade)
                return (
                  <>
                    <ul className="space-y-1">
                      {col1.map((item: BloqueioItem) => <li key={item.key}>• {item.nome}</li>)}
                    </ul>
                    <ul className="space-y-1">
                      {col2.map((item: BloqueioItem) => <li key={item.key}>• {item.nome}</li>)}
                    </ul>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
