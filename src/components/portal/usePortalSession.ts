'use client'

// Quem está usando o portal (via /api/auth/me) e, para admins, quantos cadastros aguardam aprovação.
// O resultado é compartilhado entre as páginas para não refazer a busca a cada navegação.

import { useEffect, useState } from 'react'
import type { AuthSessionRole } from '@/lib/auth/session'

export interface PortalUser {
  username: string
  role: AuthSessionRole
  nome: string
  laboratorio: string
  avatar: string
}

let sessao: Promise<PortalUser | null> | null = null
let pendentes: Promise<number> | null = null

function carregarSessao() {
  sessao ??= fetch('/jira/api/auth/me')
    .then(r => (r.ok ? r.json() : null))
    .then(d => (d?.username ? d as PortalUser : null))
    .catch(() => { sessao = null; return null })
  return sessao
}

/** Recarrega a contagem de cadastros pendentes (chamado pelo Admin depois de aprovar ou recusar). */
export function refreshPendingSignups() {
  pendentes = null
  window.dispatchEvent(new Event('portal:pendentes'))
}

function carregarPendentes() {
  pendentes ??= fetch('/jira/api/admin/users')
    .then(r => (r.ok ? r.json() : []))
    .then((lista: { status?: string }[]) => (Array.isArray(lista) ? lista.filter(u => u.status === 'pendente').length : 0))
    .catch(() => { pendentes = null; return 0 })
  return pendentes
}

export function usePortalSession() {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let vivo = true
    const atualizarPendentes = () => carregarPendentes().then(n => { if (vivo) setPending(n) })
    carregarSessao().then(u => {
      if (!vivo) return
      setUser(u)
      if (u?.role === 'admin') atualizarPendentes()
    })
    window.addEventListener('portal:pendentes', atualizarPendentes)
    return () => { vivo = false; window.removeEventListener('portal:pendentes', atualizarPendentes) }
  }, [])

  return { user, pending }
}
