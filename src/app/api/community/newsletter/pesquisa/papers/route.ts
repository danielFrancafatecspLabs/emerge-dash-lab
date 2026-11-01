import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { unauthorized } from '@/lib/community/server'
import { ehArea } from '@/lib/newsletter/pesquisa-ia'
import { papersDaArea } from '@/lib/newsletter/pesquisa-ia-fontes'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Os papers mais recentes do arXiv numa área de tecnologia emergente (?area=quantica). */
export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  const area = request.nextUrl.searchParams.get('area') ?? ''
  if (!ehArea(area)) return NextResponse.json({ error: 'Área desconhecida.' }, { status: 400 })
  try {
    return NextResponse.json(await papersDaArea(area))
  } catch (err) {
    console.error('[pesquisa-ia]', area, err)
    return NextResponse.json({ error: 'Os papers desta área não puderam ser lidos agora: o arXiv não respondeu.' }, { status: 503 })
  }
}
