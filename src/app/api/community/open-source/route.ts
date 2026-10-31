import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { parseRepoInput } from '@/lib/community/open-source'
import { loadRepos, publicarRepo } from '@/lib/community/open-source-store'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  return NextResponse.json(loadRepos())
}

export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  let body: unknown
  try { body = await request.json() } catch { return badRequest('Requisição inválida') }
  const parsed = parseRepoInput(body)
  if ('error' in parsed) return badRequest(parsed.error)
  const repo = publicarRepo(parsed.value, { username: member.username, nome: member.user?.nome || member.username })
  if (repo === 'duplicado') return NextResponse.json({ error: 'Este repositório já está na vitrine' }, { status: 409 })
  return NextResponse.json(repo, { status: 201 })
}
