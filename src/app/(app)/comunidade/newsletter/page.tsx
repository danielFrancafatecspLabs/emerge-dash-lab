'use client'

// beOn Radar: a newsletter diária de tecnologias emergentes, mercado e bolsa, bolhas e impactos, montada a partir de
// fontes públicas. Capa com a manchete e a pauta do dia, briefing em tela cheia, termômetro da edição e as seções em
// trilhos, os tópicos especiais e a Fronteira da tecnologia (pessoas e papers por área). Cada notícia leva ao site de origem.
// As peças visuais estão em src/components/newsletter.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Radio, RefreshCw } from 'lucide-react'
import { ehAutomacaoDoRadar } from '@/lib/community/automacao'
import { SECOES, type Edicao, type Secao } from '@/lib/newsletter/edicao'
import { api, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { Abertura } from '@/components/newsletter/Abertura'
import { BotaoAlertas } from '@/components/newsletter/Alertas'
import { FaixaDaBolsa, ReguaDoMercado, useBolsa } from '@/components/newsletter/Bolsa'
import { Briefing } from '@/components/newsletter/Briefing'
import { Capa } from '@/components/newsletter/Capa'
import { SecaoPesquisaIA, usePesquisaIA } from '@/components/newsletter/PesquisaIA'
import { NavegacaoDeSecoes, TermometroDoDia, TrilhoDaSecao } from '@/components/newsletter/Secoes'
import { TopicosEspeciais } from '@/components/newsletter/Topicos'
import { useLeituraDoRadar } from '@/components/newsletter/useLeituraDoRadar'
import { Button, Skeleton, cx, focusRing } from '@/components/ui'

const NO_BRIEFING = 8

export default function NewsletterPage() {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [briefing, setBriefing] = useState(false)
  const [ativa, setAtiva] = useState<Secao | null>(null)
  const { lidas, marcarLida, ehNova } = useLeituraDoRadar()
  const bolsa = useBolsa()
  const pesquisa = usePesquisaIA()
  const { posts } = useCommunity()
  // Discussão de cada notícia no fórum (aberta pela automação do Radar), pelo id da notícia.
  const discussoes = useMemo(() => new Map((posts.data ?? [])
    .filter(p => ehAutomacaoDoRadar(p.authorUsername) && p.id.startsWith('radar:'))
    .map(p => [p.id.slice('radar:'.length), { id: p.id, comentarios: p.comments.length }])), [posts.data])

  const carregar = useCallback(() => { setErro(null); api<Edicao>('/community/newsletter').then(setEdicao).catch(e => setErro(errorMessage(e))) }, [])
  useEffect(() => { carregar() }, [carregar])

  const { manchete, grupos, destaques } = useMemo(() => {
    const ns = edicao?.noticias ?? []
    const manchete = ns.find(n => n.imagem) ?? ns[0]
    const grupos = SECOES.map(s => ({ secao: s.id, itens: ns.filter(n => n.secao === s.id) })).filter(g => g.itens.length)
    // Briefing: a manchete e, em seguida, a mais relevante de cada seção, depois as demais na ordem da edição.
    const primeiras = grupos.map(g => g.itens[0]).filter(n => n !== manchete)
    const destaques = [...new Set([manchete, ...primeiras, ...ns])].filter(Boolean).slice(0, NO_BRIEFING)
    return { manchete, grupos, destaques }
  }, [edicao])

  const novas = useMemo(() => (edicao?.noticias ?? []).filter(n => ehNova(n.publicadoEm) && !lidas.has(n.id)).length, [edicao, ehNova, lidas])

  const irPara = useCallback((s: Secao) => {
    document.getElementById(`secao-${s}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Marca na navegação a seção que está na tela.
  useEffect(() => {
    if (!grupos.length) return
    const obs = new IntersectionObserver(entradas => {
      const visivel = entradas.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visivel) setAtiva(visivel.target.id.replace('secao-', '') as Secao)
    }, { rootMargin: '-30% 0px -60% 0px' })
    grupos.forEach(g => { const el = document.getElementById(`secao-${g.secao}`); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [grupos])

  if (erro && !edicao) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
        <div className="flex flex-col items-center rounded-[28px] border border-beon-line px-6 py-20 text-center">
          <Radio className="h-9 w-9 text-beon-red" aria-hidden />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-beon-ink">beOn Radar<span className="text-beon-red">.</span></h1>
          <p className="mt-2 max-w-md text-beon-body">{erro}</p>
          <Button className="mt-6" icon={RefreshCw} onClick={carregar}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (!edicao) {
    return (
      <div className="mx-auto max-w-[1240px] space-y-6 px-4 pt-6 sm:px-6" aria-busy="true" aria-label="Montando a edição de hoje">
        <Skeleton className="h-[520px] rounded-[28px]" />
        <Skeleton className="h-36 rounded-3xl" />
        <div className="flex gap-4 overflow-hidden">{[0, 1, 2].map(i => <Skeleton key={i} className="h-80 w-80 shrink-0 rounded-3xl" />)}</div>
      </div>
    )
  }

  if (!manchete) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
        <p className="rounded-[28px] border border-beon-line px-6 py-20 text-center text-beon-body">
          As fontes responderam, mas nenhuma notícia do tema saiu nas últimas 72 horas. Volte mais tarde.
        </p>
      </div>
    )
  }

  const fontesOk = edicao.fontes.filter(f => f.ok).length

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6">
      <Abertura edicao={edicao.numero} acoes={<>
        <Link href="/comunidade/newsletter/historico"
          className={cx('inline-flex h-10 items-center gap-2 rounded-full border border-beon-line bg-white px-4 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
          <History className="h-4 w-4" aria-hidden />Histórico do mês
        </Link>
        <BotaoAlertas />
      </>} />

      <div className="mt-4"><FaixaDaBolsa painel={bolsa.painel} erro={bolsa.erro} /></div>

      <div className="mt-6">
        <Capa edicao={edicao} manchete={manchete} porSecao={grupos} onBriefing={() => setBriefing(true)}
          onAbrirManchete={() => marcarLida(manchete.id)} onIrPara={irPara} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReguaDoMercado painel={bolsa.painel} erro={bolsa.erro} />
        <TermometroDoDia grupos={grupos} novas={novas} onIrPara={irPara} />
      </div>

      <div className="mt-12">
        <TopicosEspeciais noticias={edicao.noticias} lidas={lidas} ehNova={ehNova} onAbrir={marcarLida} discussoes={discussoes} />
      </div>

      <div className="mt-14">
        <SecaoPesquisaIA painel={pesquisa.painel} erro={pesquisa.erro} />
      </div>

      <div className="mt-12">
        <NavegacaoDeSecoes grupos={grupos} ativa={ativa} onIrPara={irPara} />
      </div>

      <div className="mt-6 space-y-14">
        {grupos.map(g => <TrilhoDaSecao key={g.secao} grupo={g} lidas={lidas} ehNova={ehNova} onAbrir={marcarLida} discussoes={discussoes} />)}
      </div>

      <footer className="mt-16 grid gap-4 rounded-3xl bg-beon-soft p-5 text-sm text-beon-body sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-semibold text-beon-ink">Como esta edição é feita</p>
          <p className="mt-1 leading-relaxed">
            Todo dia, o Radar varre {edicao.fontes.length} fontes abertas e de reputação reconhecida ({fontesOk} responderam nesta edição):
            agências públicas como a Agência Brasil, grandes jornais do Brasil e do mundo (Folha, Estadão, Valor, The New York Times, BBC),
            ciência (Nature, Pesquisa FAPESP, Jornal da USP), telecom (Teletime, TeleSíntese, Anatel) e consultorias como o Gartner. Fica só
            com notícias das últimas 72 horas sobre
            tecnologias emergentes, Vale do Silício, mercado, bolhas e impactos. Quando vários veículos dão a mesma história, ela vira uma
            notícia só, com a repercussão indicada. “Possível sinal” marca matérias com cara de sinal de futuro (primeira vez, protótipo,
            piloto, pesquisa nova). As manchetes levam ao site de origem; a beOn Labs não edita o conteúdo. EN indica notícia em inglês.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-beon-muted">
            {edicao.fontes.map(f => <span key={f.nome} className={f.ok ? '' : 'line-through'} title={f.ok ? `${f.itens} itens` : 'não respondeu'}>{f.nome}</span>)}
          </p>
        </div>
        <Button variant="primary" onClick={() => setBriefing(true)}>Rever o briefing</Button>
      </footer>

      {briefing && <Briefing noticias={destaques} lidas={lidas} onLer={marcarLida} onFechar={() => setBriefing(false)} />}
    </div>
  )
}
