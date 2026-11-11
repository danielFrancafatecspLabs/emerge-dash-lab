'use client'

// Report executivo do Comparativo: duas folhas A4 em preto, com a identidade do beOn Labs. A peça central é o anel,
// tirado do "O" do logo, que mostra a taxa de validação com o degradê da marca. Tipografia editorial (títulos com
// serifa, números finos), tons de marfim sobre o preto e o degradê como único acento. Os blocos são registros com
// filetes (sem cartões): o ritmo do período em colunas, o funil em barras, o valor gerado em ranking e a leitura em
// parágrafos numerados. Nos gráficos, o traço fino é sempre o período anterior. "Baixar PDF" imprime só o documento.

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Button, cx, focusRing } from '@/components/ui'
import { resumir, trecho, type ComparativoDados, type Janela } from '@/lib/comparativo/resumo'
import { comparacaoDoRecorte, NOME_DO_RECORTE, opcoesDoRecorte, RECORTES, type Recorte } from '@/lib/comparativo/recortes'
import { formatar, montarReport, variacaoPar, type Par } from '@/lib/comparativo/report'

// ── Identidade: preto, marfins e o degradê do logo ────────────────────────────────────────────
const PRETO = '#0B0B0C'
const GRAFITE = '#17171A'
const FILETE = '#2A2A2D'
const MARFIM = '#F4F1EA'
const OSSO = '#CFC9BC'
const CINZA = '#8C877E'
const CINZA_ESCURO = '#5C5953'
const LARANJA = '#F7941D'
const VERMELHO = '#EE3124'
const DEGRADE = `linear-gradient(90deg, ${LARANJA}, ${VERMELHO})`
const SERIFA = 'Georgia, "Iowan Old Style", "Times New Roman", serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const LOGO = '/jira/semanal/logo.png'
// A folha na tela tem a proporção do A4 (780 × 1103 px); na impressão, um leve zoom a leva à largura da página.
const LARGURA = 780
const ALTURA = 1103

const IMPRESSAO = `
#area-impressao { display: none; }
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: ${PRETO} !important; margin: 0 !important; }
  body > *:not(#area-impressao) { display: none !important; }
  #area-impressao { display: block !important; }
  #area-impressao * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #area-impressao .folha { box-shadow: none !important; border-radius: 0 !important; margin: 0 auto !important; width: ${LARGURA}px !important; max-width: none !important; height: ${ALTURA}px !important; min-height: 0 !important; overflow: hidden; zoom: 1.016; }
  #area-impressao .quebra { break-before: page; }
}`

// ── Peças ─────────────────────────────────────────────────────────────────────────────────────

/** Variação contra o período anterior: seta e percentual, em marfim quando melhora e em cinza quando piora. */
function Delta({ valores, melhor, tamanho = 10 }: { valores: Par; melhor: 'maior' | 'menor'; tamanho?: number }) {
  const base = { fontFamily: MONO, fontSize: tamanho }
  if (valores[0] !== null && valores[0] < 3) return <span className="whitespace-nowrap" style={{ ...base, color: CINZA_ESCURO }}>base pequena</span>
  const v = variacaoPar(valores, melhor)
  if (!v) return <span className="whitespace-nowrap" style={{ ...base, color: CINZA_ESCURO }}>sem base</span>
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
    <div className="mb-2.5">
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: MONO, fontSize: 10, color: LARANJA, letterSpacing: '0.08em' }}>{n}</span>
        <h3 style={{ fontFamily: SERIFA, fontSize: 19, color: MARFIM, letterSpacing: '-0.01em' }}>{titulo}</h3>
        <span className="h-px flex-1 self-center" style={{ background: FILETE }} />
        {nota && <span style={{ fontSize: 9.5, color: CINZA }}>{nota}</span>}
      </div>
    </div>
  )
}

/** Rótulo pequeno em caixa-alta mono. */
const Rotulo = ({ children, cor = CINZA }: { children: ReactNode; cor?: string }) => (
  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: cor }}>{children}</p>
)

