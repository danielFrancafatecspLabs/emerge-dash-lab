import { NextResponse } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await carregarSemanal())
}
