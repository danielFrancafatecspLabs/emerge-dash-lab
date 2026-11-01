import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { chavesVapid, desinscrever, inscrever, inscricoesDe, validarInscricao } from '@/lib/community/push'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

/** Chave pública para o navegador se inscrever e quantos navegadores da pessoa já estão inscritos. */
export async function GET(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  return NextResponse.json({ publicKey: chavesVapid().publicKey, inscricoes: inscricoesDe(member.username).length })
}

export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const inscricao = validarInscricao(await request.json().catch(() => null))
  if (!inscricao) return badRequest('Inscrição de push inválida')
  inscrever(member.username, inscricao)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null
  if (typeof body?.endpoint !== 'string') return badRequest('Informe o endpoint')
  desinscrever(member.username, body.endpoint)
  return NextResponse.json({ ok: true })
}
