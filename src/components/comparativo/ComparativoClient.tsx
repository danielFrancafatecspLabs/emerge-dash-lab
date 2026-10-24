'use client'

// Aba Comparativo: um período contra outro (ano × ano, trimestre × trimestre ou mês × mês), da foto geral ao detalhe.
// 1. Panorama: todos os experimentos do histórico e a safra de cada período (criados nele), com onde cada um está hoje.
// 2. Resultados: concluídos, hipóteses validadas e refutadas, cancelados e benefício, no período em que aconteceram.
// 3. Por área, tempos do processo e o detalhe de cada indicador; no fim, o report executivo para baixar em PDF.

import { useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, ExternalLink, Info, Minus } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import {
  criarComparacao, dentro, MINIMO_PARA_COMPARAR, periodosDisponiveis, principal, resumir, serie, trecho, variacao,
  type Comparacao, type ComparativoDados, type Indicador, type IndicadorId, type Modo, type Resumo,
} from '@/lib/comparativo/resumo'
import Panorama from './Panorama'
import PorArea from './PorArea'
import ReportExecutivo from './ReportExecutivo'
import { COR_PERIODO } from './cores'

const TRIMESTRES = ['1º tri', '2º tri', '3º tri', '4º tri']
const MODOS: [Modo, string][] = [['anual', 'Anual'], ['trimestral', 'Trimestral'], ['mensal', 'Mensal']]

/** Como o gráfico do detalhe mostra o período: acumulado (itens e R$), parte a parte (mês ou semana) ou trimestres do ano. */
type Vista = 'acumulado' | 'partes' | 'trimestre'

