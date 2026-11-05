import { NextResponse } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'
import { talvezRodarAgenteAnalitico } from '@/lib/analytics/agente'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const semanal = await carregarSemanal()
    talvezRodarAgenteAnalitico()
    return NextResponse.json(semanal)
  } catch (err) {
    console.error('[semanal] Jira indisponível:', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
}
