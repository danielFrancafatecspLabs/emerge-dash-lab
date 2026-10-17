import { NextRequest, NextResponse } from 'next/server'
import { applyProfilePatch, getProfile, saveProfile } from '@/lib/community-profile'
import { badRequest, getMember, unauthorized } from '@/lib/community-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const member = await getMember(request)
  if (!member) return unauthorized()
  return NextResponse.json({
    username: member.username,
    role: member.role,
    nome: member.user?.nome || member.username,
    laboratorio: member.user?.laboratorio || '',
    avatar: member.user?.avatar || '',
    profile: getProfile(member.username),
  })
}

export async function PATCH(request: NextRequest) {
  const member = await getMember(request)
  if (!member) return unauthorized()
  try {
    const patch = await request.json()
    const profile = applyProfilePatch(getProfile(member.username), patch)
    saveProfile(profile)
    return NextResponse.json(profile)
  } catch {
    return badRequest('Requisição inválida')
  }
}
