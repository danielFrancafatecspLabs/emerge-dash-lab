'use client'

import { Suspense, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, FlaskConical, HelpCircle, Inbox, Radar, Search, X, Check, Plus } from 'lucide-react'
import { FEED_FILTER_LABEL, filterFeed, matchesSearch, type FeedFilter, type PostKind } from '@/lib/community/model'
import { COMMUNITY_TOPICS, isKnownTopic } from '@/lib/community/topics'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageColumns } from '@/components/comunidade/CommunityShell'
import { DiscoveryRail } from '@/components/comunidade/DiscoveryRail'
import { PostItem } from '@/components/comunidade/PostItem'
import { StoriesRail } from '@/components/comunidade/Stories'
import { Avatar, Button, EmptyState, ErrorState, PostSkeleton, cx, focusRing, inputClass } from '@/components/comunidade/ui'
import { topicIcon } from '@/components/comunidade/visuals'

const FILTROS = Object.keys(FEED_FILTER_LABEL) as FeedFilter[]
const PAGE = 15

const ATALHOS: { kind: PostKind; label: string; icon: typeof HelpCircle }[] = [
  { kind: 'pergunta', label: 'Pergunta', icon: HelpCircle },
  { kind: 'pesquisa', label: 'Pesquisa', icon: BookOpen },
  { kind: 'experimento', label: 'Experimento', icon: FlaskConical },
  { kind: 'sinal', label: 'Sinal', icon: Radar },
]

const VAZIO: Record<FeedFilter, [string, string]> = {
  'para-voce': ['Nada por aqui ainda', 'Seja a primeira pessoa a compartilhar algo com a comunidade.'],
  recentes: ['Nenhuma publicação ainda', 'Que tal começar com uma pergunta ou uma descoberta recente?'],
  'em-alta': ['Nada em alta nos últimos 14 dias', 'Publicações com comentários e marcações de “Útil” aparecem aqui.'],
  'sem-resposta': ['Todas as perguntas foram respondidas', 'Boa! Quando surgir uma pergunta sem resposta, ela aparece aqui.'],
  pesquisas: ['Nenhuma pesquisa compartilhada', 'Compartilhe um artigo, benchmark ou relatório que ajudou você.'],
  experimentos: ['Nenhum experimento compartilhado', 'Conte o que você testou e o que aprendeu — inclusive o que não deu certo.'],
  seguindo: ['Você ainda não segue ninguém', 'Siga pessoas e tópicos para montar um feed só com o que importa para você.'],
}

