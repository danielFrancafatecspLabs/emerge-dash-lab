'use client'

// beOn Radar: a newsletter diária de tecnologias emergentes, mercado e bolha, montada automaticamente a partir de fontes
// públicas. Manchete em banner, resumo em 30 segundos e seções com cards grandes; cada notícia leva ao site de origem.

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Clock3, Newspaper, Radio, RefreshCw } from 'lucide-react'
import { SECOES, type Edicao, type Noticia, type Secao } from '@/lib/newsletter/edicao'
import { api, errorMessage } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { CoverArt, type CoverPattern } from '@/components/comunidade/visuals'
import { Button, Chip, Skeleton, cx, focusRing } from '@/components/ui'

const SECAO_VISUAL: Record<Secao, { cor: string; tone: 'red' | 'sky' | 'amber' | 'teal'; pattern: CoverPattern }> = {
  emergentes: { cor: '#D31809', tone: 'red', pattern: 'constelacao' },
  mercado: { cor: '#2F6FB3', tone: 'sky', pattern: 'dados' },
  bolhas: { cor: '#b45309', tone: 'amber', pattern: 'orbita' },
  impactos: { cor: '#0f766e', tone: 'teal', pattern: 'ondas' },
}
const nomeDa = (s: Secao) => SECOES.find(x => x.id === s)!.nome

function Imagem({ n, className }: { n: Noticia; className?: string }) {
  const [falhou, setFalhou] = useState(false)
  const v = SECAO_VISUAL[n.secao]
  if (!n.imagem || falhou) return <CoverArt seed={n.id} pattern={v.pattern} tone={v.tone} className={cx('h-full w-full', className)} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={n.imagem} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} className={cx('h-full w-full object-cover', className)} />
}

function Selo({ secao, claro }: { secao: Secao; claro?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]', claro ? 'bg-white/15 text-white backdrop-blur-sm' : 'bg-beon-soft text-beon-ink')}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SECAO_VISUAL[secao].cor }} aria-hidden />{nomeDa(secao)}
    </span>
  )
}

const Meta = ({ n, claro }: { n: Noticia; claro?: boolean }) => (
  <p className={cx('flex flex-wrap items-center gap-x-2 text-xs', claro ? 'text-white/75' : 'text-beon-muted')}>
    <span className={cx('font-semibold', claro ? 'text-white' : 'text-beon-body')}>{n.fonte}</span>
    {n.publicadoEm && <><span aria-hidden>·</span><span>{tempoRelativo(n.publicadoEm)}</span></>}
  </p>
)

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const

