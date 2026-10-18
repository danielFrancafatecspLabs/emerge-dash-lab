'use client'

// Quantos cadastros aguardam aprovação (só para admins), para o contador do menu.

import { useEffect, useState } from 'react'

const EVENTO = 'app:cadastros-pendentes'

/** Pede ao menu que recarregue a contagem (chamado pelo Admin depois de aprovar ou recusar). */
export function refreshPendingSignups() {
  window.dispatchEvent(new Event(EVENTO))
}

export function usePendingSignups(enabled: boolean) {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let vivo = true
    const carregar = () => fetch('/jira/api/admin/users')
      .then(r => (r.ok ? r.json() : []))
      .then((lista: { status?: string }[]) => {
        if (vivo) setPending(Array.isArray(lista) ? lista.filter(u => u.status === 'pendente').length : 0)
      })
      .catch(() => {})
    carregar()
    window.addEventListener(EVENTO, carregar)
    return () => { vivo = false; window.removeEventListener(EVENTO, carregar) }
  }, [enabled])

  return enabled ? pending : 0
}
