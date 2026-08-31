'use client'

import { useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Lightbulb,
} from 'lucide-react'
import type { ResearchTreeNode } from './types'

interface ResearchTreeProps {
  nodes: ResearchTreeNode[]
  selectedId: string | null
  onSelect: (path: string) => void
}

function formatDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function NodeIcon({ node, expanded }: { node: ResearchTreeNode; expanded: boolean }) {
  const iconClass = 'h-4 w-4 shrink-0'
  if (node.kind === 'category') return <BookOpen className={`${iconClass} text-red-700`} />
  if (node.kind === 'topic') return <FolderOpen className={`${iconClass} text-sky-700`} />
  if (node.kind === 'concept') return <Lightbulb className={`${iconClass} text-violet-600`} />
  if (node.kind === 'paper') return <GraduationCap className={`${iconClass} text-emerald-600`} />
  return expanded
    ? <FolderOpen className={`${iconClass} text-amber-600`} />
    : <Folder className={`${iconClass} text-amber-600`} />
}

function TreeBranch({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: ResearchTreeNode
  depth: number
  selectedId: string | null
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const selected = node.document?.id === selectedId
  const date = node.kind === 'topic' ? formatDate(node.document?.created ?? null) : null

  return (
    <li className="min-w-0">
      <div
        className={`group flex min-h-10 items-center rounded-xl border transition-colors ${
          selected
            ? 'border-red-200 bg-red-50 text-red-950'
            : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
        }`}
        style={{ marginLeft: Math.min(depth * 18, 54) }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            aria-label={expanded ? `Recolher ${node.label}` : `Expandir ${node.label}`}
            aria-expanded={expanded}
            className="grid h-9 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => {
            if (node.document) onSelect(node.document.path)
            else if (hasChildren) setExpanded(value => !value)
          }}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
        >
          <NodeIcon node={node} expanded={expanded} />
          <span className={`min-w-0 flex-1 truncate text-sm ${node.kind === 'category' || node.kind === 'topic' ? 'font-semibold' : 'font-medium'}`}>
            {node.label}
          </span>
          {date ? (
            <span className="hidden shrink-0 items-center gap-1 text-[10px] font-medium tabular-nums text-slate-400 sm:flex">
              <CalendarDays className="h-3 w-3" />
              {date}
            </span>
          ) : null}
          {hasChildren ? (
            <span className="min-w-5 rounded-full bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-semibold text-slate-500">
              {node.children.length}
            </span>
          ) : null}
        </button>
      </div>

      {hasChildren && expanded ? (
        <ul className="space-y-0.5 py-0.5">
          {node.children.map(child => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function ResearchTree({ nodes, selectedId, onSelect }: ResearchTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
        <FileText className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium">Nenhuma pesquisa encontrada.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1 p-3">
      {nodes.map(node => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
