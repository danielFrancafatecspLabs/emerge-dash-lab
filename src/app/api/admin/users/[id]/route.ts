import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { hashPassword, loadUsers, parseUserChanges, saveUsers, toPublic } from '@/lib/auth/users'

const forbidden = () => NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 })

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin(request)
  if (!admin) return forbidden()
  const parsed = parseUserChanges(await request.json().catch(() => null), false)
  if ('error' in parsed) return badRequest(parsed.error)

  const users = loadUsers()
  const user = users.find(u => u.id === params.id)
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { password, ...changes } = parsed.value
  // Evita que um admin se tranque para fora.
  if (user.username === admin.username && (changes.active === false || (changes.role && changes.role !== 'admin'))) {
    return badRequest('Você não pode desativar nem rebaixar o próprio acesso')
  }
  if (changes.username && changes.username !== user.username && users.some(u => u.username === changes.username)) {
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
  }

  Object.assign(user, changes)
  // Ativar pelo Admin também conclui um pedido de cadastro pendente.
  if (changes.active) delete user.status
  if (password) user.passwordHash = hashPassword(password)
  saveUsers(users)
  return NextResponse.json(toPublic(user))
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin(request)
  if (!admin) return forbidden()
  const users = loadUsers()
  const user = users.find(u => u.id === params.id)
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (user.username === admin.username) return badRequest('Você não pode excluir o próprio acesso')
  saveUsers(users.filter(u => u.id !== params.id))
  return NextResponse.json({ ok: true })
}
