'use client'

// Pesquisa em IA no beOn Radar: os pesquisadores para acompanhar (nome, foto e, à direita, se há algo novo deles) e
// os papers em destaque. Clicar no pesquisador abre o painel com as novidades, os últimos papers e as notícias.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BookOpen, FileText, MessageSquare, Newspaper, Share2, Star, ThumbsUp, Users, X, type LucideIcon } from 'lucide-react'
import {
  compartilhamentosDe, ehAutor,
  type Compartilhamento, type Novidade, type PainelDePesquisa, type Paper, type PesquisadorNoRadar,
} from '@/lib/newsletter/pesquisa-ia'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { tempoRelativo } from '@/components/comunidade/format'
import { Skeleton, cx, focusRing, iniciais } from '@/components/ui'

export function usePesquisaIA() {
  const [painel, setPainel] = useState<PainelDePesquisa | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => { api<PainelDePesquisa>('/community/newsletter/pesquisa').then(setPainel).catch(e => setErro(errorMessage(e))) }, [])
  return { painel, erro }
}

// O que a pessoa já viu (neste navegador): a novidade deixa de piscar como "nova" depois de aberta.
const VISTAS = 'beon:radar:pesquisa-vistas'
function useVistas() {
  const [vistas, setVistas] = useState<Set<string>>(new Set())
  useEffect(() => { try { setVistas(new Set(JSON.parse(window.localStorage.getItem(VISTAS) ?? '[]'))) } catch { /* sem armazenamento */ } }, [])
  const marcar = useCallback((chaves: string[]) => setVistas(atual => {
    if (chaves.every(c => atual.has(c))) return atual
    const nova = new Set([...atual, ...chaves])
    try { window.localStorage.setItem(VISTAS, JSON.stringify([...nova].slice(-400))) } catch { /* sem armazenamento */ }
    return nova
  }), [])
  return { vistas, marcar }
}

/** Novidade do painel ou paper compartilhado na Comunidade, num formato só. */
type Item = Novidade | (Omit<Novidade, 'tipo'> & { tipo: 'compartilhado' })

const TIPO: Record<Item['tipo'], { rotulo: string; icone: LucideIcon; cor: string; suave: string }> = {
  paper: { rotulo: 'Novo paper', icone: FileText, cor: '#D31809', suave: '#FDF1F0' },
  destaque: { rotulo: 'Paper em destaque', icone: Star, cor: '#B45309', suave: '#FEF6E7' },
  compartilhado: { rotulo: 'Compartilhado aqui', icone: Share2, cor: '#0E7490', suave: '#ECFEFF' },
  noticia: { rotulo: 'Nas notícias', icone: Newspaper, cor: '#1E3A5F', suave: '#EEF2F7' },
}

const chaveDe = (p: PesquisadorNoRadar, i: Item) => `${p.id}|${i.tipo}|${i.link}`
const dataCurta = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ de /g, ' ').replace('.', '') : ''
const autoresCurtos = (a: string[]) => a.length > 3 ? `${a.slice(0, 3).join(', ')} e mais ${a.length - 3}` : a.join(', ')

function itensDe(p: PesquisadorNoRadar, compartilhados: Compartilhamento[]): Item[] {
  return [...p.novidades, ...compartilhados.map(c => ({
    tipo: 'compartilhado' as const, titulo: c.titulo, link: `/comunidade/post/${c.postId}`, em: c.em, fonte: `por ${c.autor}`,
  }))].sort((a, b) => (b.em ?? '').localeCompare(a.em ?? ''))
}

export function FotoDoPesquisador({ p, tamanho, className }: { p: Pick<PesquisadorNoRadar, 'nome' | 'foto'>; tamanho: number; className?: string }) {
  const [falhou, setFalhou] = useState(false)
  return (
    <span className={cx('relative inline-flex shrink-0 overflow-hidden rounded-full bg-beon-soft ring-1 ring-beon-line', className)} style={{ width: tamanho, height: tamanho }}>
      {p.foto && !falhou ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto.url} alt={`Foto de ${p.nome}`} className="h-full w-full object-cover object-top" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-beon-body" style={{ fontSize: Math.max(11, tamanho * 0.36) }} aria-hidden>{iniciais(p.nome)}</span>
      )}
    </span>
  )
}

