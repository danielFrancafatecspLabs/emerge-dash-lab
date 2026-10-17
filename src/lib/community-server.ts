import { NextResponse, type NextRequest } from 'next/server'
import { verifyAuthSession, type AuthSessionRole } from './auth-session'
import { loadUsers, type User } from './users'
import { loadPresence } from './chat-store'
import { loadPosts } from './posts-store'
import { normalizePost, type CommunityPost } from './community'
import { loadProfiles, emptyProfile } from './community-profile'

// Utilitários de servidor compartilhados pelas rotas /api/community/*.

export interface Member {
  username: string
  role: AuthSessionRole
  user: User | undefined
}

export async function getMember(request: NextRequest): Promise<Member | null> {
  const session = await verifyAuthSession(request.cookies.get('auth_session')?.value, process.env.AUTH_SECRET)
  if (!session) return null
  return { username: session.username, role: session.role, user: loadUsers().find(u => u.username === session.username) }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export const ACTIVE_WINDOW_MS = 5 * 60 * 1000

export interface MemberPublic {
  username: string
  nome: string
  laboratorio: string
  avatar: string
  cargo: string
  especialidade: string
  bio: string
  interesses: string[]
  ultimoAcesso: string | null
  ativoAgora: boolean
  publicacoes: number
}

export function memberDirectory(posts: CommunityPost[] = loadNormalizedPosts(), now = Date.now()): MemberPublic[] {
  const profiles = new Map(loadProfiles().map(p => [p.username, p]))
  const presence = new Map(loadPresence().map(p => [p.userId, p.lastSeen]))
  return loadUsers()
    .filter(u => u.active)
    .map(u => {
      const profile = profiles.get(u.username) ?? emptyProfile(u.username)
      const ultimoAcesso = presence.get(u.username) ?? null
      return {
        username: u.username,
        nome: u.nome || u.username,
        laboratorio: u.laboratorio,
        avatar: u.avatar,
        cargo: profile.cargo,
        especialidade: profile.especialidade,
        bio: profile.bio,
        interesses: profile.interesses,
        ultimoAcesso,
        ativoAgora: !!ultimoAcesso && now - Date.parse(ultimoAcesso) < ACTIVE_WINDOW_MS,
        publicacoes: posts.filter(p => p.authorUsername === u.username).length,
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function loadNormalizedPosts(): CommunityPost[] {
  const users = loadUsers()
  return loadPosts().map(p => normalizePost(p, users))
}
