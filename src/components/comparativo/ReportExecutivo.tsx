'use client'

// Report executivo do Comparativo: um documento A4 de duas páginas com os números macro de 2025 × 2026, no fim da
// página. "Baixar PDF" imprime só o documento (o navegador oferece "Salvar como PDF"), com cores e quebras de página.

import { useMemo, useRef } from 'react'
import { ArrowDownRight, ArrowUpRight, Download, Minus } from 'lucide-react'
import { Button, cx } from '@/components/ui'
import { ANOS, SITUACOES, type ComparativoDados } from '@/lib/comparativo/resumo'
import { formatar, montarReport, variacaoPar, type Formato, type Par } from '@/lib/comparativo/report'
import { COR_ANO } from './cores'

const [A, B] = ANOS
const RED = '#C8102E'
const COR = Object.fromEntries(SITUACOES.map(s => [s.id, s.cor]))

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

function Chip({ valores, melhor }: { valores: Par; melhor: 'maior' | 'menor' }) {
  // Com menos de 3 no ano anterior, o percentual exagera (2 → 22 vira +1000%): mostra só os números.
  if (valores[0] !== null && valores[0] < 3) return <span className="text-[10px] text-stone-400">base pequena</span>
  const v = variacaoPar(valores, melhor)
  if (!v) return <span className="text-[10px] text-stone-400">sem base</span>
  const Icone = v.pct === 0 ? Minus : v.pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
      v.boa === null ? 'bg-stone-100 text-stone-600' : v.boa ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
      <Icone className="h-3 w-3" aria-hidden />{v.pct > 0 ? '+' : ''}{v.pct}%
    </span>
  )
}

function Titulo({ numero, children, subtitulo }: { numero: string; children: React.ReactNode; subtitulo?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-3 border-b border-stone-200 pb-2">
      <span className="text-[11px] font-bold tabular-nums" style={{ color: RED }}>{numero}</span>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-stone-900">{children}</h3>
        {subtitulo && <p className="text-[11px] text-stone-500">{subtitulo}</p>}
      </div>
    </div>
  )
}

function AnoTag({ ano }: { ano: number }) {
  return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500"><span className="h-2 w-2 rounded-sm" style={{ background: COR_ANO[ano] }} />{ano}</span>
}

