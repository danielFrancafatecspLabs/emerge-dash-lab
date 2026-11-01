'use client'

// Mensagens diretas da Comunidade. À esquerda: quem está online agora (para puxar conversa num toque), as conversas
// com filtro de não lidas e a busca de pessoas. À direita: a conversa, que começa com o cartão de quem está do outro
// lado (especialidade, laboratório, bio e os interesses em comum) e sugestões para quebrar o gelo; as mensagens vêm
// agrupadas por dia e por pessoa.

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, RotateCw, Search, Send, Sparkles, UserRound } from 'lucide-react'
import { MAX_MESSAGE_LENGTH, type ConversationSummary, type DirectMessage } from '@/lib/community/messages'
import { topicLabel } from '@/lib/community/topics'
import type { MemberPublic } from '@/lib/community/server'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { sugerirPessoas } from '@/components/comunidade/DiscoveryRail'
import { horaCurta, primeiroNome, tempoRelativo } from '@/components/comunidade/format'
import { Avatar, ErrorState, Skeleton, cx, focusRing } from '@/components/ui'

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

const descricao = (m?: MemberPublic | null) => [m?.especialidade || m?.cargo, m?.laboratorio].filter(Boolean).join(' · ')

function status(m?: MemberPublic | null) {
  if (!m) return ''
  if (m.ativoAgora) return 'Online agora'
  return m.ultimoAcesso ? `Visto ${tempoRelativo(m.ultimoAcesso)}` : 'Ainda não entrou na Comunidade'
}

// ── Lista de conversas ─────────────────────────────────────────────────────────────────────────────────────

