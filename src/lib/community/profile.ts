import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from '@/lib/community/model'
import { isKnownTopic } from '@/lib/community/topics'
import type { PapelConversa } from '@/lib/community/cientista'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import { isEtapaTrilha, normalizarTrilha, type EtapaTrilha } from '@/lib/community/trilha'

// Perfil social de cada pessoa na Comunidade, separado do cadastro de acesso (data/users.json).

/** Conversa com o Cientista aberta por esta pessoa (o backend do Cientista não tem login). */
export interface SessaoCientista {
  id: string
  papel: PapelConversa
  criadaEm: string
}

export interface CommunityProfile {
  username: string
  cargo: string
  especialidade: string
  bio: string
  interesses: string[]
  topicosSeguidos: string[]
  pessoasSeguidas: string[]
  salvos: string[]
  trilhaConcluida: EtapaTrilha[]
  notificacoes: NotificationPrefs
  notificacoesVistasEm: string | null
  onboardedAt: string | null
  cientistaSessoes: SessaoCientista[]
}

export function emptyProfile(username: string): CommunityProfile {
  return {
    username,
    cargo: '',
    especialidade: '',
    bio: '',
    interesses: [],
    topicosSeguidos: [],
    pessoasSeguidas: [],
    salvos: [],
    trilhaConcluida: [],
    notificacoes: { ...DEFAULT_NOTIFICATION_PREFS },
    notificacoesVistasEm: null,
    onboardedAt: null,
    cientistaSessoes: [],
  }
}

function profilesPath(): string {
  return jsonStorePath('COMMUNITY_PROFILES_PATH', 'community-profiles.json')
}

export function loadProfiles(): CommunityProfile[] {
  return readJsonStore<Partial<CommunityProfile>[]>(profilesPath(), [])
    .filter(p => typeof p.username === 'string')
    .map(p => ({
      ...emptyProfile(p.username as string), ...p,
      trilhaConcluida: normalizarTrilha(p.trilhaConcluida),
      notificacoes: { ...DEFAULT_NOTIFICATION_PREFS, ...p.notificacoes },
    }))
}

export function getProfile(username: string): CommunityProfile {
  return loadProfiles().find(p => p.username === username) ?? emptyProfile(username)
}

export function saveProfile(profile: CommunityProfile): void {
  const profiles = loadProfiles().filter(p => p.username !== profile.username)
  profiles.push(profile)
  writeJsonStore(profilesPath(), profiles)
}

const TEXT_LIMITS = { cargo: 80, especialidade: 80, bio: 400 } as const

/** Mudanças que a própria pessoa pode fazer no seu perfil. Valida e ignora o que não for permitido. */
export interface ProfilePatch {
  cargo?: unknown
  especialidade?: unknown
  bio?: unknown
  interesses?: unknown
  toggleTopico?: unknown
  togglePessoa?: unknown
  toggleSalvo?: unknown
  toggleEtapa?: unknown
  notificacoes?: unknown
  marcarNotificacoesVistas?: unknown
  concluirOnboarding?: unknown
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

export function applyProfilePatch(profile: CommunityProfile, patch: ProfilePatch, now = new Date()): CommunityProfile {
  const next: CommunityProfile = { ...profile }
  for (const field of ['cargo', 'especialidade', 'bio'] as const) {
    const value = patch[field]
    if (typeof value === 'string') next[field] = value.trim().slice(0, TEXT_LIMITS[field])
  }
  if (Array.isArray(patch.interesses)) {
    next.interesses = [...new Set(patch.interesses.filter((t): t is string => typeof t === 'string' && isKnownTopic(t)))]
  }
  if (typeof patch.toggleTopico === 'string' && isKnownTopic(patch.toggleTopico)) {
    next.topicosSeguidos = toggle(next.topicosSeguidos, patch.toggleTopico)
  }
  if (typeof patch.togglePessoa === 'string' && patch.togglePessoa && patch.togglePessoa !== profile.username) {
    next.pessoasSeguidas = toggle(next.pessoasSeguidas, patch.togglePessoa)
  }
  if (typeof patch.toggleSalvo === 'string' && patch.toggleSalvo) {
    next.salvos = toggle(next.salvos, patch.toggleSalvo)
  }
  if (isEtapaTrilha(patch.toggleEtapa)) {
    next.trilhaConcluida = normalizarTrilha(toggle(next.trilhaConcluida, patch.toggleEtapa))
  }
  if (patch.notificacoes && typeof patch.notificacoes === 'object') {
    const prefs = patch.notificacoes as Record<string, unknown>
    next.notificacoes = { ...next.notificacoes }
    for (const key of ['comentarios', 'respostas', 'mensagens', 'noticias'] as const) {
      if (typeof prefs[key] === 'boolean') next.notificacoes[key] = prefs[key] as boolean
    }
  }
  if (patch.marcarNotificacoesVistas === true) next.notificacoesVistasEm = now.toISOString()
  if (patch.concluirOnboarding === true && !next.onboardedAt) next.onboardedAt = now.toISOString()
  return next
}

const MAX_SESSOES_CIENTISTA = 50

export function registrarSessaoCientista(profile: CommunityProfile, sessao: SessaoCientista): CommunityProfile {
  const outras = profile.cientistaSessoes.filter(x => x.id !== sessao.id)
  return { ...profile, cientistaSessoes: [sessao, ...outras].slice(0, MAX_SESSOES_CIENTISTA) }
}

export function isDonoSessaoCientista(profile: CommunityProfile, sid: string): boolean {
  return profile.cientistaSessoes.some(x => x.id === sid)
}
