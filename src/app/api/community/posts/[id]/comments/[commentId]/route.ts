import { NextRequest, NextResponse } from 'next/server'
import { loadPosts, savePosts } from '@/lib/posts-store'
import { getMember, unauthorized } from '@/lib/community-server'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  const member = await getMember(request)
  if (!member) return unauthorized()
  const posts = loadPosts()
  const post = posts.find(p => p.id === params.id)
  const comment = post?.comments?.find(c => c.id === params.commentId)
  if (!post || !comment) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
  if (comment.authorUsername !== member.username && member.role !== 'admin') {
    return NextResponse.json({ error: 'Só quem escreveu pode excluir este comentário' }, { status: 403 })
  }
  // Remove o comentário e as respostas a ele.
  post.comments = (post.comments ?? []).filter(c => c.id !== comment.id && c.parentId !== comment.id)
  savePosts(posts)
  return NextResponse.json({ ok: true })
}
