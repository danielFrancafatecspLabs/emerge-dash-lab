'use client'

// Moldura única do app. A Comunidade é a casa de todos os perfis; as visões executivas e a administração
// ficam no mesmo menu para quem tem acesso, então trocar de área nunca troca de "aplicativo".
// Desktop: menu lateral (ícones no tablet, completo a partir de 1280px). Celular: barra superior,
// navegação inferior com as áreas da Comunidade e gaveta com o menu completo.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, LogOut, Menu, MessageCircle, MoreHorizontal, PenSquare, Settings2, UserRound, X } from 'lucide-react'
import { ROLE_LABEL, logout } from '@/lib/auth/client'
import { topicLabel } from '@/lib/community/topics'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { Composer } from '@/components/comunidade/Composer'
import { NotificationsDialog, NotificationPrefsDialog } from '@/components/comunidade/Notifications'
import { Onboarding } from '@/components/comunidade/Onboarding'
import { Toaster } from '@/components/comunidade/Toaster'
import { topicIcon } from '@/components/comunidade/visuals'
import { Avatar, CountBadge, IconButton, cx, focusRing } from '@/components/ui'
import { useChromeHidden } from './AppChrome'
import { COMMUNITY_SHORTCUTS, communityAreasFor, isNavActive, portalGroupsFor, type NavGroup, type NavItem } from './nav'
import { usePendingSignups } from './usePendingSignups'

type Badges = Record<NonNullable<NavItem['badge']>, number>

