import { NextResponse } from 'next/server'
import { lerArquivoDoApp } from '@/lib/osint/app-files'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** App OSINT embutido no Radar OSINT (iframe em /osint). Os cabeçalhos de frame vêm do next.config.mjs. */
export async function GET(_request: Request, { params }: { params: { caminho?: string[] } }) {
  const arquivo = lerArquivoDoApp(params.caminho ?? [])
  if (!arquivo) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  return new NextResponse(new Uint8Array(arquivo.corpo), {
    headers: {
      'Content-Type': arquivo.tipo,
      'Cache-Control': arquivo.imutavel ? 'public, max-age=31536000, immutable' : 'no-cache',
    },
  })
}
