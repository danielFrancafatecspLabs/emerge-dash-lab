import { NextRequest, NextResponse } from 'next/server'
import { loadStories, saveStories } from '@/lib/stories-store'
import { Story } from '@/lib/stories'
import { verifyAuthSession } from '@/lib/auth-session'
import { isAdmin } from '@/lib/users'
import { randomUUID } from 'crypto'

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  return session?.role === 'admin' && isAdmin(session.username)
}

export async function GET(request: NextRequest) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const stories = loadStories()
  return NextResponse.json(stories)
}

export async function POST(request: NextRequest) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  try {
    const { title, imageUrl, linkUrl, order } = await request.json()
    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Título e imagem são obrigatórios' }, { status: 400 })
    }

    const stories = loadStories()
    const session = await verifyAuthSession(
      request.cookies.get('auth_session')?.value,
      process.env.AUTH_SECRET,
    )

    const newStory: Story = {
      id: randomUUID(),
      title,
      imageUrl,
      linkUrl: linkUrl || '',
      active: true,
      order: order ?? stories.length,
      createdAt: new Date().toISOString(),
      createdBy: session?.username || 'unknown',
    }
    stories.push(newStory)
    saveStories(stories)
    return NextResponse.json(newStory, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}