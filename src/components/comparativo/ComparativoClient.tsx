'use client'

// Aba Comparativo: 2025 × 2026 em três camadas, da foto geral ao detalhe.
// 1. Panorama: todos os experimentos do histórico, pela safra (ano de criação), e onde cada safra está hoje.
// 2. Resultados no ano: concluídos, hipóteses validadas e refutadas, cancelados e benefício, no ano em que aconteceram.
// 3. Tempos do processo: lead times e cycle times. Cada cartão abre o detalhe, com a regra, o mês a mês e os itens.

import { useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, ExternalLink, Info, Minus } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import {
  amostrasDoAno, ANOS, MINIMO_PARA_COMPARAR, principal, resumirAno, serie, variacao,
  type ComparativoDados, type Indicador, type IndicadorId, type ResumoAno,
} from '@/lib/comparativo/resumo'
import Panorama from './Panorama'
import PorArea from './PorArea'
import ReportExecutivo from './ReportExecutivo'
import { COR_ANO } from './cores'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const TRIMESTRES = ['1º tri', '2º tri', '3º tri', '4º tri']

/** Como o gráfico do detalhe mostra o ano: acumulado (itens e R$), mês a mês ou trimestre a trimestre. */
type Vista = 'acumulado' | 'mes' | 'trimestre'
const [A, B] = ANOS

