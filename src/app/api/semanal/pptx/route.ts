import { NextResponse } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'
import { gerarPptxSemanal } from '@/lib/semanal-pptx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Deck da Semanal em PPTX editável, com o mesmo design da aba e os dados atuais do Jira. */
export async function GET() {
  let data
  try { data = await carregarSemanal() } catch (err) {
    console.error('[semanal pptx] Jira indisponível:', err)
    return NextResponse.json({ error: 'jira-indisponivel', detalhe: String(err) }, { status: 503 })
  }
  const pptx = await gerarPptxSemanal(data)
  const dia = data.geradoEm.slice(0, 10)
  return new NextResponse(new Uint8Array(pptx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="report-beon-labs-${dia}.pptx"`,
      'Cache-Control': 'no-store',
    },
  })
}
