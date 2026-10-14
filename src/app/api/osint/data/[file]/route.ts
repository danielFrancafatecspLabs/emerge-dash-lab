import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// O app OSINT consome /data/*; aqui o conteúdo vem do _export do vault de sinais.
const ALLOWED_FILES: Record<string, string> = {
  'signals.geojson': 'application/geo+json',
  'signals.map.geojson': 'application/geo+json',
  'graph.json': 'application/json',
}

export async function GET(_request: Request, { params }: { params: { file: string } }) {
  const contentType = Object.prototype.hasOwnProperty.call(ALLOWED_FILES, params.file)
    ? ALLOWED_FILES[params.file]
    : null
  if (!contentType) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

  const root = process.env.SIGNAL_VAULT_PATH
  if (!root) {
    console.error('OSINT data unavailable: SIGNAL_VAULT_PATH is not configured')
    return NextResponse.json({ error: 'Dados de sinais indisponíveis' }, { status: 503 })
  }

  try {
    const body = await readFile(path.join(root, '_export', params.file), 'utf8')
    return new NextResponse(body, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }
    console.error('OSINT data read failed:', error)
    return NextResponse.json({ error: 'Dados de sinais indisponíveis' }, { status: 503 })
  }
}
