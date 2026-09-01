import { NextRequest, NextResponse } from 'next/server'
import { loadUsers, saveUsers, hashPassword, toPublic, isAdmin } from '@/lib/users'
import { verifyAuthSession } from '@/lib/auth-session'

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  return session?.role === 'admin' && isAdmin(session.username)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await request.json()
    const users = loadUsers()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (body.username !== undefined) users[idx].username = body.username
    if (body.role !== undefined && ['admin', 'viewer', 'financeiro'].includes(body.role)) users[idx].role = body.role
    if (body.active !== undefined) users[idx].active = Boolean(body.active)
    if (body.password) users[idx].passwordHash = hashPassword(body.password)

    saveUsers(users)
    return NextResponse.json(toPublic(users[idx]))
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const { id } = await params
  const users = loadUsers()
  const filtered = users.filter(u => u.id !== id)
  if (filtered.length === users.length) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }
  saveUsers(filtered)
  return NextResponse.json({ ok: true })
}
