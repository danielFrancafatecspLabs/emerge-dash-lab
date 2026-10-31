'use client'

// Briefing em 2 minutos: as principais notícias da edição, uma por tela, como stories. Setas do teclado, toque nas
// laterais ou deslizar avançam e voltam; Esc fecha. Cada tela leva à matéria completa na fonte.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Noticia } from '@/lib/newsletter/edicao'
import { cx, focusRing } from '@/components/ui'
import { IDENTIDADE, ImagemDaNoticia, MetaDaNoticia, SeloDaSecao } from './identidade'

export function Briefing({ noticias, onFechar, onLer, lidas }: {
  noticias: Noticia[]
  onFechar: () => void
  onLer: (id: string) => void
  lidas: Set<string>
}) {
  const [i, setI] = useState(0)
  const fim = i >= noticias.length
  const toque = useRef<number | null>(null)
  // Um deslize termina com um clique: esse clique não pode avançar de novo.
  const deslizou = useRef(false)

  const ir = useCallback((d: 1 | -1) => setI(x => Math.min(noticias.length, Math.max(0, x + d))), [noticias.length])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
      else if (e.key === 'ArrowRight') ir(1)
      else if (e.key === 'ArrowLeft') ir(-1)
    }
    document.addEventListener('keydown', tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = overflow }
  }, [ir, onFechar])

  const n = noticias[i]
  const id = n ? IDENTIDADE[n.secao] : null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label="Briefing do beOn Radar"
      onPointerDown={e => { toque.current = e.clientX }}
      onPointerUp={e => {
        if (toque.current === null) return
        const dx = e.clientX - toque.current
        toque.current = null
        deslizou.current = Math.abs(dx) > 50
        if (deslizou.current) ir(dx < 0 ? 1 : -1)
      }}>
      {/* Fundo: a imagem da notícia desfocada */}
      {n && <div className="absolute inset-0 opacity-50 blur-2xl" aria-hidden><ImagemDaNoticia key={`f-${n.id}`} n={n} /></div>}
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-beon-ink text-white sm:h-[min(860px,94dvh)] sm:rounded-[28px] sm:shadow-2xl">
        {/* Progresso */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
          {noticias.map((x, k) => (
            <span key={x.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <span className={cx('block h-full rounded-full bg-white transition-all duration-300', k < i || fim ? 'w-full' : k === i ? 'w-1/2' : 'w-0')} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 top-5 z-20 flex items-center justify-between px-4">
          <span className="text-xs font-semibold text-white/80">{fim ? 'Fim do briefing' : `${i + 1} de ${noticias.length}`}</span>
          <button type="button" onClick={onFechar} aria-label="Fechar o briefing" className={cx('flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50', focusRing)}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {n && id ? (
          <>
            <div className="relative h-[46%] shrink-0 overflow-hidden">
              <ImagemDaNoticia key={n.id} n={n} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-beon-ink" aria-hidden />
            </div>
            <div className="relative -mt-10 flex flex-1 flex-col px-6 pb-6">
              <div className="flex items-center gap-2">
                <SeloDaSecao secao={n.secao} sobreImagem />
                {lidas.has(n.id) && <span className="inline-flex items-center gap-1 text-xs text-white/60"><Check className="h-3.5 w-3.5" aria-hidden />Lida</span>}
              </div>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-tight sm:text-3xl">{n.titulo}</h2>
              {n.resumo && <p className="mt-3 line-clamp-5 text-[15px] leading-relaxed text-white/80">{n.resumo}</p>}
              <p className="mt-3 text-xs leading-relaxed text-white/55">Por que acompanhar: {id.porQue}</p>
              <div className="mt-auto space-y-4 pt-5">
                <MetaDaNoticia n={n} claro />
                <a href={n.link} target="_blank" rel="noopener noreferrer" onClick={() => onLer(n.id)} onPointerDown={e => e.stopPropagation()}
                  className={cx('flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-beon-ink hover:bg-white/90', focusRing)}>
                  Ler a notícia completa <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10"><Check className="h-8 w-8" aria-hidden /></span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">Você está em dia.</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Esses eram os destaques de hoje. As outras notícias estão nas seções do Radar.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setI(0)} className={cx('h-11 rounded-full border border-white/30 px-5 text-sm font-semibold hover:bg-white/10', focusRing)}>Rever</button>
              <button type="button" onClick={onFechar} className={cx('h-11 rounded-full bg-white px-5 text-sm font-bold text-beon-ink', focusRing)}>Ver todas as seções</button>
            </div>
          </div>
        )}

        {/* Toque nas laterais (abaixo dos botões) */}
        {!fim && (
          <>
            <button type="button" aria-label="Anterior" onClick={() => { if (!deslizou.current) ir(-1) }} disabled={i === 0}
              className="absolute left-0 top-16 z-10 h-[38%] w-1/3 disabled:cursor-default" />
            <button type="button" aria-label="Próxima" onClick={() => { if (!deslizou.current) ir(1) }}
              className="absolute right-0 top-16 z-10 h-[38%] w-1/3" />
          </>
        )}
      </div>

      {/* Setas no desktop */}
      <button type="button" aria-label="Notícia anterior" onClick={() => ir(-1)} disabled={i === 0}
        className={cx('absolute left-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 disabled:opacity-30 md:flex', focusRing)}>
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" aria-label="Próxima notícia" onClick={() => ir(1)} disabled={fim}
        className={cx('absolute right-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 disabled:opacity-30 md:flex', focusRing)}>
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>
    </div>,
    document.body,
  )
}
