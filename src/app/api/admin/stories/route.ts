import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAdmin } from '@/lib/auth/request'
import { loadStories, saveStories } from '@/lib/community/stories-store'
import { parseStoryChanges, type Story } from '@/lib/community/stories'

const forbidden = () => NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return forbidden()
  return NextResponse.json(loadStories())
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin(request)
  if (!admin) return forbidden()
  const parsed = parseStoryChanges(await request.json().catch(() => null), true)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const stories = loadStories()
  const story: Story = {
    id: randomUUID(),
    title: parsed.value.title!,
    imageUrl: parsed.value.imageUrl!,
    linkUrl: parsed.value.linkUrl ?? '',
    categoria: parsed.value.categoria ?? 'novidade',
    texto: parsed.value.texto ?? '',
    active: true,
    order: parsed.value.order ?? stories.length,
    createdAt: new Date().toISOString(),
    createdBy: admin.username,
  }
  saveStories([...stories, story])
  return NextResponse.json(story, { status: 201 })
}
