'use client'

// Faixa de stories no topo do feed e visualização imersiva.
// Editoriais (publicados pela equipe beOn Labs em Admin › Stories) usam a imagem cadastrada e o selo beOn Labs;
// os da comunidade são as publicações recentes de membros, com capa ilustrada pelo tipo de conteúdo.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { POST_KIND_LABEL, postTitle, type CommunityPost, type PostKind } from '@/lib/community/model'
import { STORY_CATEGORIA_LABEL, type Story, type StoryCategoria } from '@/lib/community/stories'
import { api } from './api'
import { useCommunity } from './CommunityProvider'
import { tempoRelativo } from './format'
import { Avatar, Skeleton, cx, focusRing } from '@/components/ui'
import { CoverArt, type CoverPattern } from './visuals'

interface StoryItem {
  id: string
  origem: 'editorial' | 'comunidade'
  categoria: string
  titulo: string
  texto: string
  imagem?: string
  pattern: CoverPattern
  tone: 'red' | 'ink' | 'teal' | 'sky' | 'amber'
  href: string
  externo: boolean
  autor?: { nome: string; username: string; avatar?: string }
  quando: string
}

const KIND_COVER: Record<PostKind, [CoverPattern, StoryItem['tone']]> = {
  discussao: ['constelacao', 'ink'],
  pergunta: ['orbita', 'amber'],
  pesquisa: ['dados', 'sky'],
  experimento: ['rede', 'red'],
  sinal: ['ondas', 'teal'],
}

const CAT_COVER: Record<StoryCategoria, CoverPattern> = {
  novidade: 'constelacao', tendencia: 'ondas', descoberta: 'orbita', experimento: 'rede',
  pesquisa: 'dados', evento: 'radar', 'future-thinking': 'ondas', destaque: 'constelacao',
}

const SEEN_KEY = 'comm-stories-vistos'
const DURATION = 7000

function readSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) } catch { return new Set() }
}
function writeSeen(seen: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300))) } catch { /* armazenamento indisponível */ }
}

/** Publicações recentes de membros (até 7 dias, uma por pessoa) viram stories da comunidade. */
export function communityStories(posts: CommunityPost[], now = Date.now()): StoryItem[] {
  const porAutor = new Set<string>()
  const out: StoryItem[] = []
  for (const p of [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))) {
    if (now - Date.parse(p.createdAt) > 7 * 86_400_000 || porAutor.has(p.authorUsername)) continue
    porAutor.add(p.authorUsername)
    const [pattern, tone] = KIND_COVER[p.kind]
    out.push({
      id: `post:${p.id}`, origem: 'comunidade', categoria: POST_KIND_LABEL[p.kind], titulo: postTitle(p),
      texto: p.content.length > 280 ? `${p.content.slice(0, 277)}…` : p.content,
      pattern, tone, href: `/comunidade/post/${p.id}`, externo: false,
      autor: { nome: p.authorName, username: p.authorUsername, avatar: p.authorAvatar }, quando: p.createdAt,
    })
    if (out.length >= 12) break
  }
  return out
}

function editorialStories(stories: Story[]): StoryItem[] {
  return stories.map(s => ({
    id: `ed:${s.id}`, origem: 'editorial', categoria: STORY_CATEGORIA_LABEL[s.categoria ?? 'novidade'], titulo: s.title,
    texto: s.texto ?? '', imagem: s.imageUrl || undefined, pattern: CAT_COVER[s.categoria ?? 'novidade'], tone: 'red',
    href: s.linkUrl || '', externo: /^https?:\/\//.test(s.linkUrl), quando: s.createdAt,
  }))
}

function Cover({ item, className }: { item: StoryItem; className?: string }) {
  return item.imagem
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={item.imagem} alt="" className={cx('h-full w-full object-cover', className)} loading="lazy" />
    : <CoverArt seed={item.id} pattern={item.pattern} tone={item.tone} className={cx('h-full w-full', className)} />
}

