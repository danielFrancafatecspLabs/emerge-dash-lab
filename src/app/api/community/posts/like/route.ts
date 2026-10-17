import { NextRequest, NextResponse } from 'next/server'
import { loadPosts, savePosts } from '@/lib/posts-store'
import { verifyAuthSession } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ error: 'postId é obrigatório' }, { status: 400 })
    }

    const posts = loadPosts()
    const idx = posts.findIndex(p => p.id === postId)
    if (idx === -1) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    const userId = session.username
    const likes = posts[idx].likes
    const likeIndex = likes.indexOf(userId)

    if (likeIndex === -1) {
      likes.push(userId)
    } else {
      likes.splice(likeIndex, 1)
    }

    savePosts(posts)
    return NextResponse.json({ likes, liked: likeIndex === -1 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}