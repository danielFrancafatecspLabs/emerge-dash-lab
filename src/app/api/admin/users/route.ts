import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAdmin } from '@/lib/auth/request'
import { hashPassword, loadUsers, parseUserChanges, saveUsers, toPublic, type User } from '@/lib/auth/users'

const forbidden = () => NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return forbidden()
  return NextResponse.json(loadUsers().map(toPublic))
}

export async function POST(request: NextRequest) {
  if (!await getAdmin(request)) return forbidden()
  const parsed = parseUserChanges(await request.json().catch(() => null), true)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { username, password, role, nome = '', laboratorio = '', avatar = '' } = parsed.value

  const users = loadUsers()
  if (users.some(u => u.username === username)) return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })

  const user: User = {
    id: randomUUID(), username: username!, passwordHash: hashPassword(password!), role: role!,
    nome, laboratorio, avatar, createdAt: new Date().toISOString(), active: true,
  }
  saveUsers([...users, user])
  return NextResponse.json(toPublic(user), { status: 201 })
}
