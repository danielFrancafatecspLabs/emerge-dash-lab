'use client'

// Panorama do Comparativo: todos os experimentos do board de Experimentação (o total do histórico), quantos foram
// criados em cada um dos dois períodos comparados (a safra) e onde cada safra está hoje (validada, refutada, cancelada,
// em andamento…).

import { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import { periodoDeCriacao, SITUACOES, trecho, type Comparacao, type Experimento, type Janela, type SituacaoExperimento } from '@/lib/comparativo/resumo'
import { COR_PERIODO } from './cores'

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`

/** Barra empilhada com 2px de respiro entre os segmentos e o número de cada um na legenda (nunca só a cor). */
function BarraSituacoes({ contagem, total, altura = 14 }: { contagem: Record<SituacaoExperimento, number>; total: number; altura?: number }) {
  return (
    <div className="flex w-full gap-[2px] overflow-hidden rounded-md" style={{ height: altura }} role="img"
      aria-label={SITUACOES.filter(s => contagem[s.id]).map(s => `${s.label}: ${contagem[s.id]}`).join(', ')}>
      {SITUACOES.filter(s => contagem[s.id]).map(s => (
        <div key={s.id} title={`${s.label}: ${contagem[s.id]} (${pct(contagem[s.id], total)}%)`}
          style={{ width: `${(contagem[s.id] / total) * 100}%`, background: s.cor, minWidth: 3 }} />
      ))}
    </div>
  )
}

function contar(lista: Experimento[]): Record<SituacaoExperimento, number> {
  const c = Object.fromEntries(SITUACOES.map(s => [s.id, 0])) as Record<SituacaoExperimento, number>
  for (const e of lista) c[e.situacao]++
  return c
}

function Lista({ itens, jiraUrl }: { itens: Experimento[]; jiraUrl: string | null }) {
  return (
    <div className="max-h-[320px] overflow-auto border-t border-beon-line">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-beon-soft text-xs uppercase tracking-[0.06em] text-beon-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">Experimento</th>
            <th scope="col" className="px-3 py-2 font-semibold">Situação hoje</th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">Benefício</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-beon-line">
          {itens.map(e => {
            const s = SITUACOES.find(x => x.id === e.situacao)!
            return (
              <tr key={e.key}>
                <td className="max-w-[340px] px-4 py-2">
                  <span className="block truncate text-beon-ink">{e.nome}</span>
                  {jiraUrl
                    ? <a href={`${jiraUrl}/browse/${e.key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-beon-muted hover:text-beon-red">{e.key} <ExternalLink className="h-3 w-3" aria-hidden /></a>
                    : <span className="text-xs text-beon-muted">{e.key}</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-beon-body">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.cor }} aria-hidden />{s.label}</span>
                  <span className="block text-xs text-beon-muted">{e.status}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-beon-ink">{e.beneficio ? formatarValor(e.beneficio) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Uma safra (criados no período): quantos são, onde estão hoje e as taxas que importam para a decisão. */
function Safra({ k, janela, itens, jiraUrl }: { k: 0 | 1; janela: Janela; itens: Experimento[]; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const [filtro, setFiltro] = useState<SituacaoExperimento | null>(null)
  const c = contar(itens)
  const total = itens.length
  const concluidos = c.validada + c.refutada
  const encerrados = concluidos + c.cancelada
  const ordenados = [...itens]
    .filter(e => !filtro || e.situacao === filtro)
    .sort((a, b) => SITUACOES.findIndex(s => s.id === a.situacao) - SITUACOES.findIndex(s => s.id === b.situacao) || (b.beneficio ?? 0) - (a.beneficio ?? 0))
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-beon-line bg-white">
      <div className="px-5 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-beon-ink">
            <span className="h-3 w-3 rounded-sm" style={{ background: COR_PERIODO[k] }} aria-hidden /> Safra {janela.rotulo}
          </h3>
          <span className="text-xs text-beon-muted">criados de {trecho(janela)}</span>
        </div>
        <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-beon-ink">{total}</p>
        <p className="text-xs text-beon-muted">experimentos criados em {janela.rotulo}</p>
        <div className="mt-4"><BarraSituacoes contagem={c} total={Math.max(1, total)} /></div>
        <ul className="mt-3 grid grid-cols-1 gap-y-0.5 text-[13px]">
          {SITUACOES.filter(s => c[s.id] || s.id !== 'outro').map(s => (
            <li key={s.id}>
              <button type="button" onClick={() => { setFiltro(f => (f === s.id ? null : s.id)); setAberto(true) }} aria-pressed={filtro === s.id}
                className={cx('flex w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left hover:bg-beon-soft', focusRing, filtro === s.id && 'bg-beon-soft')}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.cor }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-beon-body">{s.label}</span>
                <span className="font-semibold tabular-nums text-beon-ink">{c[s.id]}</span>
                <span className="w-9 text-right text-xs tabular-nums text-beon-muted">{pct(c[s.id], total)}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <dl className="mx-5 mt-4 grid grid-cols-3 gap-2 rounded-xl bg-beon-soft p-3 text-center">
        <div>
          <dt className="text-[11px] leading-tight text-beon-muted">Já encerrados</dt>
          <dd className="text-lg font-semibold tabular-nums text-beon-ink">{pct(encerrados, total)}%</dd>
          <dd className="text-[11px] text-beon-muted">{plural(encerrados, 'experimento', 'experimentos')}</dd>
        </div>
        <div>
          <dt className="text-[11px] leading-tight text-beon-muted">Taxa de validação</dt>
          <dd className="text-lg font-semibold tabular-nums text-beon-ink">{concluidos ? `${pct(c.validada, concluidos)}%` : '—'}</dd>
          <dd className="text-[11px] text-beon-muted">{c.validada} de {plural(concluidos, 'concluído', 'concluídos')}</dd>
        </div>
        <div>
          <dt className="text-[11px] leading-tight text-beon-muted">Cancelamento</dt>
          <dd className="text-lg font-semibold tabular-nums text-beon-ink">{encerrados ? `${pct(c.cancelada, encerrados)}%` : '—'}</dd>
          <dd className="text-[11px] text-beon-muted">dos encerrados</dd>
        </div>
      </dl>
      <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto}
        className={cx('mt-4 flex w-full items-center justify-between border-t border-beon-line px-5 py-3 text-left text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
        {filtro ? `${SITUACOES.find(s => s.id === filtro)!.label} (${ordenados.length})` : `Ver os ${total} experimentos`}
        <ChevronDown className={cx('h-4 w-4 text-beon-muted transition-transform', aberto && 'rotate-180')} aria-hidden />
      </button>
      {aberto && <Lista itens={ordenados} jiraUrl={jiraUrl} />}
    </article>
  )
}

export default function Panorama({ experimentos, comparacao, jiraUrl }: { experimentos: Experimento[]; comparacao: Comparacao; jiraUrl: string | null }) {
  const total = experimentos.length
  const grupo = (g: ReturnType<typeof periodoDeCriacao>) => experimentos.filter(e => periodoDeCriacao(e, comparacao) === g)
  const janelas = [comparacao.base, comparacao.atual] as const
  const faixas = [
    { id: 'base', label: `Criados em ${comparacao.base.rotulo}`, n: grupo('base').length, cor: COR_PERIODO[0] as string },
    { id: 'atual', label: `Criados em ${comparacao.atual.rotulo}`, n: grupo('atual').length, cor: COR_PERIODO[1] as string },
    { id: 'outro', label: 'Criados em outros períodos', n: grupo('outro').length, cor: '#C4C7CE' },
    { id: 'sem-data', label: 'Sem data de criação', n: grupo('sem-data').length, cor: '#E5E7EB' },
  ].filter(f => f.n)
  const c = contar(experimentos)

  return (
    <section aria-labelledby="panorama-titulo" className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">Panorama</p>
        <h2 id="panorama-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">De onde vêm os {total} experimentos e onde estão hoje</h2>
        <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">
          Todos os experimentos do board de Experimentação e, em destaque, os criados em cada período comparado (a safra). A situação de cada um segue a mesma classificação do Semanal.
        </p>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <article className="flex flex-col rounded-2xl border border-beon-line bg-white p-5">
          <h3 className="text-sm font-semibold text-beon-ink">Todo o histórico</h3>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-beon-ink">{total}</p>
          <p className="text-xs text-beon-muted">experimentos no board de Experimentação</p>
          <div className="mt-4 flex h-3.5 w-full gap-[2px] overflow-hidden rounded-md" role="img" aria-label={faixas.map(f => `${f.label}: ${f.n}`).join(', ')}>
            {faixas.map(f => <div key={f.id} title={`${f.label}: ${f.n}`} style={{ width: `${(f.n / Math.max(1, total)) * 100}%`, background: f.cor, minWidth: 3 }} />)}
          </div>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {faixas.map(f => (
              <li key={f.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: f.cor }} aria-hidden />
                <span className="flex-1 text-beon-body">{f.label}</span>
                <span className="font-semibold tabular-nums text-beon-ink">{f.n}</span>
                <span className="w-9 text-right text-xs tabular-nums text-beon-muted">{pct(f.n, total)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-beon-line pt-4">
            <p className="text-xs font-medium text-beon-muted">Situação hoje, de todo o histórico</p>
            <div className="mt-2"><BarraSituacoes contagem={c} total={Math.max(1, total)} altura={10} /></div>
            <p className="mt-2 text-xs leading-relaxed text-beon-body">
              <b className="text-beon-ink">{c.validada + c.refutada}</b> concluídos ({c.validada} com hipótese validada e {c.refutada} refutada),{' '}
              <b className="text-beon-ink">{c.cancelada}</b> cancelados e <b className="text-beon-ink">{c.andamento + c.exploracao + c.outro}</b> ainda abertos.
            </p>
          </div>
        </article>
        {janelas.map((j, k) => <Safra key={j.id} k={k as 0 | 1} janela={j} itens={grupo(k ? 'atual' : 'base')} jiraUrl={jiraUrl} />)}
      </div>
    </section>
  )
}
