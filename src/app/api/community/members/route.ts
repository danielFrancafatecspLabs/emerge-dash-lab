import { NextRequest, NextResponse } from 'next/server'
import { getMember, memberDirectory, unauthorized } from '@/lib/community-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!await getMember(request)) return unauthorized()
  return NextResponse.json(memberDirectory())
}
