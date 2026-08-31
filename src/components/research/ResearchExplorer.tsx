'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  Boxes,
  FolderTree,
  GitCommitHorizontal,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { ResearchDocumentPanel } from './ResearchDocumentPanel'
import { ResearchGraph } from './ResearchGraph'
import { ResearchTree } from './ResearchTree'
import { buildResearchTree, filterResearchTree } from './research-view-model'
import type { ResearchDocumentContent, ResearchVault } from './types'

type ResearchMode = 'files' | 'graph'

function shortRevision(revision: string) {
  return revision === 'local' ? 'ambiente local' : revision.slice(0, 7)
}

export function ResearchExplorer() {
  const [vault, setVault] = useState<ResearchVault | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ResearchMode>('files')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [documentValue, setDocumentValue] = useState<ResearchDocumentContent | null>(null)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)

  const loadVault = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/jira/api/pesquisas', { credentials: 'include', signal })
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
    setSelectedPath(path)
    setDocumentValue(null)
    setDocumentError(null)
    setDocumentLoading(true)
    try {
      const response = await fetch(`/jira/api/pesquisas?file=${encodeURIComponent(path)}`, {
        credentials: 'include',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Falha ao abrir o documento')
      setDocumentValue(body)
    } catch (requestError) {
      setDocumentError(requestError instanceof Error ? requestError.message : 'Falha ao abrir o documento')
    } finally {
      setDocumentLoading(false)
    }
  }, [])

  const tree = useMemo(() => buildResearchTree(vault?.documents ?? []), [vault?.documents])
  const filteredTree = useMemo(
    () => filterResearchTree(tree, deferredQuery),
    [deferredQuery, tree],
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-52px)] items-center justify-center gap-3 bg-slate-100 text-sm font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-red-700" />
        Carregando o acervo de pesquisas…
      </div>
    )
  }

  if (error || !vault) {
    return (
      <div className="flex h-[calc(100dvh-52px)] items-center justify-center bg-slate-100 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <p className="text-base font-bold text-slate-900">Acervo indisponível</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error || 'Não foi possível carregar as pesquisas.'}</p>
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

  return (
    <div className="flex h-[calc(100dvh-52px)] min-h-[560px] flex-col overflow-hidden bg-slate-100">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="relative min-w-[220px] flex-1 lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por pesquisa, conceito, paper ou tag…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('files')}
            aria-pressed={mode === 'files'}
            className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
              mode === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Arquivos
          </button>
          <button
            type="button"
            onClick={() => setMode('graph')}
            aria-pressed={mode === 'graph'}
            className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
              mode === 'graph' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="h-4 w-4" />
            Grafo
          </button>
        </div>

        <div className="hidden items-center gap-3 text-[11px] font-semibold text-slate-500 xl:flex">
          <span>{vault.completedResearchCount} pesquisas concluídas</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1.5 font-mono">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            {shortRevision(vault.revision)}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 overflow-hidden">
          {mode === 'files' ? (
            <div className="h-full overflow-y-auto p-3 sm:p-4">
              <div className="mx-auto min-h-full max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                <ResearchTree
                  nodes={filteredTree}
                  selectedId={selectedPath}
                  onSelect={path => void loadDocument(path)}
                />
              </div>
            </div>
          ) : (
            <ResearchGraph
              documents={vault.documents}
              edges={vault.edges}
              query={deferredQuery}
              selectedId={selectedPath}
              onSelect={path => void loadDocument(path)}
            />
          )}
        </section>

        {selectedPath ? (
          <ResearchDocumentPanel
            value={documentValue}
            documents={vault.documents}
            loading={documentLoading}
            error={documentError}
            onClose={() => {
              setSelectedPath(null)
              setDocumentValue(null)
              setDocumentError(null)
            }}
            onSelect={path => void loadDocument(path)}
            onRetry={() => void loadDocument(selectedPath)}
          />
        ) : null}
      </div>
    </div>
  )
}
