import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { randomUUID } from 'crypto'
import { loadPosts, savePosts } from '@/lib/community/posts-store'
import { POST_LIMITS, type CommunityComment } from '@/lib/community/model'
import { badRequest, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()

  let content = ''
  let parentId: string | null = null
  try {
    const body = await request.json()
    content = typeof body.content === 'string' ? body.content.trim() : ''
    parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null
  } catch {
    return badRequest('Requisição inválida')
  }
  if (!content) return badRequest('Escreva um comentário')
  if (content.length > POST_LIMITS.comment) return badRequest(`O comentário pode ter até ${POST_LIMITS.comment} caracteres`)

  const posts = loadPosts()
  const post = posts.find(p => p.id === params.id)
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 })
  const comments = Array.isArray(post.comments) ? post.comments : []
  if (parentId && !comments.some(c => c.id === parentId)) return badRequest('Comentário respondido não existe mais')

  const comment: CommunityComment = {
    id: randomUUID(),
    authorUsername: member.username,
    authorName: member.user?.nome || member.username,
    content,
    createdAt: new Date().toISOString(),
    parentId,
  }
  post.comments = [...comments, comment]
  savePosts(posts)
  return NextResponse.json(comment, { status: 201 })
}
