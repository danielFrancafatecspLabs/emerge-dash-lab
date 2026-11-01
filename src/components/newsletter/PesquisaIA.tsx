'use client'

// Fronteira da IA no beOn Radar: a galeria de retratos dos pesquisadores para acompanhar (no canto direito de cada
// retrato, se há algo novo dele) e os papers em alta do dia. Clicar no retrato abre o perfil com as novidades, a linha
// do tempo de papers e as notícias.
//
// Foto, em camadas: a cópia que o servidor baixou da Wikipedia (servida pelo próprio app), o endereço original na
// Wikimedia, a busca direto do navegador na Wikipedia e, por fim, um retrato gráfico com as iniciais.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BookOpen, FileText, MessageSquare, Newspaper, Share2, Sparkles, Star, ThumbsUp, X, type LucideIcon } from 'lucide-react'
import {
  compartilhamentosDe, ehAutor,
  type Compartilhamento, type Novidade, type PainelDePesquisa, type Paper, type PesquisadorNoRadar,
} from '@/lib/newsletter/pesquisa-ia'
import { BASE_PATH, api, errorMessage } from '@/components/comunidade/api'
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
  destaque: { rotulo: 'Paper em alta', icone: Star, cor: '#B45309', suave: '#FEF6E7' },
  compartilhado: { rotulo: 'Compartilhado aqui', icone: Share2, cor: '#0E7490', suave: '#ECFEFF' },
  noticia: { rotulo: 'Nas notícias', icone: Newspaper, cor: '#1E3A5F', suave: '#EEF2F7' },
}

const chaveDe = (p: PesquisadorNoRadar, i: Item) => `${p.id}|${i.tipo}|${i.link}`
const dataCurta = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ de /g, ' ').replace('.', '') : ''
const autoresCurtos = (a: string[]) => a.length > 3 ? `${a.slice(0, 3).join(', ')} e mais ${a.length - 3}` : a.join(', ')
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) }

function itensDe(p: PesquisadorNoRadar, compartilhados: Compartilhamento[]): Item[] {
  return [...p.novidades, ...compartilhados.map(c => ({
    tipo: 'compartilhado' as const, titulo: c.titulo, link: `/comunidade/post/${c.postId}`, em: c.em, fonte: `por ${c.autor}`,
  }))].sort((a, b) => (b.em ?? '').localeCompare(a.em ?? ''))
}

// ── Foto ────────────────────────────────────────────────────────────────────────────────────

const buscasNoNavegador = new Map<string, Promise<string | null>>()

