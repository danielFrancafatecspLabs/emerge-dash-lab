'use client'

// Tópicos especiais do beOn Radar: um cartão por tópico (quantas notícias hoje e a principal) e, embaixo, o trilho
// com as notícias do tópico escolhido. Link direto: /comunidade/newsletter?topico=quantica.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Atom, Bot, Car, Cpu, Dna, Glasses, RadioTower, Satellite, Sparkles, Telescope, Zap, type LucideIcon } from 'lucide-react'
import type { Noticia } from '@/lib/newsletter/edicao'
import { TOPICOS_ESPECIAIS } from '@/lib/newsletter/topicos'
import { cx, focusRing } from '@/components/ui'
import { CardNoticia } from './CardNoticia'

export const IDENTIDADE_DO_TOPICO: Record<string, { icone: LucideIcon; cor: string; suave: string }> = {
  'carros-autonomos': { icone: Car, cor: '#2F6FB3', suave: '#EEF4FB' },
  quantica: { icone: Atom, cor: '#0E7490', suave: '#ECFEFF' },
  'ia-agentes': { icone: Sparkles, cor: '#D31809', suave: '#FDF1F0' },
  robotica: { icone: Bot, cor: '#B45309', suave: '#FEF6E7' },
  espaco: { icone: Satellite, cor: '#1E3A5F', suave: '#EEF2F7' },
  chips: { icone: Cpu, cor: '#3F6212', suave: '#F2F7E9' },
  'redes-futuro': { icone: RadioTower, cor: '#BE123C', suave: '#FFF1F2' },
  energia: { icone: Zap, cor: '#A16207', suave: '#FEFCE8' },
  biotech: { icone: Dna, cor: '#047857', suave: '#ECFDF5' },
  interfaces: { icone: Glasses, cor: '#C2410C', suave: '#FFF7ED' },
  futuros: { icone: Telescope, cor: '#44403C', suave: '#F5F5F4' },
}

export const nomeDoTopico = (id: string) => TOPICOS_ESPECIAIS.find(t => t.id === id)?.nome ?? id

export function TopicosEspeciais({ noticias, lidas, ehNova, onAbrir, discussoes }: {
  noticias: Noticia[]
  lidas: Set<string>
  ehNova: (publicadoEm: string | null) => boolean
  onAbrir: (id: string) => void
  discussoes?: Map<string, { id: string; comentarios: number }>
}) {
  const porTopico = useMemo(() => TOPICOS_ESPECIAIS.map(t => ({ t, itens: noticias.filter(n => n.topicos?.includes(t.id)) })), [noticias])
  const comNoticia = porTopico.filter(g => g.itens.length)
  const [ativo, setAtivo] = useState<string | null>(null)
  const faixa = useRef<HTMLUListElement>(null)

  // Na faixa que rola para o lado (celular), traz o tópico escolhido para a vista.
  useEffect(() => {
    const ul = faixa.current
    const li = ul?.querySelector<HTMLElement>('[aria-selected="true"]')?.parentElement
    if (ul && li && ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: li.offsetLeft - 16, behavior: 'smooth' })
  }, [ativo])

  // Tópico pedido no link (?topico=…) ou, sem ele, o que tem mais notícias hoje.
  useEffect(() => {
    const pedido = new URLSearchParams(window.location.search).get('topico')
    if (pedido && porTopico.some(g => g.t.id === pedido && g.itens.length)) {
      setAtivo(pedido)
      document.getElementById('topicos-especiais')?.scrollIntoView({ block: 'start' })
    } else setAtivo(a => a ?? [...comNoticia].sort((x, y) => y.itens.length - x.itens.length)[0]?.t.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porTopico])

  if (!comNoticia.length) return null
  const grupo = porTopico.find(g => g.t.id === ativo) ?? comNoticia[0]
  const id = IDENTIDADE_DO_TOPICO[grupo.t.id]

  function escolher(topico: string) {
    setAtivo(topico)
    try { const u = new URL(window.location.href); u.searchParams.set('topico', topico); window.history.replaceState(null, '', u) } catch { /* sem history */ }
  }

  return (
    <section id="topicos-especiais" aria-labelledby="t-topicos" className="scroll-mt-36 md:scroll-mt-20">
      <header>
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-red">Tecnologias emergentes e futuro</p>
        <h2 id="t-topicos" className="mt-1 text-2xl font-extrabold tracking-tight text-beon-ink sm:text-[30px]">Tópicos especiais</h2>
        <p className="mt-1 max-w-2xl text-sm text-beon-body">Trilhas que atravessam as seções: tudo o que saiu hoje sobre cada tema, venha de onde vier.</p>
      </header>

      <ul ref={faixa} className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-6" role="tablist" aria-label="Tópicos especiais">
        {porTopico.map(({ t, itens }) => {
          const ident = IDENTIDADE_DO_TOPICO[t.id]
          const Icone = ident.icone
          const sel = grupo.t.id === t.id
          return (
            <li key={t.id} className="w-[44%] shrink-0 sm:w-auto">
              <button type="button" role="tab" aria-selected={sel} disabled={!itens.length} onClick={() => escolher(t.id)}
                className={cx('flex h-full w-full flex-col rounded-2xl border p-3.5 text-left transition-all disabled:cursor-default disabled:opacity-45', focusRing,
                  sel ? 'border-transparent text-white shadow-lg' : 'border-beon-line bg-white hover:-translate-y-0.5 hover:shadow-md')}
                style={sel ? { background: ident.cor } : undefined}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: sel ? 'rgba(255,255,255,0.18)' : ident.suave, color: sel ? '#fff' : ident.cor }}>
                    <Icone className="h-5 w-5" aria-hidden />
                  </span>
                  <span className={cx('text-lg font-extrabold tabular-nums', sel ? 'text-white' : 'text-beon-ink')}>{itens.length}</span>
                </span>
                <span className={cx('mt-2.5 text-[13px] font-bold leading-snug', sel ? 'text-white' : 'text-beon-ink')}>{t.nome}</span>
                <span className={cx('mt-0.5 line-clamp-2 text-[11px] leading-snug', sel ? 'text-white/80' : 'text-beon-muted')}>
                  {itens[0]?.titulo ?? 'Sem notícias hoje'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 rounded-[28px] p-5 sm:p-6" style={{ background: id.suave }} role="tabpanel" aria-label={grupo.t.nome}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight" style={{ color: id.cor }}>{grupo.t.nome}</h3>
            <p className="mt-0.5 max-w-2xl text-sm text-beon-body">{grupo.t.descricao}</p>
          </div>
          <span className="text-sm font-semibold text-beon-muted">{grupo.itens.length} {grupo.itens.length === 1 ? 'notícia' : 'notícias'} hoje</span>
        </div>
        <div className="-mx-5 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {grupo.itens.map(n => (
            <div key={n.id} className="w-[82%] shrink-0 snap-start sm:w-[320px]">
              <CardNoticia n={n} lida={lidas.has(n.id)} nova={ehNova(n.publicadoEm)} onAbrir={() => onAbrir(n.id)} discussao={discussoes?.get(n.id)} />
            </div>
          ))}
          <div className="w-1 shrink-0" aria-hidden />
        </div>
      </div>
    </section>
  )
}
