'use client'

// Push do beOn Radar no navegador. Ativar registra o service worker (/jira/sw-radar.js) e inscreve o navegador no
// servidor. Ao entrar na Comunidade, o servidor aplica a regra de um push por entrada (ver lib/community/push.ts):
// com push ativo, a notícia chega como notificação do sistema; sem push, ela aparece uma vez num cartão dentro do app.

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, BellOff, BellRing, MessageCircle, Send, X } from 'lucide-react'
import type { ConteudoDoPush, ResultadoDaEntrada } from '@/lib/community/push'
import { AUTOMACAO_RADAR } from '@/lib/community/automacao'
import { api, errorMessage } from '@/components/comunidade/api'
import { cx, focusRing } from '@/components/ui'
import { ImagemDaNoticia } from './identidade'

const SW = '/jira/sw-radar.js'
const ESCOPO = '/jira/'
const EVENTO = 'beon:radar:push'

type Estado = 'carregando' | 'sem-https' | 'sem-suporte' | 'bloqueado' | 'desligado' | 'ligado'

function suporte(): Estado | null {
  if (typeof window === 'undefined') return 'carregando'
  if (!window.isSecureContext) return 'sem-https'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'sem-suporte'
  if (Notification.permission === 'denied') return 'bloqueado'
  return null
}

function chaveParaBytes(base64: string) {
  const b64 = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

async function inscricaoAtual(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration(ESCOPO)
  return (await reg?.pushManager.getSubscription()) ?? null
}

/** Garante que o servidor conhece a inscrição deste navegador (ela pode ter sido renovada pelo próprio navegador). */
async function sincronizar(): Promise<boolean> {
  if (suporte() || Notification.permission !== 'granted') return false
  const sub = await inscricaoAtual()
  if (!sub) return false
  await api('/community/push', { method: 'POST', json: sub.toJSON() })
  return true
}

function usePush() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const atualizar = useCallback(async () => {
    const s = suporte()
    if (s) { setEstado(s); return }
    setEstado((await inscricaoAtual().catch(() => null)) && Notification.permission === 'granted' ? 'ligado' : 'desligado')
  }, [])
  useEffect(() => {
    atualizar()
    window.addEventListener(EVENTO, atualizar)
    return () => window.removeEventListener(EVENTO, atualizar)
  }, [atualizar])
  return { estado, atualizar }
}

async function ativar() {
  const permissao = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permissao !== 'granted') throw new Error('O navegador não deu permissão para notificações.')
  const reg = await navigator.serviceWorker.register(SW, { scope: ESCOPO })
  await navigator.serviceWorker.ready
  const { publicKey } = await api<{ publicKey: string }>('/community/push')
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(publicKey) })
  await api('/community/push', { method: 'POST', json: sub.toJSON() })
}

async function desativar() {
  const sub = await inscricaoAtual()
  if (!sub) return
  await api('/community/push', { method: 'DELETE', json: { endpoint: sub.endpoint } }).catch(() => null)
  await sub.unsubscribe()
}

