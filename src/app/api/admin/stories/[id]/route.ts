import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { loadStories, saveStories } from '@/lib/community/stories-store'
import { parseStoryChanges } from '@/lib/community/stories'

const forbidden = () => NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
const notFound = () => NextResponse.json({ error: 'Story não encontrado' }, { status: 404 })

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdmin(request)) return forbidden()
  const parsed = parseStoryChanges(await request.json().catch(() => null), false)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const stories = loadStories()
  const story = stories.find(s => s.id === params.id)
  if (!story) return notFound()
  Object.assign(story, parsed.value)
  saveStories(stories)
  return NextResponse.json(story)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAdmin(request)) return forbidden()
  const stories = loadStories()
  if (!stories.some(s => s.id === params.id)) return notFound()
  saveStories(stories.filter(s => s.id !== params.id))
  return NextResponse.json({ ok: true })
}
