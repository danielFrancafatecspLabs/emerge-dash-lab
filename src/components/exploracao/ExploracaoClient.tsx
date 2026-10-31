'use client'

// Painel de Exploração (Discovery Flow 2.0): o fluxo com as oportunidades de hoje em cada etapa (cada etapa filtra a
// lista), os indicadores da janela contra a janela anterior, o funil de conversão, as decisões do Gate 1 e, no fim, como
// o processo é governado (rituais, papéis e pilares).

import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ChevronRight, Info, Minus, PauseCircle, Scale, Undo2, XCircle,
  type LucideIcon,
} from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { formatarValor } from '@/lib/portfolio/filtros'
import {
  DECISOES, DIAS_PARA_ALERTA, ETAPAS, FASES, PAPEIS, PILARES, RITUAIS, diasEntre, situacao, ultimaDecisao,
  type DecisaoGate, type EtapaId, type Indicador, type Oportunidade, type ResumoExploracao,
} from '@/lib/exploracao/modelo'

// Paleta de status (dataviz): sempre com ícone e rótulo, nunca só a cor.
const DECISAO_VISUAL: Record<DecisaoGate, { cor: string; icone: LucideIcon }> = {
  aprovar: { cor: '#0ca30c', icone: CheckCircle2 },
  ajustar: { cor: '#fab219', icone: Undo2 },
  pausar: { cor: '#a8a29e', icone: PauseCircle },
  encerrar: { cor: '#d03b3b', icone: XCircle },
}

/** Série única do funil: o azul validado da paleta do Comparativo. */
const COR_FUNIL = '#2F6FB3'

type Filtro = EtapaId | 'pausadas' | 'paradas' | null

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')

function Card({ titulo, subtitulo, acao, children, className }: { titulo: string; subtitulo?: string; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx('min-w-0 rounded-2xl border border-beon-line bg-white', className)}>
      <header className="flex flex-wrap items-end justify-between gap-2 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-beon-ink">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-xs text-beon-muted">{subtitulo}</p>}
        </div>
        {acao}
      </header>
      <div className="p-5 pt-4">{children}</div>
    </section>
  )
}

// ── Fluxo ─────────────────────────────────────────────────────────────────────

function EtapaTile({ id, resumo, selecionada, onClick }: { id: EtapaId; resumo: ResumoExploracao; selecionada: boolean; onClick: () => void }) {
  const etapa = ETAPAS.find(e => e.id === id)!
  const dados = resumo.porEtapa[id]
  const ehGate = id === 'gate'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionada}
      title={selecionada ? 'Mostrar todas as oportunidades' : `Filtrar a lista: ${etapa.nome}`}
      className={cx(
        'group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left transition-colors',
        selecionada ? 'border-beon-red bg-beon-tint' : 'border-beon-line bg-white hover:border-beon-muted/50 hover:bg-beon-soft',
        ehGate && !selecionada && 'border-dashed',
        focusRing,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cx(
          'flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold',
          ehGate ? 'rotate-45 rounded-[6px] bg-beon-ink text-white' : 'rounded-full border border-beon-line bg-white text-beon-ink',
        )}>
          <span className={cx(ehGate && '-rotate-45')}>{ehGate ? <Scale className="h-3.5 w-3.5" aria-hidden /> : etapa.numero}</span>
        </span>
        <span className="min-w-0 truncate text-sm font-semibold text-beon-ink">{etapa.nome}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 text-beon-muted">{etapa.resumo}</p>
      <p className="mt-3 text-[28px] font-semibold tabular-nums leading-none tracking-tight text-beon-ink">{dados.quantidade}</p>
      <p className="mt-1 truncate text-[11px] text-beon-muted">
        {ehGate ? 'aguardando' : id === 'handoff' ? 'nas esteiras' : 'na etapa'}
        {dados.medianaDias !== null && <> · ~{dados.medianaDias} d</>}
      </p>
      {/* Linha sempre reservada: os números ficam alinhados entre as etapas, com ou sem alerta. */}
      <span className="mt-2 flex h-5 items-center">
        {dados.paradas > 0 && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
            title={`Há mais de ${DIAS_PARA_ALERTA} dias na etapa`}>
            <AlertTriangle className="h-3 w-3" aria-hidden /> {dados.paradas} {dados.paradas === 1 ? 'parada' : 'paradas'}
          </span>
        )}
      </span>
    </button>
  )
}