export function StoriesRail() {
  const { posts } = useCommunity()
  const [editoriais, setEditoriais] = useState<Story[] | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [aberto, setAberto] = useState<number | null>(null)

  useEffect(() => {
    setSeen(readSeen())
    api<Story[]>('/stories').then(setEditoriais).catch(() => setEditoriais([]))
  }, [])

  const items = useMemo(
    () => [...editorialStories(editoriais ?? []), ...communityStories(posts.data ?? [])],
    [editoriais, posts.data],
  )

  const marcarVisto = useCallback((id: string) => {
    setSeen(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev).add(id)
      writeSeen(next)
      return next
    })
  }, [])

  if (editoriais === null || posts.loading && !posts.data) {
    return (
      <div className="flex gap-3 overflow-hidden px-4 py-4 sm:px-6" aria-hidden>
        {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[168px] w-[108px] shrink-0 rounded-2xl" />)}
      </div>
    )
  }
  if (items.length === 0) return null

  return (
    <section aria-label="Stories" className="border-b border-beon-line">
      <ul className="flex gap-3 overflow-x-auto px-4 py-4 [scrollbar-width:none] sm:px-6">
        {items.map((item, i) => {
          const visto = seen.has(item.id)
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setAberto(i)}
                aria-label={`${item.origem === 'editorial' ? 'beOn Labs' : item.autor?.nome}: ${item.titulo}${visto ? ' (visto)' : ''}`}
                className={cx(
                  'group relative block h-[168px] w-[108px] overflow-hidden rounded-2xl text-left ring-2 ring-offset-2 transition-transform hover:-translate-y-0.5',
                  visto ? 'ring-beon-line' : item.origem === 'editorial' ? 'ring-beon-red' : 'ring-beon-ink/70',
                  focusRing,
                )}
              >
                <Cover item={item} className="transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
                {item.origem === 'editorial' ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-beon-red">beOn Labs</span>
                ) : item.autor && (
                  <span className="absolute left-2 top-2 rounded-full ring-2 ring-white"><Avatar nome={item.autor.nome} src={item.autor.avatar} size={26} /></span>
                )}
                <span className="absolute inset-x-2 bottom-2">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-white/75">{item.categoria}</span>
                  <span className="line-clamp-3 text-[12px] font-semibold leading-tight text-white">{item.titulo}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {aberto !== null && (
        <StoryViewer items={items} start={aberto} onSeen={marcarVisto} onClose={() => setAberto(null)} />
      )}
    </section>
  )
}

function StoryViewer({ items, start, onSeen, onClose }: { items: StoryItem[]; start: number; onSeen: (id: string) => void; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const item = items[index]

  const next = useCallback(() => { if (index < items.length - 1) { setIndex(i => i + 1); setProgress(0) } else onClose() }, [index, items.length, onClose])
  const prev = useCallback(() => { setIndex(i => Math.max(0, i - 1)); setProgress(0) }, [])

  useEffect(() => { onSeen(item.id) }, [item.id, onSeen])
  useEffect(() => {
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setProgress(p => Math.min(1, p + 100 / DURATION)), 100)
    return () => clearInterval(t)
  }, [paused])
  useEffect(() => { if (progress >= 1) next() }, [progress, next])

  const cta = item.href && (item.externo
    ? <a href={item.href} target="_blank" rel="noopener noreferrer" className={ctaCls}>Abrir conteúdo <ArrowUpRight className="h-4 w-4" aria-hidden /></a>
    : <Link href={item.href} onClick={onClose} className={ctaCls}>{item.origem === 'comunidade' ? 'Ver publicação completa' : 'Ver conteúdo'} <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>)

  return (
    <div role="dialog" aria-modal="true" aria-label={`Story: ${item.titulo}`} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-[420px] overflow-hidden bg-black sm:h-[min(88dvh,760px)] sm:rounded-3xl"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <Cover item={item} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85" />

        <div className="absolute inset-x-3 top-3 flex gap-1" aria-hidden>
          {items.map((it, i) => (
            <span key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? Math.min(100, progress * 100) : 0}%` }} />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-4 top-7 flex items-center justify-between gap-3 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            {item.origem === 'editorial'
              ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-beon-red">beOn Labs</span>
              : item.autor && <Avatar nome={item.autor.nome} src={item.autor.avatar} size={32} />}
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">{item.origem === 'editorial' ? item.categoria : item.autor?.nome}</span>
              <span className="block text-xs text-white/70">{item.origem === 'comunidade' ? `${item.categoria} · ` : ''}{tempoRelativo(item.quando)}</span>
            </span>
          </div>
          <div className="flex items-center">
            <button type="button" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Continuar' : 'Pausar'} className="rounded-full p-2 hover:bg-white/15">
              {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar stories" className="rounded-full p-2 hover:bg-white/15">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-white">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">{item.titulo}</h2>
          {item.texto && <p className="line-clamp-6 whitespace-pre-line text-[15px] leading-relaxed text-white/85">{item.texto}</p>}
          {cta}
        </div>

        <button type="button" onClick={prev} disabled={index === 0} aria-label="Story anterior" className="absolute left-0 top-24 bottom-48 w-1/3 disabled:cursor-default" />
        <button type="button" onClick={next} aria-label="Próximo story" className="absolute right-0 top-24 bottom-48 w-1/3" />
      </div>

      <button type="button" onClick={prev} disabled={index === 0} aria-label="Story anterior"
        className="absolute left-6 hidden h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30 sm:flex">
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button type="button" onClick={next} aria-label="Próximo story"
        className="absolute right-6 hidden h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:flex">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}

const ctaCls = 'inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-beon-ink hover:bg-white/90'
