import { NextRequest, NextResponse } from 'next/server'
import { loadPosts, savePosts } from '@/lib/posts-store'
import { CommunityPost } from '@/lib/community'
import { verifyAuthSession } from '@/lib/auth-session'
import { loadUsers } from '@/lib/users'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = loadPosts()
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { content, linkUrl } = await request.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 })
    }

    const users = loadUsers()
    const user = users.find(u => u.username === session.username)

    const post: CommunityPost = {
      id: randomUUID(),
      authorId: user?.id || session.username,
      authorName: user?.nome || session.username,
      authorLab: user?.laboratorio || '',
      authorAvatar: user?.avatar || '',
      content: content.trim(),
      linkUrl: linkUrl || '',
      createdAt: new Date().toISOString(),
      likes: [],
    }

    const posts = loadPosts()
    posts.push(post)
    savePosts(posts)
    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}