'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Bookmark, Check, Plus, UsersRound } from 'lucide-react'
import { COMMUNITY_TOPICS } from '@/lib/community/topics'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageColumns, PageHeader } from '@/components/comunidade/Page'
import { FollowButton } from '@/components/comunidade/DiscoveryRail'
import { PostItem, PostSkeleton } from '@/components/comunidade/PostItem'
import { Avatar, EmptyState, cx, focusRing } from '@/components/ui'
import { topicIcon } from '@/components/comunidade/visuals'

type Aba = 'publicacoes' | 'topicos' | 'pessoas'
const ABAS: { id: Aba; label: string }[] = [
  { id: 'publicacoes', label: 'Publicações salvas' },
  { id: 'topicos', label: 'Tópicos' },
  { id: 'pessoas', label: 'Pessoas que sigo' },
]

export default function SalvosPage() {
  const { me, posts, member, patchProfile } = useCommunity()
  const [aba, setAba] = useState<Aba>('publicacoes')
  const salvos = useMemo(() => {
    const ids = me?.profile.salvos ?? []
    return (posts.data ?? []).filter(p => ids.includes(p.id)).sort((a, b) => ids.indexOf(b.id) - ids.indexOf(a.id))
  }, [me?.profile.salvos, posts.data])
  const seguidas = (me?.profile.pessoasSeguidas ?? []).map(u => member(u)).filter(Boolean)
  const topicos = me?.profile.topicosSeguidos ?? []

  return (
    <PageColumns>
      <PageHeader eyebrow="Salvos e seguidos" title="Seu espaço" description="O que você guardou para depois e o que você acompanha." />
      <div role="tablist" className="flex gap-6 overflow-x-auto border-b border-beon-line px-4 [scrollbar-width:none] sm:px-6">
        {ABAS.map(a => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={cx('shrink-0 border-b-2 py-3 text-sm', aba === a.id ? 'border-beon-red font-semibold text-beon-ink' : 'border-transparent text-beon-muted hover:text-beon-ink')}>
            {a.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {aba === 'publicacoes' && (!posts.data ? <PostSkeleton /> : salvos.length === 0 ? (
          <EmptyState icon={Bookmark} title="Nada salvo ainda">Use “Salvar” em uma publicação ou material para encontrá-lo aqui depois.</EmptyState>
        ) : salvos.map(p => <PostItem key={p.id} post={p} />))}

        {aba === 'topicos' && (
          <div className="px-4 py-5 sm:px-6">
            <p className="mb-4 text-sm text-beon-muted">Tópicos acompanhados aparecem como atalhos no menu e reforçam o feed “Para você” e “Seguindo”.</p>
            <ul className="divide-y divide-beon-line">
              {COMMUNITY_TOPICS.map(t => {
                const Icon = topicIcon(t.id)
                const seguindo = topicos.includes(t.id)
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 shrink-0 text-beon-muted" aria-hidden />
                    <Link href={`/comunidade?topico=${t.id}`} className="min-w-0 flex-1 rounded-lg hover:underline">
                      <span className="block text-sm font-semibold text-beon-ink">{t.label}</span>
                      <span className="block truncate text-xs text-beon-muted">{t.descricao}</span>
                    </Link>
                    <button type="button" aria-pressed={seguindo}
                      onClick={() => patchProfile({ toggleTopico: t.id }, p => ({ ...p, topicosSeguidos: seguindo ? p.topicosSeguidos.filter(x => x !== t.id) : [...p.topicosSeguidos, t.id] }))}
                      className={cx('inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium', seguindo ? 'bg-beon-soft text-beon-body' : 'border border-beon-ink/80 text-beon-ink hover:bg-beon-ink hover:text-white', focusRing)}>
                      {seguindo ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                      {seguindo ? 'Acompanhando' : 'Acompanhar'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {aba === 'pessoas' && (seguidas.length === 0 ? (
          <EmptyState icon={UsersRound} title="Você ainda não segue ninguém"
            action={<Link href="/comunidade/pessoas" className="text-sm font-medium text-beon-red hover:underline">Descobrir pessoas</Link>}>
            As publicações de quem você segue aparecem primeiro no feed.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-beon-line px-4 sm:px-6">
            {seguidas.map(m => m && (
              <li key={m.username} className="flex items-center gap-3 py-3">
                <Link href={`/comunidade/pessoas/${encodeURIComponent(m.username)}`} className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-xl', focusRing)}>
                  <Avatar nome={m.nome} src={m.avatar} size={42} ativo={m.ativoAgora} />
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{m.nome}</span><span className="block truncate text-xs text-beon-muted">{m.especialidade || m.laboratorio}</span></span>
                </Link>
                <FollowButton username={m.username} nome={m.nome} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </PageColumns>
  )
}
