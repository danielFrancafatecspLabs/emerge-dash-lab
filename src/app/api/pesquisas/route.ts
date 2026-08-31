import { NextResponse } from 'next/server'
import {
  loadResearchDocument,
  loadResearchVault,
  ResearchDocumentNotFoundError,
  ResearchVaultUnavailableError,
} from '@/lib/research-vault'

export const runtime = 'nodejs'

const UNAVAILABLE_MESSAGE = 'Acervo de pesquisas temporariamente indisponível'

export async function GET(request: Request) {
  const root = process.env.RESEARCH_VAULT_PATH
  if (!root) {
    console.error('Research vault unavailable: RESEARCH_VAULT_PATH is not configured')
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const hasFileParameter = searchParams.has('file')
  const requestedFile = searchParams.get('file')

  if (hasFileParameter && !requestedFile) {
    return NextResponse.json({ error: 'Arquivo de pesquisa inválido' }, { status: 400 })
  }

  try {
    const vault = await loadResearchVault(root)
    if (!requestedFile) return NextResponse.json(vault)

    const document = await loadResearchDocument(root, vault, requestedFile)
    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof ResearchDocumentNotFoundError) {
      return NextResponse.json({ error: 'Arquivo de pesquisa não encontrado' }, { status: 404 })
    }

    if (error instanceof ResearchVaultUnavailableError) {
      console.error('Research vault unavailable:', error)
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 })
    }

    console.error('Unexpected research API error:', error)
    return NextResponse.json({ error: 'Falha ao carregar pesquisas' }, { status: 500 })
  }
}