function OnlineAgora({ abrir }: { abrir: (u: string) => void }) {
  const { me, members } = useCommunity()
  const online = (members.data ?? []).filter(m => m.ativoAgora && m.username !== me?.username).slice(0, 12)
  if (!online.length) return null
  return (
    <div className="border-b border-beon-line px-4 pb-3 pt-1">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-beon-muted">Online agora</p>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {online.map(m => (
          <li key={m.username} className="shrink-0">
            <button type="button" onClick={() => abrir(m.username)} title={`Conversar com ${m.nome}`}
              className={cx('group flex w-14 flex-col items-center gap-1 rounded-2xl', focusRing)}>
              <span className="rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-[2px] transition-transform group-hover:scale-105">
                <span className="block rounded-full bg-white p-[2px]"><Avatar nome={m.nome} src={m.avatar} size={42} /></span>
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium text-beon-body">{primeiroNome(m.nome)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConversationList({ conversas, erro, atual, onRetry }: { conversas: ConversationSummary[] | null; erro: string | null; atual: string | null; onRetry: () => void }) {
  const { me, members, member } = useCommunity()
  const router = useRouter()
  const pathname = usePathname()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'nao-lidas'>('todas')

  const pessoas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    return (members.data ?? []).filter(m => m.username !== me?.username && [m.nome, m.especialidade, m.laboratorio, m.area].join(' ').toLowerCase().includes(q)).slice(0, 8)
  }, [busca, members.data, me?.username])

  const abrir = (username: string) => { setBusca(''); router.push(`${pathname}?com=${encodeURIComponent(username)}`) }
  const naoLidas = (conversas ?? []).filter(c => c.naoLidas > 0).length
  const lista = (conversas ?? []).filter(c => filtro === 'todas' || c.naoLidas > 0)

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 pb-3 pt-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-beon-ink">Mensagens</h1>
        <p className="text-[13px] text-beon-muted">Converse direto com quem está construindo o futuro com você.</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-beon-muted" aria-hidden />
          <label htmlFor="busca-conversa" className="sr-only">Buscar pessoa para conversar</label>
          <input id="busca-conversa" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pessoa, laboratório ou especialidade"
            className={cx('h-11 w-full rounded-2xl border border-transparent bg-beon-soft pl-10 pr-3 text-sm text-beon-ink placeholder:text-beon-muted focus:border-beon-line focus:bg-white focus:outline-none', focusRing)} />
        </div>
      </div>

      {!busca.trim() && <OnlineAgora abrir={abrir} />}

      {!busca.trim() && (conversas?.length ?? 0) > 0 && (
        <div className="flex gap-2 px-4 py-3" role="tablist" aria-label="Filtrar conversas">
          {(['todas', 'nao-lidas'] as const).map(f => (
            <button key={f} type="button" role="tab" aria-selected={filtro === f} onClick={() => setFiltro(f)}
              className={cx('inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors', focusRing,
                filtro === f ? 'bg-beon-ink text-white' : 'bg-beon-soft text-beon-body hover:bg-stone-200')}>
              {f === 'todas' ? 'Todas' : 'Não lidas'}
              {f === 'nao-lidas' && naoLidas > 0 && <span className={cx('rounded-full px-1.5 text-[11px] tabular-nums', filtro === f ? 'bg-white/20' : 'bg-beon-red text-white')}>{naoLidas}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {busca.trim() ? (
          pessoas.length === 0 ? <p className="p-4 text-sm text-beon-muted">Ninguém encontrado com “{busca}”.</p> : (
            <ul>
              {pessoas.map(m => (
                <li key={m.username}>
                  <button type="button" onClick={() => abrir(m.username)} className={cx('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-beon-soft', focusRing)}>
                    <Avatar nome={m.nome} src={m.avatar} size={42} ativo={m.ativoAgora} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-beon-ink">{m.nome}</span><span className="block truncate text-xs text-beon-muted">{descricao(m) || status(m)}</span></span>
                    <MessageCircle className="h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : erro && !conversas ? <ErrorState message={erro} onRetry={onRetry} /> : !conversas ? (
          <div className="space-y-4 p-3" aria-hidden>{[0, 1, 2, 3].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2 pt-1"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>)}</div>
        ) : conversas.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-beon-tint text-beon-red"><MessageCircle className="h-6 w-6" aria-hidden /></span>
            <p className="mt-3 font-semibold text-beon-ink">Nenhuma conversa ainda</p>
            <p className="mt-1 text-sm text-beon-muted">Toque em alguém online, busque uma pessoa acima ou use “Mensagem” num perfil ou publicação.</p>
          </div>
        ) : lista.length === 0 ? (
          <p className="p-4 text-center text-sm text-beon-muted">Tudo lido por aqui.</p>
        ) : (
          <ul className="space-y-0.5">
            {lista.map(c => {
              const m = member(c.com)
              const nome = m?.nome ?? c.com
              const ativa = atual === c.com
              return (
                <li key={c.id}>
                  <Link href={`${pathname}?com=${encodeURIComponent(c.com)}`} aria-current={ativa ? 'page' : undefined}
                    className={cx('relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors', ativa ? 'bg-beon-tint' : 'hover:bg-beon-soft', focusRing)}>
                    {ativa && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-beon-red" aria-hidden />}
                    <Avatar nome={nome} src={m?.avatar} size={48} ativo={m?.ativoAgora} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cx('truncate text-[15px] text-beon-ink', c.naoLidas ? 'font-bold' : 'font-semibold')}>{nome}</span>
                        {c.ultima && <span className={cx('shrink-0 text-[11px]', c.naoLidas ? 'font-semibold text-beon-red' : 'text-beon-muted')}>{tempoRelativo(c.ultima.createdAt)}</span>}
                      </span>
                      {descricao(m) && <span className="block truncate text-[11px] text-beon-muted">{descricao(m)}</span>}
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cx('truncate text-[13px]', c.naoLidas ? 'font-medium text-beon-ink' : 'text-beon-body')}>
                          {c.ultima?.from === me?.username ? <span className="text-beon-muted">Você: </span> : ''}{c.ultima?.text}
                        </span>
                        {c.naoLidas > 0 && <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-beon-red px-1.5 text-[11px] font-bold tabular-nums text-white">{c.naoLidas}</span>}
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

// ── Conversa ───────────────────────────────────────────────────────────────────────────────────────────────

function rotuloDoDia(iso: string, agora = new Date()) {
  const d = new Date(iso)
  const ontem = new Date(agora.getTime() - 86_400_000)
  if (d.toDateString() === agora.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  const t = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== agora.getFullYear() ? { year: 'numeric' } : {}) })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Quem está do outro lado: o começo de toda conversa, com o que vocês têm em comum e ideias para puxar assunto. */
function CartaoDaPessoa({ outro, nome, comuns, vazia, onSugestao }: {
  outro?: MemberPublic | null; nome: string; comuns: string[]; vazia: boolean; onSugestao: (t: string) => void
}) {
  const primeiro = primeiroNome(nome)
  const sugestoes = [
    `Oi, ${primeiro}! Tudo bem? Queria trocar uma ideia com você.`,
    comuns[0] ? `Oi, ${primeiro}! Vi que você também se interessa por ${topicLabel(comuns[0])}. Bora trocar referências?` : null,
    outro?.especialidade ? `Oi, ${primeiro}! Estou explorando algo ligado a ${outro.especialidade} e queria sua opinião.` : null,
  ].filter((s): s is string => !!s)
  return (
    <div className="mx-auto mb-6 max-w-md text-center">
      <div className="mx-auto w-fit"><Avatar nome={nome} src={outro?.avatar} size={84} ativo={outro?.ativoAgora} /></div>
      <p className="mt-3 text-lg font-bold text-beon-ink">{nome}</p>
      {descricao(outro) && <p className="text-sm text-beon-muted">{descricao(outro)}</p>}
      {outro?.bio && <p className="mx-auto mt-2 line-clamp-3 max-w-sm text-[13px] leading-relaxed text-beon-body">{outro.bio}</p>}
      {comuns.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-beon-muted">Vocês têm em comum</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
            {comuns.slice(0, 4).map(t => <span key={t} className="rounded-full bg-beon-tint px-2.5 py-1 text-xs font-semibold text-beon-red">{topicLabel(t)}</span>)}
          </div>
        </div>
      )}
      <Link href={`/comunidade/pessoas/${encodeURIComponent(outro?.username ?? '')}`}
        className={cx('mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-beon-line px-3 text-xs font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
        <UserRound className="h-3.5 w-3.5" aria-hidden />Ver perfil
      </Link>
      {vazia && (
        <div className="mt-6 text-left">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-beon-muted"><Sparkles className="h-3.5 w-3.5 text-beon-red" aria-hidden />Para quebrar o gelo</p>
          <ul className="space-y-2">
            {sugestoes.map(s => (
              <li key={s}>
                <button type="button" onClick={() => onSugestao(s)}
                  className={cx('w-full rounded-2xl border border-beon-line bg-white px-4 py-2.5 text-left text-[13px] text-beon-body transition-colors hover:border-beon-red/40 hover:bg-beon-tint/50', focusRing)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] text-beon-muted">As mensagens ficam visíveis só para vocês dois.</p>
        </div>
      )}
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

  // Abrir a conversa marca como lida: a lista ao lado é atualizada logo depois da primeira leitura.
  useEffect(() => { setMensagens(null); setErro(null); setTexto(''); carregar().then(onActivity); inputRef.current?.focus() }, [com]) // eslint-disable-line react-hooks/exhaustive-deps
  usePolling(carregar, POLL_MS)
  useEffect(() => { fimRef.current?.scrollIntoView({ block: 'end' }) }, [mensagens?.length])

  const comuns = useMemo(() => {
    const meus = new Set([...(me?.profile.interesses ?? []), ...(me?.profile.topicosSeguidos ?? [])])
    return (outro?.interesses ?? []).filter(i => meus.has(i))
  }, [me, outro])

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
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="h-8 w-8 text-beon-muted" aria-hidden />
        <p className="mt-3 font-semibold text-beon-ink">Pessoa não encontrada</p>
        <p className="text-sm text-beon-muted">Ela pode não fazer mais parte da comunidade.</p>
      </div>
    )
  }
  const nome = outro?.nome ?? com
  const restante = MAX_MESSAGE_LENGTH - texto.length

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-beon-line bg-white/95 px-4 py-3 backdrop-blur">
        <Link href="/comunidade/mensagens" aria-label="Voltar às conversas" className={cx('rounded-full p-1.5 text-beon-body hover:bg-beon-soft md:hidden', focusRing)}>
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Link href={`/comunidade/pessoas/${encodeURIComponent(com)}`} className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-xl', focusRing)}>
          <Avatar nome={nome} src={outro?.avatar} size={42} ativo={outro?.ativoAgora} />
          <span className="min-w-0">
            <span className="block truncate font-bold text-beon-ink">{nome}</span>
            <span className={cx('flex items-center gap-1.5 truncate text-xs', outro?.ativoAgora ? 'font-semibold text-emerald-700' : 'text-beon-muted')}>
              {outro?.ativoAgora && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />}
              {status(outro)}{descricao(outro) ? <span className="font-normal text-beon-muted"> · {descricao(outro)}</span> : null}
            </span>
          </span>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8" aria-live="polite">
        {erro && !mensagens ? <ErrorState message={erro} onRetry={carregar} /> : !mensagens ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-beon-muted" aria-label="Carregando mensagens" /></div>
        ) : (
          <>
            <CartaoDaPessoa outro={outro} nome={nome} comuns={comuns} vazia={mensagens.length === 0}
              onSugestao={t => { setTexto(t); inputRef.current?.focus() }} />
            <ol className="mx-auto max-w-3xl space-y-1">
              {mensagens.map((m, i) => {
                const minha = m.from === me?.username
                const anterior = mensagens[i - 1]
                const proxima = mensagens[i + 1]
                const novoDia = !anterior || new Date(anterior.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
                const inicioBloco = novoDia || anterior.from !== m.from
                const fimBloco = !proxima || proxima.from !== m.from || new Date(proxima.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
                return (
                  <li key={m.id}>
                    {novoDia && (
                      <div className="my-4 flex items-center gap-3" role="separator">
                        <span className="h-px flex-1 bg-beon-line" />
                        <span className="rounded-full bg-beon-soft px-3 py-1 text-[11px] font-semibold text-beon-muted">{rotuloDoDia(m.createdAt)}</span>
                        <span className="h-px flex-1 bg-beon-line" />
                      </div>
                    )}
                    <div className={cx('flex items-end gap-2', minha ? 'justify-end' : 'justify-start', inicioBloco && !novoDia && 'pt-2')}>
                      {!minha && (fimBloco ? <Avatar nome={nome} src={outro?.avatar} size={28} /> : <span className="w-7 shrink-0" aria-hidden />)}
                      <div className={cx('max-w-[75%] px-3.5 py-2 text-[15px] leading-snug shadow-sm',
                        minha ? 'bg-gradient-to-br from-beon-red to-[#B01407] text-white' : 'border border-beon-line bg-white text-beon-ink',
                        minha ? cx('rounded-2xl', !fimBloco && 'rounded-br-md', !inicioBloco && 'rounded-tr-md', fimBloco && 'rounded-br-sm')
                          : cx('rounded-2xl', !fimBloco && 'rounded-bl-md', !inicioBloco && 'rounded-tl-md', fimBloco && 'rounded-bl-sm'),
                        m.estado === 'enviando' && 'opacity-60')}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        {fimBloco && (
                          <p className={cx('mt-0.5 text-right text-[10px]', minha ? 'text-white/75' : 'text-beon-muted')}>
                            {m.estado === 'enviando' ? 'Enviando…' : horaCurta(m.createdAt)}
                          </p>
                        )}
                      </div>
                      {m.estado === 'falhou' && (
                        <button type="button" onClick={() => enviar(m.text, m.id)} className="inline-flex items-center gap-1 self-center text-xs font-medium text-red-700 hover:underline">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden /> Falhou · <RotateCw className="h-3 w-3" aria-hidden /> Reenviar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={submit} className="border-t border-beon-line bg-white px-3 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[26px] border border-beon-line bg-beon-soft/60 p-1.5 pl-4 focus-within:border-beon-ink/30 focus-within:bg-white">
          <label htmlFor="nova-mensagem" className="sr-only">Mensagem para {nome}</label>
          <textarea ref={inputRef} id="nova-mensagem" rows={1} value={texto} maxLength={MAX_MESSAGE_LENGTH} onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
            placeholder={`Mensagem para ${primeiroNome(nome)}…`}
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] text-beon-ink placeholder:text-beon-muted focus:outline-none [field-sizing:content]" />
          <button type="submit" disabled={!texto.trim()} aria-label="Enviar mensagem"
            className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beon-red text-white transition-transform enabled:hover:scale-105 disabled:bg-beon-line disabled:text-beon-muted', focusRing)}>
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mx-auto mt-1.5 flex max-w-3xl justify-between px-3 text-[11px] text-beon-muted">
          <span>Enter envia · Shift+Enter quebra a linha</span>
          {restante < 200 && <span className={cx('tabular-nums', restante < 50 && 'text-red-700')}>{restante} caracteres</span>}
        </p>
      </form>
    </div>
  )
}

/** Sem conversa aberta: quem você pode chamar agora, a começar por quem tem interesses em comum. */
function ComecarConversa() {
  const { me, members } = useCommunity()
  const pathname = usePathname()
  const lista = members.data ?? []
  const sugeridas = me ? sugerirPessoas(lista, { username: me.username, interesses: [...me.profile.interesses, ...me.profile.topicosSeguidos], seguidos: [] }, 4) : []
  const online = lista.filter(m => m.ativoAgora && m.username !== me?.username)
  const pessoas = [...sugeridas.map(s => ({ m: s.m, motivo: `Também curte ${topicLabel(s.comuns[0])}` })),
    ...online.filter(m => !sugeridas.some(s => s.m.username === m.username)).map(m => ({ m, motivo: 'Online agora' }))].slice(0, 4)
  return (
    <div className="flex h-full items-center justify-center bg-white p-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex w-fit -space-x-3">
          {(pessoas.length ? pessoas.map(p => p.m) : lista.filter(m => m.username !== me?.username).slice(0, 4)).map(m => (
            <span key={m.username} className="rounded-full ring-4 ring-white"><Avatar nome={m.nome} src={m.avatar} size={52} /></span>
          ))}
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-beon-ink">Suas conversas</h2>
        <p className="mt-1 text-sm text-beon-muted">Escolha uma conversa ao lado ou chame alguém para trocar ideias.</p>
        {pessoas.length > 0 && (
          <ul className="mt-6 space-y-2 text-left">
            {pessoas.map(({ m, motivo }) => (
              <li key={m.username}>
                <Link href={`${pathname}?com=${encodeURIComponent(m.username)}`}
                  className={cx('flex items-center gap-3 rounded-2xl border border-beon-line px-3 py-2.5 transition-colors hover:border-beon-red/40 hover:bg-beon-tint/40', focusRing)}>
                  <Avatar nome={m.nome} src={m.avatar} size={40} ativo={m.ativoAgora} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-beon-ink">{m.nome}</span>
                    <span className="block truncate text-xs text-beon-muted">{motivo}</span>
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-beon-ink px-3 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" aria-hidden />Conversar</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
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
      <div className={cx('w-full shrink-0 border-r border-beon-line md:w-80 lg:w-[380px]', com && 'hidden md:block')}>
        <ConversationList conversas={conversas} erro={erro} atual={com} onRetry={carregar} />
      </div>
      <div className={cx('min-w-0 flex-1', !com && 'hidden md:block')}>
        {com ? <Thread com={com} onActivity={carregar} /> : <ComecarConversa />}
      </div>
    </div>
  )
}

export default function MensagensPage() {
  return <Suspense fallback={null}><Mensagens /></Suspense>
}
