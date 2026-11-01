'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import type { CommunityNotification, NotificationPrefs } from '@/lib/community/model'
import { AUTOMACAO_RADAR } from '@/lib/community/automacao'
import { BotaoAlertas } from '@/components/newsletter/Alertas'
import { api, errorMessage } from './api'
import { useCommunity } from './CommunityProvider'
import { tempoRelativo } from './format'
import { Avatar, Button, Dialog, EmptyState, ErrorState, Skeleton, cx, focusRing } from '@/components/ui'

interface NotificationsResponse {
  itens: CommunityNotification[]
  naoLidas: number
  mensagensNaoLidas: number
}

export function NotificationsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { patchProfile, refreshCounts, member } = useCommunity()
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await api<NotificationsResponse>('/community/notifications')
      setData(res)
      // Abrir a lista marca tudo como visto; os itens continuam destacados nesta abertura.
      if (res.naoLidas > 0) await patchProfile({ marcarNotificacoesVistas: true })
      refreshCounts()
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [patchProfile, refreshCounts])

  useEffect(() => {
    if (open) { setData(null); load() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} title="Notificações" description="Respostas às suas publicações e comentários e as notícias do dia no beOn Radar.">
      {error ? <ErrorState message={error} onRetry={load} /> : !data ? (
        <div className="space-y-4" aria-busy>
          {[0, 1, 2].map(i => <div key={i} className="flex gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/3" /></div></div>)}
        </div>
      ) : (
        <div className="space-y-1">
          {data.mensagensNaoLidas > 0 && (
            <Link href="/comunidade/mensagens" onClick={onClose} className={cx('mb-2 flex items-center gap-3 rounded-xl bg-beon-tint px-4 py-3 text-sm text-beon-ink', focusRing)}>
              <MessageCircle className="h-4 w-4 text-beon-red" aria-hidden />
              Você tem {data.mensagensNaoLidas} {data.mensagensNaoLidas === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
            </Link>
          )}
          {data.itens.length === 0 ? (
            <EmptyState icon={Bell} title="Tudo em dia">
              Quando alguém comentar suas publicações ou responder você, ou quando o beOn Radar trouxer as notícias do dia, o aviso aparece aqui.
            </EmptyState>
          ) : data.itens.map(n => (
            <Link
              key={n.id}
              href={`/comunidade/post/${n.postId}`}
              onClick={onClose}
              className={cx('flex gap-3 rounded-xl px-3 py-3 hover:bg-beon-soft', !n.lida && 'bg-beon-soft/60', focusRing)}
            >
              <Avatar nome={n.atorNome} src={n.tipo === 'noticia' ? AUTOMACAO_RADAR.avatar : member(n.ator)?.avatar} size={36} />
              <span className="min-w-0 flex-1 text-sm leading-snug text-beon-body">
                <strong className="font-semibold text-beon-ink">{n.tipo === 'noticia' ? 'beOn Radar' : n.atorNome}</strong>{' '}
                {n.tipo === 'noticia' ? 'trouxe uma notícia para discutir:' : n.tipo === 'resposta' ? 'respondeu seu comentário em' : 'comentou em'}{' '}
                <span className="font-medium text-beon-ink">“{n.postTitulo}”</span>
                <span className="mt-0.5 block text-xs text-beon-muted">{tempoRelativo(n.createdAt)}</span>
              </span>
              {!n.lida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-beon-red" aria-label="Nova" />}
            </Link>
          ))}
        </div>
      )}
    </Dialog>
  )
}

const PREF_LABEL: Record<keyof NotificationPrefs, [string, string]> = {
  comentarios: ['Comentários nas minhas publicações', 'Avise quando alguém comentar o que publiquei.'],
  respostas: ['Respostas aos meus comentários', 'Avise quando alguém responder diretamente a mim.'],
  mensagens: ['Mensagens diretas', 'Mostre o contador de mensagens não lidas.'],
  noticias: ['Notícias do beOn Radar', 'As notícias mais relevantes do dia nesta lista e uma por entrada como push (ou cartão no app).'],
}

export function NotificationPrefsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, patchProfile, refreshCounts, toast } = useCommunity()
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open && me) setPrefs(me.profile.notificacoes) }, [open, me])

  async function save() {
    if (!prefs) return
    setSaving(true)
    const ok = await patchProfile({ notificacoes: prefs })
    setSaving(false)
    if (ok) { refreshCounts(); toast('Preferências salvas.'); onClose() }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Preferências de notificação" description="Escolha o que merece sua atenção. Nada é enviado por e-mail.">
      {prefs && (
        <div className="space-y-1">
          {(Object.keys(PREF_LABEL) as (keyof NotificationPrefs)[]).map(key => (
            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-3 hover:bg-beon-soft">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#D31809]" checked={prefs[key]}
                onChange={e => setPrefs({ ...prefs, [key]: e.target.checked })} />
              <span>
                <span className="block text-sm font-medium text-beon-ink">{PREF_LABEL[key][0]}</span>
                <span className="block text-xs text-beon-muted">{PREF_LABEL[key][1]}</span>
              </span>
            </label>
          ))}
          <div className="mt-2 rounded-2xl border border-beon-line p-4">
            <p className="text-sm font-medium text-beon-ink">Push do beOn Radar neste navegador</p>
            <p className="mb-3 mt-0.5 text-xs leading-relaxed text-beon-muted">
              Uma notícia por vez, quando você entra (no máximo uma a cada 6 horas), com foto, fonte e a provocação da discussão.
            </p>
            <BotaoAlertas compacto />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" loading={saving} onClick={save}>Salvar</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
