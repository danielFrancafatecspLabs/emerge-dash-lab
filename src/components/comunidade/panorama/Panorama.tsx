'use client'

// Panorama da home da Comunidade, entre as primeiras discussões do feed: o que está acontecendo no mundo (beOn Radar),
// o que estamos pesquisando (Acervo de Pesquisas), o que estamos experimentando agora (Jira) e o que o Radar OSINT está
// captando. Cada bloco tem um título que diz exatamente o que mostra e um botão para a área completa.

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Building2, ChevronDown, FlaskConical, Globe2, Library, MessageCircle, Newspaper, Radar } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ehAutomacaoDeSinais, ehAutomacaoDoRadar } from '@/lib/community/automacao'
import type { CommunityPost } from '@/lib/community/model'
import type { Noticia } from '@/lib/newsletter/edicao'
import { IDENTIDADE, ImagemDaNoticia, MetaDaNoticia, SeloDaSecao } from '@/components/newsletter/identidade'
import { FaixaDaBolsa, useBolsa } from '@/components/newsletter/Bolsa'
import { Skeleton, cx, focusRing } from '@/components/ui'
import { useCommunity } from '../CommunityProvider'
import { tempoRelativo } from '../format'
import { linkDaPesquisa, pesquisasRecentes, provocacaoDoPost, useAcervo, useEdicaoDoRadar, useExperimentosAtivos, useResumoDoOsint } from './dados'
import { LAT_DO_TOPO, MAPA_MUNDI, PASSO_DO_MAPA } from './mapa-mundi'

const botaoDaArea = cx(
  'inline-flex h-11 items-center gap-2 rounded-full bg-beon-ink px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5',
  focusRing,
)
const linkSutil = cx('inline-flex items-center gap-1 rounded-full text-[13px] font-semibold text-beon-red hover:underline', focusRing)

