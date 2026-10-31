import { NextRequest, NextResponse } from 'next/server'
import { emailDe, parseAccountChanges, updateAccount } from '@/lib/auth/account'
import { getSessionUser } from '@/lib/auth/request'
import { FailureLimiter } from '@/lib/auth/rate-limit'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

// Erros de "senha atual" por conta: 5 a cada 15 minutos, contra adivinhação com a sessão aberta.
const limiteSenha = new FailureLimiter(5, 15 * 60 * 1000)

/** Meu perfil: nome, e-mail, área, laboratório e troca de senha (com a senha atual). */
export async function PATCH(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member?.user) return unauthorized()
  let body: unknown
  try { body = await request.json() } catch { return badRequest('Requisição inválida') }
  const parsed = parseAccountChanges(body)
  if ('error' in parsed) return badRequest(parsed.error)

  if (parsed.value.senha) {
    const espera = limiteSenha.bloqueadoPor(member.username)
    if (espera) return NextResponse.json({ error: `Muitas tentativas. Tente de novo em ${Math.ceil(espera / 60)} min.` }, { status: 429 })
  }
  const result = updateAccount(member.username, parsed.value)
  if ('error' in result) {
    if (result.status === 403) limiteSenha.registrarFalha(member.username)
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  if (parsed.value.senha) limiteSenha.limparChave(member.username)
  const u = result.user
  return NextResponse.json({ nome: u.nome, email: emailDe(u), area: u.area ?? '', laboratorio: u.laboratorio, avatar: u.avatar })
}
