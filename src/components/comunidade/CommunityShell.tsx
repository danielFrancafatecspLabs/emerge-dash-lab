'use client'

// Moldura da experiência Comunidade: navegação à esquerda (desktop), barra superior e navegação
// inferior (celular), botão de publicar sempre à mão, notificações, onboarding e avisos.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell, BookOpen, Bookmark, ChevronLeft, FlaskConical, Home, LogOut, MessageCircle, MoreHorizontal, PenSquare, Route,
  Settings2, Telescope, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { logout } from '@/lib/auth/client'
import { topicLabel } from '@/lib/community/topics'
import { useCommunity } from './CommunityProvider'
import { Avatar, CountBadge, IconButton, cx, focusRing } from '@/components/ui'
import { topicIcon } from './visuals'
import { Composer } from './Composer'
import { NotificationsDialog, NotificationPrefsDialog } from './Notifications'
import { Onboarding } from './Onboarding'
import { Toaster } from './Toaster'

export const AREAS: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: '/comunidade', label: 'Comunidade', short: 'Início', icon: Home },
  { href: '/comunidade/cientista', label: 'Cientista', short: 'Cientista', icon: FlaskConical },
  { href: '/comunidade/pesquisas', label: 'Pesquisas', short: 'Pesquisas', icon: BookOpen },
  { href: '/comunidade/future-thinking', label: 'Future Thinking', short: 'Futuro', icon: Telescope },
  { href: '/comunidade/trilha', label: 'Trilha de Experimentação', short: 'Trilha', icon: Route },
]

function isActive(path: string, href: string) {
  if (href === '/comunidade') return path === '/comunidade' || path.startsWith('/comunidade/post')
  if (href === '/comunidade/trilha') return ['/comunidade/trilha', '/comunidade/como-experimentar', '/comunidade/framework-hipoteses'].some(p => path.startsWith(p))
  if (href === '/comunidade/pesquisas') return path.startsWith(href) || path.startsWith('/comunidade/experimentos')
  return path.startsWith(href)
}

