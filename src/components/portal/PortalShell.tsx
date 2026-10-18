'use client'

// Moldura do portal executivo e de administração: menu lateral agrupado (recolhível no desktop,
// gaveta no celular) e barra superior com o título da página, as ações dela e o menu da pessoa.
// Usa o mesmo design system da Comunidade (tokens `beon-*` e primitivas de components/ui).

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, HeartHandshake, LogOut, Menu, RotateCcw, X } from 'lucide-react'
import { ROLE_LABEL, logout } from '@/lib/auth/client'
import { Avatar, CountBadge, cx, focusRing } from '@/components/ui'
import { isNavActive, navFor, type PortalNavGroup } from './nav'
import { usePortalSession, type PortalUser } from './usePortalSession'

const COLLAPSE_KEY = 'portal-menu-recolhido'

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/estrategia" className={cx('flex items-center gap-2.5 rounded-xl', compact ? 'justify-center' : 'px-2', focusRing)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jira/logobeonlabs.png" alt="beOn Labs" className={compact ? 'h-6 w-auto' : 'h-8 w-auto'} />
      {!compact && (
        <span className="border-l border-beon-line pl-2.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-beon-muted">
          Portal<br />Executivo
        </span>
      )}
    </Link>
  )
}

function NavList({ groups, path, pending, compact, onNavigate }: {
  groups: PortalNavGroup[]; path: string; pending: number; compact?: boolean; onNavigate?: () => void
}) {
  return (
    <nav aria-label="Áreas do portal" className="space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          {compact
            ? <div className="mx-auto mb-2 h-px w-6 bg-beon-line first:hidden" aria-hidden />
            : <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map(item => {
              const active = isNavActive(path, item)
              const badge = item.pendingBadge ? pending : 0
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    title={compact ? item.label : undefined}
                    className={cx(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                      active ? 'bg-beon-tint font-semibold text-beon-ink' : 'text-beon-body hover:bg-beon-soft hover:text-beon-ink',
                      compact && 'justify-center px-0',
                      focusRing,
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-beon-red" aria-hidden />}
                    <Icon className={cx('h-[18px] w-[18px] shrink-0', active ? 'text-beon-red' : 'text-beon-muted group-hover:text-beon-ink')} aria-hidden />
                    {!compact && <span className="truncate">{item.label}</span>}
                    {!!badge && (
                      <CountBadge n={badge} className={compact ? 'absolute right-1 top-0.5' : 'ml-auto'} />
                    )}
                    {!!badge && <span className="sr-only">{badge} cadastros aguardando aprovação</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UserMenu({ user }: { user: PortalUser | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])

  const itemCls = cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-beon-body hover:bg-beon-soft hover:text-beon-ink', focusRing)
  const nome = user?.nome || user?.username || ''
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu da conta"
        className={cx('flex items-center gap-2.5 rounded-full p-0.5 pr-0.5 hover:bg-beon-soft sm:pr-3', focusRing)}
      >
        {user ? <Avatar nome={nome} src={user.avatar} size={34} /> : <span className="h-[34px] w-[34px] animate-pulse rounded-full bg-stone-200" aria-hidden />}
        {user && (
          <span className="hidden text-left sm:block">
            <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight text-beon-ink">{nome}</span>
            <span className="block text-xs leading-tight text-beon-muted">{ROLE_LABEL[user.role]}</span>
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-beon-line bg-white p-1.5 shadow-xl">
          {user && (
            <div className="border-b border-beon-line px-3 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-semibold text-beon-ink">{nome}</p>
              <p className="truncate text-xs text-beon-muted">{user.username} · {ROLE_LABEL[user.role]}</p>
            </div>
          )}
          <div className="pt-1.5">
            {user?.role === 'admin' && (
              <Link role="menuitem" href="/comunidade" className={itemCls}>
                <HeartHandshake className="h-4 w-4" aria-hidden /> Ir para a Comunidade
              </Link>
            )}
            <button role="menuitem" type="button" className={itemCls} onClick={() => logout()}>
              <LogOut className="h-4 w-4" aria-hidden /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Limpa o cache do Jira no servidor e recarrega a página (só admin e executivo podem). */
function RefreshButton() {
  const [loading, setLoading] = useState(false)
  async function refresh() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/jira/api/clear-cache', { method: 'POST' })
    } finally {
      window.location.reload()
    }
  }
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={loading}
      title="Limpar o cache e buscar os dados do Jira de novo"
      className={cx('flex h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3 text-sm font-medium text-beon-ink hover:bg-beon-soft disabled:opacity-60', focusRing)}
    >
      <RotateCcw className={cx('h-4 w-4 text-beon-muted', loading && 'animate-spin')} aria-hidden />
      <span className="hidden md:inline">{loading ? 'Atualizando…' : 'Atualizar dados'}</span>
    </button>
  )
}

export interface PortalShellProps {
  /** Título da página na barra superior. */
  title: string
  /** Uma linha de contexto abaixo do título. */
  description?: string
  /** Controles da página (filtros, exportar…), à direita da barra superior. */
  actions?: ReactNode
  /** Mostra "Atualizar dados" (limpa o cache do Jira) para admin e executivo. */
  refreshable?: boolean
  /**
   * Página com altura da tela (deck, chat): a moldura não rola, e a página cuida da própria rolagem
   * dentro de um contêiner `flex-1 overflow-auto`.
   */
  fit?: boolean
  /** `false` esconde menu e barra (modo apresentação). */
  chrome?: boolean
  children: ReactNode
}

export function PortalShell({ title, description, actions, refreshable, fit, chrome = true, children }: PortalShellProps) {
  const path = usePathname()
  const { user, pending } = usePortalSession()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const groups = navFor(user?.role ?? null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY)
      setCollapsed(saved ? saved === '1' : window.innerWidth < 1440)
    } catch { /* armazenamento indisponível */ }
  }, [])

  useEffect(() => { setDrawer(false) }, [path])

  useEffect(() => {
    if (!drawer) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [drawer])

  function toggleCollapsed() {
    setCollapsed(c => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1') } catch { /* armazenamento indisponível */ }
      return !c
    })
  }

  if (!chrome) return <div className="min-h-dvh bg-beon-soft font-sans text-beon-ink">{children}</div>

  const podeAtualizar = refreshable && (user?.role === 'admin' || user?.role === 'executivo')

  return (
    <div className={cx('flex bg-beon-soft font-sans text-beon-ink antialiased', fit ? 'h-dvh overflow-hidden' : 'min-h-dvh')}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Pular para o conteúdo
      </a>

      {/* Menu lateral — tablet e desktop */}
      <aside
        className={cx(
          'sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-beon-line bg-white py-5 transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px] px-2.5' : 'w-60 px-3',
        )}
      >
        <div className="mb-6"><Logo compact={collapsed} /></div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
          <NavList groups={groups} path={path} pending={pending} compact={collapsed} />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cx('mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-beon-muted hover:bg-beon-soft hover:text-beon-ink', collapsed && 'justify-center px-0', focusRing)}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden /> : <><ChevronsLeft className="h-4 w-4" aria-hidden /> Recolher menu</>}
        </button>
      </aside>

      {/* Gaveta — celular */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-stone-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white px-3 py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Fechar menu" className={cx('rounded-full p-2 text-beon-muted hover:bg-beon-soft', focusRing)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList groups={groups} path={path} pending={pending} onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}

      <div className={cx('flex min-w-0 flex-1 flex-col', fit && 'min-h-0')}>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-beon-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
            className={cx('-ml-1 rounded-full p-2 text-beon-body hover:bg-beon-soft md:hidden', focusRing)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-beon-ink">{title}</h1>
            {description && <p className="hidden truncate text-xs text-beon-muted sm:block">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {podeAtualizar && <RefreshButton />}
            <span className="mx-1 hidden h-6 w-px bg-beon-line sm:block" aria-hidden />
            <UserMenu user={user} />
          </div>
        </header>

        <main id="conteudo" className={cx('flex min-w-0 flex-1 flex-col', fit && 'min-h-0 overflow-hidden')}>
          {children}
        </main>
      </div>
    </div>
  )
}