const dias = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('pt-BR')} ${v === 1 ? 'dia' : 'dias'}`)
const itens = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR'))
const valor = (ind: Indicador, v: number | null) =>
  ind.unidade === 'reais' ? (v ? formatarValor(v) : '—') : ind.unidade === 'itens' ? itens(v) : dias(v)
const dataBR = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
const comoResume = (ind: Indicador) => (ind.unidade === 'reais' ? 'Soma no ano' : ind.unidade === 'itens' ? 'Quantidade no ano' : 'Mediana no ano')

function Ano({ ano, className }: { ano: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-medium text-beon-muted', className)}>
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_ANO[ano] }} aria-hidden /> {ano}
    </span>
  )
}

/** Variação com ícone e texto (nunca só a cor): verde quando melhora, vermelho quando piora, cinza quando é neutra. */
function Variacao({ ind, r1, r2, compacta = false }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; compacta?: boolean }) {
  if (Math.min(r1.n, r2.n) < MINIMO_PARA_COMPARAR) {
    return <span className="text-xs text-beon-muted">Poucos itens para comparar (mín. {MINIMO_PARA_COMPARAR} por ano)</span>
  }
  const v = variacao(ind, principal(ind, r1), principal(ind, r2))
  if (!v) return <span className="text-xs text-beon-muted">Sem base de comparação</span>
  const Icone = v.diferenca === 0 ? Minus : v.diferenca < 0 ? ArrowDownRight : ArrowUpRight
  const tom = v.melhorou === null ? 'bg-stone-100 text-beon-body' : v.melhorou ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
  const dif = ind.unidade === 'reais' ? formatarValor(Math.abs(v.diferenca)) : ind.unidade === 'itens' ? itens(Math.abs(v.diferenca)) : dias(Math.abs(v.diferenca))
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', tom)}>
      <Icone className="h-3.5 w-3.5" aria-hidden />
      {v.pct > 0 ? '+' : ''}{v.pct}%
      {!compacta && <span className="font-medium">· {v.diferenca < 0 ? '−' : '+'}{dif}</span>}
      <span className="sr-only">{v.melhorou === null ? 'sem leitura de melhor ou pior' : v.melhorou ? 'melhorou' : 'piorou'}</span>
      {!compacta && v.melhorou !== null && <span className="font-medium">· {v.melhorou ? 'melhor' : 'pior'}</span>}
    </span>
  )
}

function CartaoResumo({ ind, r1, r2, base, ativo, onClick }: {
  ind: Indicador; r1: ResumoAno; r2: ResumoAno; base?: [ResumoAno, ResumoAno]; ativo: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo}
      className={cx('flex min-w-0 flex-col rounded-2xl border bg-white p-4 text-left transition hover:border-stone-300', focusRing,
        ativo ? 'border-beon-ink ring-1 ring-beon-ink' : 'border-beon-line')}>
      <span className="text-[13px] font-semibold leading-snug text-beon-ink">{ind.titulo}</span>
      <span className="mt-0.5 text-[11px] text-beon-muted">{comoResume(ind)} · board de {ind.board}</span>
      <span className="mt-3 grid grid-cols-2 gap-2">
        {[r1, r2].map((r, k) => (
          <span key={r.ano} className="min-w-0">
            <Ano ano={r.ano} />
            <span className="mt-0.5 block truncate text-xl font-semibold tracking-tight tabular-nums text-beon-ink">{valor(ind, principal(ind, r))}</span>
            <span className="block text-[11px] tabular-nums text-beon-muted">
              {base ? `${pct(r.n, base[k].n)}% dos concluídos` : ind.unidade === 'itens' ? 'experimentos' : `${r.n} ${r.n === 1 ? 'item' : 'itens'}`}
            </span>
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
      <p className="mb-1 font-semibold capitalize text-beon-ink">{label}{acumulado ? ' (acumulado)' : ''}</p>
      {payload.map(p => {
        const ano = Number(p.dataKey.slice(1))
        const n = p.payload[`n${ano}`]
        return (
          <p key={p.dataKey} className="flex items-center gap-2 tabular-nums text-beon-body">
            <span className="h-2 w-2 rounded-sm" style={{ background: COR_ANO[ano] }} aria-hidden />
            {ano}: <b className="text-beon-ink">{valor(ind, p.value)}</b>
            {n ? <span className="text-beon-muted">({n} {n === 1 ? 'item' : 'itens'} no período)</span> : null}
          </p>
        )
      })}
    </div>
  )
}

/** Períodos do gráfico e da tabela: rótulo, valor e quantidade de cada ano (vazio depois do corte). */
function periodos(ind: Indicador, r1: ResumoAno, r2: ResumoAno, vista: Vista, ate: string, cortar: boolean) {
  const mesAtual = Number(ate.slice(0, 2)) - 1
  const g = vista === 'trimestre' ? 'trimestre' : 'mes'
  const rotulos = g === 'mes' ? MESES : TRIMESTRES
  const ultimo = g === 'mes' ? mesAtual : Math.floor(mesAtual / 3)
  const series = [r1, r2].map(r => serie(ind, r, g))
  return rotulos.map((rotulo, p) => {
    const linha: Record<string, string | number | null> = { rotulo }
    ;[r1, r2].forEach((r, k) => {
      // Depois do corte (o hoje, no ano corrente; nos dois anos, no "mesmo período") o período fica vazio.
      const futuro = (r.ano === B || cortar) && p > ultimo
      const acumulado = series[k].slice(0, p + 1).reduce<number>((s, x) => s + (x.valor ?? 0), 0)
      linha[`a${r.ano}`] = futuro ? null : vista === 'acumulado' ? acumulado : series[k][p].valor
      linha[`n${r.ano}`] = futuro ? null : series[k][p].n
    })
    return linha
  })
}

function Grafico({ ind, linhas, vista }: { ind: Indicador; linhas: Record<string, string | number | null>[]; vista: Vista }) {
  const eixo = { tick: { fill: '#78716C', fontSize: 11 }, axisLine: false, tickLine: false }
  const formatoEixo = (v: number) => (ind.unidade === 'reais' ? formatarValor(v).replace('R$ ', '') : String(v))
  return (
    <div className="h-[260px] w-full" role="img" aria-label={`${ind.titulo}: ${vista === 'acumulado' ? 'acumulado' : vista === 'mes' ? 'mês a mês' : 'por trimestre'} em ${A} e ${B}`}>
      <ResponsiveContainer width="100%" height="100%">
        {vista === 'acumulado' ? (
          <LineChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis {...eixo} width={ind.unidade === 'reais' ? 64 : 36} allowDecimals={false} tickFormatter={formatoEixo} />
            <Tooltip content={<Dica ind={ind} acumulado />} cursor={{ stroke: '#D6D3D1' }} />
            {[A, B].map(ano => (
              <Line key={ano} dataKey={`a${ano}`} stroke={COR_ANO[ano]} strokeWidth={2} dot={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap={vista === 'trimestre' ? '36%' : '28%'}>
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis {...eixo} width={ind.unidade === 'reais' ? 64 : 40} allowDecimals={false} tickFormatter={formatoEixo} />
            <Tooltip content={<Dica ind={ind} />} cursor={{ fill: '#F7F6F4' }} />
            {[A, B].map(ano => (
              <Bar key={ano} dataKey={`a${ano}`} fill={COR_ANO[ano]} maxBarSize={vista === 'trimestre' ? 36 : 14} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/** Tabela período a período: os dois anos lado a lado e a variação, para ler sem o gráfico. */
function TabelaPeriodos({ ind, linhas, vista }: { ind: Indicador; linhas: Record<string, string | number | null>[]; vista: Vista }) {
  const num = (v: string | number | null) => (typeof v === 'number' ? v : null)
  return (
    <div className="mt-3 max-h-[300px] overflow-auto rounded-xl border border-beon-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-beon-soft text-xs uppercase tracking-[0.06em] text-beon-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">{vista === 'trimestre' ? 'Trimestre' : 'Mês'}{vista === 'acumulado' ? ' (acumulado)' : ''}</th>
            {[A, B].map(ano => <th key={ano} scope="col" className="px-3 py-2 text-right font-semibold"><Ano ano={ano} className="justify-end" /></th>)}
            <th scope="col" className="px-3 py-2 text-right font-semibold">Variação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-beon-line">
          {linhas.map(l => {
            const a = num(l[`a${A}`]), b = num(l[`a${B}`])
            const v = a !== null && b !== null ? variacao(ind, a, b) : null
            return (
              <tr key={String(l.rotulo)}>
                <th scope="row" className={cx('px-3 py-1.5 text-left font-normal text-beon-body', vista !== 'trimestre' && 'capitalize')}>{l.rotulo}</th>
                {[A, B].map(ano => {
                  const x = num(l[`a${ano}`]), n = num(l[`n${ano}`])
                  return (
                    <td key={ano} className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-beon-ink">
                      {x === null ? <span className="text-beon-muted">–</span> : valor(ind, x)}
                      {ind.unidade === 'dias' && n ? <span className="ml-1 text-[11px] text-beon-muted">({n})</span> : null}
                    </td>
                  )
                })}
                <td className={cx('whitespace-nowrap px-3 py-1.5 text-right text-xs font-semibold tabular-nums',
                  !v || v.melhorou === null ? 'text-beon-muted' : v.melhorou ? 'text-emerald-700' : 'text-red-700')}>
                  {v ? `${v.pct > 0 ? '+' : ''}${v.pct}%` : '–'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LinkJira({ chave, jiraUrl }: { chave: string; jiraUrl: string | null }) {
  return jiraUrl
    ? <a href={`${jiraUrl}/browse/${chave}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-beon-muted hover:text-beon-red">{chave} <ExternalLink className="h-3 w-3" aria-hidden /></a>
    : <span className="text-xs text-beon-muted">{chave}</span>
}

