import { NextResponse } from 'next/server'
import { loadStories } from '@/lib/stories-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stories = loadStories()
  const active = stories.filter(s => s.active).sort((a, b) => a.order - b.order)
  return NextResponse.json(active)
}