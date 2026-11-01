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

const primeiroNome = (nome: string) => nome.split(' ')[0]
const subtitulo = (m: MemberPublic) => m.especialidade || m.cargo || m.laboratorio || m.area

/**
 * Quem está por aqui: quem está ativo agora em destaque (fotos com anel verde), depois quem passou nas últimas 24 horas.
 * Se ninguém passou no dia, mostra quem passou na semana, para o painel nunca ficar vazio à toa.
 */
function QuemEstaPorAqui({ lista, eu, carregando }: { lista: MemberPublic[]; eu?: string; carregando: boolean }) {
  const { agora, recentes, janela } = useMemo(() => {
    const outros = lista.filter(m => m.username !== eu && m.ultimoAcesso)
      .sort((a, b) => Date.parse(b.ultimoAcesso!) - Date.parse(a.ultimoAcesso!))
    const agora = outros.filter(m => m.ativoAgora)
    const dia = outros.filter(m => !m.ativoAgora && Date.parse(m.ultimoAcesso!) > Date.now() - 86_400_000)
    if (agora.length || dia.length) return { agora, recentes: dia.slice(0, 5), janela: 'hoje' as const }
    return { agora, recentes: outros.filter(m => Date.parse(m.ultimoAcesso!) > Date.now() - 7 * 86_400_000).slice(0, 5), janela: 'semana' as const }
  }, [lista, eu])

  return (
    <section className="overflow-hidden rounded-3xl border border-beon-line bg-white" aria-labelledby="t-quem">
      <header className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <h2 id="t-quem" className="flex items-center gap-2 text-[15px] font-bold text-beon-ink">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            {agora.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
            <span className={cx('relative inline-flex h-2.5 w-2.5 rounded-full', agora.length ? 'bg-emerald-500' : 'bg-beon-line')} />
          </span>
          Quem está por aqui
        </h2>
        <span className="text-xs font-medium text-beon-muted">
          {agora.length ? `${agora.length} online` : janela === 'hoje' ? 'hoje' : 'nesta semana'}
        </span>
      </header>

      {carregando ? (
        <div className="flex gap-3 px-4 pb-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-14 rounded-full" />)}</div>
      ) : !agora.length && !recentes.length ? (
        <div className="px-4 pb-5 text-center">
          <div className="mx-auto flex w-fit -space-x-2" aria-hidden>
            {['#FDE2DF', '#E0F2EF', '#E6EEF8'].map(c => <span key={c} className="h-10 w-10 rounded-full border-2 border-white" style={{ background: c }} />)}
          </div>
          <p className="mt-3 text-sm text-beon-body">Ninguém passou por aqui nos últimos dias.</p>
          <Link href="/comunidade/pessoas" className={cx('mt-3 inline-flex h-9 items-center rounded-full bg-beon-ink px-4 text-[13px] font-semibold text-white', focusRing)}>
            Conhecer as pessoas
          </Link>
        </div>
      ) : (
        <>
          {agora.length > 0 && (
            <ul className="flex gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
              {agora.slice(0, 8).map(m => (
                <li key={m.username} className="shrink-0">
                  <Link href={`/comunidade/pessoas/${encodeURIComponent(m.username)}`} title={`${m.nome}${subtitulo(m) ? ` · ${subtitulo(m)}` : ''}`}
                    className={cx('group flex w-14 flex-col items-center gap-1.5 rounded-2xl', focusRing)}>
                    <span className="rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-[2.5px] transition-transform group-hover:scale-105">
                      <span className="block rounded-full bg-white p-[2px]"><Avatar nome={m.nome} src={m.avatar} size={46} /></span>
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium text-beon-body">{primeiroNome(m.nome)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {recentes.length > 0 && (
            <div className="border-t border-beon-line bg-beon-soft/40 px-2 py-2">
              <p className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-beon-muted">{janela === 'hoje' ? 'Passaram hoje' : 'Passaram nesta semana'}</p>
              <ul>
                {recentes.map(m => (
                  <li key={m.username} className="group flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white">
                    <Link href={`/comunidade/pessoas/${encodeURIComponent(m.username)}`} className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-xl', focusRing)}>
                      <Avatar nome={m.nome} src={m.avatar} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-beon-ink">{m.nome}</span>
                        <span className="block truncate text-xs text-beon-muted">{subtitulo(m) || 'Comunidade beOn Labs'}</span>
                      </span>
                    </Link>
                    <span className="shrink-0 text-[11px] tabular-nums text-beon-muted group-hover:hidden">{tempoRelativo(m.ultimoAcesso!)}</span>
                    <span className="hidden group-hover:block group-focus-within:block"><MessageLink username={m.username} nome={m.nome} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function DiscoveryRail() {
  const { me, members, posts } = useCommunity()
  const lista = useMemo(() => members.data ?? [], [members.data])

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
      <QuemEstaPorAqui lista={lista} eu={me?.username} carregando={members.loading && !members.data} />

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
