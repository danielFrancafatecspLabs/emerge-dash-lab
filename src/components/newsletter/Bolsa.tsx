'use client'

// Bolsa de tecnologia no beOn Radar: a faixa horizontal de cotações (renovada a cada minuto) e a régua do humor do
// dia na cesta de tecnologia.

import { useCallback, useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Cotacao, PainelDaBolsa } from '@/lib/newsletter/bolsa'
import { api } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { Skeleton, cx } from '@/components/ui'

const ATUALIZAR_MS = 60_000

/** Lê o painel e o renova a cada minuto enquanto a aba está visível. */
export function useBolsa() {
  const [painel, setPainel] = useState<PainelDaBolsa | null>(null)
  const [erro, setErro] = useState(false)
  const carregar = useCallback(() => {
    api<PainelDaBolsa>('/community/newsletter/bolsa').then(p => { setPainel(p); setErro(false) }).catch(() => setErro(true))
  }, [])
  useEffect(() => {
    carregar()
    const t = setInterval(() => { if (document.visibilityState === 'visible') carregar() }, ATUALIZAR_MS)
    const ver = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', ver)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', ver) }
  }, [carregar])
  return { painel, erro }
}

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const preco = (c: Cotacao) => c.grupo === 'indice'
  ? c.preco.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  : c.preco.toLocaleString('pt-BR', { style: 'currency', currency: c.moeda || 'USD', maximumFractionDigits: c.preco < 10 ? 3 : 2 })
const corDa = (v: number) => (v > 0.005 ? 'text-emerald-700' : v < -0.005 ? 'text-red-700' : 'text-beon-muted')

function Seta({ v }: { v: number }) {
  const I = v > 0.005 ? ArrowUpRight : v < -0.005 ? ArrowDownRight : Minus
  return <I className="h-3.5 w-3.5" aria-hidden />
}