/** Duas barras (2025 e 2026) na mesma escala, com o número ao lado. */
function BarrasAno({ valores, max, formato = 'numero' }: { valores: [number, number]; max: number; formato?: Formato }) {
  return (
    <div className="space-y-1">
      {valores.map((v, k) => (
        <div key={k} className="flex items-center gap-2">
          <div className="h-2.5 flex-1 rounded-sm bg-stone-100">
            <div className="h-full rounded-sm" style={{ width: `${max ? Math.max(v ? 2 : 0, (v / max) * 100) : 0}%`, background: COR_ANO[ANOS[k]] }} />
          </div>
          <span className="w-16 text-right text-[11px] font-semibold tabular-nums text-stone-800">{formatar(v, formato)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportExecutivo({ dados, corte }: { dados: ComparativoDados; corte: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const r = useMemo(() => montarReport(dados, corte), [dados, corte])
  const gerado = new Date(`${dados.hoje}T12:00:00`).toLocaleDateString('pt-BR')
  const maxFunil = Math.max(1, ...r.funil.flatMap(f => f.valores))

  // Copia o documento para uma área própria e imprime só ela; o título vira o nome sugerido do PDF.
  function baixar() {
    if (!ref.current) return
    const area = document.createElement('div')
    area.id = 'area-impressao'
    area.innerHTML = ref.current.outerHTML
    document.body.appendChild(area)
    const titulo = document.title
    document.title = `Report executivo beOn Labs ${A} x ${B}`
    const limpar = () => { area.remove(); document.title = titulo; window.removeEventListener('afterprint', limpar) }
    window.addEventListener('afterprint', limpar)
    window.print()
  }

  const resultados = (['validada', 'refutada', 'cancelada'] as const).map(id => ({
    id, label: SITUACOES.find(s => s.id === id)!.label,
    valores: id === 'validada' ? r.resultados.validadas : id === 'refutada' ? r.resultados.refutadas : r.resultados.cancelados,
  }))
  const encerrados = ANOS.map((_, k) => resultados.reduce((s, x) => s + x.valores[k], 0))

  return (
    <section aria-labelledby="report-titulo" className="space-y-3">
      <style dangerouslySetInnerHTML={{ __html: IMPRESSAO }} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">Report executivo</p>
          <h2 id="report-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">O ano em duas páginas, pronto para levar à diretoria</h2>
          <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">
            Os números macro desta página num documento só, com o mesmo período escolhido acima. Em &quot;Baixar PDF&quot;, escolha &quot;Salvar como PDF&quot; e desmarque &quot;Cabeçalhos e rodapés&quot;.
          </p>
        </div>
        <Button variant="primary" icon={Download} onClick={baixar}>Baixar PDF</Button>
      </div>

      <div ref={ref} className="text-stone-800" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
        {/* Página 1 */}
        <article className="folha mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-beon-line bg-white shadow-sm">
          {/* div, não <header>: o CSS de impressão do app esconde todo <header>. */}
          <div className="relative px-8 pb-4 pt-5 text-white" style={{ background: 'linear-gradient(120deg, #8A0A1F 0%, #C8102E 55%, #E2401C 100%)' }}>
            <div className="flex items-start justify-between gap-6">
              <div className="rounded-xl bg-white px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ height: 28 }} />
              </div>
              <p className="text-right text-[11px] leading-relaxed text-white/85">Report executivo<br />Gerado em {gerado}</p>
            </div>
            <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-tight">Experimentação beOn Labs</h1>
            <p className="mt-0.5 text-[15px] font-light text-white/90">{A} × {B} · do que exploramos ao que chegou à escala</p>
            <p className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-0.5 text-[10.5px] text-white">Período comparado: {r.periodo}</p>
          </div>

          <div className="space-y-5 px-8 py-5">
            <section className="inteiro">
              <div className="grid grid-cols-5 gap-2">
                {r.kpis.map(k => (
                  <div key={k.id} className="rounded-xl border border-stone-200 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-500">{k.titulo}</p>
                    <p className="mt-1.5 whitespace-nowrap text-[20px] font-semibold leading-none tracking-tight tabular-nums text-stone-900">{formatar(k.valores[1], k.formato)}</p>
                    <p className="mt-1 text-[10px] tabular-nums text-stone-500">{A}: {formatar(k.valores[0], k.formato)}</p>
                    <div className="mt-1"><Chip valores={k.valores} melhor={k.melhor} /></div>
                    <p className="mt-1 text-[9.5px] leading-snug text-stone-400">{k.nota}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="inteiro">
              <Titulo numero="01" subtitulo="Ideias registradas no board de Ideação e quantas viraram experimento">Iniciativas que exploramos</Titulo>
              <div className="grid grid-cols-[1.1fr_1fr] gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {ANOS.map((ano, k) => (
                      <div key={ano} className="rounded-xl bg-stone-50 p-3">
                        <AnoTag ano={ano} />
                        <p className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-stone-900">{r.exploracao.registradas[k]}</p>
                        <p className="mt-1 text-[10.5px] text-stone-500">ideias registradas</p>
                        <p className="mt-2 text-[11px] text-stone-700">
                          <b className="tabular-nums">{r.exploracao.registradas[k] ? Math.round((r.exploracao.viraramExperimento[k] / r.exploracao.registradas[k]) * 100) : 0}%</b> já viraram experimento
                        </p>
                      </div>
                    ))}
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <dt className="text-stone-500">Da ideia ao experimento (mediana)</dt>
                      <dd className="mt-0.5 flex items-center gap-2 font-semibold tabular-nums text-stone-900">
                        {formatar(r.exploracao.leadMediana[1], 'dias')} <Chip valores={r.exploracao.leadMediana} melhor="menor" />
                      </dd>
                      <dd className="text-[10px] text-stone-500">{A}: {formatar(r.exploracao.leadMediana[0], 'dias')}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Em exploração hoje</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-stone-900">{r.exploracao.emExploracaoHoje} ideias</dd>
                      <dd className="text-[10px] text-stone-500">aguardando virar experimento</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-xl border border-stone-200 p-3">
                  <p className="text-[11px] font-semibold text-stone-900">Chegaram mais longe em {B}</p>
                  <p className="text-[10px] text-stone-500">Iniciativas que entraram em Piloto ou Escala</p>
                  <ul className="mt-2 space-y-1">
                    {r.exploracao.chegaramLonge.map(d => (
                      <li key={d.key} className="flex items-center gap-2 text-[11px]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RED }} />
                        <span className="min-w-0 flex-1 truncate font-medium text-stone-900">{d.nome}</span>
                        <span className="shrink-0 rounded-full px-1.5 py-px text-[9.5px] font-semibold"
                          style={{ background: d.detalhe === 'Escala' ? '#FDE7EA' : '#F3F4F6', color: d.detalhe === 'Escala' ? RED : '#57534E' }}>{d.detalhe}</span>
                      </li>
                    ))}
                    {!r.exploracao.chegaramLonge.length && <li className="text-[11px] text-stone-500">Nenhuma iniciativa entrou em Piloto ou Escala no período.</li>}
                  </ul>
                </div>
              </div>
            </section>

            <section className="inteiro">
              <Titulo numero="02" subtitulo="Quantas iniciativas e experimentos passaram por cada etapa no ano">Nosso funil de experimentos</Titulo>
              <div className="mb-2 flex justify-end gap-3"><AnoTag ano={A} /><AnoTag ano={B} /></div>
              <ol className="space-y-1.5">
                {r.funil.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[22px_180px_1fr_64px] items-center gap-3">
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: RED, opacity: 1 - i * 0.1 }}>{i + 1}</span>
                    <span>
                      <span className="block text-[12px] font-semibold text-stone-900">{f.titulo}</span>
                      <span className="block text-[10px] text-stone-500">{f.descricao}</span>
                    </span>
                    <BarrasAno valores={f.valores} max={maxFunil} />
                    <Chip valores={f.valores} melhor="maior" />
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>

        {/* Página 2 */}
        <article className="folha quebra mx-auto mt-6 max-w-[760px] overflow-hidden rounded-2xl border border-beon-line bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-8 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jira/semanal/logo.png" alt="beOn Labs" style={{ height: 22 }} />
            <p className="text-[10px] text-stone-500">Experimentação beOn Labs · {A} × {B}</p>
          </div>
          <div className="space-y-4 px-8 py-5">
            <section className="inteiro">
              <Titulo numero="03" subtitulo="Como terminaram os experimentos encerrados no ano">Resultados dos experimentos</Titulo>
              <div className="space-y-3">
                {ANOS.map((ano, k) => (
                  <div key={ano} className="grid grid-cols-[60px_1fr_92px] items-center gap-3">
                    <AnoTag ano={ano} />
                    <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded">
                      {resultados.filter(x => x.valores[k]).map(x => (
                        <div key={x.id} className="flex items-center justify-center text-[10px] font-semibold text-white"
                          style={{ width: `${(x.valores[k] / Math.max(1, encerrados[k])) * 100}%`, background: COR[x.id] }}>
                          {x.valores[k]}
                        </div>
                      ))}
                    </div>
                    <span className="whitespace-nowrap text-right text-[11px] tabular-nums text-stone-600">{encerrados[k]} encerrados</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-4 pl-[72px] text-[10px] text-stone-600">
                  {resultados.map(x => <span key={x.id} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: COR[x.id] }} />{x.label}</span>)}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <section className="inteiro">
                <Titulo numero="04" subtitulo="Mediana de dias por etapa">Velocidade do processo</Titulo>
                <table className="w-full text-[11px]">
                  <thead><tr className="text-stone-500"><th className="pb-1 text-left font-medium" /><th className="pb-1 pl-3 text-right font-medium">{A}</th><th className="pb-1 pl-3 text-right font-medium">{B}</th><th className="pb-1 text-right font-medium" /></tr></thead>
                  <tbody className="divide-y divide-stone-100">
                    {r.tempos.map(t => (
                      <tr key={t.titulo}>
                        <td className="py-1.5 pr-2 text-stone-700">{t.titulo.replace('Cycle time de ', '').replace('Cycle time do ', '')}</td>
                        <td className="whitespace-nowrap py-1.5 pl-3 text-right tabular-nums text-stone-500">{formatar(t.valores[0], 'dias')}</td>
                        <td className="whitespace-nowrap py-1.5 pl-3 text-right font-semibold tabular-nums text-stone-900">{formatar(t.valores[1], 'dias')}</td>
                        <td className="py-1.5 pl-2 text-right"><Chip valores={t.valores} melhor="menor" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section className="inteiro">
                <Titulo numero="05" subtitulo={`Áreas com mais hipóteses validadas em ${B}`}>Onde aconteceu</Titulo>
                <table className="w-full text-[11px]">
                  <thead><tr className="text-stone-500"><th className="pb-1 text-left font-medium">Área</th><th className="pb-1 text-right font-medium">Validadas {A}</th><th className="pb-1 text-right font-medium">Validadas {B}</th></tr></thead>
                  <tbody className="divide-y divide-stone-100">
                    {r.areas.map(a => (
                      <tr key={a.nome}>
                        <td className="max-w-[150px] truncate py-1.5 pr-2 text-stone-700">{a.nome}</td>
                        <td className="py-1.5 text-right tabular-nums text-stone-500">{a.validadas[0]}</td>
                        <td className="py-1.5 text-right font-semibold tabular-nums text-stone-900">{a.validadas[1]}</td>
                      </tr>
                    ))}
                    {!r.areas.length && <tr><td colSpan={3} className="py-2 text-stone-500">Sem área informada nos experimentos.</td></tr>}
                  </tbody>
                </table>
              </section>
            </div>

            <section className="inteiro">
              <Titulo numero="06" subtitulo="Benefício potencial das hipóteses validadas no ano">Valor gerado</Titulo>
              <div className="grid grid-cols-[1fr_1.4fr] gap-6">
                <div className="space-y-3">
                  {ANOS.map((ano, k) => (
                    <div key={ano}>
                      <AnoTag ano={ano} />
                      <p className={cx('tabular-nums tracking-tight', k === 1 ? 'text-[28px] font-semibold text-stone-900' : 'text-[18px] font-medium text-stone-500')}>{formatar(r.valor.total[k], 'reais')}</p>
                    </div>
                  ))}
                  <Chip valores={r.valor.total} melhor="maior" />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-stone-900">Maiores benefícios validados em {B}</p>
                  <ol className="space-y-1.5">
                    {r.valor.top.map((d, i) => (
                      <li key={d.key} className="flex items-baseline gap-2 text-[11px]">
                        <span className="w-4 text-right font-bold tabular-nums" style={{ color: RED }}>{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-stone-800">{d.nome}</span>
                        <span className="shrink-0 text-[10.5px] tabular-nums text-stone-500">{d.detalhe}</span>
                      </li>
                    ))}
                    {!r.valor.top.length && <li className="text-[11px] text-stone-500">Sem benefício registrado nas validadas do período.</li>}
                  </ol>
                </div>
              </div>
            </section>

            <section className="inteiro rounded-xl px-5 py-3" style={{ background: '#FBF1F2' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: RED }}>Leitura executiva</h3>
              <ul className="mt-2 space-y-1.5">
                {r.leitura.map(f => (
                  <li key={f} className="flex gap-2 text-[11.5px] leading-relaxed text-stone-800">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RED }} />{f}
                  </li>
                ))}
              </ul>
            </section>

            <footer className="border-t border-stone-200 pt-3 text-[9.5px] leading-relaxed text-stone-400">
              Fonte: Jira (boards de Ideação e de Experimentação), lido em {gerado}. Cada número conta no ano em que o evento aconteceu (criação,
              entrada na etapa, conclusão ou cancelamento). Hipótese validada: experimento concluído cuja iniciativa seguiu para Aguardando piloto,
              Piloto ou Escala; refutada: concluído sem seguir. Tempos em mediana. Período: {r.periodo}.
            </footer>
          </div>
        </article>
      </div>
    </section>
  )
}
