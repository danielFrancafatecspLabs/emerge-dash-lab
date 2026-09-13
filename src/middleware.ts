import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthSession } from '@/lib/auth-session'

const PUBLIC_PATHS = ['/login', '/bem-vindo', '/api/auth']
const BASE = '/jira'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const stripped = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname

  // Ignorar assets estáticos do Next.js
  if (stripped.startsWith('/_next/') || stripped === '/favicon.ico') {
    return NextResponse.next()
  }

  // Rotas públicas (login + logout)
  const isPublic = PUBLIC_PATHS.some(p => stripped.startsWith(p))
  if (isPublic) return NextResponse.next()

  const secret = process.env.AUTH_SECRET
  const session = await verifyAuthSession(request.cookies.get('auth_session')?.value, secret)
  if (session) {
    // Proteger rotas que só admin pode acessar
    const ADMIN_ONLY = ['/admin/users', '/api/admin', '/beneficios', '/pesquisas', '/api/pesquisas', '/report/mbr', '/weekly', '/api/weekly']
    const isAdminOnly = ADMIN_ONLY.some(p => stripped.startsWith(p))
    if (isAdminOnly) {
      if (session?.role !== 'admin') {
        if (stripped.startsWith('/api/')) {
          return NextResponse.json({ error: 'Acesso restrito a admin' }, { status: 403 })
        }
        return NextResponse.redirect(new URL(`${BASE}/estrategia`, request.url))
      }
    }
    return NextResponse.next()
  }

  // Para rotas de API, retorna 401 JSON em vez de redirecionar para HTML
  if (stripped.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.redirect(new URL(`${BASE}/login`, request.url))
}

export const config = {
  // Com basePath=/jira, o matcher é relativo ao basePath.
  // '/(.*)'  compila para /jira/(.*) — cobre /jira, /jira/, /jira/report, etc.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
