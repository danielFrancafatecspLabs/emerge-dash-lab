// Itens do menu do portal executivo e de administração, agrupados, com os perfis que veem cada um.
// O menu só esconde o que o perfil não usa: quem decide o acesso é a política em lib/auth/access-policy.

import {
  Activity, BarChart2, BookOpen, Bot, CalendarCheck, CalendarDays, FileText, HeartHandshake, Images, Target, UserCog, Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AuthSessionRole } from '@/lib/auth/session'

export interface PortalNavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: readonly AuthSessionRole[]
  /** Outras rotas que contam como esta área (ex.: o MBR dentro de Report). */
  also?: string[]
  /** Mostra a contagem de cadastros aguardando aprovação. */
  pendingBadge?: boolean
}

export interface PortalNavGroup {
  label: string
  items: PortalNavItem[]
}

const ADMIN: AuthSessionRole[] = ['admin']

export const PORTAL_NAV: PortalNavGroup[] = [
  {
    label: 'Painéis',
    items: [
      { label: 'Estratégia', href: '/estrategia', icon: Target, roles: ['admin', 'executivo', 'financeiro', 'viewer'] },
      { label: 'Operacional', href: '/operacional', icon: Activity, roles: ADMIN },
      { label: 'Benefícios', href: '/beneficios', icon: Wallet, roles: ['admin', 'executivo', 'financeiro'] },
      { label: 'Portfólio', href: '/portfolio', icon: BarChart2, roles: ADMIN },
    ],
  },
  {
    label: 'Rituais',
    items: [
      { label: 'Report', href: '/report', icon: FileText, roles: ADMIN },
      { label: 'Weekly', href: '/weekly', icon: CalendarDays, roles: ADMIN },
      { label: 'Semanal', href: '/semanal', icon: CalendarCheck, roles: ADMIN },
    ],
  },
  {
    label: 'Conhecimento',
    items: [
      { label: 'Cientista', href: '/cientista', icon: Bot, roles: ADMIN },
      { label: 'Pesquisas', href: '/pesquisas', icon: BookOpen, roles: ADMIN },
      { label: 'Comunidade', href: '/comunidade', icon: HeartHandshake, roles: ADMIN },
    ],
  },
  {
    label: 'Administração',
    items: [
      { label: 'Usuários', href: '/admin/users', icon: UserCog, roles: ADMIN, pendingBadge: true },
      { label: 'Stories', href: '/admin/stories', icon: Images, roles: ADMIN },
    ],
  },
]

export function isNavActive(path: string, item: PortalNavItem): boolean {
  return [item.href, ...(item.also ?? [])].some(h => path === h || path.startsWith(`${h}/`))
}

/** Grupos e itens visíveis para o perfil (sem perfil carregado, nada é escondido). */
export function navFor(role: AuthSessionRole | null): PortalNavGroup[] {
  return PORTAL_NAV
    .map(g => ({ ...g, items: g.items.filter(i => !role || i.roles.includes(role)) }))
    .filter(g => g.items.length > 0)
}
