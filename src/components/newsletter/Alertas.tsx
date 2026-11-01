'use client'

// Alertas do beOn Radar no navegador: com a permissão dada, as notícias do dia (as mesmas da central de notificações)
// aparecem como notificação do sistema enquanto a Comunidade estiver aberta em alguma aba. Clicar leva à discussão.

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import type { CommunityNotification } from '@/lib/community/model'
import { api } from '@/components/comunidade/api'
import { cx, focusRing } from '@/components/ui'

const LIGADO = 'beon:radar:alertas'
const AVISADOS = 'beon:radar:alertados'
const EVENTO = 'beon:radar:alertas'
const INTERVALO = 5 * 60 * 1000

type Estado = 'indisponivel' | 'bloqueado' | 'desligado' | 'ligado'

function ler(chave: string) { try { return localStorage.getItem(chave) } catch { return null } }
function gravar(chave: string, valor: string | null) {
  try { if (valor === null) localStorage.removeItem(chave); else localStorage.setItem(chave, valor) } catch { /* sem armazenamento */ }
}

function estadoAtual(): Estado {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'indisponivel'
  if (Notification.permission === 'denied') return 'bloqueado'
  return Notification.permission === 'granted' && ler(LIGADO) === '1' ? 'ligado' : 'desligado'
}

function useEstado() {
  const [estado, setEstado] = useState<Estado>('desligado')
  useEffect(() => {
    const atualizar = () => setEstado(estadoAtual())
    atualizar()
    window.addEventListener(EVENTO, atualizar)
    return () => window.removeEventListener(EVENTO, atualizar)
  }, [])
  return estado
}

/** Botão de ligar/desligar os alertas (no topo do beOn Radar). */
export function BotaoAlertas() {
  const estado = useEstado()
  const [msg, setMsg] = useState<string | null>(null)

  async function alternar() {
    setMsg(null)
    if (estado === 'ligado') { gravar(LIGADO, null); window.dispatchEvent(new Event(EVENTO)); return }
    const permissao = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permissao !== 'granted') { setMsg('O navegador não deu permissão para notificações.'); window.dispatchEvent(new Event(EVENTO)); return }
    gravar(LIGADO, '1')
    window.dispatchEvent(new Event(EVENTO))
    new Notification('beOn Radar', { body: 'Pronto! Você vai receber aqui as notícias mais relevantes do dia.', icon: '/jira/logobeonlabs.png', tag: 'beon-radar-boas-vindas' })
  }

  if (estado === 'indisponivel') return null
  const Icone = estado === 'ligado' ? BellRing : estado === 'bloqueado' ? BellOff : Bell
  return (
    <span className="inline-flex flex-col items-end">
      <button type="button" onClick={alternar} disabled={estado === 'bloqueado'} aria-pressed={estado === 'ligado'}
        title={estado === 'bloqueado' ? 'As notificações estão bloqueadas nas configurações do navegador para este site.' : undefined}
        className={cx('inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', focusRing,
          estado === 'ligado' ? 'bg-beon-tint text-beon-red hover:bg-red-100' : 'bg-beon-red text-white hover:bg-beon-redhi')}>
        <Icone className="h-4 w-4" aria-hidden />
        {estado === 'ligado' ? 'Alertas ligados' : estado === 'bloqueado' ? 'Alertas bloqueados no navegador' : 'Receber alertas das notícias'}
      </button>
      {msg && <span role="status" className="mt-1 text-xs text-beon-muted">{msg}</span>}
    </span>
  )
}

/**
 * Fica de olho nas notícias do Radar (a cada 5 minutos, com os alertas ligados) e mostra as novas como notificação do
 * sistema. Na primeira vez, só anota as que já existem, para não despejar o dia inteiro de uma vez.
 */
export function VigiaDoRadar() {
  const estado = useEstado()
  const router = useRouter()

  const verificar = useCallback(async () => {
    let itens: CommunityNotification[]
    try { itens = (await api<{ itens: CommunityNotification[] }>('/community/notifications')).itens } catch { return }
    const noticias = itens.filter(n => n.tipo === 'noticia')
    const salvos = ler(AVISADOS)
    const avisados = new Set<string>(salvos ? JSON.parse(salvos) : [])
    const novas = salvos === null ? [] : noticias.filter(n => !n.lida && !avisados.has(n.id))
    for (const n of novas.slice(0, 4)) {
      const alerta = new Notification('beOn Radar · notícia para discutir', { body: n.postTitulo, icon: '/jira/logobeonlabs.png', tag: n.id })
      alerta.onclick = () => { window.focus(); router.push(`/comunidade/post/${n.postId}`); alerta.close() }
    }
    noticias.forEach(n => avisados.add(n.id))
    gravar(AVISADOS, JSON.stringify([...avisados].slice(-200)))
  }, [router])

  useEffect(() => {
    if (estado !== 'ligado') return
    verificar()
    const t = setInterval(verificar, INTERVALO)
    return () => clearInterval(t)
  }, [estado, verificar])

  return null
}
