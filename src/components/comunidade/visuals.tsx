'use client'

// Linguagem visual por tipo de conteúdo e tópico, e as capas ilustradas (SVG) usadas em stories e destaques.

import {
  Atom, BrainCircuit, Bot, Eye, FlaskConical, HelpCircle, Leaf, Lightbulb, Link2, MessagesSquare,
  MonitorSmartphone, Network, Radar, ShieldCheck, Sparkles, BarChart3, BookOpen, type LucideIcon,
} from 'lucide-react'
import { POST_KIND_LABEL, type PostKind } from '@/lib/community'
import { topicLabel } from '@/lib/community-topics'
import { cx } from './ui'

export const KIND_STYLE: Record<PostKind, { icon: LucideIcon; chip: string; accent: string }> = {
  discussao: { icon: MessagesSquare, chip: 'bg-stone-100 text-stone-700', accent: '#57534E' },
  pergunta: { icon: HelpCircle, chip: 'bg-amber-50 text-amber-800', accent: '#B45309' },
  pesquisa: { icon: BookOpen, chip: 'bg-sky-50 text-sky-800', accent: '#0369A1' },
  experimento: { icon: FlaskConical, chip: 'bg-comm-tint text-comm-redhi', accent: '#D31809' },
  sinal: { icon: Radar, chip: 'bg-teal-50 text-teal-800', accent: '#0F766E' },
}

export function KindBadge({ kind, className }: { kind: PostKind; className?: string }) {
  const { icon: Icon, chip } = KIND_STYLE[kind]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium', chip, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {POST_KIND_LABEL[kind]}
    </span>
  )
}

export const TOPIC_ICON: Record<string, LucideIcon> = {
  ia: BrainCircuit,
  'ia-generativa': Sparkles,
  agentes: Bot,
  'future-network': Network,
  'visao-computacional': Eye,
  'ciencia-de-dados': BarChart3,
  experimentacao: FlaskConical,
  'novas-interfaces': MonitorSmartphone,
  web3: Link2,
  quantica: Atom,
  ciberseguranca: ShieldCheck,
  sustentabilidade: Leaf,
}

export function topicIcon(id: string): LucideIcon {
  return TOPIC_ICON[id] ?? Lightbulb
}

export function TopicTag({ id, onClick }: { id: string; onClick?: () => void }) {
  const cls = 'text-[13px] font-medium text-comm-muted transition-colors hover:text-comm-red'
  const label = `#${topicLabel(id).replace(/\s+/g, '')}`
  return onClick
    ? <button type="button" onClick={onClick} className={cls}>{label}</button>
    : <span className={cls}>{label}</span>
}

// ── Capas ilustradas ────────────────────────────────────────────────────────────────────────
// Padrões abstratos gerados em SVG a partir do tema e de uma semente: cada capa é única,
// sem fotos de banco de imagens e sem sugerir que uma ilustração seja registro de algo real.

export type CoverPattern = 'radar' | 'rede' | 'ondas' | 'constelacao' | 'dados' | 'orbita'

const PALETAS: Record<string, [string, string, string]> = {
  red: ['#2A0A07', '#D31809', '#F7B7AE'],
  ink: ['#1C1917', '#E7E5E4', '#D31809'],
  teal: ['#0B2B29', '#2DD4BF', '#F7B7AE'],
  sky: ['#0B2235', '#7DD3FC', '#F7B7AE'],
  amber: ['#2B1A06', '#FBBF24', '#F7B7AE'],
}

function rng(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function CoverArt({ seed, pattern, tone = 'red', className }: { seed: string; pattern: CoverPattern; tone?: keyof typeof PALETAS; className?: string }) {
  const [bg, fg, hi] = PALETAS[tone]
  const r = rng(seed + pattern)
  const W = 300, H = 400
  const els: JSX.Element[] = []

  if (pattern === 'radar') {
    const cx0 = 60 + r() * 180, cy0 = 120 + r() * 200
    for (let i = 1; i <= 9; i++) els.push(<circle key={i} cx={cx0} cy={cy0} r={i * 34} fill="none" stroke={fg} strokeOpacity={0.55 - i * 0.05} strokeWidth={1.2} />)
    for (let i = 0; i < 5; i++) els.push(<circle key={`p${i}`} cx={cx0 + (r() - 0.5) * 260} cy={cy0 + (r() - 0.5) * 300} r={3 + r() * 4} fill={i === 0 ? hi : fg} />)
  } else if (pattern === 'rede') {
    const pts = Array.from({ length: 16 }, () => [r() * W, r() * H])
    pts.forEach(([x, y], i) => {
      const [x2, y2] = pts[(i * 7 + 3) % pts.length]
      els.push(<line key={`l${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke={fg} strokeOpacity={0.35} strokeWidth={1} />)
    })
    pts.forEach(([x, y], i) => els.push(<circle key={`n${i}`} cx={x} cy={y} r={i % 5 === 0 ? 6 : 3} fill={i % 5 === 0 ? hi : fg} />))
  } else if (pattern === 'ondas') {
    for (let i = 0; i < 14; i++) {
      const y = 40 + i * 26, a = 18 + r() * 30, f = 0.012 + r() * 0.01, ph = r() * 6
      const d = Array.from({ length: 31 }, (_, k) => {
        const x = k * 10
        return `${k ? 'L' : 'M'}${x},${(y + Math.sin(x * f + ph) * a).toFixed(1)}`
      }).join(' ')
      els.push(<path key={i} d={d} fill="none" stroke={i === 6 ? hi : fg} strokeOpacity={i === 6 ? 0.95 : 0.4} strokeWidth={i === 6 ? 2.2 : 1.1} />)
    }
  } else if (pattern === 'constelacao') {
    const pts = Array.from({ length: 22 }, () => [20 + r() * 260, 20 + r() * 360])
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
        if (dist < 85) els.push(<line key={`${i}-${j}`} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} stroke={fg} strokeOpacity={0.45} />)
      }
    }
    pts.forEach(([x, y], i) => els.push(<circle key={i} cx={x} cy={y} r={i % 6 === 0 ? 5 : 2.5} fill={i % 6 === 0 ? hi : fg} />))
  } else if (pattern === 'dados') {
    for (let i = 0; i < 12; i++) {
      const h = 40 + r() * 220
      els.push(<rect key={i} x={18 + i * 23} y={H - 40 - h} width={14} height={h} rx={3} fill={i === 7 ? hi : fg} fillOpacity={i === 7 ? 0.95 : 0.35 + r() * 0.3} />)
    }
  } else {
    for (let i = 0; i < 6; i++) {
      els.push(<ellipse key={i} cx={150} cy={200} rx={40 + i * 26} ry={16 + i * 22} fill="none" stroke={fg} strokeOpacity={0.5} transform={`rotate(${r() * 180} 150 200)`} />)
    }
    els.push(<circle key="c" cx={150} cy={200} r={14} fill={hi} />)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width={W} height={H} fill={bg} />
      {els}
    </svg>
  )
}
