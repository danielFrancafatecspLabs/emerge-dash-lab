'use client'

// Report executivo do Comparativo: duas folhas A4 em preto, com a identidade do beOn Labs. Tipografia editorial
// (títulos com serifa, números finos), tons de marfim sobre o preto e o degradê do logo como único acento. Os blocos
// são registros com filetes (sem cartões): o livro-razão dos indicadores, o funil em barras com a marca do período
// anterior, o valor gerado em ranking e a leitura em parágrafos numerados. "Baixar PDF" imprime só o documento.

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Button, cx, focusRing } from '@/components/ui'
import { trecho, type ComparativoDados } from '@/lib/comparativo/resumo'
import { comparacaoDoRecorte, NOME_DO_RECORTE, opcoesDoRecorte, RECORTES, type Recorte } from '@/lib/comparativo/recortes'
import { formatar, montarReport, variacaoPar, type Par } from '@/lib/comparativo/report'

// ── Identidade: preto, marfins e o degradê do logo ────────────────────────────────────────────
const PRETO = '#0B0B0C'
const GRAFITE = '#151517'
const FILETE = '#2A2A2D'
const MARFIM = '#F4F1EA'
const OSSO = '#CFC9BC'
const CINZA = '#8C877E'
const CINZA_ESCURO = '#55524D'
const LARANJA = '#F7941D'
const VERMELHO = '#EE3124'
const DEGRADE = `linear-gradient(90deg, ${LARANJA}, ${VERMELHO})`
const SERIFA = 'Georgia, "Iowan Old Style", "Times New Roman", serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const LOGO = '/jira/semanal/logo.png'

const IMPRESSAO = `
#area-impressao { display: none; }
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: ${PRETO} !important; }
  body > *:not(#area-impressao) { display: none !important; }
  #area-impressao { display: block !important; }
  #area-impressao * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #area-impressao .folha { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; margin: 0 auto !important; max-width: none !important; zoom: 0.94; }
  #area-impressao .quebra { break-before: page; }
  #area-impressao .inteiro { break-inside: avoid; }
}`

// ── Peças ─────────────────────────────────────────────────────────────────────────────────────

/** Variação contra o período anterior: seta e percentual, em marfim quando melhora e em cinza quando piora. */
function Delta({ valores, melhor, grande = false }: { valores: Par; melhor: 'maior' | 'menor'; grande?: boolean }) {
  const base = { fontFamily: MONO, fontSize: grande ? 12 : 10 }
  if (valores[0] !== null && valores[0] < 3) return <span style={{ ...base, color: CINZA_ESCURO }}>base pequena</span>
  const v = variacaoPar(valores, melhor)
  if (!v) return <span style={{ ...base, color: CINZA_ESCURO }}>sem base</span>
  const seta = v.pct === 0 ? '=' : v.pct > 0 ? '▲' : '▼'
  return (
    <span className="whitespace-nowrap tabular-nums" style={{ ...base, color: v.boa === false ? CINZA : MARFIM, fontWeight: v.boa ? 600 : 400 }}>
      {seta} {v.pct > 0 ? '+' : ''}{v.pct}%
    </span>
  )
}

/** Cabeçalho de seção: número em mono, título com serifa e um filete que corre até a margem. */
function Secao({ n, titulo, nota }: { n: string; titulo: string; nota?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: MONO, fontSize: 10, color: LARANJA, letterSpacing: '0.08em' }}>{n}</span>
        <h3 style={{ fontFamily: SERIFA, fontSize: 20, color: MARFIM, letterSpacing: '-0.01em' }}>{titulo}</h3>
        <span className="h-px flex-1 self-center" style={{ background: FILETE }} />
      </div>
      {nota && <p className="mt-1 pl-[34px]" style={{ fontSize: 10, color: CINZA }}>{nota}</p>}
    </div>
  )
}

/** Rótulo pequeno em caixa-alta mono. */
const Rotulo = ({ children, cor = CINZA }: { children: ReactNode; cor?: string }) => (
  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: cor }}>{children}</p>
)

/** Cabeçalho de cada folha: logo original sobre o preto, o nome do report e o período. */
function Cabecalho({ direita }: { direita: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-10 pt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="beOn Labs" style={{ height: 30 }} />
      <div className="text-right">{direita}</div>
    </div>
  )
}

