import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { ehChaveDeEpic, salvarLinks, validarLinks } from '@/lib/community/experimentos-links'
import { badRequest } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

/** Admins cadastram (ou removem, mandando vazio) os links da ficha e do relatório de um Experimento. */
export async function PUT(request: NextRequest, { params }: { params: { chave: string } }) {
  const admin = await getAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Só admins podem editar os links da ficha e do relatório.' }, { status: 403 })
  const chave = decodeURIComponent(params.chave)
  if (!ehChaveDeEpic(chave)) return badRequest('Experimento inválido')
  const v = validarLinks(await request.json().catch(() => null))
  if ('erro' in v) return badRequest(v.erro)
  return NextResponse.json(salvarLinks(chave, v, admin.user?.nome || admin.username))
}
