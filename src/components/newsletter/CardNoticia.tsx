'use client'

import { ArrowUpRight, Check } from 'lucide-react'
import type { Noticia } from '@/lib/newsletter/edicao'
import { cx, focusRing } from '@/components/ui'
import { ImagemDaNoticia, MetaDaNoticia, SeloDaSecao } from './identidade'

/** Card de notícia: abre a matéria na fonte (nova aba) e marca como lida. Lidas ficam esmaecidas; novas ganham selo. */
export function CardNoticia({ n, lida, nova, onAbrir, destaque }: {
  n: Noticia
  lida: boolean
  nova: boolean
  onAbrir: () => void
  /** Card maior, para a primeira notícia de cada seção. */
  destaque?: boolean
}) {
  return (
    <a href={n.link} target="_blank" rel="noopener noreferrer" onClick={onAbrir}
      className={cx('group flex h-full flex-col overflow-hidden rounded-3xl border border-beon-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10', lida && 'opacity-60 hover:opacity-100', focusRing)}>
      <div className={cx('relative overflow-hidden bg-beon-soft', destaque ? 'aspect-[16/10]' : 'aspect-[16/10]')}>
        <ImagemDaNoticia n={n} className="transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <SeloDaSecao secao={n.secao} sobreImagem />
          {nova && !lida && <span className="rounded-full bg-beon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">Novo</span>}
          {lida && <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"><Check className="h-3 w-3" aria-hidden />Lida</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className={cx('font-bold leading-snug tracking-tight text-beon-ink group-hover:text-beon-red', destaque ? 'text-xl' : 'text-[16px]')}>{n.titulo}</h3>
        {n.resumo && <p className={cx('mt-2 text-sm leading-relaxed text-beon-body', destaque ? 'line-clamp-4' : 'line-clamp-3')}>{n.resumo}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <MetaDaNoticia n={n} />
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-beon-muted group-hover:text-beon-red">
            Ler <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}
