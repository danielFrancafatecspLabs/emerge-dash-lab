import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthSession } from '@/lib/auth-session'
import { loadUsers } from '@/lib/users'

export async function GET(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  if (!session) {
    return NextResponse.json({ username: null }, { status: 401 })
  }

  const users = loadUsers()
  const user = users.find(u => u.username === session.username)

  return NextResponse.json({
    username: session.username,
    role: session.role,
    nome: user?.nome || session.username,
    laboratorio: user?.laboratorio || '',
    avatar: user?.avatar || '',
  })
}