function Minilinha({ serie, sobe }: { serie: number[]; sobe: boolean }) {
  if (serie.length < 2) return null
  const min = Math.min(...serie), max = Math.max(...serie), alt = max - min || 1
  const pts = serie.map((v, i) => `${(i / (serie.length - 1)) * 40},${14 - ((v - min) / alt) * 12}`).join(' ')
  return (
    <svg viewBox="0 0 40 16" className="h-4 w-10 shrink-0" aria-hidden>
      <polyline points={pts} fill="none" stroke={sobe ? '#047857' : '#b91c1c'} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Item({ c, copia }: { c: Cotacao; copia?: boolean }) {
  return (
    <li aria-hidden={copia || undefined} className={cx('flex shrink-0 items-center gap-2.5 border-r border-beon-line px-5 py-3', copia && 'motion-reduce:hidden')}>
      <span className="text-[13px] font-bold text-beon-ink">{c.nome}</span>
      <span className="text-[13px] tabular-nums text-beon-body">{preco(c)}</span>
      <span className={cx('inline-flex items-center gap-0.5 text-[13px] font-semibold tabular-nums', corDa(c.variacao))}><Seta v={c.variacao} />{pct(c.variacao)}</span>
      <Minilinha serie={c.serie} sobe={c.variacao >= 0} />
    </li>
  )
}

/** Faixa horizontal com as cotações em movimento contínuo (para ao passar o mouse; parada para quem pede menos movimento). */
export function FaixaDaBolsa({ painel, erro }: { painel: PainelDaBolsa | null; erro: boolean }) {
  if (erro && !painel) return null
  if (!painel) return <Skeleton className="h-[52px] rounded-2xl" />
  const aberto = painel.cotacoes.some(c => c.aberto)
  return (
    <section aria-label="Cotações de tecnologia" className="flex items-stretch overflow-hidden rounded-2xl border border-beon-line bg-white">
      <div className="z-10 flex shrink-0 items-center gap-2 border-r border-beon-line bg-white px-4">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          {aberto && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
          <span className={cx('relative inline-flex h-2.5 w-2.5 rounded-full', aberto ? 'bg-emerald-600' : 'bg-beon-muted')} />
        </span>
        <span className="text-[11px] font-bold uppercase leading-tight tracking-[0.1em] text-beon-ink">
          {aberto ? 'Ao vivo' : 'Último pregão'}<span className="hidden font-medium normal-case tracking-normal text-beon-muted sm:block">atualizado {tempoRelativo(painel.atualizadoEm)}</span>
        </span>
      </div>
      <div className="group relative min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
        <ul className="flex w-max animate-[faixa_60s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {painel.cotacoes.map(c => <Item key={c.simbolo} c={c} />)}
          {/* Cópia para o movimento contínuo, escondida de leitores de tela. */}
          {painel.cotacoes.map(c => <Item key={`b-${c.simbolo}`} c={c} copia />)}
        </ul>
      </div>
    </section>
  )
}

const MARCAS = [-3, -2, -1, 0, 1, 2, 3]
const TOM: Record<string, string> = {
  'forte-queda': 'bg-red-700 text-white', queda: 'bg-red-50 text-red-800', estavel: 'bg-beon-soft text-beon-ink',
  alta: 'bg-emerald-50 text-emerald-800', 'forte-alta': 'bg-emerald-700 text-white',
}

/** A régua: onde a média do dia da cesta de tecnologia cai entre -3% e +3%, com a leitura e os destaques. */
export function ReguaDoMercado({ painel, erro }: { painel: PainelDaBolsa | null; erro: boolean }) {
  if (!painel) {
    if (erro) return (
      <section className="rounded-3xl border border-beon-line bg-white p-5 text-sm text-beon-muted sm:p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">Régua das bolsas de tecnologia</h2>
        <p className="mt-2">As cotações não estão disponíveis agora. Tentamos de novo a cada minuto.</p>
      </section>
    )
    return <Skeleton className="h-52 rounded-3xl" />
  }
  const r = painel.regua
  if (!r) return null
  const posicao = ((Math.max(-3, Math.min(3, r.media)) + 3) / 6) * 100
  return (
    <section className="rounded-3xl border border-beon-line bg-white p-5 sm:p-6" aria-labelledby="t-regua">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="t-regua" className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">Régua das bolsas de tecnologia</h2>
          <p className="mt-1 text-lg font-semibold leading-snug text-beon-ink sm:text-xl">
            Hoje as ações de tecnologia estão <span className={cx('rounded-lg px-2 py-0.5', TOM[r.leitura.tom])}>{r.leitura.rotulo.toLowerCase()}</span>:
            {' '}média de <span className={cx('tabular-nums', corDa(r.media))}>{pct(r.media)}</span>.
          </p>
        </div>
      </div>

      <div className="relative mt-7 pb-6" role="img" aria-label={`Média do dia ${pct(r.media)}, numa escala de -3% a +3%`}>
        <div className="h-3 rounded-full bg-gradient-to-r from-red-600 via-stone-200 to-emerald-600" />
        <div className="absolute -top-4 flex -translate-x-1/2 flex-col items-center transition-[left] duration-700" style={{ left: `${posicao}%` }}>
          <span className="rounded-md bg-beon-ink px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">{pct(r.media)}</span>
          <span className="mt-0.5 h-5 w-[3px] rounded-full bg-beon-ink" />
        </div>
        {MARCAS.map(m => (
          <span key={m} className="absolute top-5 -translate-x-1/2 text-[11px] tabular-nums text-beon-muted" style={{ left: `${((m + 3) / 6) * 100}%` }}>
            {m > 0 ? `+${m}` : m}%
          </span>
        ))}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-beon-soft/70 p-3"><dt className="text-xs text-beon-muted">Em alta</dt><dd className="text-lg font-bold tabular-nums text-emerald-700">{r.emAlta}</dd></div>
        <div className="rounded-2xl bg-beon-soft/70 p-3"><dt className="text-xs text-beon-muted">Em queda</dt><dd className="text-lg font-bold tabular-nums text-red-700">{r.emQueda}</dd></div>
        <div className="rounded-2xl bg-beon-soft/70 p-3"><dt className="text-xs text-beon-muted">Maior alta</dt><dd className="font-semibold text-beon-ink">{r.maiorAlta ? <><span className="block truncate">{r.maiorAlta.nome}</span><span className="tabular-nums text-emerald-700">{pct(r.maiorAlta.variacao)}</span></> : '—'}</dd></div>
        <div className="rounded-2xl bg-beon-soft/70 p-3"><dt className="text-xs text-beon-muted">Maior queda</dt><dd className="font-semibold text-beon-ink">{r.maiorQueda ? <><span className="block truncate">{r.maiorQueda.nome}</span><span className="tabular-nums text-red-700">{pct(r.maiorQueda.variacao)}</span></> : '—'}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-beon-muted">
        Média da variação do dia de Nasdaq, semicondutores, big techs e fabricantes de chips. Fonte: {painel.fonte}. {painel.aviso}
      </p>
    </section>
  )
}