function Itens({ ind, r1, r2, jiraUrl }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const lista = [...r2.amostras.map(a => ({ ...a, ano: B })), ...r1.amostras.map(a => ({ ...a, ano: A }))]
    .sort((x, y) => y.data.localeCompare(x.data))
  const coluna = ind.unidade === 'reais' ? 'Benefício' : ind.unidade === 'itens' ? null : 'Tempo'
  return (
    <div className="border-t border-beon-line">
      <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto}
        className={cx('flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-beon-ink hover:bg-beon-soft', focusRing)}>
        Itens que entram na conta ({lista.length})
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
                {coluna && <th scope="col" className="px-5 py-2 text-right font-semibold">{coluna}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-beon-line">
              {lista.map(a => (
                <tr key={`${a.ano}-${a.key}`}>
                  <td className="px-5 py-2"><Ano ano={a.ano} /></td>
                  <td className="max-w-[420px] px-3 py-2"><span className="block truncate text-beon-ink">{a.nome}</span><LinkJira chave={a.key} jiraUrl={jiraUrl} /></td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-beon-body">{dataBR(a.data)}</td>
                  {coluna && <td className="whitespace-nowrap px-5 py-2 text-right font-medium tabular-nums text-beon-ink">{valor(ind, a.valor)}</td>}
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-beon-muted">Nenhum item no período.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Quem poderia entrar e ficou de fora, com o motivo: explica por que o número é menor que o total de experimentos. */
function ForaDaConta({ ind, corte, jiraUrl }: { ind: Indicador; corte: string | null; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const fora = ind.foraDaConta ?? []
  if (!fora.length) return null
  const doAno = (ano: number) => fora.filter(f => f.data?.startsWith(`${ano}-`) && (!corte || f.data.slice(5) <= corte))
  const semData = fora.filter(f => !f.data)
  const motivos = [...new Set(fora.map(f => f.motivo))]
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
      <p className="font-semibold">Fora da conta</p>
      <ul className="mt-1 space-y-0.5 tabular-nums">
        {ANOS.map(ano => <li key={ano} className="flex justify-between gap-3"><Ano ano={ano} /><span>{doAno(ano).length}</span></li>)}
        {semData.length > 0 && <li className="flex justify-between gap-3"><span>Sem data</span><span>{semData.length}</span></li>}
      </ul>
      <p className="mt-1.5">{motivos.join('. ')}.</p>
      <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto} className={cx('mt-1 font-semibold underline', focusRing)}>
        {aberto ? 'Esconder' : 'Ver'} os {fora.length}
      </button>
      {aberto && (
        <ul className="mt-2 max-h-[220px] space-y-1.5 overflow-auto">
          {fora.map(f => (
            <li key={f.key} className="rounded-lg bg-white px-2 py-1.5">
              <span className="block truncate text-beon-ink">{f.nome}</span>
              <span className="flex flex-wrap items-center gap-x-2"><LinkJira chave={f.key} jiraUrl={jiraUrl} />{f.data && <span className="text-beon-muted">{dataBR(f.data)}</span>}</span>
              <span className="block text-beon-muted">{f.motivo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Fecha o benefício com o Semanal: o total de hoje das hipóteses validadas e em que ano cada uma foi concluída. */
function Conciliacao({ ind }: { ind: Indicador }) {
  const c = ind.conciliacao!
  const anos = ANOS.map(ano => {
    const xs = ind.amostras.filter(a => a.data.startsWith(`${ano}-`))
    return { ano, n: xs.length, soma: xs.reduce((s, a) => s + a.valor, 0) }
  })
  const experimentos = (n: number) => `${n} ${n === 1 ? 'experimento' : 'experimentos'}`
  return (
    <div className="mt-4 rounded-xl bg-beon-soft px-3 py-2.5 text-xs leading-relaxed text-beon-body">
      <p>
        Hoje, as <b className="text-beon-ink">hipóteses validadas</b> do Semanal somam <b className="text-beon-ink">{formatarValor(c.total)}</b> em {experimentos(c.n)}.
        Pelo ano da conclusão (ano inteiro):
      </p>
      <ul className="mt-1.5 space-y-0.5 tabular-nums">
        {anos.map(a => (
          <li key={a.ano} className="flex items-center justify-between gap-3"><Ano ano={a.ano} /><span><b className="text-beon-ink">{experimentos(a.n)}</b> · {formatarValor(a.soma)}</span></li>
        ))}
        {c.foraDosAnos > 0 && <li className="flex justify-between gap-3"><span>Antes de {ANOS[0]}</span><span>{experimentos(c.foraDosAnos)}</span></li>}
        {c.semData > 0 && <li className="flex justify-between gap-3"><span>Sem data de conclusão no Jira</span><span>{experimentos(c.semData)}</span></li>}
      </ul>
    </div>
  )
}

/** Frase que lê o número para o executivo: o que mudou de um ano para o outro, em palavras. */
function Leitura({ ind, r1, r2, base }: { ind: Indicador; r1: ResumoAno; r2: ResumoAno; base?: [ResumoAno, ResumoAno] }) {
  const p1 = principal(ind, r1), p2 = principal(ind, r2)
  if (p1 === null || p2 === null) return null
  const v = variacao(ind, p1, p2)
  const sentido = !v || v.diferenca === 0 ? 'ficou estável' : v.diferenca > 0 ? `subiu ${Math.abs(v.pct)}%` : `caiu ${Math.abs(v.pct)}%`
  const leitura = v?.melhorou === true ? ', um avanço' : v?.melhorou === false ? ', um ponto de atenção' : ''
  return (
    <p className="mt-3 rounded-xl border border-beon-line px-3 py-2.5 text-[13px] leading-relaxed text-beon-body">
      Em {B}, {ind.titulo.toLowerCase()} {sentido} em relação a {A} ({valor(ind, p1)} → <b className="text-beon-ink">{valor(ind, p2)}</b>){leitura}.
      {base && ` Sobre os concluídos, a fatia passou de ${pct(r1.n, base[0].n)}% para ${pct(r2.n, base[1].n)}%.`}
      {Math.min(r1.n, r2.n) < MINIMO_PARA_COMPARAR && ' Com tão poucos itens, leia como sinal, não como tendência.'}
    </p>
  )
}

function Detalhe({ ind, r1, r2, base, ate, cortar, corte, jiraUrl }: {
  ind: Indicador; r1: ResumoAno; r2: ResumoAno; base?: [ResumoAno, ResumoAno]; ate: string; cortar: boolean; corte: string | null; jiraUrl: string | null
}) {
  const mesesNoAno = (r: ResumoAno) => (r.ano === B || cortar ? Number(ate.slice(0, 2)) : 12)
  type Linha = [string, (r: ResumoAno, k: number) => string]
  const linhas: Linha[] =
    ind.unidade === 'reais'
      ? [['Benefício', r => valor(ind, principal(ind, r))], ['Hipóteses validadas', r => String(r.n)], ['Média por hipótese', r => valor(ind, r.media)]]
      : ind.unidade === 'itens'
        ? [
          ['Total no período', r => itens(r.n)],
          ['Média por mês', r => (r.n / mesesNoAno(r)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })],
          ...(base ? [['% dos concluídos', (r: ResumoAno, k: number) => `${pct(r.n, base[k].n)}%`] as Linha] : []),
        ]
        : [['Mediana', r => dias(r.mediana)], ['Média', r => dias(r.media)], ['Itens medidos', r => String(r.n)]]
  const aberto = ind.emAberto
  const ordenados = aberto.map(e => e.dias).sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  const medianaAberto = !ordenados.length ? 0 : ordenados.length % 2 ? ordenados[meio] : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2)
  const vistas: [Vista, string][] = [...(ind.unidade === 'dias' ? [] : [['acumulado', 'Acumulado'] as [Vista, string]]), ['mes', 'Por mês'], ['trimestre', 'Por trimestre']]
  const [escolhida, setVista] = useState<Vista>('acumulado')
  const vista: Vista = ind.unidade === 'dias' && escolhida === 'acumulado' ? 'mes' : escolhida
  const linhasPeriodo = periodos(ind, r1, r2, vista, ate, cortar)
  const legendaGrafico = ind.unidade === 'dias'
    ? `Mediana ${vista === 'mes' ? 'por mês' : 'por trimestre'} (pelo período em que o item saiu da etapa; entre parênteses, quantos itens)`
    : vista === 'acumulado' ? `${ind.unidade === 'reais' ? 'Benefício' : 'Quantidade'} acumulada no ano` : `${ind.unidade === 'reais' ? 'Benefício' : 'Quantidade'} ${vista === 'mes' ? 'em cada mês' : 'em cada trimestre'}`
  return (
    <section aria-labelledby="detalhe-titulo" className="overflow-hidden rounded-2xl border border-beon-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-muted">Detalhe</p>
          <h2 id="detalhe-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">{ind.titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-beon-muted">{ind.regra}</p>
        </div>
        <Variacao ind={ind} r1={r1} r2={r2} />
      </div>
      <div className="px-5"><Leitura ind={ind} r1={r1} r2={r2} base={base} /></div>
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
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
                  {[r1, r2].map((r, k) => <td key={r.ano} className="whitespace-nowrap py-2 pl-3 text-right font-semibold tabular-nums text-beon-ink">{f(r, k)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {ind.conciliacao && <Conciliacao ind={ind} />}
          <ForaDaConta ind={ind} corte={corte} jiraUrl={jiraUrl} />
          {aberto.length > 0 && (
            <p className="mt-4 flex gap-2 rounded-xl bg-beon-soft px-3 py-2.5 text-xs leading-relaxed text-beon-body">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beon-muted" aria-hidden />
              <span>Hoje, <b className="text-beon-ink">{aberto.length}</b> {aberto.length === 1 ? 'item ainda está' : 'itens ainda estão'} nesta etapa, há {dias(medianaAberto)} (mediana). Só entram na conta quando saem.</span>
            </p>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-beon-muted">{legendaGrafico}</p>
            <div role="radiogroup" aria-label="Granularidade do gráfico" className="inline-flex rounded-full bg-stone-100 p-0.5">
              {vistas.map(([v, rotulo]) => (
                <button key={v} type="button" role="radio" aria-checked={vista === v} onClick={() => setVista(v)}
                  className={cx('h-7 rounded-full px-2.5 text-xs font-medium transition', focusRing,
                    vista === v ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          <Grafico ind={ind} linhas={linhasPeriodo} vista={vista} />
          <TabelaPeriodos ind={ind} linhas={linhasPeriodo} vista={vista} />
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
      <span>O Jira não devolveu o histórico de status de {partes.join(' e ')}. Esses itens ficam fora dos cálculos por data; atualize a página para tentar de novo.</span>
    </p>
  )
}

function Secao({ olho, titulo, descricao, children }: { olho: string; titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">{olho}</p>
        <h2 className="text-lg font-semibold tracking-tight text-beon-ink">{titulo}</h2>
        <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">{descricao}</p>
      </div>
      {children}
    </section>
  )
}

export default function ComparativoClient({ dados }: { dados: ComparativoDados }) {
  const [mesmoPeriodo, setMesmoPeriodo] = useState(true)
  const [atual, setAtual] = useState<IndicadorId>('concluidos')
  const detalheRef = useRef<HTMLDivElement>(null)
  const ateMMDD = dados.hoje.slice(5)
  const corte = mesmoPeriodo ? ateMMDD : null
  const resumos = useMemo(() => new Map(dados.indicadores.map(i => [i.id, [resumirAno(i, A, corte), resumirAno(i, B, corte)] as const])), [dados, corte])
  const baseDe = (i: Indicador): [ResumoAno, ResumoAno] | undefined => {
    const r = i.relativoA ? resumos.get(i.relativoA) : undefined
    return r ? [r[0], r[1]] : undefined
  }
  const ind = dados.indicadores.find(i => i.id === atual)!
  const [r1, r2] = resumos.get(atual)!
  const diaMes = `${ateMMDD.slice(3)}/${ateMMDD.slice(0, 2)}`
  const escolher = (id: IndicadorId) => {
    setAtual(id)
    requestAnimationFrame(() => detalheRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const cartoes = (grupo: Indicador['grupo']) => dados.indicadores.filter(i => i.grupo === grupo).map(i => {
    const [x, y] = resumos.get(i.id)!
    return <CartaoResumo key={i.id} ind={i} r1={x} r2={y} base={baseDe(i)} ativo={i.id === atual} onClick={() => escolher(i.id)} />
  })
  // Quantas conclusões de 2025 ficam depois de hoje (só entram no "Ano inteiro").
  const concluidos = dados.indicadores.find(i => i.id === 'concluidos')
  const depoisDoCorte = concluidos ? concluidos.amostras.filter(a => a.data.startsWith(`${A}-`)).length - amostrasDoAno(concluidos, A, ateMMDD).length : 0

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-5 sm:px-6">
      <AvisoCobertura dados={dados} />

      <Panorama experimentos={dados.experimentos} jiraUrl={dados.jiraUrl} />

      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-beon-line bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Ano ano={A} /> <Ano ano={B} />
          <span className="text-xs text-beon-muted">
            {mesmoPeriodo ? `Resultados e tempos de 1º/jan até ${diaMes} nos dois anos` : `${A} completo × ${B} até ${diaMes}`}
            {mesmoPeriodo && depoisDoCorte > 0 && ` · ${depoisDoCorte} conclusões de ${A} ficam depois de ${diaMes}`}
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

      <Secao olho="Resultados no ano" titulo="O que foi concluído, validado, refutado e cancelado"
        descricao="Cada experimento conta no ano em que o evento aconteceu: a conclusão (validada ou refutada) ou o cancelamento. Clique num cartão para ver o mês a mês e a lista.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{cartoes('resultados')}</div>
      </Secao>

      <PorArea experimentos={dados.experimentos} corte={corte} jiraUrl={dados.jiraUrl} />

      <Secao olho="Tempos do processo" titulo="Quanto tempo cada etapa leva"
        descricao="Mediana de dias por etapa, no ano em que o item saiu dela. Itens ainda na etapa e itens sem histórico ficam de fora, e o detalhe mostra quantos.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cartoes('tempos')}</div>
      </Secao>

      <div ref={detalheRef} className="scroll-mt-16">
        <Detalhe ind={ind} r1={r1} r2={r2} base={baseDe(ind)} ate={ateMMDD} cortar={mesmoPeriodo} corte={corte} jiraUrl={dados.jiraUrl} />
      </div>

      <ReportExecutivo dados={dados} corte={corte} />

      <p className="text-xs leading-relaxed text-beon-muted">
        Nos tempos, o número principal é a mediana: metade dos itens levou menos que isso e metade, mais; a média aparece no detalhe.
        A etapa de cada status segue as colunas atuais dos boards de Ideação e de Experimentação. Validada, refutada e cancelada seguem a classificação do Semanal.
      </p>
    </div>
  )
}
