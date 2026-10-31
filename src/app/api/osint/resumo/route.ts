import { NextResponse } from 'next/server'
import { resumoDoOsint } from '@/lib/community/sinais-osint'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Prévia do Radar OSINT para a home da Comunidade (totais, pontos do mapa e sinais recentes). */
export function GET() {
  if (!process.env.SIGNAL_VAULT_PATH) return NextResponse.json({ error: 'Dados de sinais indisponíveis' }, { status: 503 })
  return NextResponse.json(resumoDoOsint())
}
