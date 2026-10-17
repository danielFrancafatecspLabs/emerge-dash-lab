import { NextRequest, NextResponse } from 'next/server'
import { loadStories, saveStories } from '@/lib/stories-store'
import { parseStoryCategoria } from '@/lib/stories'
import { verifyAuthSession } from '@/lib/auth-session'
import { isAdmin } from '@/lib/users'

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const session = await verifyAuthSession(
    request.cookies.get('auth_session')?.value,
    process.env.AUTH_SECRET,
  )
  return session?.role === 'admin' && isAdmin(session.username)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await request.json()
    const stories = loadStories()
    const idx = stories.findIndex(s => s.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 })

    if (body.title !== undefined) stories[idx].title = body.title
    if (body.imageUrl !== undefined) stories[idx].imageUrl = body.imageUrl
    if (body.linkUrl !== undefined) stories[idx].linkUrl = body.linkUrl
    if (body.active !== undefined) stories[idx].active = Boolean(body.active)
    if (body.order !== undefined) stories[idx].order = body.order
    if (body.categoria !== undefined) stories[idx].categoria = parseStoryCategoria(body.categoria) ?? stories[idx].categoria
    if (typeof body.texto === 'string') stories[idx].texto = body.texto.trim().slice(0, 500)

    saveStories(stories)
    return NextResponse.json(stories[idx])
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const { id } = await params
  const stories = loadStories()
  const filtered = stories.filter(s => s.id !== id)
  if (filtered.length === stories.length) {
    return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 })
  }
  saveStories(filtered)
  return NextResponse.json({ ok: true })
}