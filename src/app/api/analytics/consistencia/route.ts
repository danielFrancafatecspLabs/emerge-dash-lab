import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { relatorioAtual } from '@/lib/analytics/agente'

// Relatório do agente de analytics (só admin): as visões conferidas entre si e os alertas de qualidade dos dados.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    return NextResponse.json(await relatorioAtual())
  } catch (err) {
    return NextResponse.json({ error: 'agente-indisponivel', detalhe: String(err).slice(0, 300) }, { status: 503 })
  }
}
