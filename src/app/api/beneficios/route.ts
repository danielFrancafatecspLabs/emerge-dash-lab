import { NextRequest, NextResponse } from 'next/server'
import { upsertValidacao, loadValidacoes, type StatusValidacao } from '@/lib/beneficios'
import { loadUsers } from '@/lib/users'

const STATUS_VALUES: StatusValidacao[] = ['nao_validado', 'em_validacao', 'validado', 'rejeitado']

function getAuthedUser(request: NextRequest): { username: string; role: string } | null {
  const token = request.cookies.get('auth_token')?.value
  const secret = process.env.AUTH_SECRET
  if (!secret || token !== secret) return null
  const username = request.cookies.get('username')?.value
  const role = request.cookies.get('user_role')?.value
  if (!username || !role) return null
  return { username, role }
}

// Só financeiro e admin podem gravar validações — os demais perfis (ex.: executivo)
// enxergam a página em modo leitura.
function canEdit(role: string): boolean {
  return role === 'admin' || role === 'financeiro'
}

export async function GET(request: NextRequest) {
  const user = getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(loadValidacoes())
}

export async function PATCH(request: NextRequest) {
  const user = getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!canEdit(user.role)) {
    return NextResponse.json({ error: 'Apenas o time financeiro pode editar validações.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { epicKey, statusValidacao, beneficioValidado, observacoes } = body

    if (!epicKey || typeof epicKey !== 'string') {
      return NextResponse.json({ error: 'epicKey é obrigatório' }, { status: 400 })
    }
    if (statusValidacao !== undefined && !STATUS_VALUES.includes(statusValidacao)) {
      return NextResponse.json({ error: 'statusValidacao inválido' }, { status: 400 })
    }
    if (beneficioValidado !== undefined && beneficioValidado !== null && typeof beneficioValidado !== 'number') {
      return NextResponse.json({ error: 'beneficioValidado precisa ser número ou null' }, { status: 400 })
    }
    if (observacoes !== undefined && observacoes !== null && typeof observacoes !== 'string') {
      return NextResponse.json({ error: 'observacoes precisa ser texto' }, { status: 400 })
    }

    // Nome de exibição do autor (fallback pro username caso não exista cadastro)
    const users = loadUsers()
    const autor = users.find(u => u.username === user.username)?.username ?? user.username

    const atualizado = upsertValidacao(epicKey, { statusValidacao, beneficioValidado, observacoes }, autor)
    return NextResponse.json(atualizado)
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}
