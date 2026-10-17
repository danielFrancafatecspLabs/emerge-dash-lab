import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { loadPosts, savePosts } from '@/lib/community/posts-store'
import { badRequest, unauthorized } from '@/lib/community/server'

export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()

  try {
    const { postId } = await request.json()
    if (!postId) return badRequest('postId é obrigatório')

    const posts = loadPosts()
    const post = posts.find(p => p.id === postId)
    if (!post) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

    const likes = Array.isArray(post.likes) ? post.likes : []
    const liked = !likes.includes(member.username)
    post.likes = liked ? [...likes, member.username] : likes.filter(u => u !== member.username)
    savePosts(posts)
    return NextResponse.json({ likes: post.likes, liked })
  } catch {
    return badRequest('Requisição inválida')
  }
}
