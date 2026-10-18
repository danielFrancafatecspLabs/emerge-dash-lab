'use client'

// Painel auxiliar do feed: quem está ativo, pessoas para conhecer, tópicos em alta,
// encontros da comunidade e os destaques mais recentes de Pesquisas e Future Thinking.

import Link from 'next/link'
import { useMemo } from 'react'
import { CalendarDays, MessageCircle, Plus, Check } from 'lucide-react'
import { postTitle, trendingTopics } from '@/lib/community/model'
import { topicLabel } from '@/lib/community/topics'
import type { MemberPublic } from '@/lib/community/server'
import { useCommunity } from './CommunityProvider'
import { tempoRelativo } from './format'
import { Avatar, SectionTitle, Skeleton, cx, focusRing } from '@/components/ui'
import { KIND_STYLE, topicIcon } from './visuals'

export const ENCONTROS = [
  { nome: 'Comunidade de Experimentação', quando: 'Quartas, 14h · quinzenal', nota: 'Alterna com o Fórum de Tecnologia' },
  { nome: 'Fórum de Tecnologia', quando: 'Quartas, 14h · quinzenal', nota: 'Tecnologias emergentes e oportunidades' },
  { nome: 'Comitê de Tecnologias Emergentes', quando: 'Terças · mensal', nota: 'Tendências e alinhamento estratégico' },
]

export function sugerirPessoas(members: MemberPublic[], me: { username: string; interesses: string[]; seguidos: string[] }, limite = 3) {
  const meus = new Set(me.interesses)
  return members
    .filter(m => m.username !== me.username && !me.seguidos.includes(m.username))
    .map(m => ({ m, comuns: m.interesses.filter(i => meus.has(i)) }))
    .filter(x => x.comuns.length > 0)
    .sort((a, b) => b.comuns.length - a.comuns.length || Number(b.m.ativoAgora) - Number(a.m.ativoAgora))
    .slice(0, limite)
}

