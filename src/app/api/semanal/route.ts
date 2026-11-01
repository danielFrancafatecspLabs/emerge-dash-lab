import { NextResponse } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    return NextResponse.json(await carregarSemanal())
  } catch (err) {
    console.error('[semanal] Jira indisponível:', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
}
