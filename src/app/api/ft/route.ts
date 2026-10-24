import { NextResponse } from 'next/server'
import {
  loadSignalDocument,
  loadSignalVault,
  SignalDocumentNotFoundError,
  SignalVaultUnavailableError,
} from '@/lib/signal-vault'

export const runtime = 'nodejs'

const UNAVAILABLE_MESSAGE = 'Acervo de sinais temporariamente indisponível'

export async function GET(request: Request) {
  const root = process.env.SIGNAL_VAULT_PATH
  if (!root) {
    console.error('Signal vault unavailable: SIGNAL_VAULT_PATH is not configured')
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const requestedFile = searchParams.get('file')
  if (searchParams.has('file') && !requestedFile) {
    return NextResponse.json({ error: 'Arquivo de sinal inválido' }, { status: 400 })
  }

  try {
    const vault = await loadSignalVault(root)
    if (!requestedFile) return NextResponse.json(vault)
    return NextResponse.json(await loadSignalDocument(vault, requestedFile))
  } catch (error) {
    if (error instanceof SignalDocumentNotFoundError) {
      return NextResponse.json({ error: 'Arquivo de sinal não encontrado' }, { status: 404 })
    }
    if (error instanceof SignalVaultUnavailableError) {
      console.error('Signal vault unavailable:', error)
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 })
    }
    console.error('Unexpected signal API error:', error)
    return NextResponse.json({ error: 'Falha ao carregar sinais' }, { status: 500 })
  }
}