/** Última tentativa: o navegador pergunta à Wikipedia (a API de resumo aceita chamadas de qualquer site). */
function fotoPeloNavegador(titulo: string): Promise<string | null> {
  let busca = buscasNoNavegador.get(titulo)
  if (!busca) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    busca = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((j: { thumbnail?: { source?: string } } | null) => (j?.thumbnail?.source && /^https:\/\//.test(j.thumbnail.source) ? j.thumbnail.source : null))
      .catch(() => null)
      .finally(() => clearTimeout(timer))
    buscasNoNavegador.set(titulo, busca)
  }
  return busca
}

type ComFoto = Pick<PesquisadorNoRadar, 'id' | 'nome' | 'foto' | 'wikipedia'>

/** As fontes da foto, em ordem; avança a cada falha. null quando nenhuma funcionou. */
function useFoto(p: ComFoto): { src: string | null; falhou: () => void } {
  const doServidor = useMemo(() => p.foto
    ? [`${BASE_PATH}/api/community/newsletter/pesquisa/foto/${p.id}?v=${hash(p.foto.url)}`, p.foto.url]
    : [], [p.foto, p.id])
  const [extra, setExtra] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const lista = useMemo(() => [...doServidor, ...(extra ? [extra] : [])], [doServidor, extra])
  const esgotou = i >= lista.length

  useEffect(() => {
    if (!esgotou || extra) return
    let vivo = true
    fotoPeloNavegador(p.wikipedia).then(u => { if (vivo && u && !doServidor.includes(u)) setExtra(u) })
    return () => { vivo = false }
  }, [esgotou, extra, p.wikipedia, doServidor])

  return { src: lista[i] ?? null, falhou: useCallback(() => setI(n => n + 1), []) }
}

const TONS = [['#D31809', '#5C0A03'], ['#2F6FB3', '#132C4A'], ['#B45309', '#4A2304'], ['#0F766E', '#062F2C'], ['#57534E', '#1C1917']]

/** Retrato gráfico (sem foto): gradiente, órbitas e as iniciais grandes. */
function RetratoGrafico({ p, className }: { p: ComFoto; className?: string }) {
  const [a, b] = TONS[hash(p.id) % TONS.length]
  return (
    <span className={cx('flex items-center justify-center overflow-hidden', className)} style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} aria-hidden>
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {[60, 100, 140, 180].map((r, k) => <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="white" strokeOpacity={0.16 - k * 0.03} strokeWidth="1.2" />)}
        {[0, 1, 2, 3, 4].map(k => <circle key={k} cx={150 + Math.cos(hash(p.id) + k * 1.3) * (60 + k * 30)} cy={150 + Math.sin(hash(p.id) + k * 1.3) * (60 + k * 30)} r="3" fill="white" fillOpacity="0.5" />)}
      </svg>
      <span className="relative -mt-[18%] font-black tracking-tight text-white/90" style={{ fontSize: 'min(34cqw, 72px)' }}>{iniciais(p.nome)}</span>
    </span>
  )
}

