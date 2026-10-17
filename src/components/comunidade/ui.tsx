'use client'

// Primitivas visuais da experiência Comunidade: avatar, botões, chips, diálogo, estados de carregamento/erro/vazio.

import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, Loader2, X, type LucideIcon } from 'lucide-react'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-comm-red/60 focus-visible:ring-offset-2'

// ── Avatar ──────────────────────────────────────────────────────────────────────────────────

const TONS = [
  ['#FDF1F0', '#B31407'], ['#F5F0EB', '#7C4A1E'], ['#EEF4F1', '#2F5D4A'],
  ['#EFF3F8', '#2D4A6B'], ['#F6F1E7', '#7A5B12'], ['#F3F1F0', '#44403C'],
]

function hash(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ nome, src, size = 40, ativo }: { nome: string; src?: string; size?: number; ativo?: boolean }) {
  const [bg, fg] = TONS[hash(nome) % TONS.length]
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
      ) : (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center rounded-full font-semibold"
          style={{ background: bg, color: fg, fontSize: Math.max(11, size * 0.38) }}
        >
          {iniciais(nome)}
        </span>
      )}
      {ativo && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500"
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
          title="Ativo agora"
        />
      )}
    </span>
  )
}

// ── Botões ──────────────────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-comm-red text-white hover:bg-comm-redhi disabled:bg-comm-red/50',
  secondary: 'border border-comm-line bg-white text-comm-ink hover:bg-comm-soft disabled:text-comm-muted',
  ghost: 'text-comm-body hover:bg-comm-soft hover:text-comm-ink disabled:text-comm-muted/60',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/50',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: LucideIcon
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        VARIANT[variant], focusRing, className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon && <Icon className="h-4 w-4" aria-hidden />}
      {children}
    </button>
  )
})

export function IconButton({ icon: Icon, label, active, badge, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon; label: string; active?: boolean; badge?: number
}) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label} (${badge} não lidas)` : label}
      title={label}
      className={cx(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors',
        active ? 'bg-comm-tint text-comm-red' : 'text-comm-body hover:bg-comm-soft hover:text-comm-ink',
        focusRing, className,
      )}
      {...rest}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {!!badge && <CountBadge n={badge} className="absolute -right-0.5 -top-0.5" />}
    </button>
  )
}

export function CountBadge({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cx('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-comm-red px-1 text-[10px] font-bold leading-none text-white', className)}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

// ── Chips ───────────────────────────────────────────────────────────────────────────────────

export function Chip({ selected, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors',
        selected ? 'border-comm-ink bg-comm-ink text-white' : 'border-comm-line bg-white text-comm-body hover:border-comm-muted/50 hover:text-comm-ink',
        focusRing, className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── Diálogo (elemento <dialog> nativo: foco preso, Esc fecha) ───────────────────────────────

export function Dialog({ open, onClose, title, description, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'md' | 'lg'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose() }}
      aria-labelledby="comm-dialog-title"
      className={cx(
        'm-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 text-comm-ink shadow-2xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px]',
        size === 'lg' ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-comm-line px-6 py-4">
            <div>
              <h2 id="comm-dialog-title" className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-comm-muted">{description}</p>}
            </div>
            <IconButton icon={X} label="Fechar" onClick={onClose} className="-mr-2" />
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}

// ── Estados ─────────────────────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-stone-200/70', className)} aria-hidden />
}

export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-comm-line px-4 py-5 sm:px-6" aria-hidden>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-comm-tint text-comm-red">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-comm-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm leading-relaxed text-comm-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-6 w-6 text-comm-red" aria-hidden />
      <p className="max-w-sm text-sm text-comm-body">{message}</p>
      {onRetry && <Button size="sm" className="mt-4" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-comm-muted">{children}</h2>
      {action}
    </div>
  )
}

export const inputClass = cx(
  'w-full rounded-xl border border-comm-line bg-white px-3.5 py-2.5 text-[15px] text-comm-ink placeholder:text-comm-muted/80',
  'transition-colors focus:border-comm-ink/40 focus:outline-none focus:ring-2 focus:ring-comm-red/20',
)
