'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, RotateCw, Search, Send } from 'lucide-react'
import { MAX_MESSAGE_LENGTH, type ConversationSummary, type DirectMessage } from '@/lib/community-messages'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { horaCurta, tempoRelativo } from '@/components/comunidade/format'
import { Avatar, CountBadge, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/comunidade/ui'

const POLL_MS = 8000

interface LocalMessage extends DirectMessage {
  estado?: 'enviando' | 'falhou'
}

function usePolling(fn: () => void, ms: number, ativo = true) {
  useEffect(() => {
    if (!ativo) return
    const t = setInterval(() => { if (document.visibilityState === 'visible') fn() }, ms)
    return () => clearInterval(t)
  }, [fn, ms, ativo])
}

function ConversationList({ conversas, erro, atual, onRetry }: { conversas: ConversationSummary[] | null; erro: string | null; atual: string | null; onRetry: () => void }) {
  const { me, members, member } = useCommunity()
  const router = useRouter()
  const pathname = usePathname()
  const [busca, setBusca] = useState('')

  const pessoas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    return (members.data ?? []).filter(m => m.username !== me?.username && [m.nome, m.especialidade, m.laboratorio].join(' ').toLowerCase().includes(q)).slice(0, 8)
  }, [busca, members.data, me?.username])

  const abrir = (username: string) => { setBusca(''); router.push(`${pathname}?com=${encodeURIComponent(username)}`) }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-comm-line p-4">
        <h1 className="mb-3 text-xl font-semibold tracking-tight">Mensagens</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-comm-muted" aria-hidden />
          <label htmlFor="busca-conversa" className="sr-only">Buscar pessoa para conversar</label>
          <input id="busca-conversa" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nova conversa: buscar pessoa"
            className={cx(inputClass, 'h-10 rounded-full py-2 pl-10 text-sm')} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {busca.trim() ? (
          pessoas.length === 0 ? <p className="p-4 text-sm text-comm-muted">Ninguém encontrado com “{busca}”.</p> : (
            <ul>
              {pessoas.map(m => (
                <li key={m.username}>
                  <button type="button" onClick={() => abrir(m.username)} className={cx('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-comm-soft', focusRing)}>
                    <Avatar nome={m.nome} src={m.avatar} size={40} ativo={m.ativoAgora} />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{m.nome}</span><span className="block truncate text-xs text-comm-muted">{m.especialidade || m.laboratorio}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : erro && !conversas ? <ErrorState message={erro} onRetry={onRetry} /> : !conversas ? (
          <div className="space-y-4 p-4" aria-hidden>{[0, 1, 2].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>)}</div>
        ) : conversas.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Nenhuma conversa ainda">Busque uma pessoa acima ou use “Mensagem” em um perfil ou publicação.</EmptyState>
        ) : (
          <ul>
            {conversas.map(c => {
              const m = member(c.com)
              const nome = m?.nome ?? c.com
              return (
                <li key={c.id}>
                  <Link href={`${pathname}?com=${encodeURIComponent(c.com)}`} aria-current={atual === c.com ? 'page' : undefined}
                    className={cx('flex items-center gap-3 px-4 py-3 hover:bg-comm-soft', atual === c.com && 'bg-comm-soft', focusRing)}>
                    <Avatar nome={nome} src={m?.avatar} size={44} ativo={m?.ativoAgora} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cx('truncate text-sm', c.naoLidas ? 'font-bold' : 'font-semibold')}>{nome}</span>
                        {c.ultima && <span className="shrink-0 text-xs text-comm-muted">{tempoRelativo(c.ultima.createdAt)}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cx('truncate text-[13px]', c.naoLidas ? 'font-medium text-comm-ink' : 'text-comm-muted')}>
                          {c.ultima?.from === me?.username ? 'Você: ' : ''}{c.ultima?.text}
                        </span>
                        {c.naoLidas > 0 && <CountBadge n={c.naoLidas} className="ml-auto shrink-0" />}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Thread({ com, onActivity }: { com: string; onActivity: () => void }) {
  const { me, member, members, refreshCounts } = useCommunity()
  const [mensagens, setMensagens] = useState<LocalMessage[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outro = member(com)

  const carregar = useCallback(async () => {
    try {
      const res = await api<{ mensagens: DirectMessage[] }>(`/community/messages/${encodeURIComponent(com)}`)
      setMensagens(prev => {
        const pendentes = (prev ?? []).filter(m => m.estado)
        return [...res.mensagens, ...pendentes]
      })
      setErro(null)
      refreshCounts()
    } catch (err) {
      setErro(errorMessage(err))
    }
  }, [com, refreshCounts])

  useEffect(() => { setMensagens(null); setErro(null); setTexto(''); carregar(); inputRef.current?.focus() }, [com]) // eslint-disable-line react-hooks/exhaustive-deps
  usePolling(carregar, POLL_MS)
  useEffect(() => { fimRef.current?.scrollIntoView({ block: 'end' }) }, [mensagens?.length])

  async function enviar(conteudo: string, tempId?: string) {
    const id = tempId ?? `tmp-${Date.now()}`
    const local: LocalMessage = { id, from: me!.username, text: conteudo, createdAt: new Date().toISOString(), estado: 'enviando' }
    setMensagens(prev => [...(prev ?? []).filter(m => m.id !== id), local])
    try {
      const salva = await api<DirectMessage>(`/community/messages/${encodeURIComponent(com)}`, { method: 'POST', json: { text: conteudo } })
      setMensagens(prev => (prev ?? []).map(m => (m.id === id ? salva : m)))
      onActivity()
    } catch {
      setMensagens(prev => (prev ?? []).map(m => (m.id === id ? { ...m, estado: 'falhou' } : m)))
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo || !me) return
    setTexto('')
    enviar(conteudo)
  }

  if (members.data && !outro) {
    return <EmptyState icon={MessageCircle} title="Pessoa não encontrada">Ela pode não fazer mais parte da comunidade.</EmptyState>
  }
  const nome = outro?.nome ?? com

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-comm-line px-4 py-3">
        <Link href="/comunidade/mensagens" aria-label="Voltar às conversas" className={cx('rounded-full p-1.5 text-comm-body hover:bg-comm-soft md:hidden', focusRing)}>
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Link href={`/comunidade/pessoas/${encodeURIComponent(com)}`} className={cx('flex min-w-0 items-center gap-3 rounded-xl', focusRing)}>
          <Avatar nome={nome} src={outro?.avatar} size={40} ativo={outro?.ativoAgora} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{nome}</span>
            <span className="block truncate text-xs text-comm-muted">
              {outro?.ativoAgora ? 'Ativo agora' : outro?.ultimoAcesso ? `Visto ${tempoRelativo(outro.ultimoAcesso)}` : outro?.especialidade || outro?.laboratorio}
            </span>
          </span>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
        {erro && !mensagens ? <ErrorState message={erro} onRetry={carregar} /> : !mensagens ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-comm-muted" aria-label="Carregando mensagens" /></div>
        ) : mensagens.length === 0 ? (
          <p className="mx-auto max-w-xs py-10 text-center text-sm text-comm-muted">Comece a conversa com {nome.split(' ')[0]}. As mensagens ficam visíveis só para vocês dois.</p>
        ) : (
          <ol className="space-y-1.5">
            {mensagens.map((m, i) => {
              const minha = m.from === me?.username
              const novoBloco = i === 0 || mensagens[i - 1].from !== m.from
              return (
                <li key={m.id} className={cx('flex', minha ? 'justify-end' : 'justify-start', novoBloco && i > 0 && 'pt-2')}>
                  <div className={cx('max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug',
                    minha ? 'rounded-br-md bg-comm-red text-white' : 'rounded-bl-md bg-comm-soft text-comm-ink',
                    m.estado === 'enviando' && 'opacity-60')}>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={cx('mt-0.5 text-right text-[11px]', minha ? 'text-white/75' : 'text-comm-muted')}>
                      {m.estado === 'enviando' ? 'Enviando…' : horaCurta(m.createdAt)}
                    </p>
                  </div>
                  {m.estado === 'falhou' && (
                    <button type="button" onClick={() => enviar(m.text, m.id)} className="ml-2 inline-flex items-center gap-1 self-center text-xs font-medium text-red-700 hover:underline">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden /> Falhou · <RotateCw className="h-3 w-3" aria-hidden /> Reenviar
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={submit} className="border-t border-comm-line p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="nova-mensagem" className="sr-only">Mensagem para {nome}</label>
          <textarea ref={inputRef} id="nova-mensagem" rows={1} value={texto} maxLength={MAX_MESSAGE_LENGTH} onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
            placeholder="Escreva uma mensagem" className={cx(inputClass, 'max-h-40 min-h-[44px] resize-none rounded-3xl py-2.5 [field-sizing:content]')} />
          <button type="submit" disabled={!texto.trim()} aria-label="Enviar mensagem"
            className={cx('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-comm-red text-white disabled:bg-comm-line disabled:text-comm-muted', focusRing)}>
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 px-2 text-[11px] text-comm-muted">Enter envia · Shift+Enter quebra a linha · a conversa atualiza a cada poucos segundos</p>
      </form>
    </div>
  )
}

function Mensagens() {
  const params = useSearchParams()
  const com = params.get('com')
  const [conversas, setConversas] = useState<ConversationSummary[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await api<{ conversas: ConversationSummary[] }>('/community/messages')
      setConversas(res.conversas)
      setErro(null)
    } catch (err) {
      setErro(errorMessage(err))
    }
  }, [])
  useEffect(() => { carregar() }, [carregar, com])
  usePolling(carregar, POLL_MS * 2)

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] md:h-dvh">
      <div className={cx('w-full shrink-0 border-r border-comm-line md:w-80 lg:w-96', com && 'hidden md:block')}>
        <ConversationList conversas={conversas} erro={erro} atual={com} onRetry={carregar} />
      </div>
      <div className={cx('min-w-0 flex-1', !com && 'hidden md:block')}>
        {com ? <Thread com={com} onActivity={carregar} /> : (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={MessageCircle} title="Suas conversas">Escolha uma conversa ou busque alguém para começar.</EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MensagensPage() {
  return <Suspense fallback={null}><Mensagens /></Suspense>
}
