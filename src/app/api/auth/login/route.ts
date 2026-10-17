import { NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth/users'
import { createAuthSession } from '@/lib/auth/session'
import { FailureLimiter } from '@/lib/auth/rate-limit'

// 8 tentativas erradas por IP + usuário a cada 15 minutos.
const limiter = new FailureLimiter(8, 15 * 60 * 1000)

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

export async function POST(request: Request) {
  let username = ''
  let password = ''
  try {
    const body = await request.json()
    username = typeof body.username === 'string' ? body.username.trim() : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
  if (!username || !password || username.length > 200 || password.length > 500) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const chave = `${clientIp(request)}|${username.toLowerCase()}`
  const espera = limiter.bloqueadoPor(chave)
  if (espera > 0) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(espera / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(espera) } },
    )
  }

  const user = verifyCredentials(username, password)
  if (!user) {
    limiter.registrarFalha(chave)
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }
  limiter.limparChave(chave)

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    console.error('Authentication unavailable: AUTH_SECRET is not configured')
    return NextResponse.json({ error: 'Autenticação indisponível' }, { status: 503 })
  }

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
  const response = NextResponse.json({ ok: true, role: user.role, username: user.username })
  response.cookies.set('auth_session', await createAuthSession(user, secret), cookieOpts)
  response.cookies.set('username', user.username, cookieOpts)
  response.cookies.set('user_role', user.role, cookieOpts)
  return response
}