/** Legenda dos gráficos: o que é a barra e o que é o traço. */
function Legenda({ itens, anterior }: { itens: [string, string][]; anterior: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4" style={{ fontSize: 9, color: CINZA }}>
      {itens.map(([cor, nome]) => <span key={nome} className="inline-flex items-center gap-1.5"><span className="inline-block h-[7px] w-4" style={{ background: cor }} />{nome}</span>)}
      <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2px] w-4" style={{ background: LARANJA }} />{anterior}</span>
    </p>
  )
}

/** Cabeçalho de cada folha: logo original sobre o preto e, à direita, o nome do report. */
function Cabecalho({ direita }: { direita: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="beOn Labs" style={{ height: 30 }} />
      <div className="text-right">{direita}</div>
    </div>
  )
}

/** Rodapé de cada folha, preso ao pé da página. */
function Rodape({ esquerda, pagina }: { esquerda: ReactNode; pagina: string }) {
  return (
    <div className="flex items-end justify-between gap-6 pt-3" style={{ borderTop: `1px solid ${FILETE}` }}>
      <div className="min-w-0">{esquerda}</div>
      <span className="shrink-0" style={{ fontFamily: MONO, fontSize: 9, color: CINZA_ESCURO }}>{pagina}</span>
    </div>
  )
}

/**
 * O anel do logo como medidor: a fatia em degradê é o percentual. Em CSS (cônico + máscara), sem gradiente de SVG:
 * na impressão o documento é copiado, e um url(#id) apontaria para a cópia escondida da tela.
 */
function Anel({ pct, tamanho = 176, espessura = 17, children }: { pct: number | null; tamanho?: number; espessura?: number; children: ReactNode }) {
  const p = Math.max(0, Math.min(100, pct ?? 0))
  const furo = `radial-gradient(farthest-side, transparent calc(100% - ${espessura}px), #000 calc(100% - ${espessura - 0.5}px))`
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <div className="absolute inset-0 rounded-full" style={{
        background: `conic-gradient(from 0deg, ${LARANJA} 0%, ${VERMELHO} ${p}%, ${GRAFITE} ${p}% 100%)`,
        WebkitMask: furo, mask: furo,
      }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** Ritmo do período: uma coluna por parte (mês, semana ou dia), validadas embaixo e refutadas em cima. */
function Ritmo({ partes, atual, validadas, anterior, fim }: { partes: Janela['partes']; atual: number[]; validadas: number[]; anterior: number[]; fim: string }) {
  const ALTO = 92
  const max = Math.max(1, ...atual, ...anterior)
  const px = (v: number) => Math.round((v / max) * ALTO)
  return (
    <div className="flex items-end gap-[6px]">
      {partes.map((parte, i) => {
        const futuro = parte.inicio > fim
        const total = atual[i] ?? 0, val = Math.min(validadas[i] ?? 0, total), antes = anterior[i]
        return (
          <div key={parte.inicio} className="min-w-0 flex-1 text-center">
            <p className="tabular-nums" style={{ fontFamily: MONO, fontSize: 9.5, color: futuro ? 'transparent' : total ? MARFIM : CINZA_ESCURO, marginBottom: 3 }}>{total}</p>
            <div className="relative mx-auto" style={{ height: ALTO, maxWidth: 46, borderBottom: `1px solid ${futuro ? FILETE : CINZA_ESCURO}` }}>
              {!futuro && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse">
                  <div style={{ height: px(val), background: MARFIM }} />
                  <div style={{ height: px(total) - px(val), background: CINZA_ESCURO }} />
                </div>
              )}
              {antes !== undefined && <span className="absolute -inset-x-[3px] h-[2px]" style={{ bottom: px(antes) - 1, background: LARANJA }} />}
            </div>
            <p className="mt-1 truncate" style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: futuro ? CINZA_ESCURO : CINZA }}>{parte.rotulo}</p>
          </div>
        )
      })}
    </div>
  )
}

