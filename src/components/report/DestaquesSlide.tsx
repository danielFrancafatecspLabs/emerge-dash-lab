'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Lightbulb, CheckCircle2, FlaskConical, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/lib/mappers'
import { SlideDownloadButtons } from './slideExport'

interface EpicBeneficio {
  nome: string
  valor: number
}

interface DestaquesData {
  iniciativasNovasAgosto: { quantidade: number; nomes: string[] }
  experimentosConcluidosAgosto: { quantidade: number; nomes: string[] }
  novoLaboratorio: { criado: boolean; nome: string }
  beneficioIncrementado30d: { valor: number; epics: EpicBeneficio[] }
}

/* ── Paleta executiva ── */
const RED_PRIMARY = '#7A1212'
const RED_LIGHT = '#FDF2F2'
const RED_BORDER = '#E8C5C5'
const RED_MUTED = '#A53A3A'
const RED_ACCENT = '#B91C1C'

/* ── Estilo consistente para os 4 cards ── */
const CARD_BASE = 'rounded-xl border p-5 flex flex-col gap-3'
const CARD_BORDER = 'border-[#E0D0D0]'
const CARD_BG = 'bg-white'

export default function DestaquesSlide() {
  const [data, setData] = useState<DestaquesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/jira/api/destaques', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json.error) {
          setError(json.error)
        } else {
          setData(json)
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
        <Sparkles size={14} className="animate-pulse" />
        <span>Carregando destaques...</span>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const { iniciativasNovasAgosto, experimentosConcluidosAgosto, novoLaboratorio, beneficioIncrementado30d } = data

  return (
    <div className="flex flex-col gap-2">
      <div className="no-print flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Slide 1 de 1
        </p>
        <SlideDownloadButtons
          targetRef={slideRef}
          filename="destaques-do-mes"
        />
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
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Destaques do Mês
          </h2>
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-9 w-auto brightness-0 invert" />
        </div>

        {/* ── Grid 2×2 de cards executivos ── */}
        <div className="grid gap-5 grid-cols-2">
          {/* ── Card 1: Novas Iniciativas ── */}
          <div className={`${CARD_BASE} ${CARD_BORDER} ${CARD_BG}`}>
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 rounded-xl p-3 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <Lightbulb size={22} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: RED_PRIMARY }}>
                  {iniciativasNovasAgosto.quantidade}
                </p>
                <p className="text-sm font-bold leading-tight mt-1" style={{ color: RED_MUTED }}>
                  Novas Iniciativas
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">criadas em agosto/2026</p>
              </div>
            </div>
            {iniciativasNovasAgosto.nomes.length > 0 && (
              <div className="border-t border-[#E8D8D8] pt-3 mt-1">
                <ul className="text-xs text-gray-600 space-y-1 leading-snug">
                  {iniciativasNovasAgosto.nomes.map((nome, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                      <span>{nome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Card 2: Experimentos Concluídos ── */}
          <div className={`${CARD_BASE} ${CARD_BORDER} ${CARD_BG}`}>
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 rounded-xl p-3 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <CheckCircle2 size={22} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: RED_PRIMARY }}>
                  {experimentosConcluidosAgosto.quantidade}
                </p>
                <p className="text-sm font-bold leading-tight mt-1" style={{ color: RED_MUTED }}>
                  Experimentos Concluídos
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">concluídos em agosto/2026</p>
              </div>
            </div>
            {experimentosConcluidosAgosto.nomes.length > 0 && (
              <div className="border-t border-[#E8D8D8] pt-3 mt-1">
                <ul className="text-xs text-gray-600 space-y-1 leading-snug">
                  {experimentosConcluidosAgosto.nomes.map((nome, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                      <span>{nome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Card 3: Novo Laboratório ── */}
          <div className={`${CARD_BASE} ${CARD_BORDER} ${CARD_BG}`}>
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 rounded-xl p-3 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <FlaskConical size={22} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: RED_PRIMARY }}>
                  {novoLaboratorio.criado ? '1' : '0'}
                </p>
                <p className="text-sm font-bold leading-tight mt-1" style={{ color: RED_MUTED }}>
                  Novo Lab. de Experimentação
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">criado em agosto/2026</p>
              </div>
            </div>
            {novoLaboratorio.criado && (
              <div className="border-t border-[#E8D8D8] pt-3 mt-1">
                <p className="text-xs font-bold" style={{ color: RED_ACCENT }}>
                  {novoLaboratorio.nome}
                </p>
              </div>
            )}
          </div>

          {/* ── Card 4: Benefício Incrementado ── */}
          <div className={`${CARD_BASE} ${CARD_BORDER} ${CARD_BG}`}>
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 rounded-xl p-3 shadow-sm"
                style={{ backgroundColor: RED_PRIMARY }}
              >
                <TrendingUp size={22} color="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: RED_PRIMARY }}>
                  {formatBRL(beneficioIncrementado30d.valor)}
                </p>
                <p className="text-sm font-bold leading-tight mt-1" style={{ color: RED_MUTED }}>
                  Benefício Incrementado
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">nos últimos 30 dias</p>
              </div>
            </div>
            {beneficioIncrementado30d.epics.length > 0 && (
              <div className="border-t border-[#E8D8D8] pt-3 mt-1">
                <ul className="text-xs text-gray-600 space-y-1 leading-snug">
                  {beneficioIncrementado30d.epics.map((ep, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RED_ACCENT }} />
                      <span>
                        {ep.nome} — <span className="font-bold" style={{ color: RED_ACCENT }}>{formatBRL(ep.valor)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Rodapé com paginação ── */}
        <p className="absolute bottom-3 right-6 text-gray-300" style={{ fontSize: 10 }}>
          01/01
        </p>
      </div>
    </div>
  )
}