'use client'

// Selo "Jira lido hoje às 08:12": quando os dados mostrados foram lidos do Jira. A leitura é uma por dia (a primeira
// pessoa do dia dispara, todo mundo usa a mesma), então o selo diz de quando é a informação.

import { useEffect, useState } from 'react'
import { cx } from '@/components/ui'

interface Situacao { salvoEm: string | null; atualizando: boolean; falhouEm: string | null; lidoHoje: boolean }

function quando(iso: string) {
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const hoje = new Date()
  const ontem = new Date(Date.now() - 86_400_000)
  if (d.toDateString() === hoje.toDateString()) return `hoje às ${hora}`
  if (d.toDateString() === ontem.toDateString()) return `ontem às ${hora}`
  return `em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`
}

export function LeituraDoJira({ className }: { className?: string }) {
  const [s, setS] = useState<Situacao | null>(null)
  useEffect(() => {
    let vivo = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const ler = () => fetch('/jira/api/community/jira/leitura', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((x: Situacao | null) => {
        if (!vivo || !x) return
        setS(x)
        // Enquanto a leitura do dia acontece, confere de novo para mostrar a hora nova.
        if (x.atualizando) timer = setTimeout(ler, 20_000)
      })
      .catch(() => {})
    ler()
    return () => { vivo = false; if (timer) clearTimeout(timer) }
  }, [])
  if (!s?.salvoEm && !s?.atualizando) return null

  const cor = s.falhouEm ? 'bg-red-500' : s.lidoHoje ? 'bg-emerald-500' : 'bg-amber-500'
  const texto = !s.salvoEm ? 'Lendo o Jira…'
    : `Jira lido ${quando(s.salvoEm)}${s.atualizando ? ' · lendo de novo…' : s.falhouEm ? ' · Jira sem resposta agora' : ''}`
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-beon-line bg-white px-2.5 py-1 text-[11px] font-medium text-beon-body', className)}
      title="O Jira é lido uma vez por dia, no primeiro acesso do dia; todo mundo usa essa mesma leitura.">
      <span className={cx('h-1.5 w-1.5 rounded-full', cor, s.atualizando && 'animate-pulse')} aria-hidden />{texto}
    </span>
  )
}
