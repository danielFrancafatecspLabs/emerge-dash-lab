'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, MessageCircle, PenLine, UserX, Inbox } from 'lucide-react'
import { POST_KIND_LABEL, type PostKind } from '@/lib/community/model'
import { COMMUNITY_TOPICS, topicLabel } from '@/lib/community/topics'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { FollowButton } from '@/components/comunidade/DiscoveryRail'
import { tempoRelativo } from '@/components/comunidade/format'
import { PostItem } from '@/components/comunidade/PostItem'
import { Avatar, Button, Chip, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/comunidade/ui'
import { topicIcon } from '@/components/comunidade/visuals'

type Aba = 'todas' | PostKind

function EditarPerfil({ onDone }: { onDone: () => void }) {
  const { me, patchProfile, reloadMembers, toast } = useCommunity()
  const [form, setForm] = useState({
    cargo: me?.profile.cargo ?? '', especialidade: me?.profile.especialidade ?? '', bio: me?.profile.bio ?? '', interesses: me?.profile.interesses ?? [],
  })
  const [saving, setSaving] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const ok = await patchProfile(form)
    setSaving(false)
    if (ok) { reloadMembers(); toast('Perfil atualizado.'); onDone() }
  }
  const toggle = (id: string) => setForm(f => ({ ...f, interesses: f.interesses.includes(id) ? f.interesses.filter(x => x !== id) : [...f.interesses, id] }))
  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-comm-line p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-cargo" className="mb-1.5 block text-sm font-medium">Cargo</label>
          <input id="pf-cargo" className={inputClass} maxLength={80} value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex.: Engenheira de dados" />
        </div>
        <div>
          <label htmlFor="pf-esp" className="mb-1.5 block text-sm font-medium">Especialidade</label>
          <input id="pf-esp" className={inputClass} maxLength={80} value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Ex.: Visão computacional" />
        </div>
      </div>
      <div>
        <label htmlFor="pf-bio" className="mb-1.5 block text-sm font-medium">Apresentação</label>
        <textarea id="pf-bio" className={cx(inputClass, 'min-h-[88px]')} maxLength={400} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Em que você trabalha, o que está explorando e como pode ajudar a comunidade." />
        <p className="mt-1 text-xs text-comm-muted">{form.bio.length}/400</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Interesses</legend>
        <div className="flex flex-wrap gap-2">
          {COMMUNITY_TOPICS.map(t => <Chip key={t.id} selected={form.interesses.includes(t.id)} onClick={() => toggle(t.id)}>{t.label}</Chip>)}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" loading={saving}>Salvar perfil</Button>
      </div>
    </form>
  )
}

