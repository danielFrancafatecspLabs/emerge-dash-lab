'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Download, Maximize2, Presentation } from 'lucide-react'
import type { SemanalData, SemanalSecaoId } from '@/lib/semanal'
import { montarPaginas } from '@/lib/semanal-deck'
import PresentationOverlay from '@/components/weekly/PresentationOverlay'
import FitSlide from '@/components/weekly/FitSlide'
import ResumoSlide from './ResumoSlide'
import CancelamentoSlide from './CancelamentoSlide'
import ListaSlide from './ListaSlide'
import { CapaSlide, DivisorSlide, ObjetivoSlide, ObrigadoSlide, SLIDE_W } from './SlideArt'

const RED = '#8B0000'

interface SlideDef {
  key: string
  label: string
  anchor?: string            // id para rolar até o slide ("DETALHES" / voltar)
  render: (nav: Navegacao) => ReactNode
}

interface Navegacao {
  irPara: (anchor: string) => void
}

function montarSlides(data: SemanalData): SlideDef[] {
  return montarPaginas(data).map((pg): SlideDef => {
    const base = { key: pg.key, label: pg.label, anchor: pg.anchor }
    switch (pg.tipo) {
      case 'capa': return { ...base, render: () => <CapaSlide periodo={pg.periodo} /> }
      case 'objetivo': return { ...base, render: () => <ObjetivoSlide /> }
      case 'resumo': return { ...base, render: nav => <ResumoSlide resumo={data.resumo} ateLabel={pg.ateLabel} onDetalhes={(id: SemanalSecaoId) => nav.irPara(id)} /> }
      case 'cancelamento': return { ...base, render: () => <CancelamentoSlide cancelamento={pg.cancelamento} /> }
      case 'divisor': return { ...base, render: () => <DivisorSlide linhas={pg.linhas} icone={pg.icone} /> }
      case 'lista': return {
        ...base,
        render: nav => <ListaSlide secao={pg.secao} titulo={pg.titulo} subtitulo={pg.subtitulo} rows={pg.rows} todas={pg.todas} onVoltar={() => nav.irPara('resumo')} />,
      }
      case 'obrigado': return { ...base, render: () => <ObrigadoSlide /> }
    }
  })
}

export default function SemanalDeck() {
  const [data, setData] = useState<SemanalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [presentIndex, setPresentIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/jira/api/semanal', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => setData(json))
      .catch(err => setError(err.message))
  }, [])

  const slides = useMemo(() => (data ? montarSlides(data) : []), [data])

  // Links como /semanal#semanal-escala (DETALHES do PPTX, endereços antigos da Weekly): rola até o slide.
  useEffect(() => {
    if (!slides.length || !window.location.hash.startsWith('#semanal-')) return
    requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }))
  }, [slides])

  // Na página: rola até o slide. Na apresentação: troca o slide exibido.
  const navPagina: Navegacao = useMemo(() => ({
    irPara: (anchor: string) => document.getElementById(`semanal-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  }), [])
  const navApresentacao = useCallback((anchor: string) => {
    const idx = slides.findIndex(s => s.anchor === anchor)
    if (idx >= 0) setPresentIndex(idx)
  }, [slides])

  const slidesApresentacao = useMemo(() => slides.map(s => ({
    key: s.key, label: s.label, node: s.render({ irPara: navApresentacao }),
  })), [slides, navApresentacao])

  if (error) return <p className="text-sm" style={{ color: RED }}>Erro ao carregar dados: {error}</p>
  if (!data) return <p className="text-sm text-gray-400">Carregando dados do Jira…</p>

  const geradoEmLabel = new Date(data.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: SLIDE_W }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {data.isSample && (
            <span
              style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '3px 8px', borderRadius: 999 }}
              title="O Jira não respondeu; estes são dados de exemplo para pré-visualizar o layout."
            >
              Dados de exemplo (Jira indisponível)
            </span>
          )}
          <span className="text-xs text-gray-400">Gerado em {geradoEmLabel} · {slides.length} páginas</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/jira/api/semanal/pptx"
            download
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            title="Deck completo em PowerPoint editável, com o mesmo design e os dados atuais do Jira"
          >
            <Download size={13} />
            Baixar PPTX editável
          </a>
          <button
            onClick={() => setPresentIndex(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: RED }}
          >
            <Presentation size={13} />
            Apresentar
          </button>
        </div>
      </div>

      {slides.map((s, i) => (
        <section key={s.key} id={s.anchor ? `semanal-${s.anchor}` : undefined} className="flex flex-col gap-2" style={{ scrollMarginTop: 16 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{i + 1}. {s.label}</span>
            <button onClick={() => setPresentIndex(i)} className="text-gray-400 hover:text-gray-700" title="Apresentar a partir deste slide">
              <Maximize2 size={14} />
            </button>
          </div>
          <FitSlide>{s.render(navPagina)}</FitSlide>
        </section>
      ))}

      {presentIndex !== null && (
        <PresentationOverlay
          key={presentIndex}
          slides={slidesApresentacao}
          initialIndex={presentIndex}
          onClose={() => setPresentIndex(null)}
        />
      )}
    </div>
  )
}
