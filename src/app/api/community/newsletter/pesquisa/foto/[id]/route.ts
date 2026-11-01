import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { fotoGuardada } from '@/lib/newsletter/pesquisa-ia-fontes'

export const dynamic = 'force-dynamic'

/** Foto do pesquisador, baixada da Wikipedia pelo servidor e guardada em disco. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getSessionUser(request)) return unauthorized()
  const foto = await fotoGuardada(params.id).catch(() => null)
  if (!foto) return new NextResponse(null, { status: 404 })
  return new NextResponse(new Uint8Array(foto.bytes), {
    headers: {
      'Content-Type': foto.tipo,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      // SVG servido como imagem não executa nada, mas por garantia nenhum script roda neste endereço.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  })
}