function NavLink({ item, path, badges, compact, onNavigate }: {
  item: NavItem; path: string; badges: Badges; compact?: boolean; onNavigate?: () => void
}) {
  const active = isNavActive(path, item)
  const badge = item.badge ? badges[item.badge] : 0
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={compact ? item.label : undefined}
      className={cx(
        'group relative flex items-center gap-3 rounded-xl px-3 py-[7px] text-[15px] transition-colors',
        active ? 'bg-beon-soft font-semibold text-beon-ink' : 'text-beon-body hover:bg-beon-soft/70 hover:text-beon-ink',
        compact && 'justify-center xl:justify-start',
        focusRing,
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-beon-red" aria-hidden />}
      <Icon className={cx('h-5 w-5 shrink-0', active ? 'text-beon-red' : 'text-beon-muted group-hover:text-beon-ink')} aria-hidden />
      <span className={cx('truncate', compact && 'hidden xl:inline')}>{item.label}</span>
      {!!badge && <CountBadge n={badge} className={cx('ml-auto', compact && 'absolute right-1 top-0.5 xl:static')} />}
      {!!badge && <span className="sr-only">({badge} novos)</span>}
    </Link>
  )
}

function GroupLabel({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return compact
    ? <><div className="mx-auto my-3 h-px w-8 bg-beon-line xl:hidden" aria-hidden /><p className="mb-1 mt-4 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted xl:block">{children}</p></>
    : <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{children}</p>
}

/** Todo o menu: Comunidade, atalhos pessoais e as visões do perfil. */
function Navigation({ path, areas, groups, badges, compact, onNavigate, onNotifications, notificacoes }: {
  path: string; areas: NavItem[]; groups: NavGroup[]; badges: Badges; compact?: boolean; onNavigate?: () => void
  onNotifications: () => void; notificacoes: number
}) {
  return (
    <>
      <nav aria-label="Comunidade" className="space-y-0.5">
        {areas.map(item => <NavLink key={item.href} item={item} path={path} badges={badges} compact={compact} onNavigate={onNavigate} />)}
      </nav>
      <div className={cx('my-3 h-px bg-beon-line', compact && 'mx-auto w-8 xl:mx-0 xl:w-auto')} aria-hidden />
      <nav aria-label="Atalhos" className="space-y-0.5">
        {COMMUNITY_SHORTCUTS.map(item => <NavLink key={item.href} item={item} path={path} badges={badges} compact={compact} onNavigate={onNavigate} />)}
        <button
          type="button"
          onClick={() => { onNavigate?.(); onNotifications() }}
          title={compact ? 'Notificações' : undefined}
          className={cx(
            'relative flex w-full items-center gap-3 rounded-xl px-3 py-[7px] text-[15px] text-beon-body hover:bg-beon-soft/70 hover:text-beon-ink',
            compact && 'justify-center xl:justify-start',
            focusRing,
          )}
        >
          <Bell className="h-5 w-5 shrink-0 text-beon-muted" aria-hidden />
          <span className={cx(compact && 'hidden xl:inline')}>Notificações</span>
          {!!notificacoes && <CountBadge n={notificacoes} className={cx('ml-auto', compact && 'absolute right-1 top-0.5 xl:static')} />}
          <span className="sr-only">{notificacoes ? `${notificacoes} não lidas` : ''}</span>
        </button>
      </nav>
      {groups.map(group => (
        <nav key={group.label} aria-label={group.label}>
          <GroupLabel compact={compact}>{group.label}</GroupLabel>
          <div className="space-y-0.5">
            {group.items.map(item => <NavLink key={item.href} item={item} path={path} badges={badges} compact={compact} onNavigate={onNavigate} />)}
          </div>
        </nav>
      ))}
    </>
  )
}

function ProfileMenu({ onPrefs, full }: { onPrefs: () => void; full?: boolean }) {
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
  const subtitulo = me.role === 'community' ? (me.profile.especialidade || me.laboratorio || 'Ver perfil') : ROLE_LABEL[me.role]
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu da conta"
        className={cx('flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-beon-soft', focusRing)}
      >
        <Avatar nome={me.nome} src={me.avatar} size={36} />
        <span className={cx('min-w-0 flex-1', full ? 'block' : 'hidden xl:block')}>
          <span className="block truncate text-sm font-semibold text-beon-ink">{me.nome}</span>
          <span className="block truncate text-xs text-beon-muted">{subtitulo}</span>
        </span>
        <MoreHorizontal className={cx('h-4 w-4 text-beon-muted', full ? 'block' : 'hidden xl:block')} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-xl border border-beon-line bg-white p-1.5 shadow-xl">
          <Link role="menuitem" href={`/comunidade/pessoas/${encodeURIComponent(me.username)}`} className={itemCls} onClick={() => setOpen(false)}>
            <UserRound className="h-4 w-4" aria-hidden /> Meu perfil
          </Link>
          <button role="menuitem" type="button" className={itemCls} onClick={() => { setOpen(false); onPrefs() }}>
            <Settings2 className="h-4 w-4" aria-hidden /> Preferências de notificação
          </button>
          <button role="menuitem" type="button" className={itemCls} onClick={() => logout()}>
            <LogOut className="h-4 w-4" aria-hidden /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

function Logo({ withName }: { withName?: boolean }) {
  return (
    <Link href="/comunidade" className={cx('flex items-center gap-2.5 rounded-xl', focusRing)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-8 w-auto" />
      {withName && <span className="text-[15px] font-semibold tracking-tight text-beon-ink">beOn Labs</span>}
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const hidden = useChromeHidden() || (typeof document !== 'undefined' && document.body.classList.contains('modo-apresentacao'))
  const { me, counts, openComposer } = useCommunity()
  const [notifOpen, setNotifOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const areas = communityAreasFor(me?.role)
  const groups = portalGroupsFor(me?.role)
  const pendentes = usePendingSignups(me?.role === 'admin')
  const badges: Badges = { mensagens: counts.mensagens, pendentes }
  const naComunidade = path.startsWith('/comunidade')
  const topicos = me?.role === 'community' ? me.profile.topicosSeguidos : []

  useEffect(() => { setDrawer(false) }, [path])
  useEffect(() => {
    if (!drawer) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [drawer])

  const dialogs = (
    <>
      <Composer />
      <NotificationsDialog open={notifOpen} onClose={() => setNotifOpen(false)} />
      <NotificationPrefsDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <Onboarding />
      <Toaster />
    </>
  )

  // Sem menu e barras (apresentação ou página maximizada) a árvore continua a mesma: só as barras deixam de
  // ser renderizadas, para a página não ser remontada (e não perder o estado) ao alternar.
  return (
    <div className="beon-root min-h-dvh bg-white font-sans text-beon-ink antialiased">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Pular para o conteúdo
      </a>

      {/* Barra superior — celular */}
      {!hidden && <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-beon-line bg-white/95 px-2 backdrop-blur md:hidden">
        <div className="flex items-center gap-1">
          <IconButton icon={Menu} label="Abrir menu" onClick={() => setDrawer(true)} />
          <Logo />
        </div>
        <div className="flex items-center gap-0.5">
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
      </header>}

      {/* Gaveta com o menu completo — celular */}
      {drawer && !hidden && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-stone-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white px-3 py-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between pl-2">
              <Logo withName />
              <IconButton icon={X} label="Fechar menu" onClick={() => setDrawer(false)} />
            </div>
            <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-4">
              <Navigation path={path} areas={areas} groups={groups} badges={badges} onNavigate={() => setDrawer(false)} onNotifications={() => setNotifOpen(true)} notificacoes={counts.notificacoes} />
            </div>
            <div className="border-t border-beon-line pt-3"><ProfileMenu full onPrefs={() => setPrefsOpen(true)} /></div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Menu lateral — tablet (ícones) e desktop (completo) */}
        {!hidden && <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-beon-line bg-white px-3 py-5 md:flex xl:w-64">
          <div className="mb-5 flex justify-center xl:justify-start xl:px-2"><Logo /></div>

          <div className="-mx-1 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
            <Navigation path={path} areas={areas} groups={groups} badges={badges} compact onNotifications={() => setNotifOpen(true)} notificacoes={counts.notificacoes} />

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
          </div>

          <div className="mt-3 space-y-3 border-t border-beon-line pt-3">
            <button
              type="button"
              onClick={() => openComposer()}
              className={cx('flex h-11 w-full items-center justify-center gap-2 rounded-full bg-beon-red text-sm font-semibold text-white transition-colors hover:bg-beon-redhi', focusRing)}
              title="Publicar na Comunidade"
            >
              <PenSquare className="h-[18px] w-[18px]" aria-hidden />
              <span className="hidden xl:inline">Publicar</span>
            </button>
            <ProfileMenu onPrefs={() => setPrefsOpen(true)} />
          </div>
        </aside>}

        <main id="conteudo" className={cx('min-w-0 flex-1', hidden ? '' : naComunidade ? 'pb-24 md:pb-10' : 'pb-16 md:pb-0')}>
          {naComunidade ? <div className="mx-auto max-w-[1180px]">{children}</div> : children}
        </main>
      </div>

      {/* Navegação inferior — celular */}
      {!hidden && <nav aria-label="Comunidade" className="fixed inset-x-0 bottom-0 z-30 grid border-t border-beon-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${areas.length}, minmax(0, 1fr))` }}>
        {areas.map(item => {
          const active = isNavActive(path, item)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'font-semibold text-beon-red' : 'text-beon-muted', focusRing)}>
              <Icon className="h-5 w-5" aria-hidden />
              {item.short}
            </Link>
          )
        })}
      </nav>}
      {!hidden && naComunidade && !path.startsWith('/comunidade/mensagens') && !path.startsWith('/comunidade/cientista/') && (
        <button
          type="button"
          onClick={() => openComposer()}
          aria-label="Publicar"
          className={cx('fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-beon-red text-white shadow-lg shadow-beon-red/30 md:hidden', focusRing)}
        >
          <PenSquare className="h-5 w-5" aria-hidden />
        </button>
      )}

      {dialogs}
    </div>
  )
}
