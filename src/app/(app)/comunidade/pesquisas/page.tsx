'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bookmark, BookOpen, FileText, FlaskConical, Library, Search, Users } from 'lucide-react'
import {
  MATERIAL_STATUS_LABEL, MATERIAL_TIPO_LABEL, matchesSearch,
  type CommunityPost, type MaterialStatus, type MaterialTipo,
} from '@/lib/community/model'
import { COMMUNITY_TOPICS, topicLabel } from '@/lib/community/topics'
import type { ResearchDocumentContent, ResearchVault } from '@/components/research/types'
import { ICONE_DO_TIPO, LeitorDePesquisa, ROTULO_DO_TIPO } from '@/components/research/LeitorDePesquisa'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { tempoRelativo } from '@/components/comunidade/format'
import { Button, Chip, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/ui'

type Aba = 'comunidade' | 'acervo' | 'experimentos'
type Periodo = 'todos' | '30' | '90' | '365'

const PERIODO_LABEL: Record<Periodo, string> = { todos: 'Qualquer data', '30': 'Últimos 30 dias', '90': 'Últimos 3 meses', '365': 'Últimos 12 meses' }
const STATUS_TONE: Record<MaterialStatus, string> = {
  publicado: 'bg-emerald-50 text-emerald-800',
  'em-elaboracao': 'bg-amber-50 text-amber-800',
  'referencia-externa': 'bg-sky-50 text-sky-800',
}

function MaterialRow({ post }: { post: CommunityPost }) {
  const { me, patchProfile, toast } = useCommunity()
  const saved = !!me?.profile.salvos.includes(post.id)
  const status = post.meta.materialStatus ?? 'publicado'
  return (
    <li className="group flex gap-4 border-b border-beon-line px-4 py-5 sm:px-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><FileText className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-beon-muted">{MATERIAL_TIPO_LABEL[post.meta.materialTipo ?? 'artigo']}</span>
          <span className={cx('rounded-full px-2 py-0.5 font-medium', STATUS_TONE[status])}>{MATERIAL_STATUS_LABEL[status]}</span>
        </div>
        <Link href={`/comunidade/post/${post.id}`} className="mt-1 block text-[16px] font-semibold leading-snug text-beon-ink hover:underline">{post.title}</Link>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-beon-body">{post.content}</p>
        <p className="mt-2 text-[13px] text-beon-muted">
          Compartilhado por <Link href={`/comunidade/pessoas/${encodeURIComponent(post.authorUsername)}`} className="font-medium text-beon-body hover:underline">{post.authorName}</Link>
          {' · '}{tempoRelativo(post.createdAt)}
          {post.tags.length > 0 && <> · {post.tags.map(topicLabel).join(', ')}</>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button type="button" aria-pressed={saved} aria-label={saved ? 'Remover dos salvos' : 'Salvar material'}
          onClick={async () => {
            const ok = await patchProfile({ toggleSalvo: post.id }, p => ({ ...p, salvos: saved ? p.salvos.filter(s => s !== post.id) : [...p.salvos, post.id] }))
            if (ok) toast(saved ? 'Removido dos salvos.' : 'Material salvo.')
          }}
          className={cx('rounded-full p-2 hover:bg-beon-soft', saved ? 'text-beon-red' : 'text-beon-muted hover:text-beon-ink', focusRing)}>
          <Bookmark className={cx('h-4 w-4', saved && 'fill-current')} aria-hidden />
        </button>
        {post.linkUrl && (
          <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir material: ${post.title}`}
            className={cx('rounded-full p-2 text-beon-muted hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </li>
  )
}

function DaComunidade({ busca }: { busca: string }) {
  const { posts, reloadPosts, openComposer } = useCommunity()
  const [tipo, setTipo] = useState<MaterialTipo | ''>('')
  const [status, setStatus] = useState<MaterialStatus | ''>('')
  const [tema, setTema] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>('todos')

  const lista = useMemo(() => {
    const desde = periodo === 'todos' ? 0 : Date.now() - Number(periodo) * 86_400_000
    return (posts.data ?? [])
      .filter(p => p.kind === 'pesquisa')
      .filter(p => (!tipo || p.meta.materialTipo === tipo) && (!status || (p.meta.materialStatus ?? 'publicado') === status)
        && (!tema || p.tags.includes(tema)) && Date.parse(p.createdAt) >= desde && matchesSearch(p, busca))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }, [posts.data, busca, tipo, status, tema, periodo])

  const filtrando = !!(busca || tipo || status || tema || periodo !== 'todos')

  return (
    <>
      <div className="space-y-3 px-4 pb-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sr-only" htmlFor="f-tipo">Tipo de material</label>
          <select id="f-tipo" value={tipo} onChange={e => setTipo(e.target.value as MaterialTipo | '')} className={cx(inputClass, 'rounded-full')}>
            <option value="">Todos os tipos</option>
            {(Object.keys(MATERIAL_TIPO_LABEL) as MaterialTipo[]).map(k => <option key={k} value={k}>{MATERIAL_TIPO_LABEL[k]}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-status">Situação</label>
          <select id="f-status" value={status} onChange={e => setStatus(e.target.value as MaterialStatus | '')} className={cx(inputClass, 'rounded-full')}>
            <option value="">Qualquer situação</option>
            {(Object.keys(MATERIAL_STATUS_LABEL) as MaterialStatus[]).map(k => <option key={k} value={k}>{MATERIAL_STATUS_LABEL[k]}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-periodo">Data</label>
          <select id="f-periodo" value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)} className={cx(inputClass, 'rounded-full')}>
            {(Object.keys(PERIODO_LABEL) as Periodo[]).map(k => <option key={k} value={k}>{PERIODO_LABEL[k]}</option>)}
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por tema">
          <Chip selected={!tema} onClick={() => setTema(null)}>Todos os temas</Chip>
          {COMMUNITY_TOPICS.map(t => <Chip key={t.id} selected={tema === t.id} onClick={() => setTema(tema === t.id ? null : t.id)}>{t.label}</Chip>)}
        </div>
      </div>
      <div className="border-t border-beon-line">
        {posts.error && !posts.data ? <ErrorState message={posts.error} onRetry={reloadPosts} /> : !posts.data ? (
          <div className="space-y-4 p-6">{[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : lista.length === 0 ? (
          <EmptyState icon={BookOpen} title={filtrando ? 'Nenhum material com esses filtros' : 'A biblioteca da comunidade está começando'}
            action={<Button variant="primary" onClick={() => openComposer({ kind: 'pesquisa' })}>Compartilhar um material</Button>}>
            {filtrando ? 'Ajuste os filtros ou busque por outro termo.' : 'Artigos, benchmarks, relatórios e estudos de caso compartilhados pelos membros aparecem aqui.'}
          </EmptyState>
        ) : <ul>{lista.map(p => <MaterialRow key={p.id} post={p} />)}</ul>}
      </div>
    </>
  )
}

// Cores das categorias do acervo (sem roxo), atribuídas pela ordem alfabética: a mesma categoria tem sempre a mesma cor.
const CORES_CATEGORIA = ['#D31809', '#2F6FB3', '#0f766e', '#c2410c', '#15803d', '#b45309', '#0e7490', '#44403C']

const dataCurta = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : null)

function Acervo({ busca }: { busca: string }) {
  const [vault, setVault] = useState<ResearchVault | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [categoria, setCategoria] = useState<string | null>(null)
  const [verTodosConceitos, setVerTodosConceitos] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)
  const [doc, setDoc] = useState<ResearchDocumentContent | null>(null)
  const [docErro, setDocErro] = useState<string | null>(null)
  const [docLoading, setDocLoading] = useState(false)

  const carregar = useCallback(async () => {
    setErro(null)
    try { setVault(await api<ResearchVault>('/pesquisas')) } catch (err) { setErro(errorMessage(err)) }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const abrir = useCallback(async (path: string) => {
    setAberto(path); setDoc(null); setDocErro(null); setDocLoading(true)
    // O documento aberto fica no endereço (?doc=…), para compartilhar o link.
    try { const u = new URL(window.location.href); u.searchParams.set('doc', path); window.history.replaceState(null, '', u) } catch { /* sem history */ }
    try { setDoc(await api<ResearchDocumentContent>(`/pesquisas?file=${encodeURIComponent(path)}`)) } catch (err) { setDocErro(errorMessage(err)) } finally { setDocLoading(false) }
  }, [])
  const fechar = useCallback(() => {
    setAberto(null)
    try { const u = new URL(window.location.href); u.searchParams.delete('doc'); window.history.replaceState(null, '', u) } catch { /* sem history */ }
  }, [])
  useEffect(() => {
    if (!vault) return
    const pedido = new URLSearchParams(window.location.search).get('doc')
    if (pedido && vault.documents.some(d => d.path === pedido)) abrir(pedido)
  }, [vault, abrir])

  const docs = useMemo(() => (vault?.documents ?? []).filter(d => d.type !== 'category'), [vault])
  const categorias = useMemo(() => {
    const nomes = [...new Set(docs.map(d => d.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return nomes.map((nome, i) => ({
      nome, cor: CORES_CATEGORIA[i % CORES_CATEGORIA.length],
      pesquisas: docs.filter(d => d.category === nome && d.type === 'topic').length,
      outros: docs.filter(d => d.category === nome && d.type !== 'topic').length,
    }))
  }, [docs])
  const corDe = useCallback((c: string) => categorias.find(x => x.nome === c)?.cor ?? CORES_CATEGORIA[7], [categorias])

  const q = busca.trim().toLowerCase()
  const filtrados = useMemo(() => docs
    .filter(d => (!categoria || d.category === categoria) && (!q || [d.title, d.category, d.topic ?? '', ...d.tags].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => (b.updated ?? b.created ?? '').localeCompare(a.updated ?? a.created ?? '') || a.title.localeCompare(b.title)),
  [docs, categoria, q])
  const pesquisas = filtrados.filter(d => d.type === 'topic')
  const conceitos = filtrados.filter(d => d.type !== 'topic')
  const ligacoes = useMemo(() => {
    const n = new Map<string, number>()
    for (const e of vault?.edges ?? []) { n.set(e.source, (n.get(e.source) ?? 0) + 1); n.set(e.target, (n.get(e.target) ?? 0) + 1) }
    return n
  }, [vault])

  if (erro) {
    return (
      <EmptyState icon={Library} title="O acervo beOn Labs não está disponível agora">
        {erro} Ele é lido do repositório de pesquisas do beOn Labs; enquanto isso, explore os materiais da comunidade.
      </EmptyState>
    )
  }
  if (!vault) return <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>

  return (
    <div className="space-y-10 px-4 sm:px-6">
      {/* Categorias */}
      <section aria-labelledby="t-categorias">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="t-categorias" className="text-lg font-semibold tracking-tight text-beon-ink">Comece por um tema</h2>
          {categoria && <button type="button" onClick={() => setCategoria(null)} className={cx('text-sm font-medium text-beon-red hover:underline', focusRing)}>Ver todos os temas</button>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map(c => {
            const sel = categoria === c.nome
            return (
              <button key={c.nome} type="button" aria-pressed={sel} onClick={() => setCategoria(sel ? null : c.nome)}
                className={cx('group relative overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md', focusRing,
                  sel ? 'border-transparent text-white' : 'border-beon-line bg-white')}
                style={sel ? { background: c.cor } : undefined}>
                <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-15 transition-transform group-hover:scale-125" style={{ background: sel ? '#fff' : c.cor }} aria-hidden />
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: sel ? 'rgba(255,255,255,0.2)' : `${c.cor}14`, color: sel ? '#fff' : c.cor }}>
                  <BookOpen className="h-4 w-4" aria-hidden />
                </span>
                <span className={cx('mt-3 block font-semibold leading-snug', sel ? 'text-white' : 'text-beon-ink')}>{c.nome}</span>
                <span className={cx('mt-0.5 block text-xs', sel ? 'text-white/80' : 'text-beon-muted')}>
                  {c.pesquisas} {c.pesquisas === 1 ? 'pesquisa' : 'pesquisas'} · {c.outros} {c.outros === 1 ? 'referência' : 'referências'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Pesquisas */}
      <section aria-labelledby="t-pesquisas">
        <h2 id="t-pesquisas" className="mb-3 text-lg font-semibold tracking-tight text-beon-ink">
          Pesquisas concluídas <span className="font-normal text-beon-muted">({pesquisas.length})</span>
        </h2>
        {pesquisas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-beon-line px-6 py-10 text-center text-sm text-beon-muted">Nenhuma pesquisa com esses filtros. Tente outro termo ou tema.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pesquisas.map(d => (
              <button key={d.path} type="button" onClick={() => abrir(d.path)}
                className={cx('group flex flex-col overflow-hidden rounded-2xl border border-beon-line bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5', focusRing)}>
                <span className="relative block h-20 overflow-hidden" style={{ background: `linear-gradient(135deg, ${corDe(d.category)}, ${corDe(d.category)}cc)` }}>
                  <span className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '12px 12px' }} aria-hidden />
                  <span className="absolute bottom-3 left-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/90">{d.category}</span>
                  <Library className="absolute -bottom-2 right-3 h-14 w-14 text-white/20" aria-hidden />
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="text-[17px] font-semibold leading-snug tracking-tight text-beon-ink group-hover:text-beon-red">{d.title}</span>
                  {d.tags.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {d.tags.filter(t => t !== 'index').slice(0, 4).map(t => <span key={t} className="rounded-full bg-beon-soft px-2 py-0.5 text-[11px] text-beon-body">#{t}</span>)}
                    </span>
                  )}
                  <span className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-beon-muted">
                    <span>{d.updated && d.updated !== d.created ? `Revisada em ${dataCurta(d.updated)}` : dataCurta(d.created) ? `Incluída em ${dataCurta(d.created)}` : ''}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-beon-body group-hover:text-beon-red">
                      {ligacoes.get(d.id) ? `${ligacoes.get(d.id)} conexões · ` : ''}Ler <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Conceitos e papers */}
      {conceitos.length > 0 && (
        <section aria-labelledby="t-conceitos">
          <h2 id="t-conceitos" className="mb-1 text-lg font-semibold tracking-tight text-beon-ink">
            Conceitos e papers <span className="font-normal text-beon-muted">({conceitos.length})</span>
          </h2>
          <p className="mb-3 text-sm text-beon-muted">As ideias e referências por trás das pesquisas, para ler em poucos minutos.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(verTodosConceitos ? conceitos : conceitos.slice(0, 12)).map(d => {
              const I = ICONE_DO_TIPO[d.type]
              return (
                <button key={d.path} type="button" onClick={() => abrir(d.path)}
                  className={cx('group flex items-center gap-3 rounded-xl border border-beon-line bg-white p-3 text-left hover:border-beon-red/30 hover:bg-beon-tint/30', focusRing)}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${corDe(d.category)}14`, color: corDe(d.category) }}><I className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-beon-ink group-hover:text-beon-red">{d.title}</span>
                    <span className="block truncate text-xs text-beon-muted">{ROTULO_DO_TIPO[d.type]}{d.topic ? ` · ${d.topic}` : ` · ${d.category}`}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {conceitos.length > 12 && (
            <Button className="mt-3" variant="ghost" onClick={() => setVerTodosConceitos(v => !v)}>
              {verTodosConceitos ? 'Mostrar menos' : `Ver todos os ${conceitos.length}`}
            </Button>
          )}
        </section>
      )}

      {aberto && (
        <LeitorDePesquisa aberto={aberto} valor={doc} documentos={vault.documents} arestas={vault.edges}
          carregando={docLoading} erro={docErro} onFechar={fechar} onAbrir={abrir} onTentarDeNovo={() => abrir(aberto)} />
      )}
    </div>
  )
}

