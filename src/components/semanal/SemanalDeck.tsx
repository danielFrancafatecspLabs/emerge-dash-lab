'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Maximize2, Presentation } from 'lucide-react'
import type { SemanalData, SemanalSecaoId } from '@/lib/semanal'
import PresentationOverlay from '@/components/weekly/PresentationOverlay'
import ResumoSlide from './ResumoSlide'
import ListaSlide, { LINHAS_POR_PAGINA } from './ListaSlide'
import { CapaSlide, DivisorSlide, ObjetivoSlide, ObrigadoSlide, SLIDE_H, SLIDE_W } from './SlideArt'

const RED = '#8B0000'
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

interface SlideDef {
  key: string
  label: string
  anchor?: string            // id para rolar até o slide ("DETALHES" / voltar)
  render: (nav: Navegacao) => ReactNode
}

interface Navegacao {
  irPara: (anchor: string) => void
}

/** Escala um slide fixo de 1280×720 para a largura disponível. */
function FitSlide({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const calc = () => setScale(Math.min(1, el.clientWidth / SLIDE_W))
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: '100%', maxWidth: SLIDE_W }}>
      <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, overflow: 'hidden', borderRadius: 6, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  )
}

function montarSlides(data: SemanalData): SlideDef[] {
  const d = new Date(data.geradoEm)
  const mes = MESES[d.getMonth()]
  const periodo = `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${d.getFullYear()}`
  const ateLabel = `até ${mes.slice(0, 3)}/${String(d.getFullYear()).slice(2)}`

  const slides: SlideDef[] = [
    { key: 'capa', label: 'Capa', render: () => <CapaSlide periodo={periodo} /> },
    { key: 'objetivo', label: 'Objetivo', render: () => <ObjetivoSlide /> },
    {
      key: 'resumo', label: 'beOn Labs — visão geral', anchor: 'resumo',
      render: nav => <ResumoSlide resumo={data.resumo} ateLabel={ateLabel} onDetalhes={(id: SemanalSecaoId) => nav.irPara(id)} />,
    },
  ]

  for (const secao of data.secoes) {
    slides.push({
      key: `div-${secao.id}`, label: secao.divisor.join(' '),
      render: () => <DivisorSlide linhas={secao.divisor} icone={secao.id === 'andamento' ? 'flask' : 'check'} />,
    })
    const porPagina = LINHAS_POR_PAGINA[secao.id]
    const paginas = Math.max(1, Math.ceil(secao.rows.length / porPagina))
    for (let p = 0; p < paginas; p++) {
      slides.push({
        key: `${secao.id}-${p}`,
        label: `${secao.titulo}${paginas > 1 ? ` (${p + 1}/${paginas})` : ''}`,
        anchor: p === 0 ? secao.id : undefined,
        render: nav => (
          <ListaSlide
            secao={secao.id}
            titulo={secao.titulo}
            subtitulo={secao.subtitulo}
            rows={secao.rows.slice(p * porPagina, (p + 1) * porPagina)}
            todas={secao.rows}
            onVoltar={() => nav.irPara('resumo')}
          />
        ),
      })
    }
  }

  slides.push({ key: 'obrigado', label: 'Obrigado', render: () => <ObrigadoSlide /> })
  return slides
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
        <button
          onClick={() => setPresentIndex(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
          style={{ background: RED }}
        >
          <Presentation size={13} />
          Apresentar
        </button>
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