function Manchete({ n }: { n: Noticia }) {
  return (
    <a href={n.link} {...linkProps} className={cx('group relative block overflow-hidden rounded-3xl bg-beon-ink', focusRing)}>
      <div className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9]">
        <Imagem n={n} className="transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <div className="flex items-center gap-2"><Selo secao={n.secao} claro /><span className="rounded-full bg-beon-red px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">Manchete</span></div>
        <h2 className="mt-3 max-w-3xl text-[26px] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[44px]">{n.titulo}</h2>
        {n.resumo && <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{n.resumo}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Meta n={n} claro />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-beon-ink transition-transform group-hover:-translate-y-0.5">
            Ler na fonte <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function EmTrintaSegundos({ itens }: { itens: Noticia[] }) {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-beon-line bg-white p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-beon-red"><Clock3 className="h-4 w-4" aria-hidden /> Em 30 segundos</p>
      <ol className="mt-4 flex-1 divide-y divide-beon-line">
        {itens.map((n, i) => (
          <li key={n.id}>
            <a href={n.link} {...linkProps} className={cx('group flex gap-4 rounded-xl py-3.5', focusRing)}>
              <span className="text-3xl font-black leading-none tracking-tighter text-beon-line transition-colors group-hover:text-beon-red">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-snug text-beon-ink group-hover:underline">{n.titulo}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-beon-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: SECAO_VISUAL[n.secao].cor }} aria-hidden />{nomeDa(n.secao)} · {n.fonte}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  )
}

function CardGrande({ n }: { n: Noticia }) {
  return (
    <a href={n.link} {...linkProps} className={cx('group flex flex-col overflow-hidden rounded-3xl border border-beon-line bg-white transition-shadow hover:shadow-xl hover:shadow-stone-900/5 md:min-h-[340px] md:flex-row', focusRing)}>
      <div className="aspect-[16/9] overflow-hidden bg-beon-soft md:aspect-auto md:w-[58%]"><Imagem n={n} className="transition-transform duration-700 group-hover:scale-[1.03]" /></div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Selo secao={n.secao} />
        <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-beon-ink group-hover:text-beon-red">{n.titulo}</h3>
        {n.resumo && <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-beon-body">{n.resumo}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Meta n={n} />
          <ArrowUpRight className="h-5 w-5 text-beon-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-beon-red" aria-hidden />
        </div>
      </div>
    </a>
  )
}

function Card({ n }: { n: Noticia }) {
  return (
    <a href={n.link} {...linkProps} className={cx('group flex flex-col overflow-hidden rounded-3xl border border-beon-line bg-white transition-shadow hover:shadow-xl hover:shadow-stone-900/5', focusRing)}>
      <div className="aspect-[16/10] overflow-hidden bg-beon-soft"><Imagem n={n} className="transition-transform duration-700 group-hover:scale-[1.04]" /></div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[17px] font-bold leading-snug tracking-tight text-beon-ink group-hover:text-beon-red">{n.titulo}</h3>
        {n.resumo && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-beon-body">{n.resumo}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Meta n={n} />
          <ArrowUpRight className="h-4 w-4 text-beon-muted group-hover:text-beon-red" aria-hidden />
        </div>
      </div>
    </a>
  )
}

function BlocoDaSecao({ secao, itens }: { secao: Secao; itens: Noticia[] }) {
  const s = SECOES.find(x => x.id === secao)!
  const [primeira, ...resto] = itens
  return (
    <section aria-labelledby={`sec-${secao}`} className="space-y-4">
      <header className="flex items-end justify-between gap-4 border-b-2 pb-3" style={{ borderColor: SECAO_VISUAL[secao].cor }}>
        <div>
          <h2 id={`sec-${secao}`} className="text-2xl font-black tracking-tight text-beon-ink sm:text-3xl">{s.nome}</h2>
          <p className="text-sm text-beon-muted">{s.descricao}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-beon-muted">{itens.length} {itens.length === 1 ? 'notícia' : 'notícias'}</span>
      </header>
      {/* Com duas notícias, lado a lado; com mais, a primeira em destaque na largura toda e as demais em grade. */}
      {itens.length === 2 ? (
        <div className="grid gap-4 md:grid-cols-2">{itens.map(n => <Card key={n.id} n={n} />)}</div>
      ) : (
        <>
          <CardGrande n={primeira} />
          {resto.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{resto.map(n => <Card key={n.id} n={n} />)}</div>
          )}
        </>
      )}
    </section>
  )
}

export default function NewsletterPage() {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Secao | null>(null)

  const carregar = () => { setErro(null); api<Edicao>('/community/newsletter').then(setEdicao).catch(e => setErro(errorMessage(e))) }
  useEffect(carregar, [])

  const { manchete, breves, porSecao } = useMemo(() => {
    const ns = edicao?.noticias ?? []
    const manchete = ns.find(n => n.imagem) ?? ns[0]
    const breves = ns.filter(n => n !== manchete).slice(0, 5)
    const porSecao = SECOES.map(s => ({ secao: s.id, itens: ns.filter(n => n.secao === s.id && n !== manchete) })).filter(x => x.itens.length)
    return { manchete, breves, porSecao }
  }, [edicao])

  const dataLonga = edicao ? new Date(`${edicao.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const fontesOk = edicao?.fontes.filter(f => f.ok).length ?? 0

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6">
      {/* Cabeçalho do jornal */}
      <header className="border-b-4 border-beon-ink pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beon-line pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-beon-muted">
          <span className="flex items-center gap-2"><Newspaper className="h-4 w-4 text-beon-red" aria-hidden />Newsletter diária{edicao ? ` · Edição nº ${edicao.numero}` : ''}</span>
          {edicao && <span>{dataLonga} · atualizada {tempoRelativo(edicao.geradoEm)}</span>}
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[52px] font-black leading-[0.9] tracking-[-0.04em] text-beon-ink sm:text-7xl lg:text-[88px]">
              beOn Radar<span className="text-beon-red">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-beon-body sm:text-lg">
              Tecnologias emergentes, sinais da bolsa, bolhas e impactos: o que importa hoje, em uma página.
            </p>
          </div>
          {edicao && (
            <div className="flex flex-wrap gap-2">
              {SECOES.map(s => {
                const n = edicao.noticias.filter(x => x.secao === s.id).length
                return n ? <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-beon-line px-3 py-1 text-xs font-semibold text-beon-body"><span className="h-2 w-2 rounded-full" style={{ background: SECAO_VISUAL[s.id].cor }} aria-hidden />{s.nome} <b className="tabular-nums text-beon-ink">{n}</b></span> : null
              })}
            </div>
          )}
        </div>
      </header>

      {erro && !edicao ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-beon-line px-6 py-16 text-center">
          <Radio className="h-8 w-8 text-beon-red" aria-hidden />
          <p className="mt-3 max-w-md text-beon-body">{erro}</p>
          <Button className="mt-5" icon={RefreshCw} onClick={carregar}>Tentar novamente</Button>
        </div>
      ) : !edicao ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><Skeleton className="aspect-[16/9] rounded-3xl" /><Skeleton className="h-full min-h-72 rounded-3xl" /></div>
      ) : !manchete ? (
        <p className="mt-10 rounded-3xl border border-beon-line px-6 py-16 text-center text-beon-body">As fontes responderam, mas nenhuma notícia do tema saiu nas últimas 72 horas.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Manchete n={manchete} />
            {breves.length > 0 && <EmTrintaSegundos itens={breves} />}
          </div>

          <nav className="sticky top-14 z-10 -mx-4 mt-10 flex gap-2 overflow-x-auto bg-white/90 px-4 py-3 backdrop-blur [scrollbar-width:none] md:top-0 sm:-mx-6 sm:px-6" aria-label="Seções">
            <Chip selected={!filtro} onClick={() => setFiltro(null)}>Tudo</Chip>
            {porSecao.map(({ secao, itens }) => (
              <Chip key={secao} selected={filtro === secao} onClick={() => setFiltro(filtro === secao ? null : secao)}>
                <span className="h-2 w-2 rounded-full" style={{ background: SECAO_VISUAL[secao].cor }} aria-hidden />{nomeDa(secao)} <span className="tabular-nums opacity-70">{itens.length}</span>
              </Chip>
            ))}
          </nav>

          <div className="mt-6 space-y-12">
            {porSecao.filter(x => !filtro || x.secao === filtro).map(x => <BlocoDaSecao key={x.secao} {...x} />)}
          </div>

          <footer className="mt-14 rounded-3xl bg-beon-soft p-5 text-sm text-beon-body sm:p-6">
            <p className="font-semibold text-beon-ink">Como esta edição é feita</p>
            <p className="mt-1 leading-relaxed">
              Todo dia, a newsletter varre {edicao.fontes.length} fontes públicas ({fontesOk} responderam nesta edição) e fica só com
              notícias das últimas 72 horas sobre tecnologias emergentes, mercado, bolhas e impactos. As manchetes levam ao site de
              origem; a beOn Labs não edita o conteúdo.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-beon-muted">
              {edicao.fontes.map(f => <span key={f.nome} className={f.ok ? '' : 'line-through'}>{f.nome}</span>)}
            </p>
          </footer>
        </>
      )}
    </div>
  )
}