export default function PerfilPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username)
  const { me, member, members, posts, reloadMembers } = useCommunity()
  const [editando, setEditando] = useState(false)
  const [aba, setAba] = useState<Aba>('todas')
  const m = member(username)
  const souEu = me?.username === username

  const publicacoes = useMemo(() => (posts.data ?? []).filter(p => p.authorUsername === username), [posts.data, username])
  const contagem = useMemo(() => {
    const c: Partial<Record<PostKind, number>> = {}
    for (const p of publicacoes) c[p.kind] = (c[p.kind] ?? 0) + 1
    return c
  }, [publicacoes])
  const abas: Aba[] = ['todas', ...(Object.keys(contagem) as PostKind[])]
  const visiveis = aba === 'todas' ? publicacoes : publicacoes.filter(p => p.kind === aba)

  if (members.error && !members.data) return <ErrorState message={members.error} onRetry={reloadMembers} />
  if (members.loading && !members.data) {
    return <div className="mx-auto max-w-[760px] space-y-4 px-6 py-10" aria-busy><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="h-6 w-60" /><Skeleton className="h-4 w-96 max-w-full" /></div>
  }
  if (!m) {
    return <EmptyState icon={UserX} title="Perfil não encontrado" action={<Link href="/comunidade/pessoas" className="text-sm font-medium text-comm-red hover:underline">Ver todas as pessoas</Link>}>A pessoa pode ter saído da comunidade.</EmptyState>
  }

  const interesses = souEu ? (me?.profile.interesses ?? []) : m.interesses

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="px-2 pt-3 sm:px-4">
        <Link href="/comunidade/pessoas" className={cx('inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-comm-body hover:bg-comm-soft', focusRing)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Pessoas
        </Link>
      </div>

      <header className="border-b border-comm-line px-4 pb-8 pt-4 sm:px-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar nome={m.nome} src={m.avatar} size={88} ativo={m.ativoAgora} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{m.nome}</h1>
            <p className="mt-1 text-[15px] text-comm-body">{[m.cargo, m.especialidade].filter(Boolean).join(' · ') || (souEu ? 'Conte à comunidade o que você faz' : 'Membro da comunidade')}</p>
            <p className="mt-0.5 text-sm text-comm-muted">
              {m.laboratorio || 'Laboratório não informado'}
              {m.ativoAgora ? ' · ativo agora' : m.ultimoAcesso ? ` · visto ${tempoRelativo(m.ultimoAcesso)}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {souEu ? (
              !editando && <Button icon={PenLine} onClick={() => setEditando(true)}>Editar perfil</Button>
            ) : (
              <>
                <Link href={`/comunidade/mensagens?com=${encodeURIComponent(m.username)}`}
                  className={cx('inline-flex h-10 items-center gap-2 rounded-full bg-comm-red px-4 text-sm font-medium text-white hover:bg-comm-redhi', focusRing)}>
                  <MessageCircle className="h-4 w-4" aria-hidden /> Mensagem
                </Link>
                <FollowButton username={m.username} nome={m.nome} />
              </>
            )}
          </div>
        </div>

        {editando ? <EditarPerfil onDone={() => setEditando(false)} /> : (
          <>
            {m.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-comm-body">{m.bio}</p>}
            {interesses.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Interesses">
                {interesses.map(t => {
                  const Icon = topicIcon(t)
                  return (
                    <li key={t}>
                      <Link href={`/comunidade?topico=${t}`} className={cx('inline-flex h-8 items-center gap-1.5 rounded-full bg-comm-soft px-3 text-[13px] font-medium text-comm-body hover:text-comm-ink', focusRing)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden /> {topicLabel(t)}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
            {souEu && !m.bio && interesses.length === 0 && (
              <p className="mt-5 rounded-xl bg-comm-soft px-4 py-3 text-sm text-comm-body">
                Perfis com especialidade e interesses recebem e geram melhores conexões. <button type="button" onClick={() => setEditando(true)} className="font-medium text-comm-red hover:underline">Completar agora</button>
              </p>
            )}
          </>
        )}
      </header>

      <section aria-label="Contribuições">
        <div className="flex gap-5 overflow-x-auto border-b border-comm-line px-4 [scrollbar-width:none] sm:px-6" role="tablist">
          {abas.map(a => (
            <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
              className={cx('shrink-0 border-b-2 py-3 text-sm', aba === a ? 'border-comm-red font-semibold text-comm-ink' : 'border-transparent text-comm-muted hover:text-comm-ink')}>
              {a === 'todas' ? `Contribuições (${publicacoes.length})` : `${POST_KIND_LABEL[a]} (${contagem[a]})`}
            </button>
          ))}
        </div>
        {visiveis.length === 0 ? (
          <EmptyState icon={Inbox} title={souEu ? 'Você ainda não publicou' : 'Nenhuma contribuição ainda'}>
            {souEu ? 'Compartilhe uma pergunta, uma pesquisa ou o aprendizado de um experimento.' : 'Quando esta pessoa publicar, as contribuições aparecem aqui.'}
          </EmptyState>
        ) : visiveis.map(p => <PostItem key={p.id} post={p} />)}
      </section>
    </div>
  )
}