function NavLink({ href, label, icon: Icon, active, badge, compact }: {
  href: string; label: string; icon: LucideIcon; active: boolean; badge?: number; compact?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={compact ? label : undefined}
      className={cx(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
        active ? 'bg-beon-soft font-semibold text-beon-ink' : 'text-beon-body hover:bg-beon-soft/70 hover:text-beon-ink',
        compact && 'justify-center xl:justify-start',
        focusRing,
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-beon-red" aria-hidden />}
      <Icon className={cx('h-5 w-5 shrink-0', active ? 'text-beon-red' : 'text-beon-muted group-hover:text-beon-ink')} aria-hidden />
      <span className={cx('truncate', compact && 'hidden xl:inline')}>{label}</span>
      {!!badge && <CountBadge n={badge} className={cx('ml-auto', compact && 'absolute right-1 top-1 xl:static')} />}
    </Link>
  )
}

function ProfileMenu({ onPrefs }: { onPrefs: () => void }) {
  const { me } = useCommunity()
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
  if (!me) return null
  const itemCls = cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-beon-body hover:bg-beon-soft hover:text-beon-ink', focusRing)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cx('flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-beon-soft', focusRing)}
      >
        <Avatar nome={me.nome} src={me.avatar} size={36} />
        <span className="hidden min-w-0 flex-1 xl:block">
          <span className="block truncate text-sm font-semibold text-beon-ink">{me.nome}</span>
          <span className="block truncate text-xs text-beon-muted">{me.profile.especialidade || me.laboratorio || 'Ver perfil'}</span>
        </span>
        <MoreHorizontal className="hidden h-4 w-4 text-beon-muted xl:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-xl border border-beon-line bg-white p-1.5 shadow-xl">
          <Link role="menuitem" href={`/comunidade/pessoas/${encodeURIComponent(me.username)}`} className={itemCls} onClick={() => setOpen(false)}>
            <UserRound className="h-4 w-4" aria-hidden /> Meu perfil
          </Link>
          <button role="menuitem" type="button" className={itemCls} onClick={() => { setOpen(false); onPrefs() }}>
            <Settings2 className="h-4 w-4" aria-hidden /> Preferências de notificação
          </button>
          {me.role !== 'community' && (
            <Link role="menuitem" href="/estrategia" className={itemCls}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Voltar ao painel executivo
            </Link>
          )}
          <button role="menuitem" type="button" className={itemCls} onClick={() => logout()}>
            <LogOut className="h-4 w-4" aria-hidden /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

export function CommunityShell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const { me, counts, openComposer } = useCommunity()
  const [notifOpen, setNotifOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const topicos = me?.profile.topicosSeguidos ?? []

  return (
    <div className="beon-root min-h-dvh bg-white font-sans text-beon-ink antialiased">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Pular para o conteúdo
      </a>

      {/* Barra superior — celular */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-beon-line bg-white/95 px-3 backdrop-blur md:hidden">
        <Link href="/comunidade" className={cx('flex items-center gap-2 rounded-lg', focusRing)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-7 w-auto" />
          <span className="text-[15px] font-semibold tracking-tight">Comunidade</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <Link href="/comunidade/pessoas" aria-label="Pessoas" className={cx('inline-flex h-9 w-9 items-center justify-center rounded-full text-beon-body hover:bg-beon-soft', focusRing)}>
            <Users className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <IconButton icon={Bell} label="Notificações" badge={counts.notificacoes} onClick={() => setNotifOpen(true)} />
          <Link href="/comunidade/mensagens" aria-label={`Mensagens${counts.mensagens ? ` (${counts.mensagens} não lidas)` : ''}`} className={cx('relative inline-flex h-9 w-9 items-center justify-center rounded-full text-beon-body hover:bg-beon-soft', focusRing)}>
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            {!!counts.mensagens && <CountBadge n={counts.mensagens} className="absolute -right-0.5 -top-0.5" />}
          </Link>
          {me && (
            <Link href={`/comunidade/pessoas/${encodeURIComponent(me.username)}`} aria-label="Meu perfil" className={cx('ml-1 rounded-full', focusRing)}>
              <Avatar nome={me.nome} src={me.avatar} size={30} />
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Navegação lateral — tablet (ícones) e desktop (completa) */}
        <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-beon-line px-3 py-5 md:flex xl:w-64">
          <Link href="/comunidade" className={cx('mb-6 flex items-center gap-2.5 rounded-xl px-2 xl:px-3', focusRing)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-8 w-auto" />
            <span className="hidden text-[15px] font-semibold tracking-tight xl:inline">Comunidade</span>
          </Link>

          <nav aria-label="Áreas da Comunidade" className="space-y-1">
            {AREAS.map(a => <NavLink key={a.href} {...a} active={isActive(path, a.href)} compact />)}
          </nav>

          <div className="my-4 h-px bg-beon-line" />

          <nav aria-label="Atalhos" className="space-y-1">
            <NavLink href="/comunidade/pessoas" label="Pessoas" icon={Users} active={path.startsWith('/comunidade/pessoas')} compact />
            <NavLink href="/comunidade/mensagens" label="Mensagens" icon={MessageCircle} active={path.startsWith('/comunidade/mensagens')} badge={counts.mensagens} compact />
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              title="Notificações"
              className={cx('relative flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-beon-body hover:bg-beon-soft/70 hover:text-beon-ink xl:justify-start', focusRing)}
            >
              <Bell className="h-5 w-5 shrink-0 text-beon-muted" aria-hidden />
              <span className="hidden xl:inline">Notificações</span>
              {!!counts.notificacoes && <CountBadge n={counts.notificacoes} className="absolute right-1 top-1 xl:static xl:ml-auto" />}
              <span className="sr-only">{counts.notificacoes ? `${counts.notificacoes} não lidas` : ''}</span>
            </button>
            <NavLink href="/comunidade/salvos" label="Salvos e seguidos" icon={Bookmark} active={path.startsWith('/comunidade/salvos')} compact />
          </nav>

          {topicos.length > 0 && (
            <div className="mt-5 hidden xl:block">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Tópicos que acompanho</p>
              <ul className="space-y-0.5">
                {topicos.slice(0, 6).map(t => {
                  const Icon = topicIcon(t)
                  return (
                    <li key={t}>
                      <Link href={`/comunidade?topico=${t}`} className={cx('flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-beon-body hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
                        <Icon className="h-4 w-4 text-beon-muted" aria-hidden /> <span className="truncate">{topicLabel(t)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="mt-auto space-y-3 pt-4">
            <button
              type="button"
              onClick={() => openComposer()}
              className={cx('flex h-11 w-full items-center justify-center gap-2 rounded-full bg-beon-red text-sm font-semibold text-white transition-colors hover:bg-beon-redhi', focusRing)}
              title="Publicar"
            >
              <PenSquare className="h-[18px] w-[18px]" aria-hidden />
              <span className="hidden xl:inline">Publicar</span>
            </button>
            <ProfileMenu onPrefs={() => setPrefsOpen(true)} />
          </div>
        </aside>

        <main id="conteudo" className="min-w-0 flex-1 pb-24 md:pb-10">{children}</main>
      </div>

      {/* Navegação inferior — celular */}
      <nav aria-label="Áreas da Comunidade" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-beon-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {AREAS.map(({ href, short, icon: Icon }) => {
          const active = isActive(path, href)
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'font-semibold text-beon-red' : 'text-beon-muted', focusRing)}>
              <Icon className="h-5 w-5" aria-hidden />
              {short}
            </Link>
          )
        })}
      </nav>
      {!path.startsWith('/comunidade/mensagens') && !path.startsWith('/comunidade/cientista/') && (
        <button
          type="button"
          onClick={() => openComposer()}
          aria-label="Publicar"
          className={cx('fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-beon-red text-white shadow-lg shadow-beon-red/30 md:hidden', focusRing)}
        >
          <PenSquare className="h-5 w-5" aria-hidden />
        </button>
      )}

      <Composer />
      <NotificationsDialog open={notifOpen} onClose={() => setNotifOpen(false)} />
      <NotificationPrefsDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <Onboarding />
      <Toaster />
    </div>
  )
}

/** Duas colunas de conteúdo: principal e painel auxiliar (este some abaixo de 1024px). */
export function PageColumns({ children, aside, wide }: { children: ReactNode; aside?: ReactNode; wide?: boolean }) {
  return (
    <div className="flex justify-center gap-8 lg:px-6">
      <div className={cx('w-full min-w-0', wide ? 'max-w-[960px]' : 'max-w-[680px]')}>{children}</div>
      {aside && <aside className="sticky top-0 hidden h-dvh w-[320px] shrink-0 overflow-y-auto py-6 lg:block" aria-label="Descoberta">{aside}</aside>}
    </div>
  )
}

export function PageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-5 pt-6 sm:px-6 md:pt-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-red">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-beon-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-beon-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