/** Funil em barras horizontais: a barra é o período atual; o traço vertical marca o período anterior. */
function Funil({ etapas, base }: { etapas: { id: string; titulo: string; descricao: string; valores: [number, number] }[]; base: string }) {
  const max = Math.max(1, ...etapas.flatMap(e => e.valores))
  return (
    <div>
      {etapas.map((e, i) => (
        <div key={e.id} className="grid grid-cols-[28px_170px_1fr_56px_74px] items-center gap-3 py-[5px]" style={{ borderTop: `1px solid ${FILETE}` }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: CINZA_ESCURO }}>{String(i + 1).padStart(2, '0')}</span>
          <span className="min-w-0">
            <span className="block truncate" style={{ fontSize: 11.5, color: MARFIM }}>{e.titulo}</span>
            <span className="block truncate" style={{ fontSize: 9, color: CINZA }}>{e.descricao}</span>
          </span>
          <span className="relative h-[10px]" style={{ background: GRAFITE }}>
            <span className="absolute inset-y-0 left-0" style={{ width: `${(e.valores[1] / max) * 100}%`, background: i === etapas.length - 1 ? DEGRADE : OSSO }} />
            <span className="absolute -inset-y-[3px] w-[2px]" style={{ left: `calc(${(e.valores[0] / max) * 100}% - 1px)`, background: CINZA }} title={`${base}: ${e.valores[0]}`} />
          </span>
          <span className="text-right tabular-nums" style={{ fontSize: 16, fontWeight: 300, color: MARFIM }}>{e.valores[1]}</span>
          <span className="text-right"><Delta valores={e.valores} melhor="maior" /></span>
        </div>
      ))}
      <p className="mt-2 flex items-center gap-2" style={{ fontSize: 9, color: CINZA }}>
        <span className="inline-block h-[8px] w-5" style={{ background: OSSO }} /> período atual
        <span className="ml-3 inline-block h-[10px] w-[2px]" style={{ background: CINZA }} /> {base}
      </p>
    </div>
  )
}

/** O que mudou em números absolutos: duas colunas, o que cresceu e o que caiu. */
function Balanco({ itens, base }: { itens: { titulo: string; valores: Par; formato: 'numero' | 'reais' }[]; base: string }) {
  const lista = itens.filter(i => i.valores[0] !== null && i.valores[1] !== null).map(i => ({ ...i, dif: (i.valores[1] ?? 0) - (i.valores[0] ?? 0) }))
  const texto = (dif: number, f: 'numero' | 'reais') => `${dif > 0 ? '+' : '−'}${formatar(Math.abs(dif), f)}`
  const coluna = (titulo: string, xs: typeof lista, cor: string, vazio: string) => (
    <div>
      <Rotulo cor={cor}>{titulo}</Rotulo>
      <ul className="mt-1.5">
        {xs.map(i => (
          <li key={i.titulo} className="flex items-baseline justify-between gap-3 py-[2px]" style={{ borderBottom: `1px dotted ${FILETE}` }}>
            <span style={{ fontSize: 10.5, color: OSSO }}>{i.titulo}</span>
            <span className="whitespace-nowrap tabular-nums" style={{ fontFamily: MONO, fontSize: 10.5, color: cor }}>{texto(i.dif, i.formato)}</span>
          </li>
        ))}
        {!xs.length && <li style={{ fontSize: 10, color: CINZA_ESCURO }}>{vazio}</li>}
      </ul>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-8">
      {coluna(`Cresceu em relação a ${base}`, lista.filter(i => i.dif > 0), MARFIM, 'Nenhum indicador cresceu neste recorte.')}
      {coluna('Caiu', lista.filter(i => i.dif < 0), CINZA, 'Nada caiu neste recorte.')}
    </div>
  )
}

// ── Report ────────────────────────────────────────────────────────────────────────────────────