function Bloco({ id, icone: Icone, eyebrow, titulo, descricao, children, acao }: {
  id: string
  icone: LucideIcon
  eyebrow: string
  titulo: string
  descricao: string
  children: ReactNode
  acao?: ReactNode
}) {
  return (
    <section aria-labelledby={`panorama-${id}`} className="border-b border-beon-line px-4 py-7 sm:px-6">
      <header className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-beon-tint text-beon-red"><Icone className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-beon-red">{eyebrow}</p>
          <h2 id={`panorama-${id}`} className="mt-0.5 text-[21px] font-extrabold leading-tight tracking-tight text-beon-ink sm:text-[23px]">{titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-beon-muted">{descricao}</p>
        </div>
      </header>
      <div className="mt-5">{children}</div>
      {acao && <div className="mt-5">{acao}</div>}
    </section>
  )
}

function Indisponivel({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-beon-line px-4 py-6 text-center text-sm text-beon-muted">{children}</p>
}

// ── O que está acontecendo no mundo ────────────────────────────────────────────────────────────────────────────────

function LinkDaDiscussao({ post }: { post: CommunityPost | undefined }) {
  if (!post) return null
  const n = post.comments.length
  return (
    <Link href={`/comunidade/post/${post.id}`} className={linkSutil}>
      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
      {n ? `Entrar na discussão · ${n} ${n === 1 ? 'comentário' : 'comentários'}` : 'Abrir a discussão'}
    </Link>
  )
}

function Mundo({ posts }: { posts: CommunityPost[] }) {
  const { data: edicao, erro } = useEdicaoDoRadar()
  const bolsa = useBolsa()
  const discussoes = useMemo(() => new Map(posts.filter(p => ehAutomacaoDoRadar(p.authorUsername)).map(p => [p.id, p])), [posts])
  const noticias = edicao?.noticias ?? []
  const manchete = noticias.find(n => n.imagem) ?? noticias[0]
  const demais = noticias.filter(n => n !== manchete).slice(0, 3)
  const discussao = (n: Noticia) => discussoes.get(`radar:${n.id}`)
  const provocacao = manchete && discussao(manchete) ? provocacaoDoPost(discussao(manchete)!.content) : null

  return (
    <Bloco id="mundo" icone={Globe2} eyebrow={edicao ? `beOn Radar · Edição nº ${edicao.numero}` : 'beOn Radar'}
      titulo="O que está acontecendo no mundo"
      descricao="As notícias de hoje sobre tecnologias emergentes, Vale do Silício, mercado, bolhas e impactos, com as bolsas de tecnologia ao vivo. Cada notícia abre uma discussão aqui no fórum."
      acao={<Link href="/comunidade/newsletter" className={botaoDaArea}><Newspaper className="h-4 w-4" aria-hidden />Ler a newsletter completa<ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
      {!edicao && !erro ? (
        <div className="space-y-3"><Skeleton className="aspect-[16/9] rounded-3xl" /><Skeleton className="h-16 rounded-2xl" /></div>
      ) : !manchete ? (
        <Indisponivel>A edição de hoje ainda não saiu: as fontes de notícias não responderam. As últimas discussões do Radar continuam no feed.</Indisponivel>
      ) : (
        <div className="space-y-4">
          <FaixaDaBolsa painel={bolsa.painel} erro={bolsa.erro} />
          <article className="overflow-hidden rounded-3xl border border-beon-line bg-white">
            <a href={manchete.link} target="_blank" rel="noopener noreferrer" className={cx('group relative block aspect-[16/9] overflow-hidden bg-beon-ink', focusRing)}>
              <ImagemDaNoticia n={manchete} className="transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
              <span className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-beon-red px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">Manchete</span>
                <SeloDaSecao secao={manchete.secao} sobreImagem />
              </span>
              <span className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                <span className="line-clamp-3 text-[21px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[26px]">{manchete.titulo}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/80">Ler na fonte · {manchete.fonte}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
              </span>
            </a>
            {(provocacao || discussao(manchete)) && (
              <div className="space-y-2 px-4 py-4 sm:px-5">
                {provocacao && <p className="text-[15px] font-medium leading-snug text-beon-ink"><span className="font-bold text-beon-red">Provocação:</span> {provocacao}</p>}
                <LinkDaDiscussao post={discussao(manchete)} />
              </div>
            )}
          </article>

          {demais.length > 0 && (
            <ul className="divide-y divide-beon-line rounded-3xl border border-beon-line">
              {demais.map(n => (
                <li key={n.id} className="flex gap-3.5 p-3.5">
                  <a href={n.link} target="_blank" rel="noopener noreferrer" aria-label={`Ler na fonte: ${n.titulo}`}
                    className={cx('relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-beon-soft', focusRing)}>
                    <ImagemDaNoticia n={n} />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: IDENTIDADE[n.secao].cor }}>{IDENTIDADE[n.secao].nome}</p>
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className={cx('mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-beon-ink hover:underline', focusRing)}>{n.titulo}</a>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <MetaDaNoticia n={n} />
                      <LinkDaDiscussao post={discussao(n)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Bloco>
  )
}

// ── O que estamos pesquisando por aqui ─────────────────────────────────────────────────────────────────────────────

const formatoData = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Pesquisas() {
  const { data: vault, erro } = useAcervo()
  const recentes = useMemo(() => pesquisasRecentes(vault, 4), [vault])
  const temas = vault ? new Set(vault.documents.filter(d => d.type === 'topic').map(d => d.category)).size : 0

  return (
    <Bloco id="pesquisas" icone={Library} eyebrow="Acervo de Pesquisas" titulo="O que estamos pesquisando por aqui"
      descricao={vault ? `As pesquisas mais recentes do beOn Labs: ${vault.completedResearchCount} concluídas em ${temas} ${temas === 1 ? 'tema' : 'temas'}.` : 'As pesquisas mais recentes do beOn Labs.'}
      acao={<Link href="/comunidade/pesquisas" className={botaoDaArea}><Library className="h-4 w-4" aria-hidden />Explorar o acervo<ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
      {!vault && !erro ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : !recentes.length ? (
        <Indisponivel>O acervo ainda não tem pesquisas publicadas.</Indisponivel>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {recentes.map((d, i) => (
            <li key={d.path}>
              <Link href={linkDaPesquisa(d.path)}
                className={cx('group flex h-full flex-col rounded-2xl border border-beon-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md', focusRing)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">{d.category}</span>
                  {i === 0 && <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-beon-red">Mais recente</span>}
                </span>
                <span className="mt-3 line-clamp-3 text-[15px] font-semibold leading-snug text-beon-ink group-hover:underline">{d.title}</span>
                <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-beon-muted">
                  <span>{formatoData(d.updated ?? d.created) ? `Atualizada em ${formatoData(d.updated ?? d.created)}` : 'No acervo'}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-800">Ler<ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Bloco>
  )
}

// ── O que estamos experimentando agora ─────────────────────────────────────────────────────────────────────────────

const VISIVEIS = 6

function Experimentos() {
  const { data, erro } = useExperimentosAtivos()
  const [todos, setTodos] = useState(false)
  const itens = data?.itens ?? []
  const lista = todos ? itens : itens.slice(0, VISIVEIS)
  const diretorias = new Set(itens.map(e => e.diretoria).filter(Boolean)).size

  return (
    <Bloco id="experimentos" icone={FlaskConical} eyebrow="Direto do Jira" titulo="O que estamos experimentando agora"
      descricao={itens.length
        ? `${itens.length} ${itens.length === 1 ? 'iniciativa com experimento' : 'iniciativas com experimentos'} em andamento ou em validação${diretorias ? `, de ${diretorias} ${diretorias === 1 ? 'diretoria' : 'diretorias'}` : ''}.`
        : 'As iniciativas com experimentos em andamento ou em validação, e a diretoria de cada uma.'}
      acao={<Link href="/comunidade/trilha" className={botaoDaArea}><FlaskConical className="h-4 w-4" aria-hidden />Conhecer a Trilha de Experimentação<ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
      {!data && !erro ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : erro ? (
        <Indisponivel>Não foi possível ler os experimentos do Jira agora. Tente de novo mais tarde.</Indisponivel>
      ) : !itens.length ? (
        <Indisponivel>Nenhum experimento em andamento no momento.</Indisponivel>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-beon-line">
          <ol className="divide-y divide-beon-line">
            {lista.map((e, i) => (
              <li key={e.chave} className="flex items-center gap-3.5 px-4 py-3.5">
                <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-beon-muted">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-beon-ink">{e.iniciativa}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-beon-muted">
                    <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />{e.diretoria ?? 'Diretoria não informada'}
                  </p>
                </div>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    e.fase === 'Em andamento' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>{e.fase}</span>
                  {e.ciclos > 1 && <span className="text-[11px] text-beon-muted">{e.ciclos} ciclos</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-beon-line bg-beon-soft/60 px-4 py-3">
            <span className="text-xs text-beon-muted">{data?.atualizadoEm ? `Jira lido ${tempoRelativo(data.atualizadoEm)}` : 'Dados do Jira'}</span>
            {itens.length > VISIVEIS && (
              <button type="button" onClick={() => setTodos(t => !t)} aria-expanded={todos}
                className={cx('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold text-beon-ink hover:bg-white', focusRing)}>
                {todos ? 'Mostrar menos' : `Ver todas as ${itens.length}`}
                <ChevronDown className={cx('h-4 w-4 transition-transform', todos && 'rotate-180')} aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </Bloco>
  )
}

// ── Radar OSINT ────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUNAS = 360 / PASSO_DO_MAPA

function MapaDeSinais({ pontos }: { pontos: [number, number][] }) {
  const linhas = MAPA_MUNDI.length
  const terra = useMemo(() => MAPA_MUNDI.flatMap((l, y) => [...l].flatMap((c, x) => (c === '#' ? [[x, y]] : []))), [])
  const projetar = ([lon, lat]: [number, number]) => [(lon + 180) / PASSO_DO_MAPA, (LAT_DO_TOPO - lat) / PASSO_DO_MAPA + 0.5]
  return (
    <svg viewBox={`0 0 ${COLUNAS} ${linhas}`} className="h-auto w-full" role="img" aria-label={`Mapa com ${pontos.length} sinais localizados`}>
      {terra.map(([x, y]) => <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.36} fill="#D9D4CF" />)}
      {pontos.map((p, i) => {
        const [x, y] = projetar(p)
        if (y < 0 || y > linhas) return null
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2.2} fill="#D31809" opacity={0.14} />
            <circle cx={x} cy={y} r={0.9} fill="#D31809" />
          </g>
        )
      })}
    </svg>
  )
}

function Osint({ posts }: { posts: CommunityPost[] }) {
  const { data, erro } = useResumoDoOsint()
  const noForum = useMemo(() => new Set(posts.filter(p => ehAutomacaoDeSinais(p.authorUsername)).map(p => p.id)), [posts])

  return (
    <Bloco id="osint" icone={Radar} eyebrow="Future Thinking · Radar OSINT" titulo="O que o Radar OSINT está captando"
      descricao={data?.total ? `${data.total} sinais de futuro mapeados em ${data.modulos} ${data.modulos === 1 ? 'módulo' : 'módulos'}, com os mais recentes abaixo.` : 'Os sinais de futuro que a varredura OSINT encontra pelo mundo.'}
      acao={<Link href="/osint" className={botaoDaArea}><Radar className="h-4 w-4" aria-hidden />Abrir o Radar OSINT<ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
      {!data && !erro ? (
        <Skeleton className="h-72 rounded-3xl" />
      ) : !data?.total ? (
        <Indisponivel>O Radar OSINT ainda não publicou sinais por aqui.</Indisponivel>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-beon-line">
          <div className="bg-white px-3 pb-1 pt-4 sm:px-5"><MapaDeSinais pontos={data.pontos} /></div>
          <ul className="divide-y divide-beon-line border-t border-beon-line">
            {data.recentes.slice(0, 3).map(s => {
              const conteudo = (
                <>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-beon-red" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug text-beon-ink">{s.titulo}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-beon-muted">{[s.modulo, s.local].filter(Boolean).join(' · ')}</span>
                  </span>
                  {s.data && <span className="shrink-0 text-xs text-beon-muted">{tempoRelativo(s.data)}</span>}
                </>
              )
              return (
                <li key={s.id}>
                  {noForum.has(s.postId)
                    ? <Link href={`/comunidade/post/${s.postId}`} className={cx('flex gap-3 px-4 py-3.5 hover:bg-beon-soft/50', focusRing)}>{conteudo}</Link>
                    : <div className="flex gap-3 px-4 py-3.5">{conteudo}</div>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Bloco>
  )
}

/** Os quatro blocos do panorama, na ordem: mundo, pesquisa, experimentos, OSINT. */
export function Panorama() {
  const { posts } = useCommunity()
  const lista = posts.data ?? []
  return (
    <div aria-label="Panorama beOn Labs" role="region" className="border-y-4 border-beon-soft">
      <Mundo posts={lista} />
      <Pesquisas />
      <Experimentos />
      <Osint posts={lista} />
    </div>
  )
}
