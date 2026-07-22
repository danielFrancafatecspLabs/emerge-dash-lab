import { NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/users'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const user = verifyCredentials(username, password)

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
    }

    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
    const response = NextResponse.json({ ok: true, role: user.role })
    response.cookies.set('auth_token', process.env.AUTH_SECRET!, cookieOpts)
    response.cookies.set('username', user.username, cookieOpts)
    return response
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}
