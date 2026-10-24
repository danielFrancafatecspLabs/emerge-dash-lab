'use client'

// Report executivo do Comparativo, em formato de infográfico: duas folhas A4 com capa vermelha, número herói, cartões
// com ícone, o funil em camadas, linhas numeradas e a leitura executiva. "Baixar PDF" imprime só o documento (o
// navegador oferece "Salvar como PDF"), com cores e quebras de página.

import { useMemo, useRef, type ComponentType } from 'react'
import {
  ArrowDownRight, ArrowUpRight, Check, Coins, Compass, Download, FlaskConical, Gauge, Layers, Lightbulb, MapPin, Minus,
  Rocket, Sparkles, Target, Timer, TrendingUp, type LucideProps,
} from 'lucide-react'
import { Button, cx } from '@/components/ui'
import { SITUACOES, type Comparacao, type ComparativoDados } from '@/lib/comparativo/resumo'
import { formatar, montarReport, variacaoPar, type Par } from '@/lib/comparativo/report'

const RED = '#C8102E'
const INK = '#1C1917'
const ROSA = '#FDF1F2'
const COR = Object.fromEntries(SITUACOES.map(s => [s.id, s.cor]))
type Icone = ComponentType<LucideProps>

const IMPRESSAO = `
#area-impressao { display: none; }
@media print {
  @page { size: A4; margin: 8mm; }
  html, body { background: #fff !important; }
  body > *:not(#area-impressao) { display: none !important; }
  #area-impressao { display: block !important; }
  #area-impressao * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #area-impressao .folha { box-shadow: none !important; border: 0 !important; margin: 0 !important; max-width: none !important; }
  #area-impressao .quebra { break-before: page; }
  #area-impressao .folha { break-inside: avoid; }
  #area-impressao .inteiro { break-inside: avoid; }
}`

/** Variação em relação à base; com menos de 3 na base, o percentual exagera e mostra só "base pequena". */
function Chip({ valores, melhor, claro = false }: { valores: Par; melhor: 'maior' | 'menor'; claro?: boolean }) {
  if (valores[0] !== null && valores[0] < 3) return <span className={cx('text-[10px]', claro ? 'text-white/70' : 'text-stone-400')}>base pequena</span>
  const v = variacaoPar(valores, melhor)
  if (!v) return <span className={cx('text-[10px]', claro ? 'text-white/70' : 'text-stone-400')}>sem base</span>
  const Seta = v.pct === 0 ? Minus : v.pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
      v.boa === null ? 'bg-stone-100 text-stone-600' : v.boa ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
      <Seta className="h-3 w-3" aria-hidden />{v.pct > 0 ? '+' : ''}{v.pct}%
    </span>
  )
}

/** Cabeçalho de seção no padrão do infográfico: ícone num círculo, olho em vermelho e título "destaque | complemento". */
function Secao({ icone: I, olho, destaque, complemento, subtitulo }: { icone: Icone; olho: string; destaque: string; complemento?: string; subtitulo?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2.5px]" style={{ borderColor: RED }}>
        <I className="h-5 w-5" color={RED} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: RED }}>{olho}</p>
        <h3 className="text-[21px] font-extrabold leading-[1.1] tracking-tight">
          <span style={{ color: RED }}>{destaque}</span>
          {complemento && <><span className="mx-1.5 font-light text-stone-300">|</span><span style={{ color: INK }}>{complemento}</span></>}
        </h3>
        {subtitulo && <p className="mt-0.5 text-[11px] text-stone-500">{subtitulo}</p>}
      </div>
    </div>
  )
}

function IconeCirculo({ icone: I, tamanho = 30 }: { icone: Icone; tamanho?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: tamanho, height: tamanho, background: '#FDE7EA' }}>
      <I width={tamanho * 0.52} height={tamanho * 0.52} color={RED} strokeWidth={2} aria-hidden />
    </span>
  )
}

/** Cartão com ícone e número grande, como os "ganhos estimados" do infográfico. */
function Destaque({ icone, valor, rotulo, base, chip }: { icone: Icone; valor: string; rotulo: string; base: string; chip: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-2 pb-2.5 pt-3 text-center">
      <IconeCirculo icone={icone} />
      <p className="mt-2 whitespace-nowrap text-[24px] font-extrabold leading-none tracking-tight tabular-nums" style={{ color: RED }}>{valor}</p>
      <p className="mt-1 text-[10.5px] font-semibold leading-tight text-stone-800">{rotulo}</p>
      <p className="mt-1.5 text-[9.5px] tabular-nums text-stone-500">{base}</p>
      <div className="mt-1">{chip}</div>
    </div>
  )
}

