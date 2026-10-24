'use client'

// Aba Comparativo: 2025 × 2026 dos indicadores-chave. Os cartões de cima resumem e escolhem o indicador;
// abaixo, a evolução mês a mês e os itens que entram na conta, para conferir de onde vem cada número.

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, ExternalLink, Info, Minus } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import {
  ANOS, MINIMO_PARA_COMPARAR, principal, resumirAno, variacao, type ComparativoDados, type Indicador, type IndicadorId, type ResumoAno,
} from '@/lib/comparativo/resumo'

// Paleta validada (dataviz/validate_palette: lightness, chroma, CVD e contraste OK): ano anterior em azul, atual na cor da marca.
const COR_ANO: Record<number, string> = { 2025: '#2F6FB3', 2026: '#D31809' }
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const [A, B] = ANOS

const dias = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('pt-BR')} ${v === 1 ? 'dia' : 'dias'}`)
const valor = (ind: Indicador, v: number | null) => (ind.unidade === 'reais' ? (v ? formatarValor(v) : '—') : dias(v))
const dataBR = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

function Ano({ ano, className }: { ano: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-medium text-beon-muted', className)}>
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_ANO[ano] }} aria-hidden /> {ano}
    </span>
  )
}

/** Variação com ícone e texto (nunca só a cor): verde quando melhora, vermelho quando piora. */
function Variacao({ ind, r1, r2, compacta = false }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; compacta?: boolean }) {
  if (Math.min(r1.n, r2.n) < MINIMO_PARA_COMPARAR) {
    return <span className="text-xs text-beon-muted">Poucos itens para comparar (mín. {MINIMO_PARA_COMPARAR} por ano)</span>
  }
  const v = variacao(ind, principal(ind, r1), principal(ind, r2))
  if (!v) return <span className="text-xs text-beon-muted">Sem base de comparação</span>
  const Icone = v.diferenca === 0 ? Minus : v.diferenca < 0 ? ArrowDownRight : ArrowUpRight
  const tom = v.melhorou === null ? 'bg-stone-100 text-beon-body' : v.melhorou ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
  const dif = ind.unidade === 'reais' ? formatarValor(Math.abs(v.diferenca)) : dias(Math.abs(v.diferenca))
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', tom)}>
      <Icone className="h-3.5 w-3.5" aria-hidden />
      {v.pct > 0 ? '+' : ''}{v.pct}%
      {!compacta && <span className="font-medium">· {v.diferenca < 0 ? '−' : '+'}{dif}</span>}
      <span className="sr-only">{v.melhorou === null ? 'sem mudança' : v.melhorou ? 'melhorou' : 'piorou'}</span>
      {!compacta && v.melhorou !== null && <span className="font-medium">· {v.melhorou ? 'melhor' : 'pior'}</span>}
    </span>
  )
}

function CartaoResumo({ ind, r1, r2, ativo, onClick }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; ativo: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo}
      className={cx('flex min-w-0 flex-col rounded-2xl border bg-white p-4 text-left transition hover:border-stone-300', focusRing,
        ativo ? 'border-beon-ink ring-1 ring-beon-ink' : 'border-beon-line')}>
      <span className="text-[13px] font-semibold leading-snug text-beon-ink">{ind.titulo}</span>
      <span className="mt-0.5 text-[11px] text-beon-muted">{ind.unidade === 'reais' ? 'Soma no ano' : 'Mediana no ano'} · board de {ind.board}</span>
      <span className="mt-3 grid grid-cols-2 gap-2">
        {[r1, r2].map(r => (
          <span key={r.ano} className="min-w-0">
            <Ano ano={r.ano} />
            <span className="mt-0.5 block truncate text-xl font-semibold tracking-tight tabular-nums text-beon-ink">{valor(ind, principal(ind, r))}</span>
            <span className="block text-[11px] tabular-nums text-beon-muted">{r.n} {r.n === 1 ? 'item' : 'itens'}</span>
          </span>
        ))}
      </span>
      <span className="mt-3"><Variacao ind={ind} r1={r1} r2={r2} compacta /></span>
    </button>
  )
}

function Dica({ active, payload, label, ind, acumulado }: {
  active?: boolean; payload?: { dataKey: string; value: number | null; payload: Record<string, number | null> }[]; label?: string; ind: Indicador; acumulado?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-beon-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold capitalize text-beon-ink">{label}</p>
      {payload.map(p => {
        const ano = Number(p.dataKey.slice(1))
        const n = p.payload[`n${ano}`]
        return (
          <p key={p.dataKey} className="flex items-center gap-2 tabular-nums text-beon-body">
            <span className="h-2 w-2 rounded-sm" style={{ background: COR_ANO[ano] }} aria-hidden />
            {ano}: <b className="text-beon-ink">{valor(ind, p.value)}</b>
            {!acumulado && n ? <span className="text-beon-muted">({n} {n === 1 ? 'item' : 'itens'})</span> : null}
          </p>
        )
      })}
    </div>
  )
}

function Grafico({ ind, r1, r2, ate, cortar }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; ate: string; cortar: boolean }) {
  const mesAtual = Number(ate.slice(0, 2)) - 1
  const reais = ind.unidade === 'reais'
  const linhas = MESES.map((mes, m) => {
    const linha: Record<string, string | number | null> = { mes }
    for (const r of [r1, r2]) {
      // Depois do corte (o hoje, no ano corrente; nos dois anos, no "mesmo período") o mês fica vazio.
      const futuro = (r.ano === B || cortar) && m > mesAtual
      if (reais) {
        const acumulado = r.porMes.slice(0, m + 1).reduce<number>((s, v) => s + (v ?? 0), 0)
        linha[`a${r.ano}`] = futuro ? null : acumulado
      } else {
        linha[`a${r.ano}`] = futuro ? null : r.porMes[m]
      }
      linha[`n${r.ano}`] = r.nPorMes[m]
    }
    return linha
  })
  const eixo = { tick: { fill: '#78716C', fontSize: 11 }, axisLine: false, tickLine: false }
  return (
    <div className="h-[260px] w-full" role="img" aria-label={`${ind.titulo}: ${reais ? 'acumulado' : 'mediana'} por mês em ${A} e ${B}`}>
      <ResponsiveContainer width="100%" height="100%">
        {reais ? (
          <LineChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="mes" {...eixo} />
            <YAxis {...eixo} width={64} tickFormatter={v => formatarValor(v).replace('R$ ', '')} />
            <Tooltip content={<Dica ind={ind} acumulado />} cursor={{ stroke: '#D6D3D1' }} />
            {[A, B].map(ano => (
              <Line key={ano} dataKey={`a${ano}`} stroke={COR_ANO[ano]} strokeWidth={2} dot={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="mes" {...eixo} />
            <YAxis {...eixo} width={40} allowDecimals={false} />
            <Tooltip content={<Dica ind={ind} />} cursor={{ fill: '#F7F6F4' }} />
            {[A, B].map(ano => (
              <Bar key={ano} dataKey={`a${ano}`} fill={COR_ANO[ano]} maxBarSize={14} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function Itens({ ind, r1, r2, jiraUrl }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const itens = [...r2.amostras.map(a => ({ ...a, ano: B })), ...r1.amostras.map(a => ({ ...a, ano: A }))]
    .sort((x, y) => y.data.localeCompare(x.data))
  return (
    <div className="border-t border-beon-line">
      <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto}
        className={cx('flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
        Itens que entram na conta ({itens.length})
        <ChevronDown className={cx('h-4 w-4 text-beon-muted transition-transform', aberto && 'rotate-180')} aria-hidden />
      </button>
      {aberto && (
        <div className="max-h-[360px] overflow-auto border-t border-beon-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-beon-soft text-xs uppercase tracking-[0.06em] text-beon-muted">
              <tr>
                <th scope="col" className="px-5 py-2 font-semibold">Ano</th>
                <th scope="col" className="px-3 py-2 font-semibold">Item</th>
                <th scope="col" className="px-3 py-2 font-semibold">Data</th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">{ind.unidade === 'reais' ? 'Benefício' : 'Tempo'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beon-line">
              {itens.map(a => (
                <tr key={`${a.ano}-${a.key}`}>
                  <td className="px-5 py-2"><Ano ano={a.ano} /></td>
                  <td className="max-w-[420px] px-3 py-2">
                    <span className="block truncate text-beon-ink">{a.nome}</span>
                    {jiraUrl
                      ? <a href={`${jiraUrl}/browse/${a.key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-beon-muted hover:text-beon-red">{a.key} <ExternalLink className="h-3 w-3" aria-hidden /></a>
                      : <span className="text-xs text-beon-muted">{a.key}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-beon-body">{dataBR(a.data)}</td>
                  <td className="whitespace-nowrap px-5 py-2 text-right font-medium tabular-nums text-beon-ink">{valor(ind, a.valor)}</td>
                </tr>
              ))}
              {itens.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-beon-muted">Nenhum item no período.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Detalhe({ ind, r1, r2, ate, cortar, jiraUrl }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; ate: string; cortar: boolean; jiraUrl: string | null }) {
  const reais = ind.unidade === 'reais'
  const linhas: [string, (r: ResumoAno) => string][] = reais
    ? [['Benefício', r => valor(ind, principal(ind, r))], ['Hipóteses validadas', r => String(r.n)], ['Média por hipótese', r => valor(ind, r.media)]]
    : [['Mediana', r => dias(r.mediana)], ['Média', r => dias(r.media)], ['Itens', r => String(r.n)]]
  const aberto = ind.emAberto
  const ordenados = aberto.map(e => e.dias).sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  const medianaAberto = !ordenados.length ? 0 : ordenados.length % 2 ? ordenados[meio] : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2)
  return (
    <section aria-labelledby="detalhe-titulo" className="overflow-hidden rounded-2xl border border-beon-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0 max-w-3xl">
          <h2 id="detalhe-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">{ind.titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-beon-muted">{ind.regra}</p>
        </div>
        <Variacao ind={ind} r1={r1} r2={r2} />
      </div>
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="sr-only">Medida</th>
                {[r1, r2].map(r => <th key={r.ano} scope="col" className="pb-2 text-right"><Ano ano={r.ano} className="justify-end" /></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-beon-line">
              {linhas.map(([rotulo, f]) => (
                <tr key={rotulo}>
                  <th scope="row" className="py-2 text-left font-normal text-beon-muted">{rotulo}</th>
                  {[r1, r2].map(r => <td key={r.ano} className="whitespace-nowrap py-2 pl-3 text-right font-semibold tabular-nums text-beon-ink">{f(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {aberto.length > 0 && (
            <p className="mt-4 flex gap-2 rounded-xl bg-beon-soft px-3 py-2.5 text-xs leading-relaxed text-beon-body">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beon-muted" aria-hidden />
              <span>Hoje, <b className="text-beon-ink">{aberto.length}</b> {aberto.length === 1 ? 'item ainda está' : 'itens ainda estão'} nesta etapa, há {dias(medianaAberto)} (mediana). Só entram na conta quando saem.</span>
            </p>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium text-beon-muted">{reais ? 'Benefício acumulado no ano' : 'Mediana por mês (pelo mês em que o item saiu da etapa)'}</p>
          <Grafico ind={ind} r1={r1} r2={r2} ate={ate} cortar={cortar} />
        </div>
      </div>
      <Itens ind={ind} r1={r1} r2={r2} jiraUrl={jiraUrl} />
    </section>
  )
}

/** Itens sem histórico de status (o Jira não devolveu) ficam fora das contas: avisa para não ler o número como completo. */
function AvisoCobertura({ dados }: { dados: ComparativoDados }) {
  const c = dados.cobertura
  if (!c || (c.iniciativas.semHistorico === 0 && c.epics.semHistorico === 0)) return null
  const partes = [
    c.iniciativas.semHistorico ? `${c.iniciativas.semHistorico} de ${c.iniciativas.total} iniciativas` : null,
    c.epics.semHistorico ? `${c.epics.semHistorico} de ${c.epics.total} experimentos` : null,
  ].filter(Boolean)
  return (
    <p role="status" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>O Jira não devolveu o histórico de status de {partes.join(' e ')}. Esses itens ficam fora dos cálculos; atualize a página para tentar de novo.</span>
    </p>
  )
}

export default function ComparativoClient({ dados }: { dados: ComparativoDados }) {
  const [mesmoPeriodo, setMesmoPeriodo] = useState(true)
  const [atual, setAtual] = useState<IndicadorId>('leadExploracao')
  const ateMMDD = dados.hoje.slice(5)
  const corte = mesmoPeriodo ? ateMMDD : null
  const resumos = useMemo(() => new Map(dados.indicadores.map(i => [i.id, [resumirAno(i, A, corte), resumirAno(i, B, corte)] as const])), [dados, corte])
  const ind = dados.indicadores.find(i => i.id === atual)!
  const [r1, r2] = resumos.get(atual)!
  const diaMes = `${ateMMDD.slice(3)}/${ateMMDD.slice(0, 2)}`

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Ano ano={A} /> <Ano ano={B} />
          <span className="text-xs text-beon-muted">
            {mesmoPeriodo ? `Os dois anos de 1º/jan até ${diaMes}` : `${A} completo × ${B} até ${diaMes}`}
          </span>
        </div>
        <div role="radiogroup" aria-label="Período comparado" className="inline-flex rounded-full bg-stone-100 p-1">
          {[[true, `Mesmo período (até ${diaMes})`], [false, 'Ano inteiro']].map(([v, rotulo]) => (
            <button key={String(v)} type="button" role="radio" aria-checked={mesmoPeriodo === v} onClick={() => setMesmoPeriodo(v as boolean)}
              className={cx('h-8 rounded-full px-3 text-[13px] font-medium transition', focusRing,
                mesmoPeriodo === v ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
              {rotulo as string}
            </button>
          ))}
        </div>
      </div>

      <AvisoCobertura dados={dados} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {dados.indicadores.map(i => {
          const [x, y] = resumos.get(i.id)!
          return <CartaoResumo key={i.id} ind={i} r1={x} r2={y} ativo={i.id === atual} onClick={() => setAtual(i.id)} />
        })}
      </div>

      <Detalhe ind={ind} r1={r1} r2={r2} ate={ateMMDD} cortar={mesmoPeriodo} jiraUrl={dados.jiraUrl} />
      <p className="text-xs leading-relaxed text-beon-muted">
        Nos tempos, o número principal é a mediana: metade dos itens levou menos que isso e metade, mais. Assim, poucos itens
        parados por muito tempo não distorcem o ano inteiro; a média aparece no detalhe. A etapa de cada status segue as
        colunas atuais dos boards de Ideação e de Experimentação.
      </p>
    </div>
  )
}
