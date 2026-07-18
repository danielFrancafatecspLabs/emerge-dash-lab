'use client'
import { Target, BarChart2, Activity, Users, FileText } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { label: 'Estratégia', icon: Target,   href: '/estrategia',    inactive: false },
  { label: 'Portfólio',  icon: BarChart2, href: '/portfolio',     inactive: false },
  { label: 'Report',     icon: FileText, href: '/report',         inactive: false },
  { label: 'Monitoram.', icon: Activity,  href: '/monitoramento', inactive: false },
  { label: 'Governança', icon: Users,     href: '/governanca',    inactive: true  },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside
      className="flex flex-col items-center pt-4 pb-6 gap-1"
      style={{ width: 72, background: '#8B0000', minHeight: '100%' }}
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
    </aside>
  )
}
