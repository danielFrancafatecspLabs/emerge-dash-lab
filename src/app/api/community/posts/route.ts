import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { randomUUID } from 'crypto'
import { loadPosts, savePosts } from '@/lib/community/posts-store'
import { validatePostInput, type CommunityPost } from '@/lib/community/model'
import { talvezSincronizarNoticiasRadar } from '@/lib/community/noticias-radar'
import { talvezSincronizarSinaisOsint } from '@/lib/community/sinais-osint'
import { isKnownTopic } from '@/lib/community/topics'
import { badRequest, loadNormalizedPosts, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  // Sinais novos do Radar OSINT entram no fórum como publicações da automação "Sinais FT - beOn Labs".
  talvezSincronizarSinaisOsint()
  // Notícias do beOn Radar viram discussões da automação "beOn Radar - Newsletter" (em segundo plano: o feed não espera).
  talvezSincronizarNoticiasRadar()
  const posts = loadNormalizedPosts()
  posts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Requisição inválida')
  }
  const result = validatePostInput(body, isKnownTopic)
  if ('error' in result) return badRequest(result.error)

  const post: CommunityPost = {
    id: randomUUID(),
    authorId: member.user?.id || member.username,
    authorUsername: member.username,
    authorName: member.user?.nome || member.username,
    authorLab: member.user?.laboratorio || '',
    authorAvatar: member.user?.avatar || '',
    ...result.value,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  }
  const posts = loadPosts()
  posts.push(post)
  savePosts(posts)
  return NextResponse.json(post, { status: 201 })
}
