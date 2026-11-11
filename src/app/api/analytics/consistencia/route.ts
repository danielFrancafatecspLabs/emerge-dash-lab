import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { relatorioAtual } from '@/lib/analytics/agente'

// Relatório do Auditor de Analytics (só admin): as telas conferidas entre si, com a explicação de cada divergência, e
// os alertas de cadastro no Jira. `?agora=1` audita de novo em vez de devolver o relatório dos últimos 10 minutos.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    return NextResponse.json(await relatorioAtual(request.nextUrl.searchParams.get('agora') === '1'))
  } catch (err) {
    return NextResponse.json({ error: 'auditor-indisponivel', detalhe: String(err).slice(0, 300) }, { status: 503 })
  }
}
