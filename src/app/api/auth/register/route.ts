import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { parseSignup, requestSignup } from '@/lib/auth/users'
import { FailureLimiter } from '@/lib/auth/rate-limit'
import { clientIp } from '@/lib/auth/request'

// Rota pública: no máximo 5 pedidos de cadastro por IP a cada hora.
const limiter = new FailureLimiter(5, 60 * 60 * 1000)

const RECEBIDO = 'Pedido recebido. Você poderá entrar assim que um administrador aprovar seu cadastro.'

export async function POST(request: Request) {
  const ip = clientIp(request)
  const espera = limiter.bloqueadoPor(ip)
  if (espera > 0) {
    return NextResponse.json(
      { error: `Muitos pedidos de cadastro. Tente novamente em ${Math.ceil(espera / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(espera) } },
    )
  }

  const parsed = parseSignup(await request.json().catch(() => null))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  limiter.registrarFalha(ip)

  const resultado = requestSignup(parsed.value, randomUUID())
  if (resultado === 'lotado') {
    return NextResponse.json({ error: 'Os cadastros estão temporariamente fechados. Fale com a equipe beOn Labs.' }, { status: 503 })
  }
  // E-mail já cadastrado recebe a mesma resposta, para não revelar quem tem conta.
  return NextResponse.json({ ok: true, message: RECEBIDO }, { status: 202 })
}
