import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { parseRepoInput } from '@/lib/community/open-source'
import { editarRepo, removerRepo } from '@/lib/community/open-source-store'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  let body: unknown
  try { body = await request.json() } catch { return badRequest('Requisição inválida') }
  const parsed = parseRepoInput(body)
  if ('error' in parsed) return badRequest(parsed.error)
  const repo = editarRepo(params.id, parsed.value, { username: member.username, nome: member.user?.nome || member.username })
  if (repo === 'nao-encontrado') return NextResponse.json({ error: 'Repositório não encontrado' }, { status: 404 })
  if (repo === 'duplicado') return NextResponse.json({ error: 'Outro card já usa este repositório' }, { status: 409 })
  return NextResponse.json(repo)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const r = removerRepo(params.id, { username: member.username, admin: member.role === 'admin' })
  if (r === 'nao-encontrado') return NextResponse.json({ error: 'Repositório não encontrado' }, { status: 404 })
  if (r === 'proibido') return NextResponse.json({ error: 'Só quem publicou ou um admin pode remover' }, { status: 403 })
  return NextResponse.json({ ok: true })
}
