'use client'

import { ArrowUpRight, Play } from 'lucide-react'
import { SECOES, type Edicao, type Noticia, type Secao } from '@/lib/newsletter/edicao'
import { tempoRelativo } from '@/components/comunidade/format'
import { cx, focusRing } from '@/components/ui'
import { IDENTIDADE, IconeDaSecao, ImagemDaNoticia, MetaDaNoticia, SeloDaSecao } from './identidade'
import { Repercussao } from './CardNoticia'

/**
 * Capa da edição: a manchete em tela larga, com a pauta do dia ao lado ("Hoje no Radar", que leva a cada seção) e o
 * convite para o briefing em tela cheia.
 */
export function Capa({ edicao, manchete, porSecao, onBriefing, onAbrirManchete, onIrPara }: {
  edicao: Edicao
  manchete: Noticia
  porSecao: { secao: Secao; itens: Noticia[] }[]
  onBriefing: () => void
  onAbrirManchete: () => void
  onIrPara: (secao: Secao) => void
}) {
  const dataLonga = new Date(`${edicao.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-beon-ink text-white" aria-label="Capa da edição">
      <div className="absolute inset-0 -z-10">
        <ImagemDaNoticia n={manchete} className="scale-105" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/75 to-black/30" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-transparent to-black/40" aria-hidden />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:p-12">
        <div className="flex min-h-[420px] flex-col">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            <span className="text-white">beOn Radar<span className="text-beon-red">.</span></span>
            <span aria-hidden>·</span><span>Edição nº {edicao.numero}</span>
            <span aria-hidden>·</span><span className="normal-case tracking-normal">{dataLonga}</span>
            <span aria-hidden>·</span><span className="normal-case tracking-normal">atualizada {tempoRelativo(edicao.geradoEm)}</span>
          </div>

          <div className="mt-auto pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-beon-red px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]">Manchete do dia</span>
              <SeloDaSecao secao={manchete.secao} sobreImagem />
            </div>
            <h1 className="mt-4 max-w-3xl text-[30px] font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[56px]">{manchete.titulo}</h1>
            {manchete.resumo && <p className="mt-4 line-clamp-3 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{manchete.resumo}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3"><MetaDaNoticia n={manchete} claro /><Repercussao n={manchete} claro /></div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={onBriefing}
                className={cx('inline-flex h-12 items-center gap-2.5 rounded-full bg-white pl-2 pr-5 text-sm font-bold text-beon-ink transition-transform hover:-translate-y-0.5', focusRing)}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-beon-red text-white"><Play className="h-4 w-4 fill-current" aria-hidden /></span>
                Briefing em 2 minutos
              </button>
              <a href={manchete.link} target="_blank" rel="noopener noreferrer" onClick={onAbrirManchete}
                className={cx('inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10', focusRing)}>
                Ler a manchete <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* Pauta do dia */}
        <nav aria-label="Hoje no Radar" className="self-end rounded-3xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Hoje no Radar</p>
          <ul className="mt-3 space-y-1.5">
            {SECOES.map(s => {
              const grupo = porSecao.find(x => x.secao === s.id)
              if (!grupo) return null
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => onIrPara(s.id)}
                    className={cx('group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/10', focusRing)}>
                    <IconeDaSecao secao={s.id} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{IDENTIDADE[s.id].nome}</span>
                        <span className="text-xs tabular-nums text-white/60">{grupo.itens.length}</span>
                      </span>
                      <span className="block truncate text-xs text-white/65 group-hover:text-white/85">{grupo.itens[0].titulo}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </section>
  )
}
