'use client'

// Comparativo por área, laboratório ou diretoria: onde os experimentos foram concluídos, validados, refutados e
// cancelados em cada período. Mesmo corte de período dos cartões; cada linha abre os experimentos que formam os números.

import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import { DIMENSOES, porDimensao, SITUACOES, type Comparacao, type Dimensao, type Experimento, type Metricas } from '@/lib/comparativo/resumo'
import { COR_PERIODO } from './cores'

const LIMITE = 10
const dataBR = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

const COLUNAS: { id: keyof Metricas; label: string; formato: (v: number | null) => string }[] = [
  { id: 'concluidos', label: 'Concluídos', formato: v => (v ? String(v) : '–') },
  { id: 'validadas', label: 'Hipóteses validadas', formato: v => (v ? String(v) : '–') },
  { id: 'refutadas', label: 'Hipóteses refutadas', formato: v => (v ? String(v) : '–') },
  { id: 'cancelados', label: 'Cancelados', formato: v => (v ? String(v) : '–') },
  { id: 'taxaValidacao', label: 'Taxa de validação', formato: v => (v === null ? '–' : `${v}%`) },
  { id: 'beneficio', label: 'Benefício validado', formato: v => (v ? formatarValor(v) : '–') },
]

function Cabecalho({ rotulos }: { rotulos: string[] }) {
  return (
    <thead className="bg-beon-soft text-[11px] uppercase tracking-[0.06em] text-beon-muted">
      <tr>
        <th scope="col" rowSpan={2} className="sticky left-0 z-[1] min-w-[200px] bg-beon-soft px-4 py-2 text-left align-bottom font-semibold">Nome</th>
        {COLUNAS.map(c => <th key={c.id} scope="colgroup" colSpan={2} className="border-l border-beon-line px-3 pt-2 text-center font-semibold">{c.label}</th>)}
      </tr>
      <tr>
        {COLUNAS.map(c => rotulos.map((rotulo, k) => (
          <th key={`${c.id}-${k}`} scope="col" className={cx('whitespace-nowrap px-3 pb-2 pt-1 text-right font-medium normal-case tracking-normal', k === 0 && 'border-l border-beon-line')}>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: COR_PERIODO[k] }} aria-hidden />{rotulo}</span>
          </th>
        )))}
      </tr>
    </thead>
  )
}

/** Células da base e do período atual; na taxa de validação, a diferença em pontos percentuais acompanha o atual. */
function Celulas({ porPeriodo, negrito }: { porPeriodo: Metricas[]; negrito?: boolean }) {
  return (
    <>
      {COLUNAS.map(c => porPeriodo.map((m, k) => {
        const v = m[c.id] as number | null
        const antes = porPeriodo[0].taxaValidacao
        const delta = c.id === 'taxaValidacao' && k === 1 && v !== null && antes !== null ? v - antes : null
        return (
          <td key={`${c.id}-${k}`} className={cx('whitespace-nowrap px-3 py-2 text-right tabular-nums', k === 0 && 'border-l border-beon-line',
            v ? 'text-beon-ink' : 'text-beon-muted', negrito && 'font-semibold')}>
            {c.formato(v)}
            {delta !== null && delta !== 0 && (
              <span className={cx('ml-1 text-[11px] font-medium', delta > 0 ? 'text-emerald-700' : 'text-red-700')}>
                {delta > 0 ? '+' : '−'}{Math.abs(delta)} p.p.
              </span>
            )}
          </td>
        )
      }))}
    </>
  )
}