export default function ReportExecutivo({ dados }: { dados: ComparativoDados }) {
  const ref = useRef<HTMLDivElement>(null)
  // O report tem o próprio recorte (o padrão é o acumulado dos últimos 12 meses), sempre contra o período anterior.
  const [recorte, setRecorte] = useState<Recorte>('ultimos12')
  const opcoes = useMemo(() => opcoesDoRecorte(recorte, dados.hoje), [recorte, dados.hoje])
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const periodoId = escolhido && opcoes.some(o => o.id === escolhido) ? escolhido : opcoes[0]?.id ?? 'ultimos12'
  const comparacao = useMemo(() => comparacaoDoRecorte(recorte, periodoId, dados.hoje), [recorte, periodoId, dados.hoje])
  const infoRecorte = RECORTES.find(x => x.id === recorte)!
  const r = useMemo(() => montarReport(dados, comparacao), [dados, comparacao])
  const [A, B] = r.rotulos
  const gerado = new Date(`${dados.hoje}T12:00:00`).toLocaleDateString('pt-BR')

  // Copia o documento para uma área própria e imprime só ela; o título vira o nome sugerido do PDF.
  function baixar() {
    if (!ref.current) return
    const area = document.createElement('div')
    area.id = 'area-impressao'
    area.innerHTML = ref.current.outerHTML
    document.body.appendChild(area)
    const titulo = document.title
    document.title = `Report executivo beOn Labs ${A} x ${B}`.replace(/\//g, '-')
    const limpar = () => { area.remove(); document.title = titulo; window.removeEventListener('afterprint', limpar) }
    window.addEventListener('afterprint', limpar)
    window.print()
  }

  const beneficio = r.kpis.find(k => k.id === 'beneficio')!
  const ledger = r.kpis.filter(k => k.id !== 'beneficio')
  const validadas = r.resultados.validadas
  const pctExp = (k: number) => (r.exploracao.registradas[k] ? Math.round((r.exploracao.viraramExperimento[k] / r.exploracao.registradas[k]) * 100) : 0)
  const encerrados = [0, 1].map(k => r.resultados.validadas[k] + r.resultados.refutadas[k] + r.resultados.cancelados[k])
  const lead = r.tempos.find(t => t.titulo === 'Cycle time da Experimentação')!
  const area = r.areas.find(a => a.validadas[1] > 0) ?? r.areas[0]
  const TONS = { validada: MARFIM, refutada: CINZA, cancelada: CINZA_ESCURO } as const
  const NOMES = { validada: 'Validadas', refutada: 'Refutadas', cancelada: 'Canceladas' } as const
  const desfecho = (id: keyof typeof TONS, k: number) => (id === 'validada' ? r.resultados.validadas[k] : id === 'refutada' ? r.resultados.refutadas[k] : r.resultados.cancelados[k])

  return (
    <section aria-labelledby="report-titulo" className="space-y-3">
      <style dangerouslySetInnerHTML={{ __html: IMPRESSAO }} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">Report executivo</p>
          <h2 id="report-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">{B} em duas páginas, pronto para levar à diretoria</h2>
          <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">
            Escolha o recorte do report: ele sempre compara com {infoRecorte.base} e mostra o que cresceu. Em &quot;Baixar PDF&quot;, escolha &quot;Salvar como PDF&quot;, desmarque &quot;Cabeçalhos e rodapés&quot; e marque &quot;Gráficos de plano de fundo&quot;.
          </p>
        </div>
        <Button variant="primary" icon={Download} onClick={baixar}>Baixar PDF</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-beon-line bg-white p-3">
        <div role="radiogroup" aria-label="Recorte do report" className="inline-flex flex-wrap rounded-full bg-stone-100 p-1">
          {RECORTES.map(x => (
            <button key={x.id} type="button" role="radio" aria-checked={recorte === x.id} onClick={() => { setRecorte(x.id); setEscolhido(null) }}
              className={cx('h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition', focusRing,
                recorte === x.id ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink')}>
              {x.rotulo}
            </button>
          ))}
        </div>
        {opcoes.length > 1 && (
          <label className="inline-flex items-center gap-2 text-[13px] text-beon-muted">
            Período
            <select value={periodoId} onChange={e => setEscolhido(e.target.value)}
              className={cx('h-9 rounded-full border border-beon-line bg-white px-3 text-[13px] font-medium text-beon-ink', focusRing)}>
              {opcoes.map(o => <option key={o.id} value={o.id}>{o.rotulo}</option>)}
            </select>
          </label>
        )}
        <span className="text-xs text-beon-muted">
          {B} ({trecho(comparacao.atual)}) × {A} ({trecho(comparacao.base)}){comparacao.cortada ? ' · base cortada no mesmo ponto' : ''}
        </span>
      </div>

      <div ref={ref} style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif', color: MARFIM }}>
        {/* ─── Folha 1 ─── */}
        <article className="folha mx-auto max-w-[780px] overflow-hidden rounded-xl" style={{ background: PRETO, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }}>
          {/* div, não <header>: o CSS de impressão do app esconde todo <header>. */}
          <Cabecalho direita={<>
            <Rotulo>Report executivo · {NOME_DO_RECORTE[recorte]}</Rotulo>
            <p className="mt-0.5" style={{ fontFamily: MONO, fontSize: 9, color: CINZA_ESCURO }}>{gerado}</p>
          </>} />

          <div className="px-10 pb-7 pt-6">
            <p style={{ fontFamily: MONO, fontSize: 10, color: CINZA, letterSpacing: '0.1em' }}>{B.toUpperCase()}</p>
            <h1 className="mt-2" style={{ fontFamily: SERIFA, fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.02em', color: MARFIM }}>
              O que a experimentação<br />entregou no período
            </h1>
            <p className="mt-2.5" style={{ fontSize: 11.5, color: OSSO }}>{trecho(comparacao.atual)}, comparado a {A} ({trecho(comparacao.base)})</p>
            <div className="mt-4 h-[3px] w-28" style={{ background: DEGRADE }} />

            {/* Número principal e o livro-razão dos indicadores */}
            <section className="inteiro mt-6 grid grid-cols-[1.05fr_1fr] gap-10">
              <div>
                <Rotulo>Benefício potencial dos experimentos</Rotulo>
                <p className="mt-2 whitespace-nowrap tabular-nums" style={{ fontSize: 46, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: MARFIM }}>
                  {formatar(beneficio.valores[1], 'reais')}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Delta valores={beneficio.valores} melhor="maior" grande />
                  <span style={{ fontSize: 10.5, color: CINZA }}>{A}: {formatar(beneficio.valores[0], 'reais')}</span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4" style={{ borderTop: `1px solid ${FILETE}`, paddingTop: 12 }}>
                  <div>
                    <dt><Rotulo>Experimentos com benefício</Rotulo></dt>
                    <dd className="mt-1 tabular-nums" style={{ fontSize: 20, fontWeight: 300 }}>{r.valor.experimentos[1]}</dd>
                  </div>
                  <div>
                    <dt><Rotulo>Já em hipóteses validadas</Rotulo></dt>
                    <dd className="mt-1 tabular-nums" style={{ fontSize: 20, fontWeight: 300 }}>{formatar(r.valor.validado[1], 'reais')}</dd>
                    <dd style={{ fontSize: 9.5, color: CINZA }}>{validadas[1]} {validadas[1] === 1 ? 'hipótese' : 'hipóteses'}</dd>
                  </div>
                </dl>
              </div>
              <table className="w-full self-start">
                <caption className="pb-2 text-left"><Rotulo>Indicadores · atual, anterior e variação</Rotulo></caption>
                <tbody>
                  {ledger.map(k => (
                    <tr key={k.id} style={{ borderTop: `1px solid ${FILETE}` }}>
                      <th scope="row" className="py-2 pr-2 text-left align-top font-normal">
                        <span className="block" style={{ fontSize: 11.5, color: MARFIM }}>{k.titulo}</span>
                        <span className="block" style={{ fontSize: 9, color: CINZA }}>{k.nota}</span>
                      </th>
                      <td className="whitespace-nowrap py-2 text-right align-top tabular-nums" style={{ fontSize: 19, fontWeight: 300, color: MARFIM }}>{formatar(k.valores[1], k.formato)}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right align-top">
                        <span className="block tabular-nums" style={{ fontSize: 9.5, color: CINZA }}>{formatar(k.valores[0], k.formato)}</span>
                        <Delta valores={k.valores} melhor={k.melhor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="inteiro mt-7">
              <Secao n="01 —" titulo="Da ideia à escala" nota={`Quantas iniciativas e experimentos passaram por cada etapa em ${B}`} />
              <Funil etapas={r.funil} base={A} />
            </section>

            <section className="inteiro mt-6">
              <Secao n="02 —" titulo="Balanço do período" nota="A diferença em números absolutos contra o período anterior" />
              <Balanco base={A} itens={[
                ...r.funil.map(f => ({ titulo: f.titulo, valores: f.valores as Par, formato: 'numero' as const })),
                { titulo: 'Benefício potencial', valores: beneficio.valores, formato: 'reais' as const },
              ]} />
            </section>
          </div>
        </article>

        {/* ─── Folha 2 ─── */}
        <article className="folha quebra mx-auto mt-6 max-w-[780px] overflow-hidden rounded-xl" style={{ background: PRETO, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }}>
          <Cabecalho direita={<Rotulo>{A} × {B}</Rotulo>} />
          <div className="px-10 pb-5 pt-6">
            <section className="inteiro">
              <Secao n="03 —" titulo="Exploração" nota="Ideias registradas no board de Ideação e o caminho até o experimento" />
              <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr]">
                {[
                  { rotulo: 'Ideias registradas', valor: String(r.exploracao.registradas[1]), base: String(r.exploracao.registradas[0]), delta: <Delta valores={r.exploracao.registradas} melhor="maior" /> },
                  { rotulo: 'Viraram experimento', valor: `${pctExp(1)}%`, base: `${pctExp(0)}%`, delta: null },
                  { rotulo: 'Da ideia ao experimento', valor: formatar(r.exploracao.leadMediana[1], 'dias'), base: formatar(r.exploracao.leadMediana[0], 'dias'), delta: <Delta valores={r.exploracao.leadMediana} melhor="menor" /> },
                ].map((x, i) => (
                  <div key={x.rotulo} className={cx('pr-4', i > 0 && 'pl-4')} style={i > 0 ? { borderLeft: `1px solid ${FILETE}` } : undefined}>
                    <Rotulo>{x.rotulo}</Rotulo>
                    <p className="mt-1.5 whitespace-nowrap tabular-nums" style={{ fontSize: 26, fontWeight: 200, lineHeight: 1 }}>{x.valor}</p>
                    <p className="mt-1.5 flex items-center gap-2" style={{ fontSize: 9.5, color: CINZA }}>{A}: {x.base} {x.delta}</p>
                  </div>
                ))}
                <div className="pl-5" style={{ borderLeft: `1px solid ${FILETE}` }}>
                  <Rotulo cor={LARANJA}>Chegaram mais longe</Rotulo>
                  <ul className="mt-1.5">
                    {r.exploracao.chegaramLonge.map(d => (
                      <li key={d.key} className="flex items-center justify-between gap-2 py-[3px]" style={{ borderBottom: `1px dotted ${FILETE}` }}>
                        <span className="min-w-0 truncate" style={{ fontSize: 10.5, color: OSSO }}>{d.nome}</span>
                        <span className="shrink-0 px-1.5" style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: d.detalhe === 'Escala' ? PRETO : MARFIM, background: d.detalhe === 'Escala' ? MARFIM : 'transparent', border: `1px solid ${d.detalhe === 'Escala' ? MARFIM : CINZA_ESCURO}` }}>{d.detalhe}</span>
                      </li>
                    ))}
                    {!r.exploracao.chegaramLonge.length && <li style={{ fontSize: 10, color: CINZA_ESCURO }}>Nenhuma iniciativa entrou em Piloto ou Escala no período.</li>}
                  </ul>
                  <p className="mt-1.5" style={{ fontSize: 9, color: CINZA }}>{r.exploracao.emExploracaoHoje} ideias em exploração hoje</p>
                </div>
              </div>
            </section>

            <section className="inteiro mt-6">
              <Secao n="04 —" titulo="Valor gerado" nota={`Maiores benefícios potenciais entre os experimentos de ${B}`} />
              <ol>
                {r.valor.top.map((d, i) => {
                  const [valor, ...resto] = d.detalhe.split(' · ')
                  return (
                    <li key={d.key} className="grid grid-cols-[44px_1fr_auto] items-baseline gap-3 py-1.5" style={{ borderTop: `1px solid ${FILETE}` }}>
                      <span style={{ fontFamily: SERIFA, fontSize: 20, color: i === 0 ? LARANJA : CINZA_ESCURO, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="block truncate" style={{ fontSize: 12, color: MARFIM }}>{d.nome}</span>
                        {resto.length > 0 && <span className="block truncate" style={{ fontSize: 9.5, color: CINZA }}>{resto.join(' · ')}</span>}
                      </span>
                      <span className="whitespace-nowrap tabular-nums" style={{ fontSize: 16, fontWeight: 300, color: MARFIM }}>{valor}</span>
                    </li>
                  )
                })}
                {!r.valor.top.length && <li className="py-2" style={{ fontSize: 10.5, color: CINZA_ESCURO, borderTop: `1px solid ${FILETE}` }}>Sem benefício registrado nos experimentos do período.</li>}
              </ol>
            </section>

            <section className="inteiro mt-6">
              <Secao n="05 —" titulo="Como o período terminou" />
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-0">
                <div className="pr-5">
                  <Rotulo>Desfecho dos experimentos encerrados</Rotulo>
                  {[0, 1].map(k => (
                    <div key={k} className="mt-2.5">
                      <p className="flex justify-between" style={{ fontSize: 9.5, color: CINZA }}><span>{r.rotulos[k]}</span><span className="tabular-nums">{encerrados[k]} encerrados</span></p>
                      <div className="mt-1 flex h-[14px] gap-[2px]">
                        {(['validada', 'refutada', 'cancelada'] as const).map(id => {
                          const v = desfecho(id, k)
                          return v ? (
                            <div key={id} className="flex items-center justify-center tabular-nums" style={{ width: `${(v / Math.max(1, encerrados[k])) * 100}%`, background: TONS[id], color: id === 'validada' ? PRETO : MARFIM, fontSize: 8.5, fontWeight: 600 }}>{v}</div>
                          ) : null
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="mt-2 flex flex-wrap gap-x-3" style={{ fontSize: 9, color: CINZA }}>
                    {(['validada', 'refutada', 'cancelada'] as const).map(id => (
                      <span key={id} className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: TONS[id], outline: id === 'cancelada' ? `1px solid ${CINZA}` : undefined }} />{NOMES[id]}</span>
                    ))}
                  </p>
                </div>
                <div className="px-5" style={{ borderLeft: `1px solid ${FILETE}` }}>
                  <Rotulo>Velocidade</Rotulo>
                  <p className="mt-2 whitespace-nowrap tabular-nums" style={{ fontSize: 28, fontWeight: 200, lineHeight: 1 }}>{formatar(lead.valores[1], 'dias')}</p>
                  <p className="mt-1.5" style={{ fontSize: 9.5, color: OSSO }}>cycle time de experimentação, mediana, sem bloqueios</p>
                  <p className="mt-1.5 flex items-center gap-2" style={{ fontSize: 9.5, color: CINZA }}>{A}: {formatar(lead.valores[0], 'dias')} <Delta valores={lead.valores} melhor="menor" /></p>
                </div>
                <div className="pl-5" style={{ borderLeft: `1px solid ${FILETE}` }}>
                  <Rotulo>Onde aconteceu</Rotulo>
                  {area ? (
                    <>
                      <p className="mt-2 truncate" style={{ fontFamily: SERIFA, fontSize: 19, lineHeight: 1.1 }}>{area.nome}</p>
                      <p className="mt-1" style={{ fontSize: 9.5, color: OSSO }}>{area.validadas[1]} {area.validadas[1] === 1 ? 'hipótese validada' : 'hipóteses validadas'} em {B}</p>
                      <ul className="mt-1.5">
                        {r.areas.filter(a => a !== area).slice(0, 3).map(a => (
                          <li key={a.nome} className="flex justify-between gap-2 py-[2px]" style={{ fontSize: 9.5, color: CINZA }}><span className="truncate">{a.nome}</span><span className="tabular-nums">{a.validadas[1]}</span></li>
                        ))}
                      </ul>
                    </>
                  ) : <p className="mt-2" style={{ fontSize: 10, color: CINZA_ESCURO }}>Sem área informada nos experimentos.</p>}
                </div>
              </div>
            </section>

            <section className="inteiro mt-6 px-6 py-4" style={{ background: GRAFITE, borderLeft: `3px solid ${LARANJA}` }}>
              <Rotulo cor={LARANJA}>Leitura executiva</Rotulo>
              <ol className="mt-2.5 space-y-2">
                {/* A área com mais validadas já está em "Onde aconteceu". */}
                {r.leitura.filter(f => !f.includes('é a área com mais')).map((f, i) => (
                  <li key={f} className="grid grid-cols-[26px_1fr] gap-2">
                    <span style={{ fontFamily: MONO, fontSize: 10, color: CINZA, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontFamily: SERIFA, fontSize: 13, lineHeight: 1.45, color: MARFIM }}>{f}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="mx-10 flex items-end justify-between gap-6 pb-6 pt-3" style={{ borderTop: `1px solid ${FILETE}` }}>
            <p className="max-w-[520px]" style={{ fontSize: 8.5, lineHeight: 1.6, color: CINZA }}>
              Fonte: Jira (boards de Ideação e de Experimentação), lido em {gerado}. Cada número conta no período em que o evento aconteceu.
              Hipótese validada: experimento concluído cuja iniciativa seguiu para Aguardando piloto, Piloto ou Escala. Tempos em mediana.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="beOn Labs" style={{ height: 22 }} />
          </div>
        </article>
      </div>
    </section>
  )
}
