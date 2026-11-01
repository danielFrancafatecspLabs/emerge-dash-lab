'use client'

import Link from 'next/link'
import { ArrowUpRight, Check, Lightbulb, MessageCircle } from 'lucide-react'
import type { Noticia } from '@/lib/newsletter/edicao'
import { TOPICOS_ESPECIAIS } from '@/lib/newsletter/topicos'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { cx, focusRing } from '@/components/ui'
import { ImagemDaNoticia, MetaDaNoticia, SeloDaSecao } from './identidade'

/** "Também em NYT, BBC e +2": quantas outras fontes deram a mesma história. */
export function Repercussao({ n, claro }: { n: Noticia; claro?: boolean }) {
  const outras = n.outrasFontes ?? []
  if (!outras.length) return null
  const nomes = outras.length <= 2 ? outras.join(' e ') : `${outras.slice(0, 2).join(', ')} e +${outras.length - 2}`
  return (
    <span title={`Também em: ${outras.join(', ')}`}
      className={cx('inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold', claro ? 'bg-white/15 text-white' : 'bg-beon-soft text-beon-body')}>
      Também em {nomes}
    </span>
  )
}

/** Abre o composer de sinal já preenchido com a notícia (Future Thinking › Propor Sinal). */
export function BotaoProporSinal({ n, className }: { n: Noticia; className?: string }) {
  const { openComposer } = useCommunity()
  return (
    <button type="button"
      onClick={() => openComposer({
        kind: 'sinal', title: n.titulo.slice(0, 160), linkUrl: n.link,
        content: `Possível sinal de futuro visto no beOn Radar (${n.fonte}).\n\n${n.resumo}`.slice(0, 1500),
      })}
      className={cx('inline-flex items-center gap-1 rounded-full text-xs font-semibold text-teal-800 hover:underline', focusRing, className)}>
      <Lightbulb className="h-3.5 w-3.5" aria-hidden />Propor como sinal
    </button>
  )
}

/**
 * Card de notícia: abre a matéria na fonte (nova aba) e marca como lida. Lidas ficam esmaecidas; novas ganham selo.
 * Embaixo, as ações: entrar na discussão do fórum e, se a matéria parece um sinal de futuro, propor como sinal.
 */
export function CardNoticia({ n, lida, nova, onAbrir, destaque, discussao }: {
  n: Noticia
  lida: boolean
  nova: boolean
  onAbrir: () => void
  /** Card maior, para a primeira notícia de cada seção. */
  destaque?: boolean
  /** Id da discussão desta notícia no fórum, se já existe. */
  discussao?: { id: string; comentarios: number }
}) {
  return (
    <article className={cx('group flex h-full flex-col overflow-hidden rounded-3xl border border-beon-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10', lida && 'opacity-60 hover:opacity-100')}>
      <a href={n.link} target="_blank" rel="noopener noreferrer" onClick={onAbrir} className={cx('flex flex-1 flex-col', focusRing)}>
        <div className="relative aspect-[16/10] overflow-hidden bg-beon-soft">
          <ImagemDaNoticia n={n} className="transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="flex flex-wrap gap-1.5">
              <SeloDaSecao secao={n.secao} sobreImagem />
              {n.possivelSinal && <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">Possível sinal</span>}
            </span>
            {nova && !lida && <span className="rounded-full bg-beon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">Novo</span>}
            {lida && <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"><Check className="h-3 w-3" aria-hidden />Lida</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className={cx('font-bold leading-snug tracking-tight text-beon-ink group-hover:text-beon-red', destaque ? 'text-xl' : 'text-[16px]')}>{n.titulo}</h3>
          {n.resumo && <p className={cx('mt-2 text-sm leading-relaxed text-beon-body', destaque ? 'line-clamp-4' : 'line-clamp-3')}>{n.resumo}</p>}
          <div className="mt-auto space-y-2 pt-4">
            {!!n.topicos?.length && (
              <span className="flex flex-wrap gap-1.5">
                {n.topicos.slice(0, 2).map(t => (
                  <span key={t} className="rounded-full border border-beon-line px-2 py-0.5 text-[10px] font-semibold text-beon-body">
                    #{TOPICOS_ESPECIAIS.find(x => x.id === t)?.nome ?? t}
                  </span>
                ))}
              </span>
            )}
            <Repercussao n={n} />
            <div className="flex items-center justify-between gap-3">
              <MetaDaNoticia n={n} />
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-beon-muted group-hover:text-beon-red">
                Ler <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </div>
        </div>
      </a>
      {(discussao || n.possivelSinal) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-beon-line px-4 py-3 sm:px-5">
          {discussao && (
            <Link href={`/comunidade/post/${discussao.id}`} className={cx('inline-flex items-center gap-1 rounded-full text-xs font-semibold text-beon-red hover:underline', focusRing)}>
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {discussao.comentarios ? `Discussão · ${discussao.comentarios} ${discussao.comentarios === 1 ? 'comentário' : 'comentários'}` : 'Discutir no fórum'}
            </Link>
          )}
          {n.possivelSinal && <BotaoProporSinal n={n} />}
        </div>
      )}
    </article>
  )
}
