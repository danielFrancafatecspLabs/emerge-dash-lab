import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthSession } from '@/lib/auth/session'
import { decideAccess } from '@/lib/auth/access-policy'

// Aplica a política de acesso (src/lib/auth/access-policy.ts) a toda requisição.
const BASE = '/jira'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname
  if (path.startsWith('/_next/') || path === '/favicon.ico') return NextResponse.next()

  const session = await verifyAuthSession(request.cookies.get('auth_session')?.value, process.env.AUTH_SECRET)
  const decision = decideAccess(path, request.method, session)
  const isApi = path.startsWith('/api/')

  switch (decision.type) {
    case 'allow':
      return NextResponse.next()
    case 'unauthenticated':
      return isApi
        ? NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        : NextResponse.redirect(new URL(`${BASE}/login`, request.url))
    case 'forbidden':
      return isApi
        ? NextResponse.json({ error: decision.message }, { status: 403 })
        : NextResponse.redirect(new URL(`${BASE}${decision.redirectTo}`, request.url))
  }
}

export const config = {
  // Com basePath=/jira, o matcher é relativo ao basePath.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