/** Botão de ativar/desativar o push (no topo do beOn Radar e nas preferências de notificação). */
export function BotaoAlertas({ compacto }: { compacto?: boolean }) {
  const { estado } = usePush()
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function alternar() {
    setMsg(null); setOcupado(true)
    try {
      if (estado === 'ligado') await desativar()
      else { await ativar(); setMsg('Push ativado: a notícia mais relevante chega quando você entrar, uma por vez.') }
    } catch (err) { setMsg(errorMessage(err)) }
    setOcupado(false)
    window.dispatchEvent(new Event(EVENTO))
  }

  async function testar() {
    setMsg(null); setOcupado(true)
    try { await api('/community/push/teste', { method: 'POST' }); setMsg('Enviamos a manchete de hoje para este navegador.') } catch (err) { setMsg(errorMessage(err)) }
    setOcupado(false)
  }

  if (estado === 'carregando' || estado === 'sem-suporte') return null
  const indisponivel = estado === 'sem-https' || estado === 'bloqueado'
  const dica = estado === 'sem-https'
    ? 'O push do navegador só funciona com o site em HTTPS. Enquanto isso, a notícia chega num cartão dentro da Comunidade.'
    : estado === 'bloqueado' ? 'As notificações estão bloqueadas nas configurações do navegador para este site.' : undefined
  const Icone = estado === 'ligado' ? BellRing : indisponivel ? BellOff : BellRing
  return (
    <span className={cx('inline-flex flex-col gap-1', compacto ? 'items-start' : 'items-end')}>
      <span className="inline-flex flex-wrap gap-2">
        <button type="button" onClick={alternar} disabled={indisponivel || ocupado} aria-pressed={estado === 'ligado'} title={dica}
          className={cx('inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed', focusRing,
            estado === 'ligado' ? 'bg-beon-tint text-beon-red hover:bg-red-100' : indisponivel ? 'bg-beon-soft text-beon-muted' : 'bg-beon-red text-white hover:bg-beon-redhi')}>
          <Icone className="h-4 w-4" aria-hidden />
          {estado === 'ligado' ? 'Push ativado' : estado === 'sem-https' ? 'Push precisa de HTTPS' : estado === 'bloqueado' ? 'Push bloqueado no navegador' : 'Ativar push do Radar'}
        </button>
        {estado === 'ligado' && (
          <button type="button" onClick={testar} disabled={ocupado}
            className={cx('inline-flex h-10 items-center gap-2 rounded-full border border-beon-line bg-white px-4 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
            <Send className="h-4 w-4" aria-hidden />Ver como fica
          </button>
        )}
      </span>
      {(msg || (indisponivel && compacto)) && <span role="status" className="max-w-xs text-xs leading-snug text-beon-muted">{msg ?? dica}</span>}
    </span>
  )
}

/** O cartão do Radar dentro do app: o mesmo conteúdo do push, para quem não tem push ativo. Some sozinho em 15 s. */
function CartaoDoRadar({ conteudo, noticia, onFechar }: { conteudo: ConteudoDoPush; noticia: Extract<ResultadoDaEntrada, { noticia: unknown }>['noticia']; onFechar: () => void }) {
  const [pausado, setPausado] = useState(false)
  const [visivel, setVisivel] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisivel(true), 50); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (pausado) return
    const t = setTimeout(onFechar, 15_000)
    return () => clearTimeout(t)
  }, [pausado, onFechar])
  const [titulo, meta, provocacao] = conteudo.body.split('\n')
  const destino = conteudo.url.replace(/^\/jira/, '')
  return createPortal(
    <div role="status" aria-live="polite" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      className={cx('fixed right-4 top-4 z-[70] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-beon-line bg-white shadow-2xl shadow-stone-900/20 transition-all duration-500',
        visivel ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0')}>
      <div className="relative aspect-[16/8] overflow-hidden bg-beon-ink">
        <ImagemDaNoticia n={noticia} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" aria-hidden />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/35 py-1 pl-1 pr-3 text-xs font-semibold text-white backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AUTOMACAO_RADAR.avatar} alt="" className="h-6 w-6 rounded-full" />
            {conteudo.title}
          </span>
          <button type="button" onClick={onFechar} aria-label="Fechar"
            className={cx('flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md hover:bg-black/55', focusRing)}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[16px] font-bold leading-snug text-beon-ink">{titulo}</p>
        {meta && <p className="mt-1 text-xs font-medium text-beon-muted">{meta}</p>}
        {provocacao && <p className="mt-3 rounded-2xl bg-beon-soft px-3 py-2.5 text-[13px] leading-snug text-beon-body">{provocacao.replace(/^💬 /, '')}</p>}
        <div className="mt-4 flex gap-2">
          <Link href={destino} onClick={onFechar}
            className={cx('inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-beon-red text-sm font-semibold text-white hover:bg-beon-redhi', focusRing)}>
            <MessageCircle className="h-4 w-4" aria-hidden />Discutir no fórum
          </Link>
          <a href={conteudo.fonte} target="_blank" rel="noopener noreferrer" onClick={onFechar}
            className={cx('inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-beon-line px-4 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
            Ler na fonte<ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
      {!pausado && <span className="block h-1 origin-left animate-[encolher_15s_linear_forwards] bg-beon-red" aria-hidden />}
    </div>,
    document.body,
  )
}

/**
 * Montado no shell: na entrada (cada vez que o app abre), sincroniza a inscrição deste navegador e pede ao servidor a
 * notícia da entrada. O servidor decide se há algo (no máximo um a cada 6 horas); sem push, mostra o cartão.
 */
export function EntradaDoRadar() {
  const [cartao, setCartao] = useState<Extract<ResultadoDaEntrada, { noticia: unknown }> | null>(null)
  const feito = useRef(false)
  useEffect(() => {
    if (feito.current) return
    feito.current = true
    ;(async () => {
      await sincronizar().catch(() => false)
      const r = await api<ResultadoDaEntrada>('/community/push/entrada', { method: 'POST' }).catch(() => null)
      if (r && r.canal === 'app') setCartao(r)
    })()
  }, [])
  const fechar = useCallback(() => setCartao(null), [])
  return cartao ? <CartaoDoRadar conteudo={cartao.conteudo} noticia={cartao.noticia} onFechar={fechar} /> : null
}