/** Foto (preenche o contêiner) com as camadas de reserva. */
function Retrato({ p, className }: { p: ComFoto; className?: string }) {
  const { src, falhou } = useFoto(p)
  if (!src) return <RetratoGrafico p={p} className={cx('[container-type:inline-size]', className)} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Foto de ${p.nome}`} onError={falhou} referrerPolicy="no-referrer" loading="lazy"
      className={cx('object-cover object-[50%_20%]', className)} />
  )
}

/** Foto redonda e pequena (autores dos papers). */
function Rosto({ p, tamanho }: { p: ComFoto; tamanho: number }) {
  return (
    <span className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white" style={{ width: tamanho, height: tamanho }}>
      <Retrato p={p} className="absolute inset-0 h-full w-full" />
    </span>
  )
}

// ── Galeria ─────────────────────────────────────────────────────────────────────────────────

/** O canto direito do retrato: a novidade mais recente (piscando se ainda não foi vista) ou "sem novidade". */
function SeloDeNovidade({ itens, novos }: { itens: Item[]; novos: number }) {
  if (!itens.length) {
    return <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] font-semibold text-white/80 backdrop-blur-md">Sem novidade</span>
  }
  const t = TIPO[itens[0].tipo]
  const Icone = t.icone
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-lg', novos ? 'text-white' : 'bg-white/95')}
      style={novos ? { background: t.cor } : { color: t.cor }}>
      {novos > 0
        ? <span className="relative flex h-1.5 w-1.5" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white motion-reduce:hidden" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>
        : <Icone className="h-3.5 w-3.5" aria-hidden />}
      {t.rotulo}
      {itens.length > 1 && <span className={novos ? 'text-white/75' : 'opacity-60'}>+{itens.length - 1}</span>}
    </span>
  )
}

function CartaoDoPesquisador({ p, itens, novos, onAbrir }: { p: PesquisadorNoRadar; itens: Item[]; novos: number; onAbrir: () => void }) {
  const ultima = itens[0]
  return (
    <button type="button" onClick={onAbrir}
      aria-label={`${p.nome}: ${ultima ? `${TIPO[ultima.tipo].rotulo}${novos ? ' (não visto)' : ''}` : 'sem novidade'}. Abrir perfil`}
      className={cx('group relative block aspect-[3/4] w-full overflow-hidden rounded-[22px] bg-stone-900 text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-stone-900/25',
        novos > 0 && 'ring-2 ring-beon-red ring-offset-2', focusRing)}>
      <Retrato p={p} className={cx('absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.04]', !ultima && 'grayscale-[85%] group-hover:grayscale-0')} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/95 from-5% via-black/65 via-45% to-black/0 to-80%" aria-hidden />
      <span className="absolute right-2.5 top-2.5"><SeloDeNovidade itens={itens} novos={novos} /></span>
      <span className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <span className="block text-[17px] font-extrabold leading-tight tracking-tight text-white">{p.nome}</span>
        <span className="mt-1 line-clamp-2 block text-[11.5px] leading-snug text-white/70">{p.conhecidoPor}</span>
        {ultima && (
          <span className="mt-2.5 line-clamp-2 block border-t border-white/15 pt-2 text-[11px] leading-snug text-white/90">
            {ultima.em && <b className="font-bold text-white">{tempoRelativo(ultima.em)} · </b>}{ultima.titulo}
          </span>
        )}
      </span>
    </button>
  )
}

// ── Papers ──────────────────────────────────────────────────────────────────────────────────

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

/** Autores do paper, com o rosto dos pesquisadores que a seção acompanha. */
function Autores({ paper, pesquisadores, onAbrir }: { paper: Paper; pesquisadores: PesquisadorNoRadar[]; onAbrir: (id: string) => void }) {
  const nossos = pesquisadores.filter(p => paper.autores.some(a => ehAutor(p, a)))
  const outros = paper.autores.filter(a => !nossos.some(p => ehAutor(p, a)))
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-beon-muted">
      {nossos.map(p => (
        <button key={p.id} type="button" onClick={() => onAbrir(p.id)}
          className={cx('inline-flex items-center gap-1.5 rounded-full bg-beon-soft py-0.5 pl-0.5 pr-2.5 font-semibold text-beon-ink hover:bg-stone-200', focusRing)}>
          <Rosto p={p} tamanho={20} />{p.nome}
        </button>
      ))}
      {outros.length > 0 && <span className="min-w-0">{autoresCurtos(outros)}</span>}
    </p>
  )
}

/** Capa do paper em alta: a miniatura do Hugging Face ou, sem ela, uma capa gráfica. */
function CapaDoPaper({ paper }: { paper: Paper }) {
  const [falhou, setFalhou] = useState(false)
  if (paper.imagem && !falhou) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={paper.imagem} alt="" onError={() => setFalhou(true)} className="absolute inset-0 h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
  }
  const s = hash(paper.id)
  return (
    <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs><linearGradient id={`cp${s}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1C1917" /><stop offset="1" stopColor="#7A0E05" /></linearGradient></defs>
      <rect width="640" height="360" fill={`url(#cp${s})`} />
      {Array.from({ length: 9 }, (_, k) => {
        const y = 40 + k * 36
        return <path key={k} d={`M0 ${y} C 160 ${y - 40 + ((s >> k) % 60)}, 420 ${y + 40 - ((s >> (k + 2)) % 60)}, 640 ${y}`} fill="none" stroke="white" strokeOpacity={0.06 + (k % 3) * 0.04} strokeWidth="1.2" />
      })}
      {Array.from({ length: 22 }, (_, k) => <circle key={`c${k}`} cx={(s * (k + 3) * 7) % 640} cy={(s * (k + 5) * 3) % 360} r={1.5 + (k % 3)} fill="white" fillOpacity="0.35" />)}
    </svg>
  )
}

