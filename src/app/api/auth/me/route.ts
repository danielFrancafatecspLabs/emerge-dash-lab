import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'

export async function GET(request: NextRequest) {
  const me = await getSessionUser(request)
  if (!me) return NextResponse.json({ username: null }, { status: 401 })
  return NextResponse.json({
    username: me.username,
    role: me.role,
    nome: me.user?.nome || me.username,
    laboratorio: me.user?.laboratorio || '',
    avatar: me.user?.avatar || '',
  })
}
