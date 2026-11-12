import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { relatorioAtual } from '@/lib/analytics/agente'
import { estadoDaLeitura } from '@/lib/analytics/leitura-ia-servidor'

// Relatório do Auditor de Analytics (só admin): as telas conferidas entre si, com a explicação de cada divergência, os
// alertas de cadastro no Jira e a leitura da IA do dia (gerada uma vez por dia; abrir a página não chama a IA).
// `?agora=1` audita de novo em vez de devolver o relatório dos últimos 10 minutos.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const rel = await relatorioAtual(request.nextUrl.searchParams.get('agora') === '1')
    return NextResponse.json({ ...rel, ia: estadoDaLeitura() })
  } catch (err) {
    return NextResponse.json({ error: 'auditor-indisponivel', detalhe: String(err).slice(0, 300) }, { status: 503 })
  }
}
