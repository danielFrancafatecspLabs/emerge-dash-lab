'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface PresentationSlideDef {
  key: string
  label: string
  node: ReactNode
}

const MARGIN_X = 64
const MARGIN_Y = 120 // reserva espaço pra barra de navegação embaixo

/**
 * Tela cheia sobre TODOS os slides da Weekly, navegável (setas/teclado),
 * escalando o slide fixo de 1280×720 para caber na tela via CSS transform —
 * o conteúdo interno de cada slide nunca muda, só o zoom visual.
 */
export default function PresentationOverlay({
  slides, initialIndex, onClose,
}: {
  slides: PresentationSlideDef[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function computeScale() {
      const availableW = window.innerWidth - MARGIN_X
      const availableH = window.innerHeight - MARGIN_Y
      setScale(Math.max(0.3, Math.min(availableW / 1280, availableH / 720)))
    }
    computeScale()
    window.addEventListener('resize', computeScale)
    return () => window.removeEventListener('resize', computeScale)
  }, [])

  useEffect(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {})
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setIndex(i => Math.min(slides.length - 1, i + 1))
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIndex(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [slides.length, onClose])

  const atFirst = index === 0
  const atLast = index === slides.length - 1

  return (
    <div
      ref={containerRef}
      className="weekly-presentation fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#111827', zIndex: 100 }}
    >
      <button
        onClick={onClose}
        title="Fechar (Esc)"
        className="absolute top-5 right-5 p-2 rounded-full transition-colors"
        style={{ color: 'rgba(255,255,255,0.7)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      >
        <X size={22} />
      </button>

      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        {slides[index].node}
      </div>

      <div className="absolute bottom-6 left-1/2 flex items-center gap-5" style={{ transform: 'translateX(-50%)' }}>
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={atFirst}
          className="p-2 rounded-full disabled:opacity-30 transition-colors"
          style={{ color: '#FFFFFF', background: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600 }}>
          {slides[index].label} · {index + 1}/{slides.length}
        </span>
        <button
          onClick={() => setIndex(i => Math.min(slides.length - 1, i + 1))}
          disabled={atLast}
          className="p-2 rounded-full disabled:opacity-30 transition-colors"
          style={{ color: '#FFFFFF', background: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
