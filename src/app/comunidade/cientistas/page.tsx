'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MessageCircle, Search, UsersRound } from 'lucide-react'
import { COMMUNITY_TOPICS, topicLabel } from '@/lib/community-topics'
import type { MemberPublic } from '@/lib/community-server'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageHeader } from '@/components/comunidade/CommunityShell'
import { FollowButton, sugerirPessoas } from '@/components/comunidade/DiscoveryRail'
import { tempoRelativo } from '@/components/comunidade/format'
import { Avatar, Chip, EmptyState, ErrorState, SectionTitle, Skeleton, cx, focusRing, inputClass } from '@/components/comunidade/ui'

function normalizar(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function PersonCard({ m, motivo }: { m: MemberPublic; motivo?: string }) {
  const { me } = useCommunity()
  const perfil = `/comunidade/cientistas/${encodeURIComponent(m.username)}`
  return (
    <li className="flex flex-col rounded-2xl border border-comm-line p-5 transition-colors hover:border-comm-muted/40">
      <div className="flex items-start gap-3.5">
        <Link href={perfil} className={cx('rounded-full', focusRing)} aria-label={`Perfil de ${m.nome}`}>
          <Avatar nome={m.nome} src={m.avatar} size={52} ativo={m.ativoAgora} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={perfil} className="block truncate text-[15px] font-semibold text-comm-ink hover:underline">{m.nome}</Link>
          <p className="truncate text-sm text-comm-body">{[m.cargo, m.especialidade].filter(Boolean).join(' · ') || 'Membro da comunidade'}</p>
          <p className="truncate text-xs text-comm-muted">
            {m.laboratorio || 'Laboratório não informado'}
            {m.ativoAgora ? ' · ativo agora' : m.ultimoAcesso ? ` · visto ${tempoRelativo(m.ultimoAcesso)}` : ''}
          </p>
        </div>
      </div>
      {m.bio && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-comm-body">{m.bio}</p>}
      {m.interesses.length > 0 && (
        <p className="mt-3 text-[13px] text-comm-muted">{m.interesses.slice(0, 3).map(topicLabel).join(' · ')}{m.interesses.length > 3 ? ` +${m.interesses.length - 3}` : ''}</p>
      )}
      {motivo && <p className="mt-2 text-xs font-medium text-comm-red">{motivo}</p>}
      <div className="mt-auto flex items-center gap-2 pt-4">
        {me?.username !== m.username ? (
          <>
            <Link href={`/comunidade/mensagens?com=${encodeURIComponent(m.username)}`}
              className={cx('inline-flex h-8 items-center gap-1.5 rounded-full bg-comm-soft px-3 text-[13px] font-medium text-comm-ink hover:bg-stone-200', focusRing)}>
              <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Mensagem
            </Link>
            <FollowButton username={m.username} nome={m.nome} />
          </>
        ) : <span className="text-xs text-comm-muted">Você</span>}
        <span className="ml-auto whitespace-nowrap text-xs text-comm-muted">{m.publicacoes} {m.publicacoes === 1 ? 'publicação' : 'publicações'}</span>
      </div>
    </li>
  )
}

export default function CientistasPage() {
  const { me, members, reloadMembers } = useCommunity()
  const [busca, setBusca] = useState('')
  const [interesse, setInteresse] = useState<string | null>(null)
  const [lab, setLab] = useState('')

  const lista = members.data ?? []
  const labs = useMemo(() => [...new Set(lista.map(m => m.laboratorio).filter(Boolean))].sort(), [lista])
  const filtrando = !!busca.trim() || !!interesse || !!lab

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim())
    return lista.filter(m =>
      (!interesse || m.interesses.includes(interesse))
      && (!lab || m.laboratorio === lab)
      && (!q || normalizar([m.nome, m.cargo, m.especialidade, m.laboratorio, m.bio, ...m.interesses.map(topicLabel)].join(' ')).includes(q)))
  }, [lista, busca, interesse, lab])

  const sugestoes = useMemo(() => (me ? sugerirPessoas(lista, {
    username: me.username, interesses: [...me.profile.interesses, ...me.profile.topicosSeguidos], seguidos: me.profile.pessoasSeguidas,
  }, 3) : []), [lista, me])

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader eyebrow="Cientista" title="Quem constrói conhecimento aqui"
        description="Encontre especialistas, autores de experimentos e pessoas com interesses parecidos com os seus." />

      <div className="space-y-3 px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-comm-muted" aria-hidden />
            <label htmlFor="busca-pessoas" className="sr-only">Buscar pessoas</label>
            <input id="busca-pessoas" type="search" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Busque por nome, especialidade, tecnologia ou laboratório" className={cx(inputClass, 'rounded-full pl-10')} />
          </div>
          {labs.length > 1 && (
            <>
              <label htmlFor="filtro-lab" className="sr-only">Laboratório</label>
              <select id="filtro-lab" value={lab} onChange={e => setLab(e.target.value)} className={cx(inputClass, 'rounded-full sm:w-56')}>
                <option value="">Todos os laboratórios</option>
                {labs.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por interesse">
          <Chip selected={!interesse} onClick={() => setInteresse(null)}>Todos os interesses</Chip>
          {COMMUNITY_TOPICS.map(t => <Chip key={t.id} selected={interesse === t.id} onClick={() => setInteresse(interesse === t.id ? null : t.id)}>{t.label}</Chip>)}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6">
        {members.error && !members.data ? <ErrorState message={members.error} onRetry={reloadMembers} /> : members.loading && !members.data ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</ul>
        ) : (
          <>
            {!filtrando && sugestoes.length > 0 && (
              <section className="mb-10">
                <SectionTitle>Com interesses parecidos com os seus</SectionTitle>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sugestoes.map(({ m, comuns }) => <PersonCard key={m.username} m={m} motivo={`Em comum: ${comuns.map(topicLabel).join(', ')}`} />)}
                </ul>
              </section>
            )}
            <section>
              <SectionTitle>{filtrando ? `${filtrados.length} ${filtrados.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}` : 'Todas as pessoas'}</SectionTitle>
              {filtrados.length === 0 ? (
                <EmptyState icon={UsersRound} title="Ninguém com esse perfil por enquanto">
                  Tente outro termo ou interesse. Os perfis ficam mais completos conforme cada pessoa preenche especialidade e interesses.
                </EmptyState>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtrados.map(m => <PersonCard key={m.username} m={m} />)}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
