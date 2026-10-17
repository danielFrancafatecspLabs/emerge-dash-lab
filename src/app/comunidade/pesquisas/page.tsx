'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bookmark, BookOpen, FileText, FlaskConical, Library, Search } from 'lucide-react'
import {
  MATERIAL_STATUS_LABEL, MATERIAL_TIPO_LABEL, matchesSearch,
  type CommunityPost, type MaterialStatus, type MaterialTipo,
} from '@/lib/community'
import { COMMUNITY_TOPICS, topicLabel } from '@/lib/community-topics'
import type { ResearchDocument, ResearchDocumentContent, ResearchVault } from '@/components/research/types'
import { ResearchDocumentPanel } from '@/components/research/ResearchDocumentPanel'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageHeader } from '@/components/comunidade/CommunityShell'
import { tempoRelativo } from '@/components/comunidade/format'
import { Button, Chip, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/comunidade/ui'

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
    <li className="group flex gap-4 border-b border-comm-line px-4 py-5 sm:px-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><FileText className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-comm-muted">{MATERIAL_TIPO_LABEL[post.meta.materialTipo ?? 'artigo']}</span>
          <span className={cx('rounded-full px-2 py-0.5 font-medium', STATUS_TONE[status])}>{MATERIAL_STATUS_LABEL[status]}</span>
        </div>
        <Link href={`/comunidade/post/${post.id}`} className="mt-1 block text-[16px] font-semibold leading-snug text-comm-ink hover:underline">{post.title}</Link>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-comm-body">{post.content}</p>
        <p className="mt-2 text-[13px] text-comm-muted">
          Compartilhado por <Link href={`/comunidade/pessoas/${encodeURIComponent(post.authorUsername)}`} className="font-medium text-comm-body hover:underline">{post.authorName}</Link>
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
          className={cx('rounded-full p-2 hover:bg-comm-soft', saved ? 'text-comm-red' : 'text-comm-muted hover:text-comm-ink', focusRing)}>
          <Bookmark className={cx('h-4 w-4', saved && 'fill-current')} aria-hidden />
        </button>
        {post.linkUrl && (
          <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir material: ${post.title}`}
            className={cx('rounded-full p-2 text-comm-muted hover:bg-comm-soft hover:text-comm-ink', focusRing)}>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </li>
  )
}

function DaComunidade() {
  const { posts, reloadPosts, openComposer } = useCommunity()
  const [busca, setBusca] = useState('')
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-comm-muted" aria-hidden />
            <label htmlFor="busca-materiais" className="sr-only">Buscar materiais</label>
            <input id="busca-materiais" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar materiais"
              className={cx(inputClass, 'rounded-full pl-10')} />
          </div>
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
      <div className="border-t border-comm-line">
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

const DOC_TIPO: Record<ResearchDocument['type'], string> = { topic: 'Pesquisa concluída', paper: 'Artigo de referência', concept: 'Conceito', category: 'Categoria' }

function Acervo() {
  const [vault, setVault] = useState<ResearchVault | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
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
    try { setDoc(await api<ResearchDocumentContent>(`/pesquisas?file=${encodeURIComponent(path)}`)) } catch (err) { setDocErro(errorMessage(err)) } finally { setDocLoading(false) }
  }, [])

  const docs = useMemo(() => (vault?.documents ?? []).filter(d => d.type !== 'category'), [vault])
  const categorias = useMemo(() => [...new Set(docs.map(d => d.category).filter(Boolean))].sort(), [docs])
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return docs
      .filter(d => (!categoria || d.category === categoria) && (!q || [d.title, d.category, d.topic ?? '', ...d.tags].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => (b.updated ?? b.created ?? '').localeCompare(a.updated ?? a.created ?? '') || a.title.localeCompare(b.title))
  }, [docs, busca, categoria])

  if (erro) {
    return <ErrorState message={`${erro} O acervo é lido do repositório de pesquisas do beOn Labs; quando ele estiver disponível neste ambiente, os documentos aparecem aqui.`} onRetry={carregar} />
  }
  if (!vault) return <div className="space-y-4 p-6">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>

  return (
    <div className="flex">
      <div className={cx('min-w-0 flex-1', aberto && 'hidden lg:block')}>
        <div className="space-y-3 px-4 pb-4 sm:px-6">
          <p className="text-sm text-comm-muted">{vault.completedResearchCount} pesquisas concluídas e {docs.length} documentos no acervo.</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-comm-muted" aria-hidden />
            <label htmlFor="busca-acervo" className="sr-only">Buscar no acervo</label>
            <input id="busca-acervo" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar no acervo" className={cx(inputClass, 'rounded-full pl-10')} />
          </div>
          {categorias.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por categoria">
              <Chip selected={!categoria} onClick={() => setCategoria(null)}>Todas</Chip>
              {categorias.map(c => <Chip key={c} selected={categoria === c} onClick={() => setCategoria(categoria === c ? null : c)}>{c}</Chip>)}
            </div>
          )}
        </div>
        {lista.length === 0 ? <EmptyState icon={Library} title="Nada encontrado no acervo">Tente outro termo ou categoria.</EmptyState> : (
          <ul className="border-t border-comm-line">
            {lista.map(d => (
              <li key={d.path}>
                <button type="button" onClick={() => abrir(d.path)} aria-current={aberto === d.path}
                  className={cx('flex w-full gap-4 border-b border-comm-line px-4 py-4 text-left hover:bg-comm-soft/50 sm:px-6', aberto === d.path && 'bg-comm-soft', focusRing)}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-comm-tint text-comm-red"><Library className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-comm-muted">{DOC_TIPO[d.type]} · {d.category}</span>
                    <span className="block font-semibold leading-snug text-comm-ink">{d.title}</span>
                    {d.tags.length > 0 && <span className="mt-1 block truncate text-xs text-comm-muted">{d.tags.slice(0, 5).map(t => `#${t}`).join(' ')}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {aberto && (
        <div className="sticky top-0 h-dvh w-full shrink-0 overflow-hidden border-l border-comm-line lg:w-[460px]">
          <ResearchDocumentPanel value={doc} documents={vault.documents} loading={docLoading} error={docErro}
            onClose={() => setAberto(null)} onSelect={abrir} onRetry={() => abrir(aberto)} />
        </div>
      )}
    </div>
  )
}

