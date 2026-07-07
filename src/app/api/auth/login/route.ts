import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const response = NextResponse.json({ ok: true })
      response.cookies.set('auth_token', process.env.AUTH_SECRET!, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}
