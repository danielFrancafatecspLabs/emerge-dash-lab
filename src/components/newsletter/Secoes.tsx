'use client'

// Termômetro do dia, navegação fixa por seção e o trilho (carrossel) de cada seção.

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, Rows3, Sparkles } from 'lucide-react'
import type { Noticia, Secao } from '@/lib/newsletter/edicao'
import { cx, focusRing } from '@/components/ui'
import { CardNoticia } from './CardNoticia'
import { IDENTIDADE, IconeDaSecao } from './identidade'

type Grupo = { secao: Secao; itens: Noticia[] }

/** Como está a edição: a proporção de cada seção e uma frase que resume o tom do dia. */
export function TermometroDoDia({ grupos, novas, onIrPara }: { grupos: Grupo[]; novas: number; onIrPara: (s: Secao) => void }) {
  const total = grupos.reduce((s, g) => s + g.itens.length, 0)
  if (!total) return null
  const maior = [...grupos].sort((a, b) => b.itens.length - a.itens.length)[0]
  const pct = (n: number) => Math.round((n / total) * 100)
  return (
    <section className="rounded-3xl border border-beon-line bg-white p-5 sm:p-6" aria-labelledby="t-termometro">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="t-termometro" className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">Termômetro do dia</h2>
          <p className="mt-1 max-w-2xl text-lg font-semibold leading-snug text-beon-ink sm:text-xl">
            Hoje o Radar fala mais de <span style={{ color: IDENTIDADE[maior.secao].cor }}>{IDENTIDADE[maior.secao].nome.toLowerCase()}</span>:{' '}
            {maior.itens.length} de {total} notícias.
          </p>
        </div>
        {novas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-beon-tint px-3 py-1.5 text-sm font-semibold text-beon-red">
            <Sparkles className="h-4 w-4" aria-hidden />{novas} {novas === 1 ? 'novidade' : 'novidades'} desde sua última visita
          </span>
        )}
      </div>
      <div className="mt-4 flex h-3 w-full gap-[3px] overflow-hidden rounded-full" role="img"
        aria-label={grupos.map(g => `${IDENTIDADE[g.secao].nome}: ${g.itens.length}`).join(', ')}>
        {grupos.map(g => (
          <button key={g.secao} type="button" onClick={() => onIrPara(g.secao)} title={`${IDENTIDADE[g.secao].nome}: ${g.itens.length} (${pct(g.itens.length)}%)`}
            className="h-full transition-opacity hover:opacity-80" style={{ width: `${pct(g.itens.length)}%`, background: IDENTIDADE[g.secao].cor, minWidth: 6 }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-beon-body">
        {grupos.map(g => (
          <li key={g.secao} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: IDENTIDADE[g.secao].cor }} aria-hidden />
            {IDENTIDADE[g.secao].nome} <b className="tabular-nums text-beon-ink">{pct(g.itens.length)}%</b>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Navegação fixa: leva a cada seção e marca a que está na tela. */
export function NavegacaoDeSecoes({ grupos, ativa, onIrPara }: { grupos: Grupo[]; ativa: Secao | null; onIrPara: (s: Secao) => void }) {
  return (
    <nav aria-label="Seções do Radar" className="sticky top-14 z-20 -mx-4 bg-white/90 px-4 py-3 backdrop-blur-md md:top-0 sm:-mx-6 sm:px-6">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {grupos.map(g => {
          const id = IDENTIDADE[g.secao]
          const sel = ativa === g.secao
          return (
            <button key={g.secao} type="button" onClick={() => onIrPara(g.secao)} aria-current={sel ? 'true' : undefined}
              className={cx('inline-flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition-all', focusRing,
                sel ? 'border-transparent text-white shadow-md' : 'border-beon-line bg-white text-beon-body hover:border-beon-muted/40')}
              style={sel ? { background: id.cor } : undefined}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: sel ? 'rgba(255,255,255,0.2)' : id.suave, color: sel ? '#fff' : id.cor }}>
                <id.icone className="h-3.5 w-3.5" aria-hidden />
              </span>
              {id.nome}<span className={cx('tabular-nums', sel ? 'text-white/80' : 'text-beon-muted')}>{g.itens.length}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Uma seção: identidade e "por que acompanhar", notícias num trilho horizontal (ou em grade, em "ver todas"). */
export function TrilhoDaSecao({ grupo, lidas, ehNova, onAbrir }: {
  grupo: Grupo
  lidas: Set<string>
  ehNova: (publicadoEm: string | null) => boolean
  onAbrir: (id: string) => void
}) {
  const id = IDENTIDADE[grupo.secao]
  const trilho = useRef<HTMLDivElement>(null)
  const [grade, setGrade] = useState(false)
  const [bordas, setBordas] = useState({ inicio: true, fim: false })

  useEffect(() => {
    const el = trilho.current
    if (!el) return
    const medir = () => setBordas({ inicio: el.scrollLeft < 8, fim: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => { el.removeEventListener('scroll', medir); window.removeEventListener('resize', medir) }
  }, [grade])

  const rolar = (dir: 1 | -1) => trilho.current?.scrollBy({ left: dir * trilho.current.clientWidth * 0.85, behavior: 'smooth' })
  const botao = cx('flex h-10 w-10 items-center justify-center rounded-full border border-beon-line bg-white text-beon-ink shadow-sm transition-opacity hover:bg-beon-soft disabled:opacity-30', focusRing)

  return (
    <section id={`secao-${grupo.secao}`} aria-labelledby={`t-${grupo.secao}`} className="scroll-mt-36 md:scroll-mt-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <IconeDaSecao secao={grupo.secao} tamanho="lg" />
          <div className="min-w-0">
            <h2 id={`t-${grupo.secao}`} className="text-2xl font-extrabold tracking-tight text-beon-ink sm:text-[28px]">
              {id.nome} <span className="text-lg font-semibold text-beon-muted">{grupo.itens.length}</span>
            </h2>
            <p className="mt-0.5 max-w-xl text-sm text-beon-body">{id.porQue}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {grupo.itens.length > 2 && (
            <button type="button" onClick={() => setGrade(g => !g)} className={cx('inline-flex h-10 items-center gap-1.5 rounded-full border border-beon-line px-3.5 text-sm font-medium text-beon-body hover:bg-beon-soft', focusRing)}>
              {grade ? <><Rows3 className="h-4 w-4" aria-hidden />Ver em trilho</> : <><LayoutGrid className="h-4 w-4" aria-hidden />Ver todas</>}
            </button>
          )}
          {!grade && grupo.itens.length > 2 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" aria-label="Notícias anteriores" onClick={() => rolar(-1)} disabled={bordas.inicio} className={botao}><ChevronLeft className="h-5 w-5" aria-hidden /></button>
              <button type="button" aria-label="Próximas notícias" onClick={() => rolar(1)} disabled={bordas.fim} className={botao}><ChevronRight className="h-5 w-5" aria-hidden /></button>
            </div>
          )}
        </div>
      </header>

      {grade ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupo.itens.map(n => <CardNoticia key={n.id} n={n} lida={lidas.has(n.id)} nova={ehNova(n.publicadoEm)} onAbrir={() => onAbrir(n.id)} />)}
        </div>
      ) : (
        <div ref={trilho} className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {grupo.itens.map((n, i) => (
            <div key={n.id} className={cx('shrink-0 snap-start', i === 0 ? 'w-[86%] sm:w-[440px]' : 'w-[78%] sm:w-[320px]')}>
              <CardNoticia n={n} destaque={i === 0} lida={lidas.has(n.id)} nova={ehNova(n.publicadoEm)} onAbrir={() => onAbrir(n.id)} />
            </div>
          ))}
          <div className="w-1 shrink-0" aria-hidden />
        </div>
      )}
    </section>
  )
}
