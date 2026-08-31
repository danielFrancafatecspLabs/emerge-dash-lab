'use client'

import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  buildResearchLinkIndex,
  prepareResearchMarkdown,
  resolveResearchLink,
} from './research-view-model'
import type { ResearchDocument, ResearchDocumentContent } from './types'

interface ResearchDocumentPanelProps {
  value: ResearchDocumentContent | null
  documents: ResearchDocument[]
  loading: boolean
  error: string | null
  onClose: () => void
  onSelect: (path: string) => void
  onRetry: () => void
}

function formatDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const TYPE_LABEL: Record<ResearchDocument['type'], string> = {
  category: 'Categoria',
  topic: 'Pesquisa concluída',
  concept: 'Conceito',
  paper: 'Paper',
}

export function ResearchDocumentPanel({
  value,
  documents,
  loading,
  error,
  onClose,
  onSelect,
  onRetry,
}: ResearchDocumentPanelProps) {
  const linkIndex = useMemo(() => buildResearchLinkIndex(documents), [documents])
  const markdown = useMemo(() => prepareResearchMarkdown(value?.content ?? ''), [value?.content])

  const components = useMemo<Components>(() => ({
    h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-slate-950 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-3 mt-8 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-base font-bold text-slate-900">{children}</h3>,
    p: ({ children }) => <p className="mb-4 text-sm leading-7 text-slate-700">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-sm leading-6 text-slate-700">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-slate-700">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
    em: ({ children }) => <em className="text-slate-800">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="my-5 rounded-r-xl border-l-4 border-red-300 bg-red-50/70 px-4 py-3 text-slate-700">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-slate-200" />,
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-100 text-slate-800">{children}</thead>,
    th: ({ children }) => <th className="border-b border-slate-200 px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700">{children}</td>,
    code: ({ className, children }) => (
      <code className={`${className ?? ''} rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-red-700`}>
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
        {children}
      </pre>
    ),
    a: ({ href, children }) => {
      if (href?.startsWith('#research:')) {
        const rawTarget = decodeURIComponent(href.slice('#research:'.length))
        const target = resolveResearchLink(linkIndex, rawTarget)
        if (!target) {
          return <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">{children}</span>
        }
        return (
          <button
            type="button"
            onClick={() => onSelect(target.path)}
            className="rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {children}
          </button>
        )
      }

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
  }), [linkIndex, onSelect])

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-slate-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.08)] lg:w-[46%] xl:w-[42%]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen className="h-4 w-4 text-red-700" />
          Leitura
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar documento"
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full min-h-72 items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Abrindo documento…
          </div>
        ) : error ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-8 text-center">
            <FileText className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : value ? (
          <article className="mx-auto max-w-3xl px-6 py-7 lg:px-8">
            <header className="mb-7 border-b border-slate-200 pb-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">
                {TYPE_LABEL[value.document.type]}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                {value.document.title}
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                {[value.document.category, value.document.topic].filter(Boolean).join(' / ')}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {value.document.created ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Incluída em {formatDate(value.document.created)}
                  </span>
                ) : null}
                {value.document.updated && value.document.updated !== value.document.created ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Revisada em {formatDate(value.document.updated)}
                  </span>
                ) : null}
              </div>

              {value.document.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {value.document.tags.map(tag => (
                    <span key={tag} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </article>
        ) : null}
      </div>
    </aside>
  )
}