/** Linha numerada com círculo vermelho, como os "ganhos por iniciativa". */
function LinhaNumerada({ n, titulo, detalhe, direita }: { n: number; titulo: string; detalhe?: string; direita: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: RED }}>{n}</span>
      <span className="min-w-0 flex-1 truncate">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.02em] text-stone-900">{titulo}</span>
        {detalhe && <span className="ml-2 text-[10px] text-stone-500">{detalhe}</span>}
      </span>
      {direita}
    </li>
  )
}

// ── Funil em camadas ──────────────────────────────────────────────────────────────────────────

const mistura = (a: string, b: string, t: number) => {
  const c = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2].map(i => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t).toString(16).padStart(2, '0')).join('')}`
}

const PASSO = 50, ALTURA = 44, RY = 7, LARGURA = 290

/**
 * O funil como camadas 3D (um cone fatiado): cada etapa é um tronco com aro elíptico, do vermelho ao vinho, com o
 * nome e o número do período atual. Em SVG para sair nítido no PDF, sem gradientes por id: na impressão o documento é
 * copiado, e um url(#id) apontaria para a cópia escondida da tela. O volume vem de faixas translúcidas sobre a cor.
 */
function FunilCamadas({ etapas }: { etapas: { id: string; titulo: string; valor: number }[] }) {
  const n = etapas.length
  const cx0 = LARGURA / 2
  const larg = (i: number) => LARGURA - i * ((LARGURA - 112) / n)
  const altura = n * PASSO + RY * 2
  // Ponto da borda esquerda (lado -1) ou direita (+1) a uma fração da largura, no topo (wt) e na base (wb) da camada.
  const faixa = (y: number, wt: number, wb: number, de: number, ate: number) => {
    const x = (w: number, f: number) => cx0 - w + 2 * w * f
    return `M ${x(wt, de)} ${y} L ${x(wt, ate)} ${y} L ${x(wb, ate)} ${y + ALTURA} L ${x(wb, de)} ${y + ALTURA} Z`
  }
  return (
    <svg width={LARGURA} height={altura} viewBox={`0 0 ${LARGURA} ${altura}`} role="img" aria-label={etapas.map(e => `${e.titulo}: ${e.valor}`).join(', ')}>
      {etapas.map((e, i) => {
        const y = RY + i * PASSO
        const wt = larg(i) / 2, wb = larg(i + 1) / 2 + 6
        const cor = mistura('#EE3A2B', '#6E0A1E', i / Math.max(1, n - 1))
        return (
          <g key={e.id}>
            <path d={`M ${cx0 - wt} ${y} L ${cx0 - wb} ${y + ALTURA} A ${wb} ${RY} 0 0 0 ${cx0 + wb} ${y + ALTURA} L ${cx0 + wt} ${y} A ${wt} ${RY} 0 0 1 ${cx0 - wt} ${y} Z`} fill={cor} />
            <path d={faixa(y, wt, wb, 0, 0.16)} fill="#000000" opacity="0.22" />
            <path d={faixa(y, wt, wb, 0.84, 1)} fill="#000000" opacity="0.28" />
            <path d={faixa(y, wt, wb, 0.3, 0.55)} fill="#FFFFFF" opacity="0.08" />
            <path d={`M ${cx0 - wb} ${y + ALTURA} A ${wb} ${RY} 0 0 0 ${cx0 + wb} ${y + ALTURA}`} fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="1" />
            <ellipse cx={cx0} cy={y} rx={wt} ry={RY} fill={mistura(cor, '#FFFFFF', 0.3)} />
            <ellipse cx={cx0} cy={y} rx={wt - 4} ry={RY - 2.5} fill={mistura(cor, '#FFFFFF', 0.14)} />
            <text x={cx0} y={y + 21} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#FFFFFF" opacity="0.92">{e.titulo}</text>
            <text x={cx0} y={y + 40} textAnchor="middle" fontSize="19" fontWeight="800" fill="#FFFFFF">{e.valor.toLocaleString('pt-BR')}</text>
          </g>
        )
      })}
    </svg>
  )
}

const ICONE_KPI: Record<string, Icone> = { ideias: Lightbulb, concluidos: FlaskConical, taxa: Target, lead: Timer }
const NOME_MODO = { anual: 'anual', trimestral: 'trimestral', mensal: 'mensal' } as const

export default function ReportExecutivo({ dados, comparacao }: { dados: ComparativoDados; comparacao: Comparacao }) {
  const ref = useRef<HTMLDivElement>(null)
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
  const tiles = r.kpis.filter(k => k.id !== 'beneficio')
  const validadas = r.resultados.validadas
  const pctExp = (k: number) => (r.exploracao.registradas[k] ? Math.round((r.exploracao.viraramExperimento[k] / r.exploracao.registradas[k]) * 100) : 0)
  const encerrados = [0, 1].map(k => r.resultados.validadas[k] + r.resultados.refutadas[k] + r.resultados.cancelados[k])
  const lead = r.tempos.find(t => t.titulo.includes('Experimentação'))!
  const area = r.areas.find(a => a.validadas[1] > 0) ?? r.areas[0]

  return (
    <section aria-labelledby="report-titulo" className="space-y-3">
      <style dangerouslySetInnerHTML={{ __html: IMPRESSAO }} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">Report executivo</p>
          <h2 id="report-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">{A} × {B} em duas páginas, pronto para levar à diretoria</h2>
          <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">
            Os números macro desta página num documento só, com os mesmos períodos escolhidos acima. Em &quot;Baixar PDF&quot;, escolha &quot;Salvar como PDF&quot; e desmarque &quot;Cabeçalhos e rodapés&quot;.
          </p>
        </div>
        <Button variant="primary" icon={Download} onClick={baixar}>Baixar PDF</Button>
      </div>

      <div ref={ref} className="text-stone-800" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
        {/* ─── Folha 1 ─── */}
        <article className="folha mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-beon-line bg-white shadow-sm">
          {/* Capa. div, não <header>: o CSS de impressão do app esconde todo <header>. */}
          <div className="relative overflow-hidden text-center text-white" style={{ background: RED }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 200" preserveAspectRatio="none" aria-hidden>
              <path d="M0 0 H300 C220 60 120 70 0 150 Z" fill="#E0262E" opacity="0.55" />
              <path d="M760 0 H470 C560 50 660 80 760 160 Z" fill="#8E0B1A" opacity="0.55" />
              <path d="M0 150 C220 70 520 120 760 40 V0 H740 C540 90 260 30 0 120 Z" fill="#FFFFFF" opacity="0.07" />
            </svg>
            <div className="relative px-8 pb-12 pt-6">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/85">beOn Labs · Report executivo {NOME_MODO[comparacao.modo]}</p>
              <div className="mx-auto mt-3 inline-flex rounded-2xl bg-white px-5 py-2.5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ height: 34 }} />
              </div>
              <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight">Experimentação em números</h1>
              <p className="mt-0.5 text-[14px] font-light text-white/90">{B} comparado a {A} · do que exploramos ao que chegou à escala</p>
            </div>
            <svg className="absolute bottom-0 left-0 h-7 w-full" viewBox="0 0 760 28" preserveAspectRatio="none" aria-hidden>
              <path d="M0 28 C200 0 560 0 760 28 Z" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="space-y-5 px-8 pb-6 pt-3">
            <section className="inteiro">
              <Secao icone={TrendingUp} olho="Visão geral" destaque="Resultados" complemento={B} subtitulo={`Comparado a ${A} · ${r.periodo}`} />
              <div className="flex items-center gap-4 rounded-2xl px-5 py-3.5" style={{ background: ROSA }}>
                <IconeCirculo icone={Coins} tamanho={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-stone-700">Benefício potencial validado em {B}</p>
                  <p className="text-[38px] font-extrabold leading-none tracking-tight tabular-nums" style={{ color: RED }}>{formatar(beneficio.valores[1], 'reais')}</p>
                  <p className="mt-1 text-[11.5px] text-stone-700"><b>{validadas[1]}</b> {validadas[1] === 1 ? 'hipótese validada' : 'hipóteses validadas'} · em {A}: {formatar(beneficio.valores[0], 'reais')} em {validadas[0]}</p>
                </div>
                <Chip valores={beneficio.valores} melhor="maior" />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {tiles.map(k => (
                  <Destaque key={k.id} icone={ICONE_KPI[k.id] ?? Gauge} valor={formatar(k.valores[1], k.formato)} rotulo={k.titulo}
                    base={`${A}: ${formatar(k.valores[0], k.formato)}`} chip={<Chip valores={k.valores} melhor={k.melhor} />} />
                ))}
              </div>
            </section>

            <section className="inteiro">
              <Secao icone={Layers} olho="Nosso funil" destaque="Funil" complemento="de experimentos"
                subtitulo={`Da ideia à escala: quantas iniciativas e experimentos passaram por cada camada em ${B}`} />
              <div className="flex items-start gap-5">
                <FunilCamadas etapas={r.funil.map(f => ({ id: f.id, titulo: f.titulo, valor: f.valores[1] }))} />
                <ol className="min-w-0 flex-1" style={{ paddingTop: RY }}>
                  {r.funil.map((f, i) => (
                    <li key={f.id} className="flex items-center gap-3 border-b border-dashed border-stone-200 last:border-0" style={{ height: PASSO }}>
                      <span className="w-4 text-[10px] font-bold tabular-nums" style={{ color: RED }}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold text-stone-900">{f.titulo}</span>
                        <span className="block truncate text-[10px] text-stone-500">{f.descricao}</span>
                      </span>
                      <span className="w-14 text-right text-[10px] tabular-nums text-stone-500">{A}: <b className="text-stone-700">{f.valores[0]}</b></span>
                      <span className="w-[74px] text-right"><Chip valores={f.valores} melhor="maior" /></span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        </article>

        {/* ─── Folha 2 ─── */}
        <article className="folha quebra mx-auto mt-6 max-w-[760px] overflow-hidden rounded-2xl border border-beon-line bg-white shadow-sm">
          <div className="flex items-center justify-between px-8 pb-1 pt-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ height: 22 }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: RED }}>{A} × {B}</p>
          </div>
          <div className="space-y-4 px-8 pb-4 pt-1">
            <section className="inteiro">
              <Secao icone={Compass} olho="Exploração" destaque="Iniciativas" complemento="que exploramos" subtitulo="Ideias registradas no board de Ideação e o caminho até o experimento" />
              <div className="grid grid-cols-[1fr_1fr_1fr_1.35fr] gap-2.5">
                <Destaque icone={Lightbulb} valor={String(r.exploracao.registradas[1])} rotulo="Ideias registradas" base={`${A}: ${r.exploracao.registradas[0]}`}
                  chip={<Chip valores={r.exploracao.registradas} melhor="maior" />} />
                <Destaque icone={FlaskConical} valor={`${pctExp(1)}%`} rotulo="Já viraram experimento" base={`${A}: ${pctExp(0)}%`} chip={null} />
                <Destaque icone={Timer} valor={formatar(r.exploracao.leadMediana[1], 'dias')} rotulo="Da ideia ao experimento" base={`${A}: ${formatar(r.exploracao.leadMediana[0], 'dias')}`}
                  chip={<Chip valores={r.exploracao.leadMediana} melhor="menor" />} />
                <div className="rounded-2xl p-3" style={{ background: ROSA }}>
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-stone-900"><Rocket className="h-3.5 w-3.5" color={RED} aria-hidden /> Chegaram mais longe em {B}</p>
                  <ul className="mt-1.5 space-y-1">
                    {r.exploracao.chegaramLonge.map(d => (
                      <li key={d.key} className="flex items-center gap-1.5 text-[10.5px]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RED }} />
                        <span className="min-w-0 flex-1 truncate text-stone-800">{d.nome}</span>
                        <span className="shrink-0 rounded-full bg-white px-1.5 text-[9px] font-semibold" style={{ color: d.detalhe === 'Escala' ? RED : '#57534E' }}>{d.detalhe}</span>
                      </li>
                    ))}
                    {!r.exploracao.chegaramLonge.length && <li className="text-[10.5px] text-stone-500">Nenhuma iniciativa entrou em Piloto ou Escala no período.</li>}
                  </ul>
                  <p className="mt-1.5 text-[9.5px] text-stone-500">{r.exploracao.emExploracaoHoje} ideias em exploração hoje</p>
                </div>
              </div>
            </section>

            <section className="inteiro">
              <Secao icone={Coins} olho="Valor" destaque="Valor" complemento="gerado" subtitulo={`Maiores benefícios potenciais entre as hipóteses validadas em ${B}`} />
              <ol className="space-y-1">
                {r.valor.top.map((d, i) => {
                  const [valor, areaNome] = d.detalhe.split(' · ')
                  return (
                    <LinhaNumerada key={d.key} n={i + 1} titulo={d.nome} detalhe={areaNome}
                      direita={<span className="whitespace-nowrap text-[15px] font-extrabold tabular-nums" style={{ color: RED }}>{valor}</span>} />
                  )
                })}
                {!r.valor.top.length && <li className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] text-stone-500">Sem benefício registrado nas hipóteses validadas do período.</li>}
              </ol>
            </section>

            <section className="inteiro">
              <Secao icone={Sparkles} olho="Como foi o período" destaque="Resultados," complemento="velocidade e áreas" />
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-stone-200 p-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900"><IconeCirculo icone={FlaskConical} tamanho={24} /> Como terminaram</p>
                  {[0, 1].map(k => (
                    <div key={k} className="mt-2">
                      <p className="flex justify-between text-[9.5px] text-stone-500"><span>{r.rotulos[k]}</span><span>{encerrados[k]} encerrados</span></p>
                      <div className="mt-0.5 flex h-3.5 gap-[2px] overflow-hidden rounded">
                        {(['validada', 'refutada', 'cancelada'] as const).map(id => {
                          const v = id === 'validada' ? r.resultados.validadas[k] : id === 'refutada' ? r.resultados.refutadas[k] : r.resultados.cancelados[k]
                          return v ? <div key={id} className="flex items-center justify-center text-[8.5px] font-bold text-white" style={{ width: `${(v / Math.max(1, encerrados[k])) * 100}%`, background: COR[id] }}>{v}</div> : null
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="mt-2 flex flex-wrap gap-x-2 text-[9px] text-stone-500">
                    {(['validada', 'refutada', 'cancelada'] as const).map(id => (
                      <span key={id} className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-sm" style={{ background: COR[id] }} />{SITUACOES.find(s => s.id === id)!.label.replace('Hipótese ', '')}</span>
                    ))}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 p-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900"><IconeCirculo icone={Gauge} tamanho={24} /> Velocidade</p>
                  <p className="mt-2.5 text-[26px] font-extrabold leading-none tabular-nums" style={{ color: RED }}>{formatar(lead.valores[1], 'dias')}</p>
                  <p className="mt-1 text-[10px] text-stone-600">para experimentar (mediana)</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-stone-500">{A}: {formatar(lead.valores[0], 'dias')} <Chip valores={lead.valores} melhor="menor" /></p>
                </div>
                <div className="rounded-2xl border border-stone-200 p-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900"><IconeCirculo icone={MapPin} tamanho={24} /> Onde aconteceu</p>
                  {area ? (
                    <>
                      <p className="mt-2.5 truncate text-[20px] font-extrabold leading-none" style={{ color: RED }}>{area.nome}</p>
                      <p className="mt-1 text-[10px] text-stone-600">{area.validadas[1]} {area.validadas[1] === 1 ? 'hipótese validada' : 'hipóteses validadas'} em {B}</p>
                      <ul className="mt-1.5 space-y-0.5 text-[9.5px] text-stone-500">
                        {r.areas.filter(a => a !== area).slice(0, 3).map(a => <li key={a.nome} className="flex justify-between gap-2"><span className="truncate">{a.nome}</span><span className="tabular-nums">{a.validadas[1]}</span></li>)}
                      </ul>
                    </>
                  ) : <p className="mt-2 text-[10px] text-stone-500">Sem área informada nos experimentos.</p>}
                </div>
              </div>
            </section>

            <section className="inteiro rounded-2xl px-5 py-3" style={{ background: ROSA }}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: RED }}>Leitura executiva</p>
              <ul className="mt-1.5 space-y-0.5">
                {/* A área com mais validadas já está no cartão "Onde aconteceu". */}
                {r.leitura.filter(f => !f.includes('é a área com mais')).map(f => (
                  <li key={f} className="flex gap-2 text-[11px] leading-snug text-stone-800">
                    <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: RED }}><Check className="h-2.5 w-2.5" color="#fff" strokeWidth={3} aria-hidden /></span>{f}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="relative overflow-hidden px-8 pb-3 pt-4 text-white" style={{ background: RED }}>
            <svg className="absolute left-0 top-0 h-5 w-full" viewBox="0 0 760 20" preserveAspectRatio="none" aria-hidden>
              <path d="M0 0 H760 V0 C560 20 200 20 0 0 Z" fill="#FFFFFF" />
            </svg>
            <div className="relative flex items-end justify-between gap-6">
              <p className="max-w-[520px] text-[8.5px] leading-relaxed text-white/80">
                Fonte: Jira (boards de Ideação e de Experimentação), lido em {gerado}. Cada número conta no período em que o evento aconteceu.
                Hipótese validada: experimento concluído cuja iniciativa seguiu para Aguardando piloto, Piloto ou Escala. Tempos em mediana.
              </p>
              <span className="rounded-xl bg-white px-3 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ height: 20 }} />
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