function PaperPrincipal({ paper, pesquisadores, fonte, onAbrir }: { paper: Paper; pesquisadores: PesquisadorNoRadar[]; fonte: PainelDePesquisa['destaquesFonte']; onAbrir: (id: string) => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[26px] border border-beon-line bg-white lg:sticky lg:top-24">
      <div className="relative aspect-[16/8] shrink-0 overflow-hidden bg-stone-900">
        <CapaDoPaper paper={paper} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-beon-ink shadow">
          <Sparkles className="h-3.5 w-3.5 text-beon-red" aria-hidden />{fonte === 'huggingface' ? 'Nº 1 em alta hoje' : 'Mais recente'}
        </span>
        {paper.votos !== undefined && (
          <span className="absolute bottom-4 left-4 inline-flex items-baseline gap-1.5 text-white">
            <span className="text-4xl font-black tabular-nums leading-none">{paper.votos}</span>
            <span className="text-sm font-semibold text-white/80">votos da comunidade de IA</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <a href={paper.link} target="_blank" rel="noopener noreferrer" className={cx('rounded text-xl font-extrabold leading-snug tracking-tight text-beon-ink hover:text-beon-red sm:text-2xl', focusRing)}>{paper.titulo}</a>
        <Autores paper={paper} pesquisadores={pesquisadores} onAbrir={onAbrir} />
        {paper.resumo && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-beon-body">{paper.resumo}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
          <a href={paper.link} target="_blank" rel="noopener noreferrer"
            className={cx('inline-flex h-10 items-center gap-1.5 rounded-full bg-beon-red px-4 text-sm font-bold text-white hover:bg-beon-redhi', focusRing)}>
            Ler o paper<ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
          {paper.pdf && <a href={paper.pdf} target="_blank" rel="noopener noreferrer" className={cx('inline-flex items-center gap-1 rounded text-xs font-semibold text-beon-body hover:text-beon-red hover:underline', focusRing)}><BookOpen className="h-3.5 w-3.5" aria-hidden />PDF</a>}
          {!!paper.comentarios && <span className="inline-flex items-center gap-1 text-xs text-beon-muted"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{paper.comentarios}</span>}
          <BotaoCompartilhar paper={paper} />
        </div>
      </div>
    </article>
  )
}

function PaperDaLista({ paper, posicao, maximo, pesquisadores, onAbrir }: { paper: Paper; posicao: number; maximo: number; pesquisadores: PesquisadorNoRadar[]; onAbrir: (id: string) => void }) {
  return (
    <li className="flex gap-4 px-5 py-4">
      <span className="w-8 shrink-0 pt-0.5 text-[22px] font-black tabular-nums leading-none text-beon-ink/25" aria-hidden>{String(posicao + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <a href={paper.link} target="_blank" rel="noopener noreferrer" className={cx('line-clamp-2 rounded text-[15px] font-bold leading-snug text-beon-ink hover:text-beon-red', focusRing)}>{paper.titulo}</a>
        <Autores paper={paper} pesquisadores={pesquisadores} onAbrir={onAbrir} />
        {paper.votos !== undefined && maximo > 0 && (
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-beon-soft">
              <span className="block h-full rounded-full bg-gradient-to-r from-beon-red/70 to-beon-red" style={{ width: `${Math.max(4, (paper.votos / maximo) * 100)}%` }} />
            </span>
            <span className="inline-flex w-20 shrink-0 items-center justify-end gap-1 text-xs font-bold tabular-nums text-beon-ink"><ThumbsUp className="h-3.5 w-3.5 text-beon-red" aria-hidden />{paper.votos}</span>
          </div>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-beon-muted">
          {paper.publicadoEm && <span>{dataCurta(paper.publicadoEm)}</span>}
          {!!paper.comentarios && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{paper.comentarios}</span>}
          {paper.pdf && <a href={paper.pdf} target="_blank" rel="noopener noreferrer" className={cx('rounded font-semibold hover:text-beon-red hover:underline', focusRing)}>PDF</a>}
          <BotaoCompartilhar paper={paper} />
        </p>
      </div>
    </li>
  )
}

// ── Seção ───────────────────────────────────────────────────────────────────────────────────

export function SecaoPesquisaIA({ painel, erro }: { painel: PainelDePesquisa | null; erro: string | null }) {
  const { posts } = useCommunity()
  const { vistas, marcar } = useVistas()
  const [aberto, setAberto] = useState<string | null>(null)
  const [soNovidades, setSoNovidades] = useState(false)

  const linhas = useMemo(() => (painel?.pesquisadores ?? []).map(p => {
    const itens = itensDe(p, compartilhamentosDe(p, painel?.destaques ?? [], posts.data ?? []))
    return { p, itens, novos: itens.filter(i => !vistas.has(chaveDe(p, i))).length }
  }), [painel, posts.data, vistas])
  // Quem tem algo ainda não visto vem primeiro; depois quem tem novidade; depois a ordem do servidor.
  const ordenadas = useMemo(() => [...linhas].sort((a, b) => Number(b.novos > 0) - Number(a.novos > 0) || Number(b.itens.length > 0) - Number(a.itens.length > 0)), [linhas])
  const comNovidade = linhas.filter(l => l.itens.length).length
  const visiveis = soNovidades ? ordenadas.filter(l => l.itens.length) : ordenadas

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
  const [principal, ...demais] = painel?.destaques ?? []
  const maximo = Math.max(0, ...(painel?.destaques ?? []).map(d => d.votos ?? 0))

  return (
    <section id="pesquisa-ia" aria-labelledby="t-pesquisa-ia" className="scroll-mt-36 md:scroll-mt-20">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-beon-red">
            <span className="relative flex h-2 w-2" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beon-red/60 motion-reduce:hidden" /><span className="relative inline-flex h-2 w-2 rounded-full bg-beon-red" /></span>
            Fronteira da IA
          </p>
          <h2 id="t-pesquisa-ia" className="mt-2 max-w-3xl text-[30px] font-black leading-[1.05] tracking-tight text-beon-ink sm:text-[44px]">
            As mentes que estão desenhando o futuro da <span className="text-beon-red">inteligência artificial</span>
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-beon-body">
            Quem está na fronteira da IA e o que publicou agora. No canto de cada retrato, a novidade: paper novo, paper em alta,
            compartilhado na comunidade ou nas notícias.
          </p>
        </div>
        {painel && (
          <dl className="grid grid-cols-3 divide-x divide-beon-line rounded-2xl border border-beon-line bg-white">
            <div className="px-4 py-3 sm:px-5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Com novidade</dt>
              <dd className="mt-0.5 text-2xl font-black tabular-nums text-beon-ink">{comNovidade}<span className="text-sm font-bold text-beon-muted">/{linhas.length}</span></dd>
            </div>
            <div className="px-4 py-3 sm:px-5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Papers em alta</dt>
              <dd className="mt-0.5 text-2xl font-black tabular-nums text-beon-ink">{painel.destaques.length}</dd>
            </div>
            <div className="px-4 py-3 sm:px-5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Janela</dt>
              <dd className="mt-0.5 text-2xl font-black tabular-nums text-beon-ink">{painel.diasDeNovidade}<span className="text-sm font-bold text-beon-muted"> dias</span></dd>
            </div>
          </dl>
        )}
      </header>

      {erro && !painel && (
        <p className="mt-6 rounded-[26px] border border-beon-line px-5 py-12 text-center text-sm text-beon-body">{erro}</p>
      )}

      {!painel && !erro && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" aria-busy="true" aria-label="Carregando pesquisadores e papers">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-[22px]" />)}
        </div>
      )}

      {painel && (
        <>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" role="group" aria-label="Filtrar pesquisadores">
              {[{ v: false, r: `Todos · ${linhas.length}` }, { v: true, r: `Com novidade · ${comNovidade}` }].map(f => (
                <button key={String(f.v)} type="button" aria-pressed={soNovidades === f.v} onClick={() => setSoNovidades(f.v)} disabled={f.v && !comNovidade}
                  className={cx('h-9 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-40', focusRing,
                    soNovidades === f.v ? 'bg-beon-ink text-white' : 'border border-beon-line bg-white text-beon-ink hover:bg-beon-soft')}>
                  {f.r}
                </button>
              ))}
            </div>
            <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-beon-body">
              {(Object.keys(TIPO) as Item['tipo'][]).map(t => (
                <span key={t} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TIPO[t].cor }} aria-hidden />{TIPO[t].rotulo}</span>
              ))}
            </p>
          </div>

          <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 pt-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
            {visiveis.map(l => (
              <li key={l.p.id} className="w-[58%] shrink-0 snap-start sm:w-auto">
                <CartaoDoPesquisador p={l.p} itens={l.itens} novos={l.novos} onAbrir={() => abrir(l.p.id)} />
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-beon-ink sm:text-2xl">Papers em alta hoje</h3>
              <p className="mt-0.5 text-sm text-beon-muted">
                {painel.destaquesFonte === 'huggingface' ? 'Os mais votados do dia no Daily Papers do Hugging Face'
                  : painel.destaquesFonte === 'arxiv' ? 'Os mais recentes do arXiv em IA, aprendizado de máquina e linguagem' : 'Sem destaques nesta leitura'}
              </p>
            </div>
          </div>

          {principal ? (
            <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <PaperPrincipal paper={principal} pesquisadores={painel.pesquisadores} fonte={painel.destaquesFonte} onAbrir={abrir} />
              {demais.length > 0 && (
                <ol start={2} className="divide-y divide-beon-line overflow-hidden rounded-[26px] border border-beon-line bg-white">
                  {demais.map((x, i) => <PaperDaLista key={x.id} paper={x} posicao={i + 1} maximo={maximo} pesquisadores={painel.pesquisadores} onAbrir={abrir} />)}
                </ol>
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-[26px] border border-beon-line px-5 py-12 text-center text-sm text-beon-body">Os papers em alta não puderam ser lidos agora.</p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-beon-muted">
            Papers do arXiv e do Daily Papers do Hugging Face; fotos da Wikipedia (Wikimedia Commons). Leitura {tempoRelativo(painel.atualizadoEm)}.
            {painel.fontes.some(f => !f.ok) && ` Não responderam nesta leitura: ${painel.fontes.filter(f => !f.ok).map(f => f.nome).join(', ')}.`}
          </p>
        </>
      )}

      {selecionada && painel && <PerfilDoPesquisador l={selecionada} painel={painel} onFechar={fechar} />}
    </section>
  )
}

// ── Perfil ──────────────────────────────────────────────────────────────────────────────────

function PerfilDoPesquisador({ l, painel, onFechar }: { l: { p: PesquisadorNoRadar; itens: Item[] }; painel: PainelDePesquisa; onFechar: () => void }) {
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
      <button type="button" aria-label="Fechar" onClick={onFechar} className={cx('absolute inset-0 bg-stone-950/45 backdrop-blur-[3px] transition-opacity duration-300', visivel ? 'opacity-100' : 'opacity-0')} />
      <div className={cx('relative flex h-full w-full max-w-[600px] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out', visivel ? 'translate-x-0' : 'translate-x-full')}>
        <div className="relative h-[340px] shrink-0 overflow-hidden bg-stone-900 sm:h-[380px]">
          <Retrato p={p} className="absolute inset-0 h-full w-full" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/25" aria-hidden />
          <button type="button" onClick={onFechar} aria-label="Fechar"
            className={cx('absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md hover:bg-black/55', focusRing)}>
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">Fronteira da IA</p>
            <h2 id="t-pesquisador" className="mt-1 text-[34px] font-black leading-none tracking-tight text-white sm:text-[40px]">{p.nome}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{p.conhecidoPor}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-beon-line px-5 py-4 sm:px-7">
          {links.map(x => (
            <a key={x.rotulo} href={x.href} target="_blank" rel="noopener noreferrer"
              className={cx('inline-flex h-9 items-center gap-1.5 rounded-full border border-beon-line px-3.5 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
              {x.rotulo}<ArrowUpRight className="h-3.5 w-3.5 text-beon-muted" aria-hidden />
            </a>
          ))}
        </div>

        <div className="space-y-9 px-5 py-7 sm:px-7">
          <section aria-labelledby="t-novidades">
            <h3 id="t-novidades" className="text-xs font-extrabold uppercase tracking-[0.14em] text-beon-ink">O que há de novo</h3>
            {itens.length ? (
              <ul className="mt-3 space-y-2.5">
                {itens.map(i => {
                  const t = TIPO[i.tipo]
                  const I = t.icone
                  const conteudo = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: t.suave, color: t.cor }}><I className="h-[18px] w-[18px]" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: t.cor }}>{t.rotulo}</span>
                        <span className="mt-0.5 block text-sm font-semibold leading-snug text-beon-ink group-hover:text-beon-red">{i.titulo}</span>
                        <span className="mt-0.5 block text-xs text-beon-muted">{[i.fonte, i.em && tempoRelativo(i.em)].filter(Boolean).join(' · ')}</span>
                      </span>
                    </>
                  )
                  const classe = cx('group flex gap-3 rounded-2xl border border-beon-line p-3 transition-colors hover:border-beon-ink/20 hover:bg-beon-soft/50', focusRing)
                  return (
                    <li key={`${i.tipo}${i.link}`}>
                      {i.link.startsWith('/') ? <Link href={i.link} className={classe}>{conteudo}</Link>
                        : <a href={i.link} target="_blank" rel="noopener noreferrer" className={classe}>{conteudo}</a>}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-3 rounded-2xl bg-beon-soft px-4 py-4 text-sm text-beon-body">
                Nada novo nos últimos {painel.diasDeNovidade} dias: nenhum paper novo no arXiv, nos papers em alta, nas notícias do Radar ou compartilhado na comunidade.
              </p>
            )}
          </section>

          <section aria-labelledby="t-papers">
            <h3 id="t-papers" className="text-xs font-extrabold uppercase tracking-[0.14em] text-beon-ink">Linha do tempo no arXiv</h3>
            {p.papers.length ? (
              <ol className="relative mt-4 space-y-5 border-l-2 border-beon-line pl-5">
                {p.papers.map(x => {
                  const novo = !!x.publicadoEm && Date.parse(x.publicadoEm) >= limite
                  return (
                    <li key={x.id} className="relative">
                      <span className={cx('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white', novo ? 'bg-beon-red' : 'bg-stone-300')} aria-hidden />
                      <p className="flex items-center gap-2 text-xs font-semibold text-beon-muted">
                        {dataCurta(x.publicadoEm)}{x.categoria && <span>· {x.categoria}</span>}
                        {novo && <span className="rounded-full bg-beon-red px-2 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>}
                      </p>
                      <a href={x.link} target="_blank" rel="noopener noreferrer" className={cx('mt-1 block rounded text-[15px] font-bold leading-snug text-beon-ink hover:text-beon-red', focusRing)}>{x.titulo}</a>
                      <p className="mt-0.5 text-xs text-beon-muted">{autoresCurtos(x.autores)}</p>
                      {x.resumo && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-beon-body">{x.resumo}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {x.pdf && <a href={x.pdf} target="_blank" rel="noopener noreferrer" className={cx('inline-flex items-center gap-1 rounded text-xs font-semibold text-beon-body hover:text-beon-red hover:underline', focusRing)}><BookOpen className="h-3.5 w-3.5" aria-hidden />PDF</a>}
                        <BotaoCompartilhar paper={x} />
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="mt-3 rounded-2xl bg-beon-soft px-4 py-4 text-sm text-beon-body">
                {painel.arxivDesde ? `Nenhum paper no arXiv desde ${dataCurta(painel.arxivDesde)}.` : 'Os papers do arXiv não puderam ser lidos agora.'}
              </p>
            )}
          </section>

          {p.noticias.length > 0 && (
            <section aria-labelledby="t-noticias">
              <h3 id="t-noticias" className="text-xs font-extrabold uppercase tracking-[0.14em] text-beon-ink">Nas notícias do Radar</h3>
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

          <p className="text-[11px] text-beon-muted">Foto: Wikipedia / Wikimedia Commons.</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