/** O canto direito de cada pesquisador: a novidade mais recente (piscando se ainda não foi vista) ou "nada novo". */
function SeloDeNovidade({ itens, novos }: { itens: Item[]; novos: number }) {
  if (!itens.length) return <span className="shrink-0 text-right text-xs font-medium text-beon-muted">Nada novo</span>
  const t = TIPO[itens[0].tipo]
  const Icone = t.icone
  return (
    <span className="flex shrink-0 flex-col items-end gap-1 text-right">
      <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', novos ? 'text-white shadow-sm' : 'border border-beon-line bg-white')}
        style={novos ? { background: t.cor } : { color: t.cor }}>
        {novos > 0 && <span className="relative flex h-1.5 w-1.5" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 motion-reduce:hidden" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>}
        {!novos && <Icone className="h-3.5 w-3.5" aria-hidden />}
        {t.rotulo}
        {itens.length > 1 && <span className={novos ? 'text-white/80' : 'text-beon-muted'}>+{itens.length - 1}</span>}
      </span>
      {itens[0].em && <span className="text-[11px] text-beon-muted">{tempoRelativo(itens[0].em)}</span>}
    </span>
  )
}

function LinhaDoPesquisador({ p, itens, novos, onAbrir }: { p: PesquisadorNoRadar; itens: Item[]; novos: number; onAbrir: () => void }) {
  return (
    <li>
      <button type="button" onClick={onAbrir}
        aria-label={`${p.nome}: ${itens.length ? `${TIPO[itens[0].tipo].rotulo}${novos ? ' (não visto)' : ''}` : 'nada novo'}. Abrir detalhes`}
        className={cx('flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-beon-soft/70 sm:px-5', focusRing)}>
        <span className="relative">
          <FotoDoPesquisador p={p} tamanho={52} />
          {novos > 0 && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-beon-red" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-beon-ink">{p.nome}</span>
          <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-beon-body sm:line-clamp-1">{p.conhecidoPor}</span>
        </span>
        <SeloDeNovidade itens={itens} novos={novos} />
      </button>
    </li>
  )
}

function BotaoCompartilhar({ paper, className }: { paper: Paper; className?: string }) {
  const { openComposer } = useCommunity()
  return (
    <button type="button"
      onClick={() => openComposer({
        kind: 'pesquisa', title: paper.titulo.slice(0, 160), linkUrl: paper.link, tags: ['ia', 'paper'],
        content: `Paper compartilhado do beOn Radar (arXiv ${paper.id}).\n\nAutores: ${autoresCurtos(paper.autores)}\n\n${paper.resumo}`.slice(0, 1500),
      })}
      className={cx('inline-flex items-center gap-1 rounded-full text-xs font-semibold text-beon-body hover:text-beon-red hover:underline', focusRing, className)}>
      <Share2 className="h-3.5 w-3.5" aria-hidden />Compartilhar na comunidade
    </button>
  )
}

/** Autores do paper, com a foto dos pesquisadores que a seção acompanha. */
function Autores({ paper, pesquisadores }: { paper: Paper; pesquisadores: PesquisadorNoRadar[] }) {
  const nossos = pesquisadores.filter(p => paper.autores.some(a => ehAutor(p, a)))
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-beon-muted">
      {nossos.map(p => (
        <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-beon-soft py-0.5 pl-0.5 pr-2 font-semibold text-beon-ink">
          <FotoDoPesquisador p={p} tamanho={18} />{p.nome}
        </span>
      ))}
      <span className="min-w-0">{autoresCurtos(paper.autores.filter(a => !nossos.some(p => ehAutor(p, a))))}</span>
    </p>
  )
}

function PaperEmDestaque({ paper, posicao, pesquisadores }: { paper: Paper; posicao: number; pesquisadores: PesquisadorNoRadar[] }) {
  return (
    <li className="flex gap-3.5 px-4 py-4 sm:px-5">
      <span className={cx('w-7 shrink-0 text-2xl font-extrabold tabular-nums leading-none', posicao < 3 ? 'text-beon-red' : 'text-beon-line')} aria-hidden>{String(posicao + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <a href={paper.link} target="_blank" rel="noopener noreferrer" className={cx('group inline rounded text-[15px] font-bold leading-snug text-beon-ink hover:text-beon-red', focusRing)}>
          {paper.titulo}<ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5 -translate-y-px text-beon-muted group-hover:text-beon-red" aria-hidden />
        </a>
        <Autores paper={paper} pesquisadores={pesquisadores} />
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-beon-muted">
          {paper.votos !== undefined && <span className="inline-flex items-center gap-1 font-semibold text-beon-ink"><ThumbsUp className="h-3.5 w-3.5 text-beon-red" aria-hidden />{paper.votos} {paper.votos === 1 ? 'voto' : 'votos'}</span>}
          {!!paper.comentarios && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{paper.comentarios}</span>}
          {paper.publicadoEm && <span>{dataCurta(paper.publicadoEm)}</span>}
          {paper.pdf && <a href={paper.pdf} target="_blank" rel="noopener noreferrer" className={cx('rounded font-semibold hover:text-beon-red hover:underline', focusRing)}>PDF</a>}
          <BotaoCompartilhar paper={paper} />
        </p>
      </div>
    </li>
  )
}

export function SecaoPesquisaIA({ painel, erro }: { painel: PainelDePesquisa | null; erro: string | null }) {
  const { posts } = useCommunity()
  const { vistas, marcar } = useVistas()
  const [aberto, setAberto] = useState<string | null>(null)

  const linhas = useMemo(() => (painel?.pesquisadores ?? []).map(p => {
    const itens = itensDe(p, compartilhamentosDe(p, painel?.destaques ?? [], posts.data ?? []))
    return { p, itens, novos: itens.filter(i => !vistas.has(chaveDe(p, i))).length }
  }), [painel, posts.data, vistas])
  // Quem tem algo ainda não visto sobe; depois quem tem novidade; depois a ordem do servidor.
  const ordenadas = useMemo(() => [...linhas].sort((a, b) => Number(b.novos > 0) - Number(a.novos > 0) || Number(b.itens.length > 0) - Number(a.itens.length > 0)), [linhas])
  const comNovidade = linhas.filter(l => l.itens.length).length

  // Link direto para um pesquisador: /comunidade/newsletter?pesquisador=hinton
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('pesquisador')
    if (id && painel?.pesquisadores.some(p => p.id === id)) setAberto(id)
  }, [painel])

  const abrir = useCallback((id: string) => {
    setAberto(id)
    try { const u = new URL(window.location.href); u.searchParams.set('pesquisador', id); window.history.replaceState(null, '', u) } catch { /* sem history */ }
  }, [])
  const fechar = useCallback(() => {
    setAberto(atual => {
      const l = linhas.find(x => x.p.id === atual)
      if (l) marcar(l.itens.map(i => chaveDe(l.p, i)))
      return null
    })
    try { const u = new URL(window.location.href); u.searchParams.delete('pesquisador'); window.history.replaceState(null, '', u) } catch { /* sem history */ }
  }, [linhas, marcar])

  const selecionada = linhas.find(l => l.p.id === aberto)

  return (
    <section id="pesquisa-ia" aria-labelledby="t-pesquisa-ia" className="scroll-mt-36 md:scroll-mt-20">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-red">Pesquisa em IA</p>
          <h2 id="t-pesquisa-ia" className="mt-1 text-2xl font-extrabold tracking-tight text-beon-ink sm:text-[30px]">Pesquisadores e papers que movem a IA</h2>
          <p className="mt-1 max-w-2xl text-sm text-beon-body">Acompanhe quem está na fronteira da IA e os papers mais votados do dia. À direita de cada nome, o que há de novo.</p>
        </div>
        {painel && (
          <span className="inline-flex items-center gap-2 rounded-full border border-beon-line bg-white px-3.5 py-1.5 text-sm font-semibold text-beon-ink">
            <Users className="h-4 w-4 text-beon-red" aria-hidden />
            {comNovidade ? `${comNovidade} de ${linhas.length} com novidade` : `${linhas.length} pesquisadores`}
          </span>
        )}
      </header>

      {erro && !painel && (
        <p className="mt-5 rounded-3xl border border-beon-line px-5 py-10 text-center text-sm text-beon-body">{erro}</p>
      )}

      {!painel && !erro && (
        <div className="mt-5 grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Carregando pesquisadores e papers">
          <Skeleton className="h-[520px] rounded-[28px]" />
          <Skeleton className="h-[520px] rounded-[28px]" />
        </div>
      )}

      {painel && (
        <>
          <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[28px] border border-beon-line bg-white">
              <div className="flex items-baseline justify-between gap-3 border-b border-beon-line px-4 py-4 sm:px-5">
                <h3 className="text-base font-extrabold text-beon-ink">Pesquisadores para acompanhar</h3>
                <span className="text-xs text-beon-muted">Novidades dos últimos {painel.diasDeNovidade} dias</span>
              </div>
              <ul className="divide-y divide-beon-line">
                {ordenadas.map(l => <LinhaDoPesquisador key={l.p.id} p={l.p} itens={l.itens} novos={l.novos} onAbrir={() => abrir(l.p.id)} />)}
              </ul>
              <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-beon-line bg-beon-soft/50 px-4 py-3 text-[11px] text-beon-body sm:px-5">
                {(Object.keys(TIPO) as Item['tipo'][]).map(t => {
                  const I = TIPO[t].icone
                  return <span key={t} className="inline-flex items-center gap-1"><I className="h-3.5 w-3.5" style={{ color: TIPO[t].cor }} aria-hidden />{TIPO[t].rotulo}</span>
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-beon-line bg-white lg:sticky lg:top-24">
              <div className="border-b border-beon-line px-4 py-4 sm:px-5">
                <h3 className="text-base font-extrabold text-beon-ink">Papers em destaque</h3>
                <p className="mt-0.5 text-xs text-beon-muted">
                  {painel.destaquesFonte === 'huggingface' ? 'Os mais votados de hoje no Daily Papers do Hugging Face'
                    : painel.destaquesFonte === 'arxiv' ? 'Os mais recentes do arXiv em IA, aprendizado de máquina e linguagem' : 'Sem destaques nesta leitura'}
                </p>
              </div>
              {painel.destaques.length ? (
                <ol className="divide-y divide-beon-line">
                  {painel.destaques.map((x, i) => <PaperEmDestaque key={x.id} paper={x} posicao={i} pesquisadores={painel.pesquisadores} />)}
                </ol>
              ) : (
                <p className="px-5 py-12 text-center text-sm text-beon-body">Os papers em destaque não puderam ser lidos agora.</p>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-beon-muted">
            Papers do arXiv e do Daily Papers do Hugging Face; fotos da Wikipedia (Wikimedia Commons). Leitura {tempoRelativo(painel.atualizadoEm)}.
            {painel.fontes.filter(f => !f.ok).length > 0 && ` Não responderam nesta leitura: ${painel.fontes.filter(f => !f.ok).map(f => f.nome).join(', ')}.`}
          </p>
        </>
      )}

      {selecionada && painel && <DetalheDoPesquisador l={selecionada} painel={painel} onFechar={fechar} />}
    </section>
  )
}

function DetalheDoPesquisador({ l, painel, onFechar }: { l: { p: PesquisadorNoRadar; itens: Item[] }; painel: PainelDePesquisa; onFechar: () => void }) {
  const { p, itens } = l
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 20)
    const tecla = (k: KeyboardEvent) => { if (k.key === 'Escape') onFechar() }
    document.addEventListener('keydown', tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.removeEventListener('keydown', tecla); document.body.style.overflow = overflow }
  }, [onFechar])

  const limite = Date.now() - painel.diasDeNovidade * 86_400_000
  const links = [
    { rotulo: 'Papers no arXiv', href: `https://arxiv.org/search/?searchtype=author&query=${encodeURIComponent(p.nome)}` },
    { rotulo: 'Google Scholar', href: `https://scholar.google.com/scholar?q=${encodeURIComponent(`author:"${p.nome}"`)}` },
    { rotulo: 'Wikipedia', href: p.foto?.pagina || `https://en.wikipedia.org/wiki/${encodeURIComponent(p.wikipedia)}` },
  ]

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="t-pesquisador">
      <button type="button" aria-label="Fechar" onClick={onFechar} className={cx('absolute inset-0 bg-stone-950/40 backdrop-blur-[2px] transition-opacity duration-300', visivel ? 'opacity-100' : 'opacity-0')} />
      <div className={cx('relative flex h-full w-full max-w-[600px] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out', visivel ? 'translate-x-0' : 'translate-x-full')}>
        <div className="border-b border-beon-line px-5 pb-6 pt-5 sm:px-7">
          <div className="flex justify-end">
            <button type="button" onClick={onFechar} aria-label="Fechar" className={cx('flex h-9 w-9 items-center justify-center rounded-full border border-beon-line text-beon-body hover:bg-beon-soft', focusRing)}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="mt-1 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <FotoDoPesquisador p={p} tamanho={112} className="ring-4 ring-beon-soft" />
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-red">Pesquisa em IA</p>
              <h2 id="t-pesquisador" className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-beon-ink">{p.nome}</h2>
              <p className="mt-1 text-sm leading-relaxed text-beon-body">{p.conhecidoPor}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {links.map(x => (
              <a key={x.rotulo} href={x.href} target="_blank" rel="noopener noreferrer"
                className={cx('inline-flex h-9 items-center gap-1.5 rounded-full border border-beon-line px-3.5 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
                {x.rotulo}<ArrowUpRight className="h-3.5 w-3.5 text-beon-muted" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-8 px-5 py-6 sm:px-7">
          <section aria-labelledby="t-novidades">
            <h3 id="t-novidades" className="text-sm font-extrabold uppercase tracking-[0.12em] text-beon-ink">O que há de novo</h3>
            {itens.length ? (
              <ul className="mt-3 space-y-2.5">
                {itens.map(i => {
                  const t = TIPO[i.tipo]
                  const I = t.icone
                  const interno = i.link.startsWith('/')
                  const conteudo = (
                    <>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.suave, color: t.cor }}><I className="h-[18px] w-[18px]" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: t.cor }}>{t.rotulo}</span>
                        <span className="mt-0.5 block text-sm font-semibold leading-snug text-beon-ink group-hover:text-beon-red">{i.titulo}</span>
                        <span className="mt-0.5 block text-xs text-beon-muted">{[i.fonte, i.em && tempoRelativo(i.em)].filter(Boolean).join(' · ')}</span>
                      </span>
                    </>
                  )
                  const classe = cx('group flex gap-3 rounded-2xl border border-beon-line p-3 hover:border-beon-ink/20 hover:bg-beon-soft/50', focusRing)
                  return (
                    <li key={`${i.tipo}${i.link}`}>
                      {interno ? <Link href={i.link} className={classe}>{conteudo}</Link>
                        : <a href={i.link} target="_blank" rel="noopener noreferrer" className={classe}>{conteudo}</a>}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-3 rounded-2xl bg-beon-soft px-4 py-4 text-sm text-beon-body">
                Nada novo nos últimos {painel.diasDeNovidade} dias: nenhum paper novo no arXiv, nos destaques do dia, nas notícias do Radar ou compartilhado na comunidade.
              </p>
            )}
          </section>

          <section aria-labelledby="t-papers">
            <h3 id="t-papers" className="text-sm font-extrabold uppercase tracking-[0.12em] text-beon-ink">Últimos papers no arXiv</h3>
            {p.papers.length ? (
              <ul className="mt-3 divide-y divide-beon-line rounded-2xl border border-beon-line">
                {p.papers.map(x => (
                  <li key={x.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <a href={x.link} target="_blank" rel="noopener noreferrer" className={cx('rounded text-sm font-bold leading-snug text-beon-ink hover:text-beon-red', focusRing)}>{x.titulo}</a>
                      {x.publicadoEm && Date.parse(x.publicadoEm) >= limite && <span className="shrink-0 rounded-full bg-beon-red px-2 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>}
                    </div>
                    <p className="mt-1 text-xs text-beon-muted">{[dataCurta(x.publicadoEm), x.categoria, `${x.autores.length} ${x.autores.length === 1 ? 'autor' : 'autores'}`].filter(Boolean).join(' · ')}</p>
                    {x.resumo && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-beon-body">{x.resumo}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {x.pdf && <a href={x.pdf} target="_blank" rel="noopener noreferrer" className={cx('inline-flex items-center gap-1 rounded text-xs font-semibold text-beon-body hover:text-beon-red hover:underline', focusRing)}><BookOpen className="h-3.5 w-3.5" aria-hidden />PDF</a>}
                      <BotaoCompartilhar paper={x} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-2xl bg-beon-soft px-4 py-4 text-sm text-beon-body">
                {painel.arxivDesde ? `Nenhum paper no arXiv desde ${dataCurta(painel.arxivDesde)}.` : 'Os papers do arXiv não puderam ser lidos agora.'}
              </p>
            )}
          </section>

          {p.noticias.length > 0 && (
            <section aria-labelledby="t-noticias">
              <h3 id="t-noticias" className="text-sm font-extrabold uppercase tracking-[0.12em] text-beon-ink">Nas notícias do Radar</h3>
              <ul className="mt-3 space-y-2">
                {p.noticias.map(n => (
                  <li key={n.link}>
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className={cx('block rounded-2xl border border-beon-line px-4 py-3 hover:bg-beon-soft/50', focusRing)}>
                      <span className="block text-sm font-semibold leading-snug text-beon-ink">{n.titulo}</span>
                      <span className="mt-0.5 block text-xs text-beon-muted">{[n.fonte, n.publicadoEm && tempoRelativo(n.publicadoEm)].filter(Boolean).join(' · ')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.foto && <p className="text-[11px] text-beon-muted">Foto: Wikipedia / Wikimedia Commons.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