function Feed() {
  const { me, posts, reloadPosts, openComposer, patchProfile } = useCommunity()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [filtro, setFiltro] = useState<FeedFilter>('para-voce')
  const [busca, setBusca] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [limite, setLimite] = useState(PAGE)

  const topico = params.get('topico')
  const topicoValido = topico && isKnownTopic(topico) ? topico : null

  const resultado = useMemo(() => {
    if (!me || !posts.data) return null
    const base = topicoValido ? posts.data.filter(p => p.tags.includes(topicoValido)) : posts.data
    const r = filterFeed(base, filtro, {
      username: me.username,
      interesses: me.profile.interesses,
      topicosSeguidos: me.profile.topicosSeguidos,
      pessoasSeguidas: me.profile.pessoasSeguidas,
    })
    return { ...r, posts: r.posts.filter(p => matchesSearch(p, busca)) }
  }, [me, posts.data, filtro, busca, topicoValido])

  const escolher = (f: FeedFilter) => { setFiltro(f); setLimite(PAGE) }
  const limparTopico = () => router.push(pathname)
  const topicInfo = COMMUNITY_TOPICS.find(t => t.id === topicoValido)
  const seguindoTopico = !!topicoValido && !!me?.profile.topicosSeguidos.includes(topicoValido)
  const TopicIcon = topicoValido ? topicIcon(topicoValido) : null

  return (
    <PageColumns aside={<DiscoveryRail />}>
      <h1 className="sr-only">Comunidade beOn Labs</h1>
      <StoriesRail />

      {/* Criar publicação */}
      <div className="border-b border-comm-line px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {me && <Avatar nome={me.nome} src={me.avatar} size={40} />}
          <button type="button" onClick={() => openComposer()}
            className={cx('h-11 min-w-0 flex-1 truncate rounded-full border border-comm-line bg-comm-soft/60 px-4 text-left text-[15px] text-comm-muted transition-colors hover:bg-comm-soft', focusRing)}>
            <span className="sm:hidden">Compartilhe com a comunidade…</span>
            <span className="hidden sm:inline">Compartilhe uma descoberta, pergunta ou aprendizado…</span>
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1 pl-[52px]">
          {ATALHOS.map(({ kind, label, icon: Icon }) => (
            <button key={kind} type="button" onClick={() => openComposer({ kind, tags: topicoValido ? [topicoValido] : [] })}
              className={cx('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-comm-body hover:bg-comm-soft hover:text-comm-ink', focusRing)}>
              <Icon className="h-4 w-4 text-comm-muted" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      {topicInfo && TopicIcon && (
        <div className="flex items-center gap-3 border-b border-comm-line bg-comm-soft/50 px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-comm-red shadow-sm"><TopicIcon className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-comm-ink">{topicInfo.label}</p>
            <p className="truncate text-sm text-comm-muted">{topicInfo.descricao}</p>
          </div>
          <Button size="sm" variant={seguindoTopico ? 'secondary' : 'primary'} icon={seguindoTopico ? Check : Plus}
            onClick={() => patchProfile({ toggleTopico: topicInfo.id }, p => ({
              ...p, topicosSeguidos: seguindoTopico ? p.topicosSeguidos.filter(t => t !== topicInfo.id) : [...p.topicosSeguidos, topicInfo.id],
            }))}>
            {seguindoTopico ? 'Acompanhando' : 'Acompanhar'}
          </Button>
          <button type="button" onClick={limparTopico} aria-label="Remover filtro de tópico"
            className={cx('rounded-full p-2 text-comm-muted hover:bg-white hover:text-comm-ink', focusRing)}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="sticky top-14 z-10 border-b border-comm-line bg-white/95 backdrop-blur md:top-0">
        <div className="flex items-center gap-2 px-4 sm:px-6">
          <div role="tablist" aria-label="Filtrar o feed" className="-mb-px flex flex-1 gap-5 overflow-x-auto [scrollbar-width:none]">
            {FILTROS.map(f => (
              <button key={f} type="button" role="tab" aria-selected={filtro === f} onClick={() => escolher(f)}
                className={cx(
                  'shrink-0 border-b-2 py-3.5 text-sm transition-colors',
                  filtro === f ? 'border-comm-red font-semibold text-comm-ink' : 'border-transparent text-comm-muted hover:text-comm-ink',
                  'focus-visible:outline-none focus-visible:text-comm-ink focus-visible:underline',
                )}>
                {FEED_FILTER_LABEL[f]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setBuscaAberta(o => !o); if (buscaAberta) setBusca('') }}
            aria-label={buscaAberta ? 'Fechar busca' : 'Buscar no feed'} aria-expanded={buscaAberta}
            className={cx('rounded-full p-2 text-comm-muted hover:bg-comm-soft hover:text-comm-ink', focusRing)}>
            {buscaAberta ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        {buscaAberta && (
          <div className="px-4 pb-3 sm:px-6">
            <label htmlFor="feed-busca" className="sr-only">Buscar publicações</label>
            <input id="feed-busca" autoFocus type="search" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por texto, pessoa ou tópico" className={cx(inputClass, 'h-10 rounded-full py-2')} />
          </div>
        )}
      </div>

      <div role="tabpanel" aria-busy={posts.loading && !posts.data}>
        {posts.error && !posts.data ? (
          <ErrorState message={posts.error} onRetry={reloadPosts} />
        ) : !resultado ? (
          <>{[0, 1, 2].map(i => <PostSkeleton key={i} />)}</>
        ) : resultado.posts.length === 0 ? (
          busca ? (
            <EmptyState icon={Search} title="Nada encontrado">Nenhuma publicação corresponde a “{busca}”.</EmptyState>
          ) : (
            <EmptyState icon={Inbox} title={VAZIO[filtro][0]}
              action={filtro === 'seguindo'
                ? <Button variant="secondary" onClick={() => router.push('/comunidade/pessoas')}>Descobrir pessoas</Button>
                : <Button variant="primary" onClick={() => openComposer({ kind: filtro === 'pesquisas' ? 'pesquisa' : filtro === 'experimentos' ? 'experimento' : filtro === 'sem-resposta' ? 'pergunta' : 'discussao' })}>Criar publicação</Button>}>
              {VAZIO[filtro][1]}
            </EmptyState>
          )
        ) : (
          <>
            {resultado.fallback && filtro === 'para-voce' && (
              <p className="border-b border-comm-line bg-comm-soft/50 px-4 py-3 text-sm text-comm-muted sm:px-6">
                Ainda não há publicações dos seus interesses — mostrando as mais recentes.
              </p>
            )}
            {resultado.posts.slice(0, limite).map(p => (
              <PostItem key={p.id} post={p} onTopic={t => router.push(`${pathname}?topico=${t}`)} />
            ))}
            {resultado.posts.length > limite && (
              <div className="flex justify-center py-6">
                <Button onClick={() => setLimite(l => l + PAGE)}>Carregar mais</Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageColumns>
  )
}

export default function ComunidadePage() {
  return (
    <Suspense fallback={null}>
      <Feed />
    </Suspense>
  )
}
