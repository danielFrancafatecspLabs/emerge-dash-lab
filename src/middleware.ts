import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']
const BASE = '/jira'

export function middleware(request: NextRequest) {
  // TODO: REATIVAR AUTENTICAÇÃO ANTES DE SUBIR PARA PRODUÇÃO
  // Desabilitado temporariamente para desenvolvimento local
  return NextResponse.next()

  /*
  const { pathname } = request.nextUrl
  const stripped = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname

  // Ignorar assets estáticos do Next.js
  if (stripped.startsWith('/_next/') || stripped === '/favicon.ico') {
    return NextResponse.next()
  }

  // Rotas públicas (login + logout)
  const isPublic = PUBLIC_PATHS.some(p => stripped.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  const secret = process.env.AUTH_SECRET
  if (secret && token === secret) return NextResponse.next()

  // Para rotas de API, retorna 401 JSON em vez de redirecionar para HTML
  if (stripped.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.redirect(new URL(`${BASE}/login`, request.url))
  */
}

export const config = {
  // Com basePath=/jira, o matcher é relativo ao basePath.
  // '/(.*)'  compila para /jira/(.*) — cobre /jira, /jira/, /jira/report, etc.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
