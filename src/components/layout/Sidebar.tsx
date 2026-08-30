'use client'
import { Target, BarChart2, Activity, Users, FileText, Bot, Flag, ListOrdered, Settings, PanelRightOpen, HeartHandshake, Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV_ALL = [
  { label: 'OKRs',      icon: Flag,     href: '/okrs',          inactive: false, roles: ['admin'] },
  { label: 'Estratégia', icon: Target,   href: '/estrategia',    inactive: false, roles: ['admin', 'executivo'] },
  { label: 'Benefícios', icon: Wallet,   href: '/beneficios',    inactive: false, roles: ['admin', 'executivo', 'financeiro'] },
  { label: 'Operacional',icon: Activity,  href: '/operacional',   inactive: false, roles: ['admin'] },
  { label: 'Portfólio',  icon: BarChart2, href: '/portfolio',     inactive: false, roles: ['admin'] },
  { label: 'Priorização',icon: ListOrdered,href: '/priorizacao',  inactive: false, roles: ['admin'] },
  { label: 'Report',     icon: FileText, href: '/report',         inactive: false, roles: ['admin'] },
  { label: 'Monitoram.', icon: Activity,  href: '/monitoramento', inactive: false, roles: ['admin'] },
  { label: 'Cientista',  icon: Bot,       href: '/cientista',     inactive: false, roles: ['admin'] },
  { label: 'Comunidade', icon: HeartHandshake, href: '/comunidade', inactive: false, roles: ['admin'] },
  { label: 'Governança', icon: Users,     href: '/governanca',    inactive: true,  roles: ['admin'] },
  { label: 'Admin',      icon: Settings,  href: '/admin/users',   inactive: false, roles: ['admin'] },
]

export default function Sidebar() {
  const path = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user_role')
    setRole(stored)
  }, [])

  const NAV = NAV_ALL.filter(item => {
    if (!role) return true // fallback: mostra tudo até carregar
    return item.roles.includes(role)
  })

  return (
    <aside
      className="flex flex-col items-center pt-4 pb-6 gap-1"
      style={{ width: 72, background: '#8B0000', minHeight: '100dvh' }}
    >
      {NAV.map(({ label, icon: Icon, href, inactive }) => {
        const active = !inactive && path.startsWith(href)

        if (inactive) {
          return (
            <div
              key={href}
              className="flex flex-col items-center gap-1 py-3 px-1 w-full cursor-not-allowed"
              title="Em breve"
            >
              <Icon size={20} color="rgba(255,255,255,0.3)" strokeWidth={1.8} />
              <span className="text-center leading-tight" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                {label}
              </span>
            </div>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-3 px-1 w-full rounded-none transition-colors
              ${active ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <Icon size={20} color="white" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-white text-center leading-tight"
              style={{ fontSize: 9, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </Link>
        )
      })}

      {/* Botão Modo Slide — só aparece na página de Estratégia */}
      {path.startsWith('/estrategia') && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-slide-mode'))}
          className="flex flex-col items-center gap-1 py-3 px-1 w-full rounded-none hover:bg-white/10 transition-colors"
          title="Expandir dashboard (ocultar menu)"
        >
          <PanelRightOpen size={20} color="white" strokeWidth={1.8} />
          <span className="text-white text-center leading-tight" style={{ fontSize: 9 }}>
            Slide
          </span>
        </button>
      )}
    </aside>
  )
}
