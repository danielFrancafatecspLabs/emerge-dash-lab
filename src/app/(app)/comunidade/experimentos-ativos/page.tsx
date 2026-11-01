'use client'

// Experimentos ativos: a vitrine da Comunidade para o que o beOn Labs está testando agora (Epics em andamento ou em
// validação no Jira). Mostra só o que a Comunidade pode ver: nome, Iniciativa, descrição, fase, sponsor, diretoria e
// os links de ficha e relatório que os admins cadastram. O restante do portfólio continua restrito.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, FileText, Search, X } from 'lucide-react'
import type { ExperimentoDetalhado, FaseDoExperimento, LinksDoExperimento } from '@/lib/community/experimentos-ativos'
import { api, errorMessage } from '@/components/comunidade/api'
import { CardDoExperimento, DetalheDoExperimento, FASE } from '@/components/comunidade/experimentos/Experimento'
import { JiraIndisponivel } from '@/components/jira/JiraIndisponivel'
import { LeituraDoJira } from '@/components/jira/LeituraDoJira'
import { Skeleton, cx, focusRing } from '@/components/ui'

interface Resposta { itens: ExperimentoDetalhado[]; atualizadoEm: string | null; podeEditarLinks: boolean }

const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Topo({ dados, falhou }: { dados: Resposta | null; falhou?: boolean }) {
  const itens = dados?.itens ?? []
  const andamento = itens.filter(e => e.fase === 'Em andamento').length
  const validacao = itens.length - andamento
  const iniciativas = new Set(itens.map(e => e.iniciativaChave ?? e.chave)).size
  const diretorias = new Set(itens.map(e => e.diretoria).filter(Boolean)).size
  const comDocs = itens.filter(e => e.links.ficha || e.links.relatorio).length
  const pct = (n: number) => (itens.length ? Math.round((n / itens.length) * 100) : 0)
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-beon-line bg-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-beon-tint blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-50 blur-3xl" aria-hidden />
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-beon-tint px-3 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-beon-red">
            <span className="relative flex h-2 w-2" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beon-red opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-beon-red" /></span>
            Direto do Jira
          </p>
          <h1 className="mt-4 text-[38px] font-extrabold leading-[1.02] tracking-tight text-beon-ink sm:text-[56px]">
            Experimentos<br />ativos<span className="text-beon-red">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-beon-body sm:text-lg">
            O que o beOn Labs está testando agora: a ideia, quem patrocina, em que fase está e, quando já publicados, a ficha e o relatório
            de cada experimento.
          </p>
          <LeituraDoJira className="mt-4" />
        </div>

        {!falhou && <div className="rounded-[26px] border border-beon-line bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          {!dados ? <Skeleton className="h-48 rounded-2xl" /> : (
            <>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-[42px] font-extrabold leading-none tabular-nums text-emerald-800">{andamento}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-900">Em andamento</p>
                </div>
                <ArrowRight className="h-5 w-5 text-beon-muted" aria-hidden />
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-[42px] font-extrabold leading-none tabular-nums text-amber-800">{validacao}</p>
                  <p className="mt-1 text-xs font-semibold text-amber-900">Em validação</p>
                </div>
              </div>
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-beon-soft" role="img" aria-label={`${pct(andamento)}% em andamento, ${pct(validacao)}% em validação`}>
                <span className="bg-emerald-500" style={{ width: `${pct(andamento)}%` }} />
                <span className="bg-amber-400" style={{ width: `${pct(validacao)}%` }} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div><dd className="text-xl font-extrabold tabular-nums text-beon-ink">{iniciativas}</dd><dt className="text-[11px] text-beon-muted">iniciativas</dt></div>
                <div><dd className="text-xl font-extrabold tabular-nums text-beon-ink">{diretorias}</dd><dt className="text-[11px] text-beon-muted">diretorias</dt></div>
                <div><dd className="text-xl font-extrabold tabular-nums text-beon-ink">{comDocs}</dd><dt className="text-[11px] text-beon-muted">com documentos</dt></div>
              </dl>
            </>
          )}
        </div>}
      </div>
    </section>
  )
}