export function FollowButton({ username, nome }: { username: string; nome: string }) {
  const { me, patchProfile } = useCommunity()
  if (!me || me.username === username) return null
  const seguindo = me.profile.pessoasSeguidas.includes(username)
  return (
    <button
      type="button"
      aria-pressed={seguindo}
      aria-label={seguindo ? `Deixar de seguir ${nome}` : `Seguir ${nome}`}
      onClick={() => patchProfile({ togglePessoa: username }, p => ({
        ...p, pessoasSeguidas: seguindo ? p.pessoasSeguidas.filter(u => u !== username) : [...p.pessoasSeguidas, username],
      }))}
      className={cx(
        'inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition-colors',
        seguindo ? 'bg-beon-soft text-beon-body hover:bg-stone-200' : 'border border-beon-ink/80 text-beon-ink hover:bg-beon-ink hover:text-white',
        focusRing,
      )}
    >
      {seguindo ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
      {seguindo ? 'Seguindo' : 'Seguir'}
    </button>
  )
}

function MessageLink({ username, nome }: { username: string; nome: string }) {
  return (
    <Link href={`/comunidade/mensagens?com=${encodeURIComponent(username)}`} aria-label={`Enviar mensagem para ${nome}`}
      className={cx('inline-flex h-8 w-8 items-center justify-center rounded-full text-beon-muted hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
      <MessageCircle className="h-4 w-4" aria-hidden />
    </Link>
  )
}

function PersonRow({ m, detalhe, action }: { m: MemberPublic; detalhe: string; action?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <Link href={`/comunidade/pessoas/${encodeURIComponent(m.username)}`} className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-xl', focusRing)}>
        <Avatar nome={m.nome} src={m.avatar} size={38} ativo={m.ativoAgora} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-beon-ink">{m.nome}</span>
          <span className="block truncate text-xs text-beon-muted">{detalhe}</span>
        </span>
      </Link>
      {action}
    </li>
  )
}

export function DiscoveryRail() {
  const { me, members, posts } = useCommunity()
  const lista = members.data ?? []

  const ativos = useMemo(() => {
    const dia = Date.now() - 86_400_000
    return lista
      .filter(m => m.username !== me?.username && m.ultimoAcesso && Date.parse(m.ultimoAcesso) > dia)
      .sort((a, b) => Date.parse(b.ultimoAcesso!) - Date.parse(a.ultimoAcesso!))
      .slice(0, 5)
  }, [lista, me?.username])

  const sugestoes = useMemo(() => (me ? sugerirPessoas(lista, {
    username: me.username,
    interesses: [...me.profile.interesses, ...me.profile.topicosSeguidos],
    seguidos: me.profile.pessoasSeguidas,
  }) : []), [lista, me])

  const emAlta = useMemo(() => trendingTopics(posts.data ?? []), [posts.data])
  const destaques = useMemo(() => {
    const all = posts.data ?? []
    return (['pesquisa', 'sinal', 'experimento'] as const)
      .map(kind => all.filter(p => p.kind === kind).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0])
      .filter(Boolean)
  }, [posts.data])

  return (
    <div className="space-y-8 pr-2">
      <section>
        <SectionTitle>Ativos recentemente</SectionTitle>
        {members.loading && !members.data ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : ativos.length === 0 ? (
          <p className="text-sm text-beon-muted">Ninguém mais passou por aqui nas últimas 24 horas.</p>
        ) : (
          <ul className="space-y-3">
            {ativos.map(m => (
              <PersonRow key={m.username} m={m}
                detalhe={m.ativoAgora ? 'Ativo agora' : `Visto ${tempoRelativo(m.ultimoAcesso!)}`}
                action={<MessageLink username={m.username} nome={m.nome} />} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle action={<Link href="/comunidade/pessoas" className="text-xs font-medium text-beon-muted hover:text-beon-ink">Ver todas</Link>}>
          Pessoas para conhecer
        </SectionTitle>
        {sugestoes.length === 0 ? (
          <p className="text-sm text-beon-muted">
            {me && me.profile.interesses.length === 0
              ? <>Escolha seus interesses no <Link className="font-medium text-beon-ink underline-offset-2 hover:underline" href={`/comunidade/pessoas/${encodeURIComponent(me.username)}`}>seu perfil</Link> para receber sugestões.</>
              : 'Ainda não há outras pessoas com os mesmos interesses. Veja todas em Pessoas.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {sugestoes.map(({ m, comuns }) => (
              <PersonRow key={m.username} m={m}
                detalhe={`Também se interessa por ${topicLabel(comuns[0])}${comuns.length > 1 ? ` +${comuns.length - 1}` : ''}`}
                action={<FollowButton username={m.username} nome={m.nome} />} />
            ))}
          </ul>
        )}
      </section>

      {emAlta.length > 0 && (
        <section>
          <SectionTitle>Em alta nos últimos 30 dias</SectionTitle>
          <ul className="space-y-1">
            {emAlta.map(({ topic, count }) => {
              const Icon = topicIcon(topic)
              return (
                <li key={topic}>
                  <Link href={`/comunidade?topico=${topic}`} className={cx('-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-beon-soft', focusRing)}>
                    <Icon className="h-4 w-4 text-beon-muted" aria-hidden />
                    <span className="flex-1 text-sm font-medium text-beon-ink">{topicLabel(topic)}</span>
                    <span className="text-xs tabular-nums text-beon-muted">{count} {count === 1 ? 'atividade' : 'atividades'}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {destaques.length > 0 && (
        <section>
          <SectionTitle>Novidades</SectionTitle>
          <ul className="space-y-3">
            {destaques.map(p => {
              const { icon: Icon, accent } = KIND_STYLE[p.kind]
              return (
                <li key={p.id}>
                  <Link href={`/comunidade/post/${p.id}`} className={cx('group -mx-2 flex gap-3 rounded-lg px-2 py-1.5 hover:bg-beon-soft', focusRing)}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-beon-ink group-hover:underline">{postTitle(p)}</span>
                      <span className="text-xs text-beon-muted">{p.authorName} · {tempoRelativo(p.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>Encontros da comunidade</SectionTitle>
        <ul className="space-y-3">
          {ENCONTROS.map(e => (
            <li key={e.nome} className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-beon-red" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-beon-ink">{e.nome}</span>
                <span className="block text-xs text-beon-muted">{e.quando} · {e.nota}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-beon-muted">Os convites chegam pelo calendário corporativo.</p>
      </section>
    </div>
  )
}
