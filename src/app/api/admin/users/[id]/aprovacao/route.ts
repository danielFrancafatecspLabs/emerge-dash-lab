import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { AUTH_ROLES, type AuthSessionRole } from '@/lib/auth/session'
import { decideSignup, toPublic } from '@/lib/auth/users'

/** Aprova (com o perfil escolhido) ou recusa um pedido de cadastro feito pela tela de login. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const body = await request.json().catch(() => null) as { decisao?: unknown; role?: unknown } | null
  const decisao = body?.decisao
  if (decisao !== 'aprovar' && decisao !== 'recusar') return NextResponse.json({ error: 'Decisão inválida' }, { status: 400 })
  const role = body?.role ?? 'community'
  if (!(AUTH_ROLES as readonly unknown[]).includes(role)) return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })

  const resultado = decideSignup(params.id, decisao, role as AuthSessionRole)
  if (resultado === 'nao-encontrado') return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  if (resultado === 'removido') return NextResponse.json({ ok: true })
  return NextResponse.json(toPublic(resultado))
}
