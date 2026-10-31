'use client'

// Modo de leitura do Acervo de Pesquisas: o documento ocupa a tela (no celular, inteira), com largura confortável de
// leitura, e termina em "Continue explorando" com os documentos ligados a ele. Esc fecha.

import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, FileText, Lightbulb, Library } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { ResearchDocumentPanel } from './ResearchDocumentPanel'
import type { ResearchDocument, ResearchDocumentContent, ResearchEdge } from './types'

export const ICONE_DO_TIPO: Record<ResearchDocument['type'], typeof Library> = { topic: Library, concept: Lightbulb, paper: FileText, category: Library }
export const ROTULO_DO_TIPO: Record<ResearchDocument['type'], string> = { topic: 'Pesquisa concluída', concept: 'Conceito', paper: 'Paper', category: 'Categoria' }

/** Documentos ligados (hierarquia e links), pesquisas primeiro. */
export function relacionados(doc: ResearchDocument, documentos: ResearchDocument[], arestas: ResearchEdge[], limite = 6): ResearchDocument[] {
  const ids = new Set<string>()
  for (const e of arestas) {
    if (e.source === doc.id) ids.add(e.target)
    if (e.target === doc.id) ids.add(e.source)
  }
  const ordem: Record<ResearchDocument['type'], number> = { topic: 0, concept: 1, paper: 2, category: 3 }
  return documentos.filter(d => ids.has(d.id) && d.type !== 'category' && d.id !== doc.id)
    .sort((a, b) => ordem[a.type] - ordem[b.type] || a.title.localeCompare(b.title))
    .slice(0, limite)
}

export function LeitorDePesquisa({ aberto, valor, documentos, arestas, carregando, erro, onFechar, onAbrir, onTentarDeNovo }: {
  aberto: string
  valor: ResearchDocumentContent | null
  documentos: ResearchDocument[]
  arestas: ResearchEdge[]
  carregando: boolean
  erro: string | null
  onFechar: () => void
  onAbrir: (path: string) => void
  onTentarDeNovo: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = overflow }
  }, [onFechar])

  const doc = documentos.find(d => d.path === aberto)
  const ligados = useMemo(() => (doc ? relacionados(doc, documentos, arestas) : []), [doc, documentos, arestas])

  // Em portal no <body>: nenhum contêiner da página (espaçamentos, overflow) interfere na sobreposição.
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-stone-900/50 backdrop-blur-[2px] sm:p-4 lg:p-8" role="dialog" aria-modal="true" aria-label={doc?.title ?? 'Leitura'}
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div className="flex h-full w-full max-w-4xl overflow-hidden bg-white shadow-2xl sm:rounded-3xl">
        <ResearchDocumentPanel value={valor} documents={documentos} loading={carregando} error={erro}
          onClose={onFechar} onSelect={onAbrir} onRetry={onTentarDeNovo} className="border-l-0"
          rodape={ligados.length > 0 && (
            <section className="mt-10 border-t border-beon-line pt-6" aria-label="Continue explorando">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-red">Continue explorando</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ligados.map(d => {
                  const I = ICONE_DO_TIPO[d.type]
                  return (
                    <button key={d.path} type="button" onClick={() => onAbrir(d.path)}
                      className={cx('group flex items-center gap-3 rounded-2xl border border-beon-line p-3 text-left hover:border-beon-red/40 hover:bg-beon-tint/40', focusRing)}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beon-soft text-beon-body group-hover:text-beon-red"><I className="h-4 w-4" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-medium text-beon-muted">{ROTULO_DO_TIPO[d.type]}</span>
                        <span className="block truncate text-sm font-semibold text-beon-ink">{d.title}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-beon-muted group-hover:text-beon-red" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </section>
          )} />
      </div>
    </div>,
    document.body,
  )
}
