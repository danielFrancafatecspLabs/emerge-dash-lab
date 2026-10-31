import { NextRequest, NextResponse } from 'next/server'
import { decodificarFoto, definirAvatar, removerFoto, salvarFoto } from '@/lib/auth/account'
import { getSessionUser } from '@/lib/auth/request'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

/** Envia a foto de perfil (data URL já recortada no navegador). */
export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member?.user) return unauthorized()
  let body: { imagem?: unknown }
  try { body = await request.json() } catch { return badRequest('Requisição inválida') }
  const foto = decodificarFoto(body.imagem)
  if ('error' in foto) return badRequest(foto.error)
  const avatar = salvarFoto(member.user, foto)
  definirAvatar(member.username, avatar)
  return NextResponse.json({ avatar })
}

/** Remove a foto de perfil. */
export async function DELETE(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member?.user) return unauthorized()
  removerFoto(member.user)
  definirAvatar(member.username, '')
  return NextResponse.json({ avatar: '' })
}