function Fluxo({ resumo, filtro, setFiltro }: { resumo: ResumoExploracao; filtro: Filtro; setFiltro: (f: Filtro) => void }) {
  const alternar = (id: EtapaId) => setFiltro(filtro === id ? null : id)
  const porFase = FASES.map(f => ({ ...f, etapas: ETAPAS.filter(e => e.fase === f.id) }))
  return (
    <Card
      titulo="Fluxo de oportunidades"
      subtitulo={`Onde cada oportunidade ativa está hoje ("~ d": mediana de dias na etapa; "parada": mais de ${DIAS_PARA_ALERTA} dias). Clique numa etapa para filtrar a lista.`}
    >
      <div className="grid gap-3 md:grid-cols-2 min-[1360px]:grid-cols-[minmax(0,5fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]">
        {porFase.map((fase, i) => (
          <div key={fase.id} className={cx('min-w-0', fase.etapas.length > 1 && 'md:col-span-2 min-[1360px]:col-span-1')}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{fase.nome}</span>
              <span className="h-px flex-1 bg-beon-line" aria-hidden />
              {i < porFase.length - 1 && <ChevronRight className="hidden h-3.5 w-3.5 text-beon-muted min-[1360px]:block" aria-hidden />}
            </div>
            <ol className={cx('grid gap-2', fase.etapas.length > 1 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-1')}>
              {fase.etapas.map(e => (
                <li key={e.id} className="min-w-0">
                  <EtapaTile id={e.id} resumo={resumo} selecionada={filtro === e.id} onClick={() => alternar(e.id)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

    </Card>
  )
}

// ── Indicadores ───────────────────────────────────────────────────────────────

function Kpi({ rotulo, ind, formato, formatoDelta = formato, menorMelhor, nota }: {
  rotulo: string; ind: Indicador; formato: (n: number) => string; formatoDelta?: (n: number) => string; menorMelhor?: boolean; nota: string
}) {
  const { atual, anterior } = ind
  const delta = atual !== null && anterior !== null ? atual - anterior : null
  const bom = delta !== null && delta !== 0 && (menorMelhor ? delta < 0 : delta > 0)
  const Seta = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown
  return (
    <div className="min-w-0 rounded-2xl border border-beon-line bg-white p-4">
      <p className="truncate text-xs font-medium text-beon-muted" title={rotulo}>{rotulo}</p>
      <p className="mt-1 text-[28px] font-semibold tabular-nums leading-tight tracking-tight text-beon-ink">{atual === null ? '—' : formato(atual)}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-beon-body">
        {delta !== null && (
          <span className={cx('inline-flex items-center gap-0.5 font-semibold', delta === 0 ? 'text-beon-muted' : bom ? 'text-[#006300]' : 'text-[#b42318]')}>
            <Seta className="h-3.5 w-3.5" aria-hidden />
            {delta > 0 ? '+' : ''}{formatoDelta(delta).replace(/^-/, '−')}
          </span>
        )}
        <span className="text-beon-muted">{anterior === null ? 'sem base anterior' : `vs ${formato(anterior)} antes`}</span>
      </p>
      <p className="mt-2 text-[11px] leading-4 text-beon-muted">{nota}</p>
    </div>
  )
}

function Indicadores({ resumo }: { resumo: ResumoExploracao }) {
  const { indicadores: i } = resumo
  const n = (v: number) => v.toLocaleString('pt-BR')
  const pp = (v: number) => `${n(v)} pp`
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi rotulo="Oportunidades identificadas" ind={i.identificadas} formato={n} nota="Registradas no Identificar" />
      <Kpi rotulo="Tempo até o Gate 1 (mediana)" ind={i.medianaDiasAteGate} formato={v => `${n(v)} d`} menorMelhor nota="Da identificação à primeira decisão" />
      <Kpi rotulo="Aprovação no Gate 1" ind={i.aprovacaoGate} formato={v => `${n(v)}%`} formatoDelta={pp} nota="Aprovações sobre todas as decisões" />
      <Kpi rotulo="Aceitas pelas esteiras" ind={i.aceitasEsteira} formato={v => `${n(v)}%`} formatoDelta={pp} nota="Das aprovadas que a esteira já respondeu" />
    </div>
  )
}

// ── Funil e decisões ─────────────────────────────────────────────────────────

function Funil({ resumo }: { resumo: ResumoExploracao }) {
  const topo = resumo.funil[0]?.quantidade || 1
  return (
    <Card titulo="Funil de conversão" subtitulo={`Oportunidades identificadas nos últimos ${resumo.janela.dias} dias: até onde chegaram`} className="lg:col-span-7">
      <ol className="space-y-1">
        {resumo.funil.map((f, i) => {
          const anterior = resumo.funil[i - 1]
          return (
            <li key={f.id}>
              {anterior && (
                <p className="py-1 pl-[calc(7rem+0.75rem)] text-[11px] text-beon-muted sm:pl-[calc(10rem+0.75rem)]">
                  ↓ {pct(f.quantidade, anterior.quantidade)}% avançam
                </p>
              )}
              <div className="flex items-center gap-3" title={`${f.nome}: ${f.quantidade} (${pct(f.quantidade, topo)}% das identificadas)`}>
                <div className="w-28 shrink-0 sm:w-40">
                  <p className="truncate text-sm font-medium text-beon-ink">{f.nome}</p>
                  <p className="truncate text-[11px] text-beon-muted">{f.detalhe}</p>
                </div>
                <div className="h-7 min-w-0 flex-1 rounded-md bg-beon-soft">
                  <div className="h-full rounded-md" style={{ width: `${Math.max(1.5, (f.quantidade / topo) * 100)}%`, background: COR_FUNIL }} />
                </div>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums text-beon-ink">
                  <span className="font-semibold">{f.quantidade}</span>
                  {i > 0 && <span className="ml-1 text-[11px] text-beon-muted">{pct(f.quantidade, topo)}%</span>}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function DecisoesGate({ resumo }: { resumo: ResumoExploracao }) {
  const total = DECISOES.reduce((s, d) => s + resumo.decisoes[d.id], 0)
  const origemTotal = resumo.origem.prospeccao + resumo.origem.recebimento
  return (
    <Card titulo="Gate 1 e qualidade das entradas" subtitulo={`Decisões dos últimos ${resumo.janela.dias} dias`} className="lg:col-span-5">
      <div className="flex w-full gap-[2px] overflow-hidden rounded-md" style={{ height: 14 }} role="img"
        aria-label={DECISOES.map(d => `${d.nome}: ${resumo.decisoes[d.id]}`).join(', ')}>
        {DECISOES.filter(d => resumo.decisoes[d.id]).map(d => (
          <div key={d.id} title={`${d.nome}: ${resumo.decisoes[d.id]} (${pct(resumo.decisoes[d.id], total)}%)`}
            style={{ width: `${(resumo.decisoes[d.id] / total) * 100}%`, background: DECISAO_VISUAL[d.id].cor, minWidth: 3 }} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {DECISOES.map(d => {
          const { cor, icone: I } = DECISAO_VISUAL[d.id]
          return (
            <li key={d.id} className="flex items-start gap-2 text-sm">
              <I className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cor }} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-beon-ink">{d.nome}</span>
                <span className="block text-[11px] leading-4 text-beon-muted">{d.efeito}</span>
              </span>
              <span className="ml-auto tabular-nums font-semibold text-beon-ink">{resumo.decisoes[d.id]}</span>
            </li>
          )
        })}
      </ul>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-beon-line pt-4">
        <div className="col-span-2">
          <dt className="flex justify-between text-xs text-beon-muted">
            <span>Origem das identificadas</span>
            <span className="tabular-nums">{origemTotal}</span>
          </dt>
          <dd className="mt-1.5">
            <div className="flex h-2.5 gap-[2px] overflow-hidden rounded" role="img" aria-label={`Prospecção ${resumo.origem.prospeccao}, recebimento ${resumo.origem.recebimento}`}>
              <div style={{ width: `${pct(resumo.origem.prospeccao, origemTotal)}%`, background: COR_FUNIL }} />
              <div className="flex-1 bg-beon-muted/40" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-beon-body">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: COR_FUNIL }} aria-hidden />Prospecção ativa <b className="tabular-nums text-beon-ink">{pct(resumo.origem.prospeccao, origemTotal)}%</b></span>
              <span>Recebidas <b className="tabular-nums text-beon-ink">{pct(resumo.origem.recebimento, origemTotal)}%</b><span className="ml-1 inline-block h-2 w-2 rounded-sm bg-beon-muted/40 align-middle" aria-hidden /></span>
            </div>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-beon-muted">Com benefício estimado</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-beon-ink">
            {pct(resumo.comBeneficio.quantidade, resumo.comBeneficio.total)}%
            <span className="ml-1 text-xs font-normal text-beon-muted">{resumo.comBeneficio.quantidade} de {resumo.comBeneficio.total} ativas</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-beon-muted">Valor potencial (ativas)</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-beon-ink">{formatarValor(resumo.valorPotencial)}</dd>
        </div>
      </dl>
    </Card>
  )
}

// ── Lista ────────────────────────────────────────────────────────────────────

function Lista({ oportunidades, filtro, setFiltro, hoje, resumo }: { oportunidades: Oportunidade[]; filtro: Filtro; setFiltro: (f: Filtro) => void; hoje: Date; resumo: ResumoExploracao }) {
  const paradas = (o: Oportunidade) => situacao(o) === 'ativa' && o.etapa !== 'handoff' && diasEntre(o.naEtapaDesde, hoje) > DIAS_PARA_ALERTA
  const grupo = (o: Oportunidade) => (paradas(o) ? 0 : situacao(o) === 'ativa' && o.etapa !== 'handoff' ? 1 : situacao(o) === 'pausada' ? 2 : 3)
  const visiveis = useMemo(() => oportunidades
    .filter(o => situacao(o) !== 'encerrada')
    .filter(o => filtro === null ? true
      : filtro === 'pausadas' ? situacao(o) === 'pausada'
      : filtro === 'paradas' ? paradas(o)
      : o.etapa === filtro && situacao(o) === 'ativa')
    // Paradas primeiro; depois as em exploração; por fim as pausadas e as já nas esteiras. Dentro de cada grupo, mais dias na etapa primeiro.
    .sort((a, b) => grupo(a) - grupo(b) || diasEntre(b.naEtapaDesde, hoje) - diasEntre(a.naEtapaDesde, hoje)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [oportunidades, filtro, hoje])
  const totalParadas = oportunidades.filter(paradas).length

  const chips: { id: Filtro; rotulo: string; n?: number }[] = [
    { id: null, rotulo: 'Todas' },
    ...ETAPAS.map(e => ({ id: e.id as Filtro, rotulo: e.nome, n: resumo.porEtapa[e.id].quantidade })),
    { id: 'paradas', rotulo: `Paradas +${DIAS_PARA_ALERTA}d`, n: totalParadas },
    { id: 'pausadas', rotulo: 'Pausadas', n: resumo.pausadas },
  ]

  return (
    <Card titulo="Oportunidades" subtitulo={`Paradas há mais de ${DIAS_PARA_ALERTA} dias primeiro, depois as em exploração, as pausadas e as já nas esteiras`}>
      <div className="-mx-1 mb-3 flex flex-wrap gap-1.5 px-1">
        {chips.map(c => (
          <button key={String(c.id)} type="button" onClick={() => setFiltro(c.id)} aria-pressed={filtro === c.id}
            className={cx('rounded-full border px-3 py-1 text-xs font-medium transition-colors', focusRing,
              filtro === c.id ? 'border-beon-ink bg-beon-ink text-white' : 'border-beon-line bg-white text-beon-body hover:bg-beon-soft')}>
            {c.rotulo}{c.n !== undefined && <span className={cx('ml-1 tabular-nums', filtro === c.id ? 'text-white/70' : 'text-beon-muted')}>{c.n}</span>}
          </button>
        ))}
      </div>
      <div className="max-h-[420px] overflow-auto rounded-xl border border-beon-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-beon-soft text-[11px] uppercase tracking-[0.06em] text-beon-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">Oportunidade</th>
              <th scope="col" className="px-3 py-2 font-semibold">Etapa</th>
              <th scope="col" className="px-3 py-2 font-semibold">Área</th>
              <th scope="col" className="px-3 py-2 font-semibold">Origem</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Na etapa</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold">Benefício est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beon-line">
            {visiveis.map(o => {
              const etapa = ETAPAS.find(e => e.id === o.etapa)!
              const dias = diasEntre(o.naEtapaDesde, hoje)
              const d = ultimaDecisao(o)
              const pausada = situacao(o) === 'pausada'
              return (
                <tr key={o.key} className="hover:bg-beon-soft/60">
                  <td className="max-w-[300px] px-4 py-2.5">
                    <span className="block truncate font-medium text-beon-ink">{o.nome}</span>
                    <span className="text-xs text-beon-muted">{o.key} · desde {dataCurta(o.identificadaEm)}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-beon-body">
                    {pausada
                      ? <span className="inline-flex items-center gap-1"><PauseCircle className="h-3.5 w-3.5" style={{ color: DECISAO_VISUAL.pausar.cor }} aria-hidden />Pausada no Gate 1</span>
                      : etapa.nome}
                    {o.etapa === 'refinar' && d?.tipo === 'ajustar' && <span className="block text-xs text-beon-muted">ajustes pedidos no Gate 1</span>}
                    {o.etapa === 'handoff' && o.esteira && (
                      <span className="block text-xs text-beon-muted">
                        {o.esteira} · {o.aceitaPelaEsteira === undefined ? 'aguardando aceite' : o.aceitaPelaEsteira ? 'aceita' : 'recusada'}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-beon-body">{o.area}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-beon-body">{o.origem === 'prospeccao' ? 'Prospecção' : 'Recebida'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-beon-ink">
                    {!pausada && o.etapa !== 'handoff' && dias > DIAS_PARA_ALERTA
                      ? <span className="inline-flex items-center gap-1 font-semibold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />{dias} d</span>
                      : `${dias} d`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-beon-ink">{o.beneficioEstimado ? formatarValor(o.beneficioEstimado) : '—'}</td>
                </tr>
              )
            })}
            {!visiveis.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-beon-muted">Nenhuma oportunidade neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Governança ───────────────────────────────────────────────────────────────

function Governanca() {
  return (
    <Card titulo="Como a exploração é governada" subtitulo="Rituais, papéis e os pilares que os indicadores acima acompanham">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Rituais</h3>
          <ul className="divide-y divide-beon-line">
            {RITUAIS.map(r => (
              <li key={r.nome} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-beon-ink">{r.nome}</p>
                  <p className="text-xs text-beon-muted">{r.pauta}</p>
                </div>
                <span className="shrink-0 rounded-full bg-beon-soft px-2 py-0.5 text-[11px] font-medium text-beon-body">{r.cadencia}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Papéis</h3>
          <ul className="divide-y divide-beon-line">
            {PAPEIS.map(p => (
              <li key={p.nome} className="py-2.5">
                <p className="text-sm font-medium text-beon-ink">{p.nome}</p>
                <p className="text-xs text-beon-muted">{p.responsabilidade}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">Pilares</h3>
          <ol className="divide-y divide-beon-line">
            {PILARES.map((p, i) => (
              <li key={p.nome} className="flex gap-3 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-beon-tint text-[11px] font-semibold text-beon-red">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-beon-ink">{p.nome}</p>
                  <p className="text-xs text-beon-muted">{p.resumo}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ExploracaoClient({ oportunidades, resumo, hoje: hojeIso, ilustrativo }: {
  oportunidades: Oportunidade[]
  resumo: ResumoExploracao
  hoje: string
  /** Base de exemplo (o Discovery Flow ainda não tem fonte no Jira): mostra o aviso no topo. */
  ilustrativo: boolean
}) {
  const [filtro, setFiltro] = useState<Filtro>(null)
  const hoje = useMemo(() => new Date(hojeIso), [hojeIso])
  const periodo = `${dataCurta(resumo.janela.inicio)} – ${dataCurta(resumo.janela.fim)}`

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-5 sm:px-6">
      {ilustrativo && (
        <p className="flex items-start gap-2 rounded-xl border border-beon-line bg-white px-4 py-2.5 text-xs text-beon-body">
          <Info className="mt-px h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
          <span><b className="font-semibold text-beon-ink">Prévia do layout com dados ilustrativos.</b> O Discovery Flow 2.0 ainda não tem fonte no Jira; os números mostram como o painel se comporta, não a realidade.</span>
        </p>
      )}

      <Fluxo resumo={resumo} filtro={filtro} setFiltro={setFiltro} />

      <div>
        <p className="mb-2 text-xs text-beon-muted">Últimos {resumo.janela.dias} dias ({periodo}) contra os {resumo.janela.dias} dias anteriores</p>
        <Indicadores resumo={resumo} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Funil resumo={resumo} />
        <DecisoesGate resumo={resumo} />
      </div>

      <Lista oportunidades={oportunidades} filtro={filtro} setFiltro={setFiltro} hoje={hoje} resumo={resumo} />

      <Governanca />
    </div>
  )
}
