'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { MessageCircleQuestion, Radar, Telescope } from 'lucide-react'
import {
  HORIZONTE_LABEL, SINAL_DIMENSAO_LABEL, postTitle,
  type CommunityPost, type Horizonte, type SinalDimensao,
} from '@/lib/community/model'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageHeader } from '@/components/comunidade/CommunityShell'
import { PostItem } from '@/components/comunidade/PostItem'
import { Button, Chip, EmptyState, ErrorState, PostSkeleton, SectionTitle, cx, focusRing } from '@/components/comunidade/ui'

const DIMENSOES = Object.keys(SINAL_DIMENSAO_LABEL) as SinalDimensao[]
const HORIZONTES = Object.keys(HORIZONTE_LABEL) as Horizonte[]

// Perguntas para provocar a discussão: não são notícias nem previsões, apenas pontos de partida.
const PROVOCACOES = [
  'Se agentes de IA passarem a comprar em nome dos clientes, como a Claro conquista a preferência de um agente?',
  'O que muda na operação de rede quando ela passa a se ajustar sozinha, em tempo real?',
  'Quais serviços nossos clientes vão esperar de uma conectividade que “desaparece” no cotidiano?',
  'Como a regulação de IA e de dados pode virar vantagem competitiva, e não só custo de conformidade?',
  'Que novas formas de interação vão substituir apps e menus nos próximos anos?',
  'Como metas climáticas e o custo de energia vão redesenhar a infraestrutura digital?',
]

function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return h
}

