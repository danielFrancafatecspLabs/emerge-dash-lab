import { NextResponse } from 'next/server'
import { checkLogin } from '@/lib/auth/users'
import { createAuthSession } from '@/lib/auth/session'
import { FailureLimiter } from '@/lib/auth/rate-limit'
import { clientIp } from '@/lib/auth/request'

// 8 tentativas erradas por IP + usuário a cada 15 minutos.
const limiter = new FailureLimiter(8, 15 * 60 * 1000)

function isHttps(request: Request): boolean {
  return new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https'
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

  const resultado = checkLogin(username, password)
  if (!resultado) {
    limiter.registrarFalha(chave)
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }
  limiter.limparChave(chave)
  if ('pendente' in resultado) {
    return NextResponse.json(
      { error: 'Seu cadastro ainda está em análise. Você poderá entrar assim que um administrador aprovar.', pendente: true },
      { status: 403 },
    )
  }
  const { user } = resultado

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    console.error('Authentication unavailable: AUTH_SECRET is not configured')
    return NextResponse.json({ error: 'Autenticação indisponível' }, { status: 503 })
  }

  const cookieOpts = {
    httpOnly: true,
    // Secure só quando a requisição chegou por HTTPS: num servidor em HTTP, o navegador descartaria o cookie.
    secure: isHttps(request),
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
  const response = NextResponse.json({ ok: true, role: user.role, username: user.username })
  response.cookies.set('auth_session', await createAuthSession(user, secret), cookieOpts)
  response.cookies.set('username', user.username, cookieOpts)
  response.cookies.set('user_role', user.role, cookieOpts)
  // Leitura do dia do Jira: se ainda não aconteceu hoje, quem entra primeiro dispara (sem esperar por ela); quem vier
  // depois usa a mesma leitura guardada. Ver POLITICA_DO_JIRA em lib/jira.ts.
  import('@/lib/jira').then(m => m.fetchDashboardRaw()).catch(err => console.warn('[jira] leitura do dia não concluída:', String(err)))
  return response
}
