import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']
const BASE = '/jira'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const stripped = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname

  // Rotas públicas (login + logout)
  const isPublic = PUBLIC_PATHS.some(p => stripped.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  const secret = process.env.AUTH_SECRET
  if (secret && token === secret) return NextResponse.next()

  return NextResponse.redirect(new URL(`${BASE}/login`, request.url))
}

export const config = {
  matcher: ['/jira', '/jira/((?!_next/static|_next/image|favicon.ico).*)'],
}