/** Radar de sinais: setores = dimensões da mudança, anéis = horizonte. Linhas ligam sinais com tópicos em comum. */
function RadarDeSinais({ sinais, onOpen }: { sinais: CommunityPost[]; onOpen: (id: string) => void }) {
  const S = 420, C = S / 2, R = 150
  const raio: Record<Horizonte | 'sem', number> = { curto: 0.33, medio: 0.62, longo: 0.9, sem: 0.9 }
  const pontos = sinais.map(p => {
    const dim = DIMENSOES.indexOf(p.meta.dimensao ?? 'tecnologica')
    const setor = (2 * Math.PI) / DIMENSOES.length
    const jitter = ((hash(p.id) % 1000) / 1000) * 0.7 + 0.15
    const ang = -Math.PI / 2 + setor * (dim + jitter)
    const r = R * raio[p.meta.horizonte ?? 'sem'] - (hash(p.id + 'r') % 18)
    return { p, x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) }
  })
  const conexoes: [number, number][] = []
  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      if (pontos[i].p.tags.some(t => pontos[j].p.tags.includes(t))) conexoes.push([i, j])
    }
  }
  return (
    <figure className="mx-auto w-full max-w-[380px]">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`Radar com ${sinais.length} sinais por dimensão e horizonte`} className="w-full">
        {[0.33, 0.62, 0.9].map((f, i) => (
          <circle key={f} cx={C} cy={C} r={R * f} fill={i === 0 ? '#FDF1F0' : 'none'} stroke="#E7E5E4" strokeDasharray={i ? '3 4' : undefined} />
        ))}
        {DIMENSOES.map((d, i) => {
          const a = -Math.PI / 2 + (2 * Math.PI / DIMENSOES.length) * i
          const al = a + Math.PI / DIMENSOES.length
          return (
            <g key={d}>
              <line x1={C} y1={C} x2={C + R * Math.cos(a)} y2={C + R * Math.sin(a)} stroke="#E7E5E4" />
              <text x={C + (R + 30) * Math.cos(al)} y={C + (R + 22) * Math.sin(al)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#78716C">
                {SINAL_DIMENSAO_LABEL[d].split(' ')[0]}
              </text>
            </g>
          )
        })}
        {conexoes.map(([i, j]) => (
          <line key={`${i}-${j}`} x1={pontos[i].x} y1={pontos[i].y} x2={pontos[j].x} y2={pontos[j].y} stroke="#0F766E" strokeOpacity={0.35} strokeDasharray="2 3" />
        ))}
        {pontos.map(({ p, x, y }) => (
          <g key={p.id} role="link" tabIndex={0} aria-label={`Sinal: ${postTitle(p)}`} className="cursor-pointer outline-none [&:focus>circle]:stroke-comm-ink"
            onClick={() => onOpen(p.id)} onKeyDown={e => { if (e.key === 'Enter') onOpen(p.id) }}>
            <title>{postTitle(p)}</title>
            <circle cx={x} cy={y} r={7} fill="#0F766E" stroke="white" strokeWidth={2} />
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-comm-muted">
        Centro: até 2 anos · meio: 2 a 5 anos · borda: mais de 5 anos ou sem horizonte. Linhas ligam sinais com tópicos em comum.
      </figcaption>
    </figure>
  )
}

export default function FutureThinkingPage() {
  const { posts, reloadPosts, openComposer } = useCommunity()
  const router = useRouter()
  const [dimensao, setDimensao] = useState<SinalDimensao | null>(null)
  const [horizonte, setHorizonte] = useState<Horizonte | null>(null)

  const sinais = useMemo(() => (posts.data ?? []).filter(p => p.kind === 'sinal').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [posts.data])
  const filtrados = sinais.filter(p => (!dimensao || p.meta.dimensao === dimensao) && (!horizonte || p.meta.horizonte === horizonte))

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader eyebrow="Future Thinking" title="Sinais do que está mudando"
        description="Tendências tecnológicas, sociais, econômicas, ambientais e regulatórias — com evidências, horizonte e o que podem significar para clientes, negócios e operações."
        action={<Button variant="primary" icon={Radar} onClick={() => openComposer({ kind: 'sinal' })}>Propor um sinal</Button>} />

      <div className="grid gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 lg:order-1">
          <div className="space-y-2 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por dimensão">
              <Chip selected={!dimensao} onClick={() => setDimensao(null)}>Todas as dimensões</Chip>
              {DIMENSOES.map(d => <Chip key={d} selected={dimensao === d} onClick={() => setDimensao(dimensao === d ? null : d)}>{SINAL_DIMENSAO_LABEL[d]}</Chip>)}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por horizonte">
              <Chip selected={!horizonte} onClick={() => setHorizonte(null)}>Qualquer horizonte</Chip>
              {HORIZONTES.map(h => <Chip key={h} selected={horizonte === h} onClick={() => setHorizonte(horizonte === h ? null : h)}>{HORIZONTE_LABEL[h]}</Chip>)}
            </div>
          </div>

          <div className="-mx-4 border-t border-comm-line sm:-mx-6">
            {posts.error && !posts.data ? <ErrorState message={posts.error} onRetry={reloadPosts} /> : !posts.data ? (
              <>{[0, 1].map(i => <PostSkeleton key={i} />)}</>
            ) : filtrados.length === 0 ? (
              <EmptyState icon={Telescope} title={sinais.length ? 'Nenhum sinal com esses filtros' : 'O radar ainda está vazio'}
                action={<Button variant="primary" onClick={() => openComposer({ kind: 'sinal' })}>Propor o primeiro sinal</Button>}>
                Um sinal é uma mudança concreta que você observou — uma regulação nova, um comportamento emergente, uma tecnologia ganhando tração.
                Traga a evidência e o que ela pode significar para a Claro.
              </EmptyState>
            ) : filtrados.map(p => <PostItem key={p.id} post={p} />)}
          </div>
        </div>

        <aside className="space-y-8 lg:order-2" aria-label="Exploração">
          <section>
            <SectionTitle>Radar de sinais</SectionTitle>
            {sinais.length > 0
              ? <RadarDeSinais sinais={sinais} onOpen={id => router.push(`/comunidade/post/${id}`)} />
              : <p className="text-sm text-comm-muted">Os sinais propostos pela comunidade aparecem no radar por dimensão e horizonte.</p>}
          </section>
          <section>
            <SectionTitle>Provocações para começar</SectionTitle>
            <ul className="space-y-1">
              {PROVOCACOES.map(q => (
                <li key={q}>
                  <button type="button" onClick={() => openComposer({ kind: 'discussao', title: q, tags: [], content: '' })}
                    className={cx('group -mx-2 flex w-full gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-comm-soft', focusRing)}>
                    <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden />
                    <span className="text-sm leading-snug text-comm-body group-hover:text-comm-ink">{q}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-comm-muted">Clique em uma provocação para abrir uma discussão com ela.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
