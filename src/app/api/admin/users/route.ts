import { NextRequest, NextResponse } from 'next/server'
import { loadUsers, saveUsers, hashPassword, toPublic, isAdmin } from '@/lib/users'
import { randomUUID } from 'crypto'

function checkAdmin(request: NextRequest): boolean {
  const token = request.cookies.get('auth_token')?.value
  const secret = process.env.AUTH_SECRET
  if (!secret || token !== secret) return false
  const username = request.cookies.get('username')?.value
  if (!username) return false
  return isAdmin(username)
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const users = loadUsers()
  return NextResponse.json(users.map(toPublic))
}

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  try {
    const { username, password, role } = await request.json()
    if (!username || !password || !['admin', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const users = loadUsers()
    if (users.find(u => u.username === username)) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
    }

    const newUser = {
      id: randomUUID(),
      username,
      passwordHash: hashPassword(password),
      role: role as 'admin' | 'viewer',
      createdAt: new Date().toISOString(),
      active: true,
    }
    users.push(newUser)
    saveUsers(users)
    return NextResponse.json(toPublic(newUser), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}
