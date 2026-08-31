'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { LocateFixed, ZoomIn, ZoomOut } from 'lucide-react'
import { layoutResearchGraph } from './research-graph-layout'
import type { ResearchDocument, ResearchEdge } from './types'

interface ResearchGraphProps {
  documents: ResearchDocument[]
  edges: ResearchEdge[]
  query: string
  selectedId: string | null
  onSelect: (path: string) => void
}

interface ViewTransform {
  x: number
  y: number
  scale: number
}

const NODE_COLORS: Record<ResearchDocument['type'], string> = {
  category: '#ef4444',
  topic: '#38bdf8',
  concept: '#a78bfa',
  paper: '#34d399',
}

const INITIAL_VIEW: ViewTransform = { x: 0, y: 0, scale: 1 }

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function nodeMatches(document: ResearchDocument, query: string) {
  if (!query) return true
  return normalize([
    document.title,
    document.name,
    document.path,
    ...document.tags,
  ].join(' ')).includes(query)
}

export function ResearchGraph({ documents, edges, query, selectedId, onSelect }: ResearchGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null)
  const [size, setSize] = useState({ width: 1200, height: 720 })
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW)
  const [dragging, setDragging] = useState(false)
  const normalizedQuery = normalize(query.trim())

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(
    () => layoutResearchGraph(documents, edges, size.width, size.height),
    [documents, edges, size.height, size.width],
  )

  const matchingIds = useMemo(() => new Set(
    layout.nodes
      .filter(node => nodeMatches(node.document, normalizedQuery))
      .map(node => node.id),
  ), [layout.nodes, normalizedQuery])

  const updateScale = (nextScale: number) => {
    setView(current => ({ ...current, scale: Math.max(0.55, Math.min(2.8, nextScale)) }))
  }

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const factor = event.deltaY > 0 ? 0.9 : 1.1
    updateScale(view.scale * factor)
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[data-graph-node]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: view.x,
      originY: view.y,
    }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setView(current => ({
      ...current,
      x: drag.originX + event.clientX - drag.x,
      y: drag.originY + event.clientY - drag.y,
    }))
  }

  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
    setDragging(false)
  }

  const handleNodeKeyDown = (event: KeyboardEvent<SVGGElement>, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(path)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-[460px] overflow-hidden bg-[#0b1020]">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="application"
        aria-label="Grafo navegável do acervo de pesquisas"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={dragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none'}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <pattern id="research-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#334155" opacity="0.5" />
          </pattern>
          <filter id="research-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={size.width} height={size.height} fill="#0b1020" />
        <rect width={size.width} height={size.height} fill="url(#research-grid)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <g aria-hidden="true">
            {layout.edges.map(edge => {
              const visible = !normalizedQuery
                || matchingIds.has(edge.source)
                || matchingIds.has(edge.target)
              return (
                <line
                  key={`${edge.kind}:${edge.source}:${edge.target}`}
                  x1={edge.sourceNode.x}
                  y1={edge.sourceNode.y}
                  x2={edge.targetNode.x}
                  y2={edge.targetNode.y}
                  stroke={edge.kind === 'wikilink' ? '#64748b' : '#263247'}
                  strokeWidth={edge.kind === 'wikilink' ? 1.15 : 0.75}
                  strokeOpacity={visible ? (edge.kind === 'wikilink' ? 0.6 : 0.48) : 0.1}
                />
              )
            })}
          </g>

          <g>
            {layout.nodes.map(node => {
              const matches = matchingIds.has(node.id)
              const selected = selectedId === node.id
              const showLabel = node.document.type === 'category'
                || node.document.type === 'topic'
                || Boolean(normalizedQuery && matches)
              return (
                <g
                  key={node.id}
                  data-graph-node
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir ${node.document.title}`}
                  transform={`translate(${node.x} ${node.y})`}
                  onClick={() => onSelect(node.document.path)}
                  onKeyDown={event => handleNodeKeyDown(event, node.document.path)}
                  className="cursor-pointer outline-none"
                  opacity={normalizedQuery && !matches ? 0.22 : 1}
                >
                  {selected ? (
                    <circle
                      r={node.radius + 8}
                      fill="none"
                      stroke="#f8fafc"
                      strokeWidth={1.8}
                      strokeOpacity={0.85}
                    />
                  ) : null}
                  <circle
                    r={node.radius + (matches && normalizedQuery ? 2 : 0)}
                    fill={NODE_COLORS[node.document.type]}
                    fillOpacity={node.document.type === 'category' ? 0.95 : 0.86}
                    stroke="#e2e8f0"
                    strokeWidth={selected ? 2 : 0.65}
                    strokeOpacity={selected ? 1 : 0.5}
                    filter={selected || (matches && normalizedQuery) ? 'url(#research-glow)' : undefined}
                  />
                  {showLabel ? (
                    <text
                      x={node.radius + 6}
                      y={4}
                      fill={node.document.type === 'category' ? '#f8fafc' : '#cbd5e1'}
                      fontSize={node.document.type === 'category' ? 12 : 10}
                      fontWeight={node.document.type === 'category' ? 700 : 550}
                      paintOrder="stroke"
                      stroke="#0b1020"
                      strokeWidth={3}
                      strokeLinejoin="round"
                    >
                      {node.document.title.length > 34
                        ? `${node.document.title.slice(0, 32)}…`
                        : node.document.title}
                    </text>
                  ) : null}
                  <title>{`${node.document.title} · ${node.document.type}`}</title>
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-400 shadow-xl backdrop-blur">
        Arraste para mover · rode para zoom · clique para abrir
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold text-slate-300 shadow-xl backdrop-blur">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {type === 'category' ? 'Categoria' : type === 'topic' ? 'Pesquisa' : type === 'concept' ? 'Conceito' : 'Paper'}
          </span>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={() => updateScale(view.scale * 0.9)}
          aria-label="Diminuir zoom"
          className="grid h-10 w-10 place-items-center text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setView(INITIAL_VIEW)}
          aria-label="Centralizar grafo"
          className="grid h-10 w-10 place-items-center border-x border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => updateScale(view.scale * 1.1)}
          aria-label="Aumentar zoom"
          className="grid h-10 w-10 place-items-center text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