function Experimentos() {
  return (
    <div className="px-4 py-2 sm:px-6">
      <Link href="/comunidade/experimentos" className={cx('group flex items-center gap-5 rounded-2xl border border-comm-line p-6 hover:border-comm-red/40', focusRing)}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-comm-tint text-comm-red"><FlaskConical className="h-6 w-6" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-comm-ink">Catálogo de experimentos do beOn Labs</span>
          <span className="block text-sm text-comm-muted">Fichas, relatórios e arquivos dos experimentos já realizados, organizados por categoria e domínio.</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-comm-muted group-hover:text-comm-red" aria-hidden />
      </Link>
    </div>
  )
}

const ABAS: { id: Aba; label: string }[] = [
  { id: 'comunidade', label: 'Da comunidade' },
  { id: 'acervo', label: 'Acervo beOn Labs' },
  { id: 'experimentos', label: 'Documentos de experimentos' },
]

export default function PesquisasPage() {
  const { openComposer } = useCommunity()
  const [aba, setAba] = useState<Aba>('comunidade')
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader eyebrow="Pesquisas" title="Conhecimento para reutilizar"
        description="Estudos, benchmarks, relatórios e referências sobre tecnologias emergentes — da comunidade e do acervo beOn Labs."
        action={<Button variant="primary" icon={BookOpen} onClick={() => openComposer({ kind: 'pesquisa' })}>Compartilhar material</Button>} />
      <div role="tablist" aria-label="Fontes de conhecimento" className="mb-5 flex gap-6 overflow-x-auto border-b border-comm-line px-4 [scrollbar-width:none] sm:px-6">
        {ABAS.map(a => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={cx('shrink-0 border-b-2 py-3 text-sm', aba === a.id ? 'border-comm-red font-semibold text-comm-ink' : 'border-transparent text-comm-muted hover:text-comm-ink')}>
            {a.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {aba === 'comunidade' ? <DaComunidade /> : aba === 'acervo' ? <Acervo /> : <Experimentos />}
      </div>
    </div>
  )
}