/** Funil em barras: a barra é o período atual, o traço laranja é o período anterior; ao lado, a diferença. */
function Funil({ etapas }: { etapas: { id: string; titulo: string; descricao: string; valores: [number, number] }[] }) {
  const max = Math.max(1, ...etapas.flatMap(e => e.valores))
  const COLUNAS = 'grid grid-cols-[22px_172px_1fr_40px_40px_78px] items-center gap-3'
  return (
    <div>
      {etapas.map((e, i) => {
        const dif = e.valores[1] - e.valores[0]
        return (
          <div key={e.id} className={cx(COLUNAS, 'py-[6px]')} style={{ borderTop: `1px solid ${FILETE}` }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: CINZA_ESCURO }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0">
              <span className="block truncate" style={{ fontSize: 11.5, color: MARFIM }}>{e.titulo}</span>
              <span className="block truncate" style={{ fontSize: 9, color: CINZA }}>{e.descricao}</span>
            </span>
            <span className="relative h-[9px]" style={{ background: GRAFITE }}>
              <span className="absolute inset-y-0 left-0" style={{ width: `${(e.valores[1] / max) * 100}%`, background: i === etapas.length - 1 ? DEGRADE : OSSO }} />
              <span className="absolute -inset-y-[4px] w-[2px]" style={{ left: `calc(${(e.valores[0] / max) * 100}% - 1px)`, background: LARANJA }} />
            </span>
            <span className="text-right tabular-nums" style={{ fontSize: 17, fontWeight: 300, color: MARFIM }}>{e.valores[1]}</span>
            <span className="text-right tabular-nums" style={{ fontFamily: MONO, fontSize: 10, color: dif > 0 ? OSSO : CINZA }}>{dif === 0 ? '=' : `${dif > 0 ? '+' : '−'}${Math.abs(dif)}`}</span>
            <span className="text-right"><Delta valores={e.valores} melhor="maior" /></span>
          </div>
        )
      })}
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
  // Ritmo: concluídos e validadas em cada parte do período (mês, semana ou dia), e os concluídos do período anterior.
  const ritmo = useMemo(() => {
    const ind = (id: 'concluidos' | 'validadas') => dados.indicadores.find(i => i.id === id)!
    return {
      atual: resumir(ind('concluidos'), comparacao.atual).nPorParte,
      validadas: resumir(ind('validadas'), comparacao.atual).nPorParte,
      anterior: resumir(ind('concluidos'), comparacao.base).nPorParte,
    }
  }, [dados, comparacao])
  const [A, B] = r.rotulos
  const gerado = new Date(`${dados.hoje}T12:00:00`).toLocaleDateString('pt-BR')
  const unidade = recorte === 'semana' ? 'dia' : recorte === 'mes' ? 'semana' : 'mês'

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

  const kpi = (id: string) => r.kpis.find(k => k.id === id)!
  const beneficio = kpi('beneficio')
  const taxa = kpi('taxa')
  const validadas = r.resultados.validadas
  const concluidos = r.resultados.concluidos
  const faixa = [
    { ...kpi('ideias'), titulo: 'Ideias registradas' },
    { ...kpi('concluidos'), titulo: 'Experimentos concluídos' },
    { id: 'validadas', titulo: 'Hipóteses validadas', valores: validadas as Par, formato: 'numero' as const, melhor: 'maior' as const, nota: 'a iniciativa seguiu adiante' },
    { ...kpi('lead'), titulo: 'Cycle time' },
  ]
  const pctExp = (k: number) => (r.exploracao.registradas[k] ? Math.round((r.exploracao.viraramExperimento[k] / r.exploracao.registradas[k]) * 100) : 0)
  const encerrados = [0, 1].map(k => r.resultados.validadas[k] + r.resultados.refutadas[k] + r.resultados.cancelados[k])
  const lead = r.tempos.find(t => t.titulo === 'Cycle time da Experimentação')!
  const area = r.areas.find(a => a.validadas[1] > 0) ?? r.areas[0]
  const TONS = { validada: MARFIM, refutada: CINZA, cancelada: CINZA_ESCURO } as const
  const NOMES = { validada: 'Validadas', refutada: 'Refutadas', cancelada: 'Canceladas' } as const
  const desfecho = (id: keyof typeof TONS, k: number) => (id === 'validada' ? r.resultados.validadas[k] : id === 'refutada' ? r.resultados.refutadas[k] : r.resultados.cancelados[k])
  // Ranking do valor gerado: o valor em reais de cada linha, para a barra de magnitude.
  const reaisDoTopo = r.valor.top.map(d => dados.experimentos.find(e => e.key === d.key)?.beneficio ?? 0)
  const maiorDoTopo = Math.max(1, ...reaisDoTopo)
  const folha = { background: PRETO, width: '100%', maxWidth: LARGURA, minHeight: ALTURA, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }

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
        {/* ─── Folha 1 ─── div e não <header>/<footer>: o CSS de impressão do app esconde essas tags. */}
        <article className="folha mx-auto flex flex-col overflow-hidden rounded-xl px-11 pb-7 pt-8" style={folha}>
          <Cabecalho direita={<>
            <Rotulo>Report executivo · {NOME_DO_RECORTE[recorte]}</Rotulo>
            <p className="mt-0.5" style={{ fontFamily: MONO, fontSize: 9, color: CINZA_ESCURO }}>{gerado}</p>
          </>} />

          <div className="flex flex-1 flex-col justify-between pt-8">
            {/* Abertura: o título, o número principal e o anel do logo com a taxa de validação */}
            <section className="flex items-center justify-between gap-8">
              <div className="min-w-0">
                <p style={{ fontFamily: MONO, fontSize: 10, color: CINZA, letterSpacing: '0.1em' }}>{B.toUpperCase()}{trecho(comparacao.atual).toLowerCase() !== B.toLowerCase() && ` · ${trecho(comparacao.atual).toUpperCase()}`}</p>
                <h1 className="mt-1.5" style={{ fontFamily: SERIFA, fontSize: 27, lineHeight: 1.1, letterSpacing: '-0.015em', color: MARFIM }}>O que a experimentação entregou</h1>
                <div className="mt-3.5 h-[3px] w-24" style={{ background: DEGRADE }} />
                <div className="mt-6"><Rotulo>Benefício potencial dos experimentos</Rotulo></div>
                <p className="mt-1.5 whitespace-nowrap tabular-nums" style={{ fontSize: 72, fontWeight: 200, letterSpacing: '-0.035em', lineHeight: 0.95, color: MARFIM }}>
                  {formatar(beneficio.valores[1], 'reais')}
                </p>
                <p className="mt-3 flex items-center gap-3">
                  <Delta valores={beneficio.valores} melhor="maior" tamanho={12} />
                  <span style={{ fontSize: 11, color: CINZA }}>{formatar(beneficio.valores[0], 'reais')} em {A}</span>
                </p>
                <p className="mt-2.5" style={{ fontSize: 11, color: OSSO }}>
                  <b style={{ fontWeight: 600, color: MARFIM }}>{r.valor.experimentos[1]}</b> experimentos com benefício · <b style={{ fontWeight: 600, color: MARFIM }}>{formatar(r.valor.validado[1], 'reais')}</b> já em {validadas[1]} {validadas[1] === 1 ? 'hipótese validada' : 'hipóteses validadas'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <Anel pct={taxa.valores[1]}>
                  <p className="tabular-nums" style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1 }}>{taxa.valores[1] === null ? '—' : <>{taxa.valores[1]}<span style={{ fontSize: 20 }}>%</span></>}</p>
                  <p className="mt-1" style={{ fontSize: 9.5, color: CINZA }}>{validadas[1]} de {concluidos[1]}</p>
                </Anel>
                <div className="mt-3 text-center">
                  <Rotulo>Taxa de validação</Rotulo>
                  <p className="mt-1 flex items-center justify-center gap-2" style={{ fontSize: 9.5, color: CINZA }}>{A}: {formatar(taxa.valores[0], 'pct')} <Delta valores={taxa.valores} melhor="maior" /></p>
                </div>
              </div>
            </section>

            {/* Faixa de indicadores: atual, anterior e variação */}
            <section className="grid grid-cols-4" style={{ borderTop: `1px solid ${FILETE}`, borderBottom: `1px solid ${FILETE}` }}>
              {faixa.map((k, i) => (
                <div key={k.id} className={cx('py-3.5', i > 0 && 'pl-4')} style={i > 0 ? { borderLeft: `1px solid ${FILETE}` } : undefined}>
                  <Rotulo>{k.titulo}</Rotulo>
                  <p className="mt-1.5 whitespace-nowrap tabular-nums" style={{ fontSize: 27, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em' }}>{formatar(k.valores[1], k.formato)}</p>
                  <p className="mt-2 flex items-center gap-2" style={{ fontSize: 9.5, color: CINZA }}>
                    <span className="whitespace-nowrap tabular-nums">antes {formatar(k.valores[0], k.formato)}</span><Delta valores={k.valores} melhor={k.melhor} />
                  </p>
                </div>
              ))}
            </section>

            <section>
              <Secao n="01 —" titulo="Ritmo do período" nota={`Experimentos concluídos por ${unidade}`} />
              <Ritmo partes={comparacao.atual.partes} atual={ritmo.atual} validadas={ritmo.validadas} anterior={ritmo.anterior} fim={comparacao.atual.fim} />
              <div className="mt-2.5"><Legenda itens={[[MARFIM, 'hipóteses validadas'], [CINZA_ESCURO, 'refutadas']]} anterior={`concluídos em ${A}`} /></div>
            </section>

            <section>
              <Secao n="02 —" titulo="Da ideia à escala" nota={`Atual, diferença e variação contra ${A}`} />
              <Funil etapas={r.funil} />
              <div className="mt-2.5"><Legenda itens={[[OSSO, B]]} anterior={A} /></div>
            </section>
          </div>

          <div className="mt-6">
            <Rodape pagina="1 / 2" esquerda={<span style={{ fontFamily: MONO, fontSize: 9, color: CINZA_ESCURO }}>beOn Labs · {trecho(comparacao.atual)} comparado a {trecho(comparacao.base)}</span>} />
          </div>
        </article>

        {/* ─── Folha 2 ─── */}
        <article className="folha quebra mx-auto mt-6 flex flex-col overflow-hidden rounded-xl px-11 pb-7 pt-8" style={folha}>
          <Cabecalho direita={<Rotulo>{B} × {A}</Rotulo>} />

          <div className="flex flex-1 flex-col justify-between pt-8">
            <section>
              <Secao n="03 —" titulo="Exploração" nota="Do board de Ideação até o experimento" />
              <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr]">
                {[
                  { rotulo: 'Ideias registradas', valor: String(r.exploracao.registradas[1]), base: String(r.exploracao.registradas[0]), delta: <Delta valores={r.exploracao.registradas} melhor="maior" /> },
                  { rotulo: 'Viraram experimento', valor: `${pctExp(1)}%`, base: `${pctExp(0)}%`, delta: null },
                  { rotulo: 'Da ideia ao experimento', valor: formatar(r.exploracao.leadMediana[1], 'dias'), base: formatar(r.exploracao.leadMediana[0], 'dias'), delta: <Delta valores={r.exploracao.leadMediana} melhor="menor" /> },
                ].map((x, i) => (
                  <div key={x.rotulo} className={cx('pr-4', i > 0 && 'pl-4')} style={i > 0 ? { borderLeft: `1px solid ${FILETE}` } : undefined}>
                    <Rotulo>{x.rotulo}</Rotulo>
                    <p className="mt-1.5 whitespace-nowrap tabular-nums" style={{ fontSize: 26, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em' }}>{x.valor}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2" style={{ fontSize: 9.5, color: CINZA }}><span className="whitespace-nowrap">antes {x.base}</span>{x.delta}</p>
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

            <section>
              <Secao n="04 —" titulo="Valor gerado" nota={`Maiores benefícios potenciais de ${B}`} />
              <ol>
                {r.valor.top.map((d, i) => {
                  const [valor, ...resto] = d.detalhe.split(' · ')
                  return (
                    <li key={d.key} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-[7px]" style={{ borderTop: `1px solid ${FILETE}` }}>
                      <span style={{ fontFamily: SERIFA, fontSize: 21, color: i === 0 ? LARANJA : CINZA_ESCURO, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate" style={{ fontSize: 12, color: MARFIM }}>{d.nome}</span>
                          {resto.length > 0 && <span className="shrink-0" style={{ fontSize: 9, color: CINZA }}>{resto.join(' · ')}</span>}
                        </span>
                        <span className="mt-1.5 block h-[3px]" style={{ background: GRAFITE }}>
                          <span className="block h-full" style={{ width: `${(reaisDoTopo[i] / maiorDoTopo) * 100}%`, background: i === 0 ? DEGRADE : OSSO }} />
                        </span>
                      </span>
                      <span className="whitespace-nowrap tabular-nums" style={{ fontSize: 17, fontWeight: 300, color: MARFIM }}>{valor}</span>
                    </li>
                  )
                })}
                {!r.valor.top.length && <li className="py-2" style={{ fontSize: 10.5, color: CINZA_ESCURO, borderTop: `1px solid ${FILETE}` }}>Sem benefício registrado nos experimentos do período.</li>}
              </ol>
            </section>

            <section>
              <Secao n="05 —" titulo="Como o período terminou" />
              <div className="grid grid-cols-[1.4fr_1fr_1fr]">
                <div className="pr-5">
                  <Rotulo>Desfecho dos experimentos encerrados</Rotulo>
                  {[1, 0].map(k => (
                    <div key={k} className="mt-2.5">
                      <p className="flex justify-between" style={{ fontSize: 9.5, color: k === 1 ? OSSO : CINZA }}><span>{r.rotulos[k]}</span><span className="tabular-nums">{encerrados[k]} encerrados</span></p>
                      <div className="mt-1 flex gap-[2px]" style={{ height: k === 1 ? 14 : 6 }}>
                        {(['validada', 'refutada', 'cancelada'] as const).map(id => {
                          const v = desfecho(id, k)
                          return v ? (
                            <div key={id} className="flex items-center justify-center tabular-nums" style={{ width: `${(v / Math.max(1, encerrados[k])) * 100}%`, background: TONS[id], color: id === 'validada' ? PRETO : MARFIM, fontSize: 8.5, fontWeight: 600 }}>{k === 1 ? v : ''}</div>
                          ) : null
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="mt-2.5 flex flex-wrap gap-x-3" style={{ fontSize: 9, color: CINZA }}>
                    {(['validada', 'refutada', 'cancelada'] as const).map(id => (
                      <span key={id} className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: TONS[id] }} />{NOMES[id]} {desfecho(id, 1)}</span>
                    ))}
                  </p>
                </div>
                <div className="px-5" style={{ borderLeft: `1px solid ${FILETE}` }}>
                  <Rotulo>Velocidade</Rotulo>
                  <p className="mt-2 whitespace-nowrap tabular-nums" style={{ fontSize: 28, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em' }}>{formatar(lead.valores[1], 'dias')}</p>
                  <p className="mt-1.5" style={{ fontSize: 9.5, color: OSSO }}>cycle time de experimentação, mediana, sem bloqueios</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2" style={{ fontSize: 9.5, color: CINZA }}><span className="whitespace-nowrap">antes {formatar(lead.valores[0], 'dias')}</span><Delta valores={lead.valores} melhor="menor" /></p>
                </div>
                <div className="pl-5" style={{ borderLeft: `1px solid ${FILETE}` }}>
                  <Rotulo>Onde aconteceu</Rotulo>
                  {area ? (
                    <>
                      <p className="mt-2 truncate" style={{ fontFamily: SERIFA, fontSize: 19, lineHeight: 1.1 }}>{area.nome}</p>
                      <p className="mt-1" style={{ fontSize: 9.5, color: OSSO }}>{area.validadas[1]} {area.validadas[1] === 1 ? 'hipótese validada' : 'hipóteses validadas'}</p>
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

            <section className="px-6 py-4" style={{ background: GRAFITE, borderLeft: `3px solid ${LARANJA}` }}>
              <Rotulo cor={LARANJA}>Leitura executiva</Rotulo>
              <ol className="mt-2.5 space-y-[7px]">
                {/* A área com mais validadas já está em "Onde aconteceu". */}
                {r.leitura.filter(f => !f.includes('é a área com mais')).map((f, i) => (
                  <li key={f} className="grid grid-cols-[26px_1fr] gap-2">
                    <span style={{ fontFamily: MONO, fontSize: 10, color: CINZA, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontFamily: SERIFA, fontSize: 12.5, lineHeight: 1.42, color: MARFIM }}>{f}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="mt-6">
            <Rodape pagina="2 / 2" esquerda={
              <p className="max-w-[560px]" style={{ fontSize: 8.5, lineHeight: 1.55, color: CINZA }}>
                Fonte: Jira (boards de Ideação e de Experimentação), lido em {gerado}. Cada número conta no período em que o evento aconteceu.
                Hipótese validada: experimento concluído cuja iniciativa seguiu para Aguardando piloto, Piloto ou Escala. Tempos em mediana.
              </p>
            } />
          </div>
        </article>
      </div>
    </section>
  )
}