function Experimentos() {
  return (
    <div className="px-4 py-2 sm:px-6">
      <Link href="/comunidade/experimentos" className={cx('group flex items-center gap-5 rounded-2xl border border-beon-line p-6 hover:border-beon-red/40', focusRing)}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-beon-tint text-beon-red"><FlaskConical className="h-6 w-6" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-beon-ink">Catálogo de experimentos do beOn Labs</span>
          <span className="block text-sm text-beon-muted">Fichas, relatórios e arquivos dos experimentos já realizados, organizados por categoria e domínio.</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-beon-muted group-hover:text-beon-red" aria-hidden />
      </Link>
    </div>
  )
}

const ABAS: { id: Aba; label: string; icone: typeof Library }[] = [
  { id: 'acervo', label: 'Acervo beOn Labs', icone: Library },
  { id: 'comunidade', label: 'Da comunidade', icone: Users },
  { id: 'experimentos', label: 'Documentos de experimentos', icone: FlaskConical },
]

export default function PesquisasPage() {
  const { openComposer, posts } = useCommunity()
  const [aba, setAba] = useState<Aba>('acervo')
  const [busca, setBusca] = useState('')
  const [resumo, setResumo] = useState<{ pesquisas: number; documentos: number; temas: number } | null>(null)
  const materiais = (posts.data ?? []).filter(p => p.kind === 'pesquisa').length

  useEffect(() => {
    api<ResearchVault>('/pesquisas').then(v => {
      const docs = v.documents.filter(d => d.type !== 'category')
      setResumo({ pesquisas: v.completedResearchCount, documentos: docs.length, temas: new Set(docs.map(d => d.category)).size })
    }).catch(() => setResumo(null))
  }, [])

  return (
    <div className="mx-auto max-w-[1180px] pb-12">
      {/* Abertura */}
      <section className="relative mx-4 mt-6 overflow-hidden rounded-3xl border border-beon-line bg-gradient-to-br from-beon-tint via-white to-white px-6 py-8 sm:mx-6 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-beon-red/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute right-10 top-10 hidden text-beon-red/10 lg:block" aria-hidden><Library className="h-40 w-40" /></div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-beon-red">Comunidade · Acervo de Pesquisas</p>
        <h1 className="mt-2 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-tight text-beon-ink sm:text-[44px]">O que você quer aprender hoje?</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-beon-body">
          Pesquisas concluídas pelo beOn Labs, os conceitos e papers por trás delas e os materiais que a comunidade compartilha.
          Comece por um tema, busque um assunto ou siga as conexões entre os documentos.
        </p>
        <div className="relative mt-6 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-beon-muted" aria-hidden />
          <label htmlFor="busca-acervo" className="sr-only">Buscar no acervo e na comunidade</label>
          <input id="busca-acervo" type="search" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Ex.: agentes, 6G, visão computacional…"
            className="h-14 w-full rounded-full border border-beon-line bg-white pl-12 pr-5 text-base text-beon-ink shadow-sm placeholder:text-beon-muted/80 focus:border-beon-ink/30 focus:outline-none focus:ring-4 focus:ring-beon-red/10" />
        </div>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {([
            [resumo?.pesquisas, 'pesquisas concluídas'],
            [resumo?.documentos, 'documentos no acervo'],
            [resumo?.temas, 'temas'],
            [materiais, 'materiais da comunidade'],
          ] as [number | undefined, string][]).filter(([n]) => n !== undefined).map(([n, rotulo]) => (
            <div key={rotulo}>
              <dt className="sr-only">{rotulo}</dt>
              <dd><span className="text-2xl font-bold tabular-nums text-beon-ink">{n}</span> <span className="text-sm text-beon-muted">{rotulo}</span></dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-4 mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 sm:mx-6">
        <div role="tablist" aria-label="Fontes de conhecimento" className="flex gap-1 overflow-x-auto rounded-full bg-beon-soft p-1 [scrollbar-width:none]">
          {ABAS.map(a => (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
              className={cx('inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors', focusRing,
                aba === a.id ? 'bg-white font-semibold text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
              <a.icone className="h-4 w-4" aria-hidden />{a.label}
            </button>
          ))}
        </div>
        <Button variant="primary" icon={BookOpen} onClick={() => openComposer({ kind: 'pesquisa' })}>Compartilhar material</Button>
      </div>
      <div role="tabpanel">
        {aba === 'acervo' ? <Acervo busca={busca} /> : aba === 'comunidade' ? <DaComunidade busca={busca} /> : <Experimentos />}
      </div>
    </div>
  )
}
