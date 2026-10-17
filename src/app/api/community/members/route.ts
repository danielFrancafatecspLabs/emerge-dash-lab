import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/request'
import { memberDirectory, unauthorized } from '@/lib/community/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!await getSessionUser(request)) return unauthorized()
  return NextResponse.json(memberDirectory())
}
