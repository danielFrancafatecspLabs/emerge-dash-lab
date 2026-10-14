'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  FolderTree,
  GitCommitHorizontal,
  Layers,
  ListFilter,
  Loader2,
  Radio,
  RefreshCw,
  Search,
  StickyNote,
  X,
} from 'lucide-react'
import type { SignalDocument, SignalDocumentContent, SignalVault } from '@/lib/signal-vault'

type Mode = 'tree' | 'list'

const TYPE_LABEL: Record<SignalDocument['type'], string> = {
  module: 'Módulo',
  subtheme: 'Subtema',
  signal: 'Sinal',
  watch: 'Watchlist',
  note: 'Nota analítica',
}

const LEVEL_STYLE: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

function normalize(value: string) {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim()
}

function formatDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function searchText(document: SignalDocument) {
  return normalize([
    document.title, document.moduleTitle, document.subtheme, document.domain,
    document.location, document.sourceOrg, ...document.tags,
  ].filter(Boolean).join(' '))
}

function TypeIcon({ type }: { type: SignalDocument['type'] }) {
  const className = 'h-4 w-4 shrink-0'
  if (type === 'module') return <Layers className={`${className} text-red-700`} />
  if (type === 'subtheme') return <FolderTree className={`${className} text-slate-500`} />
  if (type === 'signal') return <Radio className={`${className} text-sky-600`} />
  if (type === 'watch') return <Eye className={`${className} text-amber-600`} />
  return <StickyNote className={`${className} text-emerald-600`} />
}