export default function PorArea({ experimentos, comparacao, jiraUrl }: { experimentos: Experimento[]; comparacao: Comparacao; jiraUrl: string | null }) {
  const [dim, setDim] = useState<Dimensao>('area')
  const [aberta, setAberta] = useState<string | null>(null)
  const [todas, setTodas] = useState(false)
  const { linhas, total } = useMemo(() => porDimensao(experimentos, dim, comparacao), [experimentos, dim, comparacao])
  const janelas = [comparacao.base, comparacao.atual]
  const visiveis = todas ? linhas : linhas.slice(0, LIMITE)
  const rotulo = DIMENSOES.find(d => d.id === dim)!.label

  return (
    <section aria-labelledby="por-area-titulo" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">Por {rotulo.toLowerCase()}</p>
          <h2 id="por-area-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">Onde os resultados aconteceram</h2>
          <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">
            Os mesmos resultados dos cartões, quebrados por {rotulo.toLowerCase()}, no período da conclusão ou do cancelamento. Clique numa linha para ver os experimentos.
          </p>
        </div>
        <div role="radiogroup" aria-label="Quebrar por" className="inline-flex rounded-full bg-stone-100 p-1">
          {DIMENSOES.map(d => (
            <button key={d.id} type="button" role="radio" aria-checked={dim === d.id} onClick={() => { setDim(d.id); setAberta(null) }}
              className={cx('h-8 rounded-full px-3 text-[13px] font-medium transition', focusRing,
                dim === d.id ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-beon-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <Cabecalho rotulos={janelas.map(j => j.rotulo)} />
            <tbody className="divide-y divide-beon-line">
              {visiveis.map(l => (
                <Fragment key={l.nome}>
                  <tr className={cx('cursor-pointer', aberta === l.nome ? 'bg-beon-soft' : 'bg-white hover:bg-beon-soft')} onClick={() => setAberta(a => (a === l.nome ? null : l.nome))}>
                    <th scope="row" className="sticky left-0 z-[1] bg-inherit px-4 py-2 text-left font-medium">
                      <button type="button" aria-expanded={aberta === l.nome} className={cx('flex w-full items-center gap-2 text-left', focusRing, l.informado ? 'text-beon-ink' : 'italic text-beon-muted')}>
                        <ChevronDown className={cx('h-3.5 w-3.5 shrink-0 text-beon-muted transition-transform', aberta === l.nome && 'rotate-180')} aria-hidden />
                        <span className="truncate">{l.nome}</span>
                      </button>
                    </th>
                    <Celulas porPeriodo={l.porPeriodo} />
                  </tr>
                  {aberta === l.nome && (
                    <tr>
                      <td colSpan={1 + COLUNAS.length * 2} className="bg-white px-4 py-3">
                        <ul className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
                          {janelas.map((j, k) => (
                            <li key={j.id}>
                              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-beon-ink">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_PERIODO[k] }} aria-hidden />{j.rotulo}
                              </p>
                              <ul className="space-y-1">
                                {l.eventos.filter(ev => ev.periodo === k).sort((a, b) => a.data.localeCompare(b.data)).map(ev => {
                                  const s = SITUACOES.find(x => x.id === ev.experimento.situacao)!
                                  return (
                                    <li key={ev.experimento.key} className="flex items-center gap-2 text-[13px]">
                                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.cor }} title={s.label} aria-label={s.label} />
                                      <span className="min-w-0 flex-1 truncate text-beon-body">{ev.experimento.nome}</span>
                                      {jiraUrl
                                        ? <a href={`${jiraUrl}/browse/${ev.experimento.key}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-beon-muted hover:text-beon-red">{ev.experimento.key}<ExternalLink className="h-3 w-3" aria-hidden /></a>
                                        : <span className="text-xs text-beon-muted">{ev.experimento.key}</span>}
                                      <span className="w-20 text-right text-xs tabular-nums text-beon-muted">{dataBR(ev.data)}</span>
                                    </li>
                                  )
                                })}
                                {!l.eventos.some(ev => ev.periodo === k) && <li className="text-xs text-beon-muted">Nenhum resultado no período.</li>}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {linhas.length === 0 && (
                <tr><td colSpan={1 + COLUNAS.length * 2} className="px-4 py-6 text-center text-beon-muted">Nenhum resultado no período.</td></tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-beon-line bg-beon-soft">
              <tr>
                <th scope="row" className="sticky left-0 z-[1] bg-beon-soft px-4 py-2 text-left font-semibold text-beon-ink">Total</th>
                <Celulas porPeriodo={total} negrito />
              </tr>
            </tfoot>
          </table>
        </div>
        {linhas.length > LIMITE && (
          <button type="button" onClick={() => setTodas(v => !v)}
            className={cx('w-full border-t border-beon-line px-4 py-2.5 text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
            {todas ? `Mostrar só as ${LIMITE} primeiras` : `Mostrar todas as ${linhas.length} linhas`}
          </button>
        )}
      </div>
    </section>
  )
}