function Pagina() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [dados, setDados] = useState<Resposta | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [fase, setFase] = useState<FaseDoExperimento | 'todas'>('todas')
  const [diretoria, setDiretoria] = useState<string | null>(null)
  const aberto = params.get('exp')

  const carregar = useCallback(() => {
    setErro(null)
    api<Resposta>('/community/experimentos-ativos').then(setDados).catch(e => setErro(errorMessage(e)))
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const diretorias = useMemo(() => {
    const cont = new Map<string, number>()
    for (const e of dados?.itens ?? []) if (e.diretoria) cont.set(e.diretoria, (cont.get(e.diretoria) ?? 0) + 1)
    return [...cont.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [dados])

  const filtrados = useMemo(() => {
    const q = sem(busca.trim())
    return (dados?.itens ?? []).filter(e =>
      (fase === 'todas' || e.fase === fase)
      && (!diretoria || e.diretoria === diretoria)
      && (!q || sem([e.nome, e.iniciativa, e.descricao, e.sponsor, e.diretoria].filter(Boolean).join(' ')).includes(q)))
  }, [dados, busca, fase, diretoria])

  const filtrando = fase !== 'todas' || !!diretoria || !!busca.trim()
  const selecionado = dados?.itens.find(e => e.chave === aberto) ?? null

  const abrir = (chave: string) => router.push(`${pathname}?exp=${encodeURIComponent(chave)}`, { scroll: false })
  const fechar = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname])
  const atualizarLinks = (chave: string, links: LinksDoExperimento) =>
    setDados(d => d && { ...d, itens: d.itens.map(e => (e.chave === chave ? { ...e, links } : e)) })
  const limpar = () => { setBusca(''); setFase('todas'); setDiretoria(null) }

  const chip = (ativo: boolean) => cx('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors', focusRing,
    ativo ? 'bg-beon-ink text-white' : 'border border-beon-line bg-white text-beon-body hover:bg-beon-soft')

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6">
      <Topo dados={dados} falhou={!!erro && !dados} />

      {/* Filtros */}
      <div className="sticky top-14 z-20 -mx-4 mt-6 border-b border-beon-line bg-white/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-beon-muted" aria-hidden />
            <label htmlFor="busca-exp" className="sr-only">Buscar experimento</label>
            <input id="busca-exp" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar experimento, sponsor, iniciativa…"
              className={cx('h-10 w-full rounded-full border border-beon-line bg-white pl-10 pr-3 text-sm text-beon-ink placeholder:text-beon-muted focus:border-beon-ink/30 focus:outline-none', focusRing)} />
          </div>
          <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 [scrollbar-width:none]" role="group" aria-label="Fase">
            {(['todas', 'Em andamento', 'Em validação'] as const).map(f => (
              <button key={f} type="button" aria-pressed={fase === f} onClick={() => setFase(f)} className={chip(fase === f)}>
                {f !== 'todas' && <span className={cx('h-2 w-2 rounded-full', FASE[f].ponto)} aria-hidden />}{f === 'todas' ? 'Todas as fases' : f}
              </button>
            ))}
          </div>
          {filtrando && (
            <button type="button" onClick={limpar} className={cx('ml-auto inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-beon-red hover:bg-beon-tint', focusRing)}>
              <X className="h-4 w-4" aria-hidden />Limpar filtros
            </button>
          )}
        </div>
        {diretorias.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]" role="group" aria-label="Diretoria">
            {diretorias.map(([d, n]) => (
              <button key={d} type="button" aria-pressed={diretoria === d} onClick={() => setDiretoria(x => (x === d ? null : d))} className={cx(chip(diretoria === d), 'h-8 text-[12px]')}>
                {d}<span className={cx('tabular-nums', diretoria === d ? 'text-white/70' : 'text-beon-muted')}>{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {erro && !dados ? (
          <div className="py-6"><JiraIndisponivel /></div>
        ) : !dados ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[380px] rounded-[26px]" />)}</div>
        ) : !dados.itens.length ? (
          <div className="rounded-[28px] border border-beon-line px-6 py-16 text-center text-beon-body">Nenhum experimento em andamento ou em validação no momento.</div>
        ) : !filtrados.length ? (
          <div className="rounded-[28px] border border-dashed border-beon-line px-6 py-14 text-center">
            <p className="font-semibold text-beon-ink">Nenhum experimento com esses filtros.</p>
            <button type="button" onClick={limpar} className={cx('mt-3 text-sm font-semibold text-beon-red hover:underline', focusRing)}>Limpar filtros</button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-beon-muted">
              {filtrados.length} {filtrados.length === 1 ? 'experimento' : 'experimentos'}{filtrando ? ' com esses filtros' : ', do mais recentemente movimentado ao mais antigo'}.
            </p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((e, i) => {
                const destaque = !filtrando && i === 0
                return (
                  <li key={e.chave} className={cx(destaque && 'sm:col-span-2 lg:col-span-3')}>
                    <CardDoExperimento e={e} destaque={destaque} onAbrir={() => abrir(e.chave)} />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <section className="mt-12 grid gap-4 rounded-[28px] bg-beon-soft p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-beon-red shadow-sm"><FileText className="h-6 w-6" aria-hidden /></span>
        <div>
          <p className="font-bold text-beon-ink">De onde vêm esses dados</p>
          <p className="mt-1 text-sm leading-relaxed text-beon-body">
            Os experimentos, fases, sponsors e diretorias vêm do board de Experimentação do Jira e se atualizam sozinhos. A ficha e o relatório
            são publicados pelo time do beOn Labs assim que ficam prontos. Custos, benefícios e o restante do portfólio não aparecem aqui.
          </p>
        </div>
      </section>

      {selecionado && dados && (
        <DetalheDoExperimento e={selecionado} podeEditar={dados.podeEditarLinks} onFechar={fechar} onLinks={l => atualizarLinks(selecionado.chave, l)} />
      )}
    </div>
  )
}

export default function ExperimentosAtivosPage() {
  return <Suspense fallback={null}><Pagina /></Suspense>
}