function Badge({ value, label }: { value: string | null; label: string }) {
  if (!value) return null
  const style = LEVEL_STYLE[value.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${style}`}>
      {label}: {value}
    </span>
  )
}

function DocumentRow({
  document, selected, depth, onSelect,
}: { document: SignalDocument; selected: boolean; depth: number; onSelect: (path: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(document.path)}
      style={{ paddingLeft: 12 + depth * 20 }}
      className={`flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition hover:bg-white ${
        selected ? 'bg-white font-semibold text-slate-950 shadow-sm' : 'text-slate-700'
      }`}
    >
      <TypeIcon type={document.type} />
      <span className="min-w-0 flex-1 truncate">{document.title}</span>
      <Badge value={document.relevance} label="Rel." />
      {document.date ? <span className="shrink-0 text-[11px] text-slate-400">{formatDate(document.date)}</span> : null}
    </button>
  )
}

export function FtExplorer() {
  const [vault, setVault] = useState<SignalVault | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('tree')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [domain, setDomain] = useState('')
  const [kind, setKind] = useState<'all' | 'signal' | 'watch' | 'note'>('all')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [documentValue, setDocumentValue] = useState<SignalDocumentContent | null>(null)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const requestRef = useRef<{ id: number; controller: AbortController | null }>({ id: 0, controller: null })

  const loadVault = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/jira/api/ft', { credentials: 'include', signal })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Falha ao carregar o acervo')
      setVault(body)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Falha ao carregar o acervo')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadVault(controller.signal)
    return () => controller.abort()
  }, [loadVault])

  const loadDocument = useCallback(async (path: string) => {
    requestRef.current.controller?.abort()
    const controller = new AbortController()
    const requestId = requestRef.current.id + 1
    requestRef.current = { id: requestId, controller }
    setSelectedPath(path)
    setDocumentValue(null)
    setDocumentError(null)
    setDocumentLoading(true)
    try {
      const response = await fetch(`/jira/api/ft?file=${encodeURIComponent(path)}`, {
        credentials: 'include',
        signal: controller.signal,
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Falha ao abrir o documento')
      if (requestRef.current.id === requestId) setDocumentValue(body)
    } catch (requestError) {
      if (controller.signal.aborted || requestRef.current.id !== requestId) return
      setDocumentError(requestError instanceof Error ? requestError.message : 'Falha ao abrir o documento')
    } finally {
      if (requestRef.current.id === requestId) {
        requestRef.current.controller = null
        setDocumentLoading(false)
      }
    }
  }, [])

  useEffect(() => () => requestRef.current.controller?.abort(), [])

  const documents = useMemo(() => vault?.documents ?? [], [vault])
  const domains = useMemo(
    () => Array.from(new Set(documents.map(d => d.domain).filter((d): d is string => !!d))).sort(),
    [documents],
  )
  const index = useMemo(() => {
    const byId = new Map(documents.map(d => [d.id, d]))
    const children = new Map<string, SignalDocument[]>()
    for (const document of documents) {
      if (!document.parent) continue
      const list = children.get(document.parent) ?? []
      list.push(document)
      children.set(document.parent, list)
    }
    return { byId, children }
  }, [documents])

  const normalizedQuery = normalize(deferredQuery)
  const matches = useCallback((document: SignalDocument) => {
    if (domain && document.domain !== domain) return false
    if (kind !== 'all' && document.type !== kind) return false
    return !normalizedQuery || searchText(document).includes(normalizedQuery)
  }, [domain, kind, normalizedQuery])
  const filtering = Boolean(normalizedQuery || domain || kind !== 'all')

  const leafMatches = useMemo(
    () => documents.filter(d => (d.type === 'signal' || d.type === 'watch' || d.type === 'note') && matches(d)),
    [documents, matches],
  )
  const visibleIds = useMemo(() => {
    const ids = new Set<string>()
    for (const leaf of leafMatches) {
      let current: SignalDocument | undefined = leaf
      while (current && !ids.has(current.id)) {
        ids.add(current.id)
        current = current.parent ? index.byId.get(current.parent) : undefined
      }
    }
    return ids
  }, [leafMatches, index])

  const toggle = (id: string) => setOpenIds(previous => {
    const next = new Set(previous)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const renderBranch = (document: SignalDocument, depth: number): JSX.Element | null => {
    if (filtering && !visibleIds.has(document.id)) return null
    const children = (index.children.get(document.id) ?? []).filter(c => !filtering || visibleIds.has(c.id))
    const isLeaf = document.type !== 'module' && document.type !== 'subtheme'
    if (isLeaf) {
      return (
        <DocumentRow
          key={document.id}
          document={document}
          depth={depth}
          selected={selectedPath === document.path}
          onSelect={path => void loadDocument(path)}
        />
      )
    }
    const expanded = filtering || openIds.has(document.id)
    return (
      <div key={document.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 20 }}>
          <button
            type="button"
            onClick={() => toggle(document.id)}
            aria-label={expanded ? 'Recolher' : 'Expandir'}
            className="grid h-9 w-9 shrink-0 place-items-center text-slate-400 hover:text-slate-700"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => void loadDocument(document.path)}
            className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-3 text-left text-sm font-semibold text-slate-800 hover:text-red-700"
          >
            <TypeIcon type={document.type} />
            <span className="min-w-0 flex-1 truncate">{document.title}</span>
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {children.length}
            </span>
          </button>
        </div>
        {expanded ? children.map(child => renderBranch(child, depth + 1)) : null}
      </div>
    )
  }

  const modules = documents.filter(d => d.type === 'module')
  const notes = documents.filter(d => d.type === 'note')
  const linkTargets = useMemo(() => {
    const map = new Map<string, SignalDocument>()
    for (const document of documents) map.set(document.path.replace(/\.md$/i, ''), document)
    return map
  }, [documents])

  const markdownComponents = useMemo<Components>(() => ({
    h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-950 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-3 mt-8 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-base font-bold text-slate-900">{children}</h3>,
    p: ({ children }) => <p className="mb-4 text-sm leading-7 text-slate-700">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-sm leading-6 text-slate-700">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-slate-700">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="my-5 rounded-r-xl border-l-4 border-red-300 bg-red-50/70 px-4 py-3 text-slate-700">{children}</blockquote>
    ),
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700">{children}</td>,
    code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-red-700">{children}</code>,
    a: ({ href, children }) => {
      if (href?.startsWith('#ft:')) {
        const target = linkTargets.get(decodeURIComponent(href.slice(4)))
        if (!target) {
          return <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">{children}</span>
        }
        return (
          <button
            type="button"
            onClick={() => void loadDocument(target.path)}
            className="rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:bg-sky-100"
          >
            {children}
          </button>
        )
      }
      if (!href || !/^https?:\/\//i.test(href)) return <span>{children}</span>
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
        >
          {children}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },
  }), [linkTargets, loadDocument])

  const markdown = useMemo(() => (documentValue?.content ?? '')
    .replace(/!?\[\[([^\]]+)\]\]/g, (_match, raw: string) => {
      const [target, label] = raw.split('|', 2)
      const clean = target.split('#', 1)[0].trim()
      return `[${(label || target).trim()}](#ft:${encodeURIComponent(clean)})`
    })
    // Sem alvo navegável (orgs, lugares): texto simples
    , [documentValue?.content])

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-52px)] items-center justify-center gap-3 bg-slate-100 text-sm font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-red-700" />
        Carregando sinais de Future Thinking…
      </div>
    )
  }

  if (error || !vault) {
    return (
      <div className="flex h-[calc(100dvh-52px)] items-center justify-center bg-slate-100 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <p className="text-base font-bold text-slate-900">Acervo indisponível</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error || 'Não foi possível carregar os sinais.'}</p>
          <button
            type="button"
            onClick={() => void loadVault()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const selectedDocument = documentValue?.document ?? null

  return (
    <div className="flex h-[calc(100dvh-52px)] min-h-[560px] flex-col overflow-hidden bg-slate-100">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="relative min-w-[220px] flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar sinal, organização, local ou tag…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-slate-400" />
          <select
            value={domain}
            onChange={event => setDomain(event.target.value)}
            aria-label="Domínio STEEP"
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700"
          >
            <option value="">Todos os domínios</option>
            {domains.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={kind}
            onChange={event => setKind(event.target.value as typeof kind)}
            aria-label="Tipo"
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">Todos os tipos</option>
            <option value="signal">Sinais</option>
            <option value="watch">Watchlist</option>
            <option value="note">Notas</option>
          </select>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          {([['tree', 'Módulos', FolderTree], ['list', 'Lista', FileText]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
                mode === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 text-[11px] font-semibold text-slate-500 xl:flex">
          <span>{vault.signalCount} sinais</span>
          <span>{vault.watchCount} em watchlist</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1.5 font-mono">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            {vault.revision === 'local' ? 'ambiente local' : vault.revision.slice(0, 7)}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto min-h-full max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 py-2 shadow-sm">
            {mode === 'tree' ? (
              <>
                {modules.map(module => renderBranch(module, 0))}
                {(!filtering || notes.some(matches)) && notes.length > 0 ? (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Notas analíticas
                    </p>
                    {notes.filter(matches).map(note => (
                      <DocumentRow
                        key={note.id}
                        document={note}
                        depth={0}
                        selected={selectedPath === note.path}
                        onSelect={path => void loadDocument(path)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              leafMatches.map(document => (
                <div key={document.id} className="border-b border-slate-100 last:border-0">
                  <DocumentRow
                    document={document}
                    depth={0}
                    selected={selectedPath === document.path}
                    onSelect={path => void loadDocument(path)}
                  />
                  <p className="-mt-1 truncate pb-2 pl-9 pr-3 text-[11px] text-slate-400">
                    {[document.moduleTitle, document.subtheme, document.domain].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))
            )}
            {filtering && leafMatches.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">Nenhum item encontrado para os filtros atuais.</p>
            ) : null}
          </div>
        </section>

        {selectedPath ? (
          <aside className="flex h-full min-h-0 w-full flex-col border-l border-slate-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.08)] lg:w-[46%] xl:w-[42%]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-semibold text-slate-700">Leitura</span>
              <button
                type="button"
                onClick={() => {
                  requestRef.current.controller?.abort()
                  requestRef.current = { id: requestRef.current.id + 1, controller: null }
                  setSelectedPath(null)
                  setDocumentValue(null)
                  setDocumentError(null)
                }}
                aria-label="Fechar documento"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {documentLoading ? (
                <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Abrindo documento…
                </div>
              ) : documentError ? (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">{documentError}</p>
                  <button
                    type="button"
                    onClick={() => void loadDocument(selectedPath)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Tentar novamente
                  </button>
                </div>
              ) : selectedDocument ? (
                <article className="mx-auto max-w-3xl px-6 py-7 lg:px-8">
                  <header className="mb-7 border-b border-slate-200 pb-6">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">
                      {TYPE_LABEL[selectedDocument.type]}
                    </p>
                    <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                      {selectedDocument.title}
                    </h1>
                    <p className="mt-2 text-xs text-slate-400">
                      {[selectedDocument.moduleTitle, selectedDocument.subtheme, selectedDocument.domain]
                        .filter(Boolean).join(' / ')}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {selectedDocument.date ? (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {formatDate(selectedDocument.date)}
                        </span>
                      ) : null}
                      <Badge value={selectedDocument.relevance} label="Relevância" />
                      <Badge value={selectedDocument.confidence} label="Confiança" />
                      {selectedDocument.horizon ? (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Horizonte: {selectedDocument.horizon}
                        </span>
                      ) : null}
                    </div>
                    {selectedDocument.sourceUrl && /^https?:\/\//i.test(selectedDocument.sourceUrl) ? (
                      <a
                        href={selectedDocument.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Fonte{selectedDocument.sourceOrg ? `: ${selectedDocument.sourceOrg}` : ''}
                      </a>
                    ) : null}
                  </header>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {markdown}
                  </ReactMarkdown>
                </article>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
