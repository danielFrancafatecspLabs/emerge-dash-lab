import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { loadPosts, savePosts } from '@/lib/community/posts-store'
import { loadNormalizedPosts, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getSessionUser(request)) return unauthorized()
  const post = loadNormalizedPosts().find(p => p.id === params.id)
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 })
  return NextResponse.json(post)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const post = loadNormalizedPosts().find(p => p.id === params.id)
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 })
  if (post.authorUsername !== member.username && member.role !== 'admin') {
    return NextResponse.json({ error: 'Só a autora ou o autor pode excluir esta publicação' }, { status: 403 })
  }
  savePosts(loadPosts().filter(p => p.id !== params.id))
  return NextResponse.json({ ok: true })
}
