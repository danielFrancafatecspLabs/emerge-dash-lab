'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABEL, homeFor } from '@/lib/auth/client'
import type { AuthSessionRole } from '@/lib/auth/session'

interface Sessao {
  nome: string
  role: AuthSessionRole
}

/** Transição curta depois do login: cumprimenta a pessoa e leva para a área do perfil dela. */
export default function BemVindoPage() {
  const router = useRouter()
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    let vivo = true
    const timers: ReturnType<typeof setTimeout>[] = []
    fetch('/jira/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!vivo) return
        if (!d?.role) { router.replace('/login'); return }
        setSessao({ nome: d.nome || d.username, role: d.role })
        timers.push(setTimeout(() => setSaindo(true), 1600))
        timers.push(setTimeout(() => router.replace(homeFor(d.role)), 2200))
      })
      .catch(() => router.replace('/login'))
    return () => { vivo = false; timers.forEach(clearTimeout) }
  }, [router])

  const primeiroNome = sessao?.nome.split(/[\s@._]/)[0] ?? ''
  const comunidade = sessao?.role === 'community'

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#3A0A05] p-5 font-sans antialiased">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jira/login-comunidade.svg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#2A0704]/60" aria-hidden />

      <div
        className={`relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl shadow-black/30 transition-all duration-500 ${saindo ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        role="status"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="mx-auto h-12 w-auto" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-beon-ink">
          {sessao ? `Bem-vindo(a), ${primeiroNome}!` : 'Bem-vindo ao beOn Labs'}
        </h1>
        <p className="mt-1.5 text-sm text-beon-muted">
          {!sessao ? 'Preparando seu acesso…' : comunidade ? 'Entrando na Comunidade beOn Labs' : `Abrindo o portal · perfil ${ROLE_LABEL[sessao.role]}`}
        </p>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-beon-soft">
          <div className="h-full w-full origin-left animate-[carregar_2s_ease-in-out_forwards] rounded-full bg-beon-red motion-reduce:animate-none" />
        </div>
      </div>
      <style>{'@keyframes carregar{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
    </div>
  )
}
