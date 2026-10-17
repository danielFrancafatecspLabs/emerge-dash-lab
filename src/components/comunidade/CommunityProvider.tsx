'use client'

// Estado compartilhado da Comunidade: quem sou eu, pessoas, publicações, contadores de não lidas,
// o compositor de publicações e os avisos (toasts). Todas as páginas da área consomem este contexto.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CommunityPost, PostKind } from '@/lib/community'
import type { CommunityProfile, ProfilePatch } from '@/lib/community-profile'
import type { MemberPublic } from '@/lib/community-server'
import type { AuthSessionRole } from '@/lib/auth-session'
import { api, errorMessage } from './api'

export interface Me {
  username: string
  role: AuthSessionRole
  nome: string
  laboratorio: string
  avatar: string
  profile: CommunityProfile
}

export interface ComposerPreset {
  kind?: PostKind
  title?: string
  content?: string
  linkUrl?: string
  tags?: string[]
}

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface Loadable<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface CommunityContextValue {
  me: Me | null
  meState: Loadable<Me>
  reloadMe: () => void
  members: Loadable<MemberPublic[]>
  member: (username: string) => MemberPublic | undefined
  reloadMembers: () => void
  posts: Loadable<CommunityPost[]>
  reloadPosts: () => void
  upsertPost: (post: CommunityPost) => void
  removePost: (id: string) => void
  patchProfile: (patch: ProfilePatch, optimistic?: (p: CommunityProfile) => CommunityProfile) => Promise<boolean>
  counts: { notificacoes: number; mensagens: number }
  refreshCounts: () => void
  composer: ComposerPreset | null
  openComposer: (preset?: ComposerPreset) => void
  closeComposer: () => void
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

export function useCommunity() {
  const ctx = useContext(CommunityContext)
  if (!ctx) throw new Error('useCommunity precisa estar dentro de <CommunityProvider>')
  return ctx
}

function useLoadable<T>(path: string) {
  const [state, setState] = useState<Loadable<T>>({ data: null, error: null, loading: true })
  const load = useCallback(async (silent = false) => {
    if (!silent) setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await api<T>(path)
      setState({ data, error: null, loading: false })
    } catch (err) {
      // Numa atualização silenciosa, mantém os dados que já estavam na tela.
      setState(s => (silent && s.data ? s : { data: s.data, error: errorMessage(err), loading: false }))
    }
  }, [path])
  return [state, setState, load] as const
}

const POLL_MS = 60_000

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [meState, setMeState, loadMe] = useLoadable<Me>('/community/me')
  const [members, , loadMembers] = useLoadable<MemberPublic[]>('/community/members')
  const [posts, setPosts, loadPosts] = useLoadable<CommunityPost[]>('/community/posts')
  const [counts, setCounts] = useState({ notificacoes: 0, mensagens: 0 })
  const [composer, setComposer] = useState<ComposerPreset | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const refreshCounts = useCallback(async () => {
    try {
      const n = await api<{ naoLidas: number; mensagensNaoLidas: number }>('/community/notifications')
      setCounts({ notificacoes: n.naoLidas, mensagens: n.mensagensNaoLidas })
    } catch {
      // Contadores são auxiliares: uma falha aqui não interrompe a navegação.
    }
  }, [])

  useEffect(() => {
    loadMe()
    loadMembers()
    loadPosts()
    refreshCounts()
    const heartbeat = () => { if (document.visibilityState === 'visible') api('/community/presence', { method: 'POST' }).catch(() => {}) }
    heartbeat()
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      heartbeat()
      refreshCounts()
      loadPosts(true)
    }, POLL_MS)
    const onFocus = () => { refreshCounts(); loadPosts(true) }
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [loadMe, loadMembers, loadPosts, refreshCounts])

  const dismissToast = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), [])
  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts(t => [...t.slice(-2), { id, message, tone }])
    setTimeout(() => dismissToast(id), tone === 'error' ? 6000 : 3500)
  }, [dismissToast])

  const patchProfile = useCallback(async (patch: ProfilePatch, optimistic?: (p: CommunityProfile) => CommunityProfile) => {
    const before = meState.data?.profile
    if (optimistic && before) setMeState(s => (s.data ? { ...s, data: { ...s.data, profile: optimistic(s.data.profile) } } : s))
    try {
      const profile = await api<CommunityProfile>('/community/me', { method: 'PATCH', json: patch })
      setMeState(s => (s.data ? { ...s, data: { ...s.data, profile } } : s))
      return true
    } catch (err) {
      if (before) setMeState(s => (s.data ? { ...s, data: { ...s.data, profile: before } } : s))
      toast(errorMessage(err), 'error')
      return false
    }
  }, [meState.data?.profile, setMeState, toast])

  const upsertPost = useCallback((post: CommunityPost) => {
    setPosts(s => {
      const list = s.data ?? []
      const exists = list.some(p => p.id === post.id)
      return { ...s, data: exists ? list.map(p => (p.id === post.id ? post : p)) : [post, ...list] }
    })
  }, [setPosts])

  const removePost = useCallback((id: string) => {
    setPosts(s => ({ ...s, data: (s.data ?? []).filter(p => p.id !== id) }))
  }, [setPosts])

  const memberIndex = useMemo(() => new Map((members.data ?? []).map(m => [m.username, m])), [members.data])

  const value: CommunityContextValue = {
    me: meState.data,
    meState,
    reloadMe: () => loadMe(),
    members,
    member: username => memberIndex.get(username),
    reloadMembers: () => loadMembers(),
    posts,
    reloadPosts: () => loadPosts(),
    upsertPost,
    removePost,
    patchProfile,
    counts,
    refreshCounts,
    composer,
    openComposer: preset => setComposer(preset ?? {}),
    closeComposer: () => setComposer(null),
    toasts,
    toast,
    dismissToast,
  }

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}