const dias = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('pt-BR')} ${v === 1 ? 'dia' : 'dias'}`)
const itens = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR'))
const valor = (ind: Indicador, v: number | null) =>
  ind.unidade === 'reais' ? (v ? formatarValor(v) : '—') : ind.unidade === 'itens' ? itens(v) : dias(v)
const dataBR = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
const comoResume = (ind: Indicador) => (ind.unidade === 'reais' ? 'Soma no período' : ind.unidade === 'itens' ? 'Quantidade no período' : 'Mediana no período')

function Periodo({ k, rotulo, className }: { k: number; rotulo: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-beon-muted', className)}>
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_PERIODO[k] }} aria-hidden /> {rotulo}
    </span>
  )
}

/** Variação com ícone e texto (nunca só a cor): verde quando melhora, vermelho quando piora, cinza quando é neutra. */
function Variacao({ ind, r1, r2, compacta = false }: { ind: Indicador; r1: Resumo; r2: Resumo; compacta?: boolean }) {
  if (Math.min(r1.n, r2.n) < MINIMO_PARA_COMPARAR) {
    return <span className="text-xs text-beon-muted">Poucos itens para comparar (mín. {MINIMO_PARA_COMPARAR} por período)</span>
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
  ind: Indicador; r1: Resumo; r2: Resumo; base?: [Resumo, Resumo]; ativo: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo}
      className={cx('flex min-w-0 flex-col rounded-2xl border bg-white p-4 text-left transition hover:border-stone-300', focusRing,
        ativo ? 'border-beon-ink ring-1 ring-beon-ink' : 'border-beon-line')}>
      <span className="text-[13px] font-semibold leading-snug text-beon-ink">{ind.titulo}</span>
      <span className="mt-0.5 text-[11px] text-beon-muted">{comoResume(ind)} · board de {ind.board}</span>
      <span className="mt-3 grid grid-cols-2 gap-2">
        {[r1, r2].map((r, k) => (
          <span key={k} className="min-w-0">
            <Periodo k={k} rotulo={r.janela.rotulo} />
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

function Dica({ active, payload, label, ind, rotulos, acumulado }: {
  active?: boolean; payload?: { dataKey: string; value: number | null; payload: Record<string, number | null> }[]; label?: string
  ind: Indicador; rotulos: string[]; acumulado?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-beon-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-beon-ink">{label}{acumulado ? ' (acumulado)' : ''}</p>
      {payload.map(p => {
        const k = Number(p.dataKey.slice(1))
        const n = p.payload[`n${k}`]
        return (
          <p key={p.dataKey} className="flex items-center gap-2 tabular-nums text-beon-body">
            <span className="h-2 w-2 rounded-sm" style={{ background: COR_PERIODO[k] }} aria-hidden />
            {rotulos[k]}: <b className="text-beon-ink">{valor(ind, p.value)}</b>
            {n ? <span className="text-beon-muted">({n} {n === 1 ? 'item' : 'itens'} no período)</span> : null}
          </p>
        )
      })}
    </div>
  )
}

/** Linhas do gráfico e da tabela: rótulo de cada parte e o valor e a quantidade de cada período (vazio depois do corte). */
function periodos(ind: Indicador, r1: Resumo, r2: Resumo, vista: Vista) {
  const tamanho = vista === 'trimestre' ? 3 : 1
  const resumos = [r1, r2]
  const maisLongo = r1.janela.partes.length >= r2.janela.partes.length ? r1.janela : r2.janela
  const rotulos = tamanho === 3 ? TRIMESTRES : maisLongo.partes.map(p => p.rotulo)
  const series = resumos.map(r => serie(ind, r, tamanho))
  return rotulos.map((rotulo, g) => {
    const linha: Record<string, string | number | null> = { rotulo }
    resumos.forEach((r, k) => {
      // Parte que começa depois do fim do período (o hoje, ou o corte do "mesmo período") ou que não existe fica vazia.
      const parte = r.janela.partes[g * tamanho]
      const vazio = !parte || parte.inicio > r.janela.fim
      const acumulado = series[k].slice(0, g + 1).reduce<number>((s, x) => s + (x.valor ?? 0), 0)
      // Dentro do período, contagem e soma sem item valem 0 (o "–" fica para o que está fora dele); tempo sem item fica vazio.
      const noGrupo = series[k][g].valor ?? (ind.unidade === 'dias' ? null : 0)
      linha[`a${k}`] = vazio ? null : vista === 'acumulado' ? acumulado : noGrupo
      linha[`n${k}`] = vazio ? null : series[k][g].n
    })
    return linha
  })
}

function Grafico({ ind, linhas, vista, rotulos }: { ind: Indicador; linhas: Record<string, string | number | null>[]; vista: Vista; rotulos: string[] }) {
  const eixo = { tick: { fill: '#78716C', fontSize: 11 }, axisLine: false, tickLine: false }
  const formatoEixo = (v: number) => (ind.unidade === 'reais' ? formatarValor(v).replace('R$ ', '') : String(v))
  const largos = linhas.length <= 5
  return (
    <div className="h-[260px] w-full" role="img" aria-label={`${ind.titulo}: ${vista === 'acumulado' ? 'acumulado' : 'por parte do período'} em ${rotulos.join(' e ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        {vista === 'acumulado' ? (
          <LineChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis {...eixo} width={ind.unidade === 'reais' ? 64 : 36} allowDecimals={false} tickFormatter={formatoEixo} />
            <Tooltip content={<Dica ind={ind} rotulos={rotulos} acumulado />} cursor={{ stroke: '#D6D3D1' }} />
            {[0, 1].map(k => (
              <Line key={k} dataKey={`a${k}`} stroke={COR_PERIODO[k]} strokeWidth={2} dot={largos ? { r: 4, stroke: '#fff', strokeWidth: 2, fill: COR_PERIODO[k] } : false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={linhas} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap={largos ? '36%' : '28%'}>
            <CartesianGrid vertical={false} stroke="#E7E5E4" />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis {...eixo} width={ind.unidade === 'reais' ? 64 : 40} allowDecimals={false} tickFormatter={formatoEixo} />
            <Tooltip content={<Dica ind={ind} rotulos={rotulos} />} cursor={{ fill: '#F7F6F4' }} />
            {[0, 1].map(k => (
              <Bar key={k} dataKey={`a${k}`} fill={COR_PERIODO[k]} maxBarSize={largos ? 36 : 14} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/** Tabela parte a parte: os dois períodos lado a lado e a variação, para ler sem o gráfico. */
function TabelaPeriodos({ ind, linhas, vista, rotulos, nomeParte }: { ind: Indicador; linhas: Record<string, string | number | null>[]; vista: Vista; rotulos: string[]; nomeParte: string }) {
  const num = (v: string | number | null) => (typeof v === 'number' ? v : null)
  return (
    <div className="mt-3 max-h-[300px] overflow-auto rounded-xl border border-beon-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-beon-soft text-xs uppercase tracking-[0.06em] text-beon-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">{vista === 'trimestre' ? 'Trimestre' : nomeParte}{vista === 'acumulado' ? ' (acumulado)' : ''}</th>
            {rotulos.map((r, k) => <th key={k} scope="col" className="px-3 py-2 text-right font-semibold normal-case tracking-normal"><Periodo k={k} rotulo={r} className="justify-end" /></th>)}
            <th scope="col" className="px-3 py-2 text-right font-semibold">Variação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-beon-line">
          {linhas.map(l => {
            const a = num(l.a0), b = num(l.a1)
            const v = a !== null && b !== null ? variacao(ind, a, b) : null
            return (
              <tr key={String(l.rotulo)}>
                <th scope="row" className={cx('px-3 py-1.5 text-left font-normal text-beon-body', vista !== 'trimestre' && 'capitalize')}>{l.rotulo}</th>
                {[0, 1].map(k => {
                  const x = num(l[`a${k}`]), n = num(l[`n${k}`])
                  return (
                    <td key={k} className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-beon-ink">
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

function Itens({ ind, r1, r2, jiraUrl }: { ind: Indicador; r1: Resumo; r2: Resumo; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const lista = [...r2.amostras.map(a => ({ ...a, k: 1 })), ...r1.amostras.map(a => ({ ...a, k: 0 }))]
    .sort((x, y) => y.data.localeCompare(x.data))
  const coluna = ind.unidade === 'reais' ? 'Benefício' : ind.unidade === 'itens' ? null : 'Tempo'
  const rotulos = [r1.janela.rotulo, r2.janela.rotulo]
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
                <th scope="col" className="px-5 py-2 font-semibold">Período</th>
                <th scope="col" className="px-3 py-2 font-semibold">Item</th>
                <th scope="col" className="px-3 py-2 font-semibold">Data</th>
                {coluna && <th scope="col" className="px-5 py-2 text-right font-semibold">{coluna}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-beon-line">
              {lista.map(a => (
                <tr key={`${a.k}-${a.key}`}>
                  <td className="px-5 py-2"><Periodo k={a.k} rotulo={rotulos[a.k]} /></td>
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
function ForaDaConta({ ind, comparacao, jiraUrl }: { ind: Indicador; comparacao: Comparacao; jiraUrl: string | null }) {
  const [aberto, setAberto] = useState(false)
  const fora = ind.foraDaConta ?? []
  if (!fora.length) return null
  const janelas = [comparacao.base, comparacao.atual]
  const semData = fora.filter(f => !f.data)
  const motivos = [...new Set(fora.map(f => f.motivo))]
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
      <p className="font-semibold">Fora da conta</p>
      <ul className="mt-1 space-y-0.5 tabular-nums">
        {janelas.map((j, k) => <li key={j.id} className="flex justify-between gap-3"><Periodo k={k} rotulo={j.rotulo} /><span>{fora.filter(f => dentro(f.data, j)).length}</span></li>)}
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

/** Fecha o benefício com o Semanal: o total de hoje das hipóteses validadas e em que período cada uma foi concluída. */
function Conciliacao({ ind, comparacao }: { ind: Indicador; comparacao: Comparacao }) {
  const c = ind.conciliacao!
  const janelas = [comparacao.base, comparacao.atual]
  const porJanela = janelas.map(j => {
    const xs = ind.amostras.filter(a => dentro(a.data, j))
    return { j, n: xs.length, soma: xs.reduce((s, a) => s + a.valor, 0) }
  })
  const outros = c.n - c.semData - porJanela.reduce((s, x) => s + x.n, 0)
  const experimentos = (n: number) => `${n} ${n === 1 ? 'experimento' : 'experimentos'}`
  return (
    <div className="mt-4 rounded-xl bg-beon-soft px-3 py-2.5 text-xs leading-relaxed text-beon-body">
      <p>
        Hoje, as <b className="text-beon-ink">hipóteses validadas</b> do Semanal somam <b className="text-beon-ink">{formatarValor(c.total)}</b> em {experimentos(c.n)}.
        Pelo período da conclusão:
      </p>
      <ul className="mt-1.5 space-y-0.5 tabular-nums">
        {porJanela.map((x, k) => (
          <li key={x.j.id} className="flex items-center justify-between gap-3"><Periodo k={k} rotulo={x.j.rotulo} /><span><b className="text-beon-ink">{experimentos(x.n)}</b> · {formatarValor(x.soma)}</span></li>
        ))}
        {outros > 0 && <li className="flex justify-between gap-3"><span>Em outros períodos</span><span>{experimentos(outros)}</span></li>}
        {c.semData > 0 && <li className="flex justify-between gap-3"><span>Sem data de conclusão no Jira</span><span>{experimentos(c.semData)}</span></li>}
      </ul>
    </div>
  )
}

/** Frase que lê o número para o executivo: o que mudou de um período para o outro, em palavras. */
function Leitura({ ind, r1, r2, base }: { ind: Indicador; r1: Resumo; r2: Resumo; base?: [Resumo, Resumo] }) {
  const p1 = principal(ind, r1), p2 = principal(ind, r2)
  if (p1 === null || p2 === null) return null
  const v = variacao(ind, p1, p2)
  const sentido = !v || v.diferenca === 0 ? 'ficou estável' : v.diferenca > 0 ? `subiu ${Math.abs(v.pct)}%` : `caiu ${Math.abs(v.pct)}%`
  const leitura = v?.melhorou === true ? ', um avanço' : v?.melhorou === false ? ', um ponto de atenção' : ''
  return (
    <p className="mt-3 rounded-xl border border-beon-line px-3 py-2.5 text-[13px] leading-relaxed text-beon-body">
      Em {r2.janela.rotulo}, {ind.titulo.toLowerCase()} {sentido} em relação a {r1.janela.rotulo} ({valor(ind, p1)} → <b className="text-beon-ink">{valor(ind, p2)}</b>){leitura}.
      {base && ` Sobre os concluídos, a fatia passou de ${pct(r1.n, base[0].n)}% para ${pct(r2.n, base[1].n)}%.`}
      {Math.min(r1.n, r2.n) < MINIMO_PARA_COMPARAR && ' Com tão poucos itens, leia como sinal, não como tendência.'}
    </p>
  )
}

function Detalhe({ ind, r1, r2, base, comparacao, jiraUrl }: {
  ind: Indicador; r1: Resumo; r2: Resumo; base?: [Resumo, Resumo]; comparacao: Comparacao; jiraUrl: string | null
}) {
  const mensal = comparacao.modo === 'mensal'
  const nomeParte = mensal ? 'Semana' : 'Mês'
  const partesNoPeriodo = (r: Resumo) => Math.max(1, r.janela.partes.filter(p => p.inicio <= r.janela.fim).length)
  type Linha = [string, (r: Resumo, k: number) => string]
  const linhas: Linha[] =
    ind.unidade === 'reais'
      ? [['Benefício', r => valor(ind, principal(ind, r))], ['Hipóteses validadas', r => String(r.n)], ['Média por hipótese', r => valor(ind, r.media)]]
      : ind.unidade === 'itens'
        ? [
          ['Total no período', r => itens(r.n)],
          [`Média por ${nomeParte.toLowerCase()}`, r => (r.n / partesNoPeriodo(r)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })],
          ...(base ? [['% dos concluídos', (r: Resumo, k: number) => `${pct(r.n, base[k].n)}%`] as Linha] : []),
        ]
        : [['Mediana', r => dias(r.mediana)], ['Média', r => dias(r.media)], ['Itens medidos', r => String(r.n)]]
  const aberto = ind.emAberto
  const ordenados = aberto.map(e => e.dias).sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  const medianaAberto = !ordenados.length ? 0 : ordenados.length % 2 ? ordenados[meio] : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2)
  const vistas: [Vista, string][] = [
    ...(ind.unidade === 'dias' ? [] : [['acumulado', 'Acumulado'] as [Vista, string]]),
    ['partes', mensal ? 'Por semana' : 'Por mês'],
    ...(comparacao.modo === 'anual' ? [['trimestre', 'Por trimestre'] as [Vista, string]] : []),
  ]
  const [escolhida, setVista] = useState<Vista>('acumulado')
  const vista: Vista = vistas.some(([v]) => v === escolhida) ? escolhida : 'partes'
  const linhasPeriodo = periodos(ind, r1, r2, vista)
  const rotulos = [r1.janela.rotulo, r2.janela.rotulo]
  const porQue = vista === 'trimestre' ? 'por trimestre' : mensal ? 'por semana' : 'por mês'
  const legendaGrafico = ind.unidade === 'dias'
    ? `Mediana ${porQue} (pela data em que o item saiu da etapa; entre parênteses, quantos itens)`
    : vista === 'acumulado' ? `${ind.unidade === 'reais' ? 'Benefício' : 'Quantidade'} acumulada no período` : `${ind.unidade === 'reais' ? 'Benefício' : 'Quantidade'} ${porQue}`
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
                {[r1, r2].map((r, k) => <th key={k} scope="col" className="pb-2 text-right"><Periodo k={k} rotulo={r.janela.rotulo} className="justify-end" /></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-beon-line">
              {linhas.map(([rotulo, f]) => (
                <tr key={rotulo}>
                  <th scope="row" className="py-2 text-left font-normal text-beon-muted">{rotulo}</th>
                  {[r1, r2].map((r, k) => <td key={k} className="whitespace-nowrap py-2 pl-3 text-right font-semibold tabular-nums text-beon-ink">{f(r, k)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {ind.conciliacao && <Conciliacao ind={ind} comparacao={comparacao} />}
          <ForaDaConta ind={ind} comparacao={comparacao} jiraUrl={jiraUrl} />
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
          <Grafico ind={ind} linhas={linhasPeriodo} vista={vista} rotulos={rotulos} />
          <TabelaPeriodos ind={ind} linhas={linhasPeriodo} vista={vista} rotulos={rotulos} nomeParte={nomeParte} />
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

/** Botões de escolha única (pílulas), no padrão da página. */
function Pilulas<T extends string | boolean>({ rotulo, opcoes, valor: atual, onChange }: { rotulo: string; opcoes: [T, string][]; valor: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-full bg-stone-100 p-1">
      {opcoes.map(([v, texto]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={atual === v} onClick={() => onChange(v)}
          className={cx('h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition', focusRing,
            atual === v ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
          {texto}
        </button>
      ))}
    </div>
  )
}

export default function ComparativoClient({ dados }: { dados: ComparativoDados }) {
  const [modo, setModo] = useState<Modo>('anual')
  const opcoes = useMemo(() => periodosDisponiveis(modo, dados.hoje), [modo, dados.hoje])
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const periodoId = escolhido && opcoes.some(o => o.id === escolhido) ? escolhido : opcoes[0]?.id ?? dados.hoje.slice(0, 4)
  const [baseTipo, setBaseTipo] = useState<'anterior' | 'ano-anterior'>('anterior')
  const [mesmoPeriodo, setMesmoPeriodo] = useState(true)
  const [atual, setAtual] = useState<IndicadorId>('concluidos')
  const detalheRef = useRef<HTMLDivElement>(null)

  const comparacao = useMemo(
    () => criarComparacao({ modo, id: periodoId, base: modo === 'anual' ? 'anterior' : baseTipo, mesmoPeriodo, hoje: dados.hoje }),
    [modo, periodoId, baseTipo, mesmoPeriodo, dados.hoje])
  const resumos = useMemo(() => new Map(dados.indicadores.map(i => [i.id, [resumir(i, comparacao.base), resumir(i, comparacao.atual)] as const])), [dados, comparacao])
  const baseDe = (i: Indicador): [Resumo, Resumo] | undefined => {
    const r = i.relativoA ? resumos.get(i.relativoA) : undefined
    return r ? [r[0], r[1]] : undefined
  }
  const ind = dados.indicadores.find(i => i.id === atual)!
  const [r1, r2] = resumos.get(atual)!
  const escolher = (id: IndicadorId) => {
    setAtual(id)
    requestAnimationFrame(() => detalheRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const cartoes = (grupo: Indicador['grupo']) => dados.indicadores.filter(i => i.grupo === grupo).map(i => {
    const [x, y] = resumos.get(i.id)!
    return <CartaoResumo key={i.id} ind={i} r1={x} r2={y} base={baseDe(i)} ativo={i.id === atual} onClick={() => escolher(i.id)} />
  })
  const unidade = modo === 'anual' ? 'ano' : modo === 'trimestral' ? 'trimestre' : 'mês'

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-5 sm:px-6">
      <AvisoCobertura dados={dados} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-beon-line bg-white p-3">
        <Pilulas rotulo="Tipo de comparação" opcoes={MODOS} valor={modo} onChange={v => { setModo(v); setEscolhido(null) }} />
        <label className="inline-flex items-center gap-2 text-[13px] text-beon-muted">
          {modo === 'anual' ? 'Ano' : modo === 'trimestral' ? 'Trimestre' : 'Mês'}
          <select value={periodoId} onChange={e => setEscolhido(e.target.value)}
            className={cx('h-9 rounded-full border border-beon-line bg-white px-3 text-[13px] font-medium text-beon-ink', focusRing)}>
            {opcoes.map(o => <option key={o.id} value={o.id}>{o.rotulo}</option>)}
          </select>
        </label>
        {modo !== 'anual' && (
          <Pilulas rotulo="Comparar com" valor={baseTipo} onChange={setBaseTipo}
            opcoes={[['anterior', `${unidade[0].toUpperCase()}${unidade.slice(1)} anterior`], ['ano-anterior', 'Mesmo período do ano anterior']]} />
        )}
        {comparacao.parcial && (
          <Pilulas rotulo="Período comparado" valor={mesmoPeriodo} onChange={setMesmoPeriodo}
            opcoes={[[true, 'Mesmo período'], [false, `${unidade[0].toUpperCase()}${unidade.slice(1)} inteiro na base`]]} />
        )}
      </div>

      <Panorama experimentos={dados.experimentos} comparacao={comparacao} jiraUrl={dados.jiraUrl} />

      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-beon-line bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        <Periodo k={0} rotulo={`${comparacao.base.rotulo} (${trecho(comparacao.base)})`} />
        <span className="text-xs text-beon-muted">×</span>
        <Periodo k={1} rotulo={`${comparacao.atual.rotulo} (${trecho(comparacao.atual)})`} />
        {comparacao.cortada && <span className="text-xs text-beon-muted">· base cortada no mesmo ponto do {unidade} atual</span>}
      </div>

      <Secao olho="Resultados" titulo="O que foi concluído, validado, refutado e cancelado"
        descricao="Cada experimento conta no período em que o evento aconteceu: a conclusão (validada ou refutada) ou o cancelamento. Clique num cartão para ver o detalhe e a lista.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{cartoes('resultados')}</div>
      </Secao>

      <PorArea experimentos={dados.experimentos} comparacao={comparacao} jiraUrl={dados.jiraUrl} />

      <Secao olho="Tempos do processo" titulo="Quanto tempo cada etapa leva"
        descricao="Mediana de dias por etapa, no período em que o item saiu dela. Itens ainda na etapa e itens sem histórico ficam de fora, e o detalhe mostra quantos.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cartoes('tempos')}</div>
      </Secao>

      <div ref={detalheRef} className="scroll-mt-16">
        <Detalhe ind={ind} r1={r1} r2={r2} base={baseDe(ind)} comparacao={comparacao} jiraUrl={dados.jiraUrl} />
      </div>

      <ReportExecutivo dados={dados} comparacao={comparacao} />

      <p className="text-xs leading-relaxed text-beon-muted">
        Nos tempos, o número principal é a mediana: metade dos itens levou menos que isso e metade, mais; a média aparece no detalhe.
        A etapa de cada status segue as colunas atuais dos boards de Ideação e de Experimentação. Validada, refutada e cancelada seguem a classificação do Semanal.
      </p>
    </div>
  )
}
