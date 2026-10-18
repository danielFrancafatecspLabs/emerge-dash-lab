import { NextResponse, type NextRequest } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'
import { montarComiteResumo } from '@/lib/comite-resumo'
import { gerarPptxComite } from '@/lib/comite-pptx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Endereço público do portal, para os links DETALHES do PPTX abrirem a aba Semanal. */
function portalBase(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const origem = proto && host ? `${proto}://${host}` : request.nextUrl.origin
  return `${origem}/jira`
}

/** PPTX editável do slide, com o mesmo design do deck do Comitê e os dados atuais do Jira. */
export async function GET(request: NextRequest) {
  const semanal = await carregarSemanal()
  const pptx = await gerarPptxComite(montarComiteResumo(semanal.resumo, semanal.geradoEm), portalBase(request))
  const dia = semanal.geradoEm.slice(0, 10)
  return new NextResponse(new Uint8Array(pptx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="beon-labs-visao-geral-${dia}${semanal.isSample ? '-exemplo' : ''}.pptx"`,
      'Cache-Control': 'no-store',
    },
  })
}
