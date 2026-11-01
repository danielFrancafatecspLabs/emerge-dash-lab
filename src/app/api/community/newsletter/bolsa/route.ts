import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { painelDaBolsa } from '@/lib/newsletter/bolsa'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Cotações de tecnologia e a régua do dia para o beOn Radar (renovadas no servidor a cada minuto). */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  try {
    return NextResponse.json(await painelDaBolsa())
  } catch (err) {
    console.error('[bolsa]', err)
    return NextResponse.json({ error: 'As cotações não estão disponíveis agora.' }, { status: 503 })
  }
}
