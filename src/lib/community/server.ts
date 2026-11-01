import { NextResponse } from 'next/server'
import { loadUsers } from '@/lib/auth/users'
import { loadPresence } from '@/lib/community/presence'
import { loadPosts } from '@/lib/community/posts-store'
import { automacaoDe } from '@/lib/community/automacao'
import { normalizePost, type CommunityPost } from '@/lib/community/model'
import { loadProfiles, emptyProfile } from '@/lib/community/profile'

// Utilitários de servidor compartilhados pelas rotas /api/community/*.

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
  area: string
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
        area: u.area ?? '',
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
  // As automações usam sempre o avatar atual da conta (publicações antigas guardaram o anterior).
  return loadPosts().map(p => {
    const post = normalizePost(p, users)
    const conta = automacaoDe(post.authorUsername)
    return conta ? { ...post, authorAvatar: conta.avatar } : post
  })
}
