// Mapa de navegação do app: a Comunidade é a casa de todos os perfis; as visões executivas e a
// administração aparecem no mesmo menu para quem tem acesso. O menu só esconde o que o perfil não usa —
// quem decide o acesso é a política em lib/auth/access-policy.

import {
  Activity, BarChart2, BookOpen, Bookmark, CalendarCheck, FileText, FlaskConical, Home, Images, Library,
  MessageCircle, Route, Target, Telescope, UserCog, Users, Wallet, type LucideIcon,
} from 'lucide-react'
import type { AuthSessionRole } from '@/lib/auth/session'

export interface NavItem {
  label: string
  /** Rótulo curto da navegação inferior no celular. */
  short?: string
  href: string
  icon: LucideIcon
  /** Perfis que veem o item; sem a lista, todos veem. */
  roles?: readonly AuthSessionRole[]
  /** Outras rotas que contam como esta área. */
  also?: string[]
  /** Contador exibido ao lado do item. */
  badge?: 'mensagens' | 'pendentes'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const ADMIN: AuthSessionRole[] = ['admin']

/** Áreas da Comunidade (também a navegação inferior no celular). */
export const COMMUNITY_AREAS: NavItem[] = [
  { label: 'Início', short: 'Início', href: '/comunidade', icon: Home },
  { label: 'Cientista', short: 'Cientista', href: '/comunidade/cientista', icon: FlaskConical },
  { label: 'Pesquisas', short: 'Pesquisas', href: '/comunidade/pesquisas', icon: BookOpen, also: ['/comunidade/experimentos'] },
  { label: 'Future Thinking', short: 'Futuro', href: '/comunidade/future-thinking', icon: Telescope },
  { label: 'Trilha de Experimentação', short: 'Trilha', href: '/comunidade/trilha', icon: Route, also: ['/comunidade/como-experimentar', '/comunidade/framework-hipoteses'] },
]

/** Atalhos pessoais da Comunidade (Notificações é um botão à parte, que abre o painel). */
export const COMMUNITY_SHORTCUTS: NavItem[] = [
  { label: 'Pessoas', href: '/comunidade/pessoas', icon: Users },
  { label: 'Mensagens', href: '/comunidade/mensagens', icon: MessageCircle, badge: 'mensagens' },
  { label: 'Salvos e seguidos', href: '/comunidade/salvos', icon: Bookmark },
]

/** Visões executivas e administração, por perfil. */
export const PORTAL_GROUPS: NavGroup[] = [
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
      { label: 'Semanal', href: '/semanal', icon: CalendarCheck, roles: ADMIN },
    ],
  },
  {
    label: 'Análises',
    items: [
      { label: 'Acervo de pesquisas', href: '/pesquisas', icon: Library, roles: ADMIN },
    ],
  },
  {
    label: 'Administração',
    items: [
      { label: 'Usuários', href: '/admin/users', icon: UserCog, roles: ADMIN, badge: 'pendentes' },
      { label: 'Stories', href: '/admin/stories', icon: Images, roles: ADMIN },
    ],
  },
]

export function isNavActive(path: string, item: NavItem): boolean {
  if (item.href === '/comunidade') return path === '/comunidade' || path.startsWith('/comunidade/post')
  return [item.href, ...(item.also ?? [])].some(h => path === h || path.startsWith(`${h}/`))
}

/** Grupos executivos e de administração visíveis para o perfil (nenhum enquanto o perfil não carrega). */
export function portalGroupsFor(role: AuthSessionRole | null | undefined): NavGroup[] {
  if (!role) return []
  return PORTAL_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !i.roles || i.roles.includes(role)) }))
    .filter(g => g.items.length > 0)
}
