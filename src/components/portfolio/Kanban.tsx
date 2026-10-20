'use client'

// Kanban de um board do Jira (Iniciativas ou Experimentos): uma coluna por coluna do board, com a
// contagem e o benefício somado; com "Raias", uma linha por valor do campo escolhido.

import { CalendarClock, ChevronsLeftRight, CornerDownRight, Layers } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import {
  agrupar, CAMPO, faixaPrazo, filhosDe, formatarData, formatarValor, IMPACTO_LABEL, maeDe, type Contexto,
} from '@/lib/portfolio/filtros'
import type { ColunaBoard, ExperimentoItem, IniciativaItem, ItemPortfolio } from '@/lib/portfolio/tipos'
import { COR_SITUACAO, Lab, SeloBloqueado } from './Comum'

const LARGURA = 288
const RECOLHIDA = 44

function CartaoIniciativa({ item, ctx }: { item: IniciativaItem; ctx: Contexto }) {
  const filhos = filhosDe(item, ctx)
  return (
    <>
      <div className="flex items-center justify-between gap-2 text-[11px] text-beon-muted">
        <span className="font-medium tabular-nums">{item.key}</span>
        <span className="inline-flex items-center gap-1" title="Experimentos vinculados">
          <Layers className="h-3 w-3" aria-hidden />
          {filhos.length === 0 ? 'sem experimento' : filhos.length === 1 ? '1 experimento' : `${filhos.length} ciclos`}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-beon-ink">{item.nome}</p>
      <Responsaveis item={item} />
      {filhos.length > 0 && (
        <div className="mt-2.5 flex gap-1" aria-label="Situação dos experimentos">
          {filhos.map(f => (
            <span key={f.key} className="h-1 flex-1 rounded-full" style={{ background: COR_SITUACAO[f.situacao] }} title={`${f.key} · ${f.status}`} />
          ))}
        </div>
      )}
      <Rodape item={item} />
    </>
  )
}

function CartaoExperimento({ item, ctx }: { item: ExperimentoItem; ctx: Contexto }) {
  const mae = maeDe(item, ctx)
  const prazo = faixaPrazo(item.prazo, item.situacao, ctx.hoje)
  return (
    <>
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-beon-muted">
        <span className="shrink-0 font-medium tabular-nums">{item.key}</span>
        {mae && (
          <span className="inline-flex min-w-0 items-center gap-0.5" title={`Iniciativa ${mae.key}: ${mae.nome}`}>
            <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{mae.nome}</span>
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-beon-ink">{item.nome}</p>
      <Responsaveis item={item} />
      {item.prazo && prazo !== 'Encerrado' && (
        <p className={cx('mt-1.5 inline-flex items-center gap-1 text-[11px]', prazo === 'Vencido' ? 'font-medium text-beon-red' : 'text-beon-muted')}>
          <CalendarClock className="h-3 w-3" aria-hidden />
          {prazo === 'Vencido' ? 'Venceu em' : 'Até'} {formatarData(item.prazo)}
        </p>
      )}
      <Rodape item={item} />
    </>
  )
}

/** Lab e sponsor. O que não está preenchido no Jira não aparece no cartão (as lacunas ficam no filtro "Pendências de cadastro"). */
function Responsaveis({ item }: { item: ItemPortfolio }) {
  if (!item.lab && !item.sponsor) return null
  return (
    <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-beon-body">
      {item.lab && <Lab nome={item.lab} className="max-w-[55%]" />}
      {item.sponsor && <span className="truncate text-beon-muted">{item.lab ? '· ' : ''}{item.sponsor}</span>}
    </div>
  )
}

function Rodape({ item }: { item: ItemPortfolio }) {
  const motivo = item.tipo === 'experimento' ? item.motivoBloqueio : null
  const impacto = item.impacto ? IMPACTO_LABEL[item.impacto] ?? item.impacto : null
  if (!item.bloqueado && !impacto && !item.beneficio) return null
  return (
    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-beon-line/70 pt-2">
      <div className="min-w-0">
        {item.bloqueado ? <SeloBloqueado motivo={motivo} /> : impacto && <span className="block truncate text-[11px] text-beon-muted">{impacto}</span>}
      </div>
      {!!item.beneficio && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-beon-ink">{formatarValor(item.beneficio)}</span>}
    </div>
  )
}

export function Cartao({ item, ctx, onAbrir }: { item: ItemPortfolio; ctx: Contexto; onAbrir: (item: ItemPortfolio) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(item)}
      className={cx(
        'block w-full rounded-xl border border-beon-line bg-white p-3 text-left shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:border-stone-300 hover:shadow-md',
        focusRing,
      )}
    >
      {item.tipo === 'iniciativa' ? <CartaoIniciativa item={item} ctx={ctx} /> : <CartaoExperimento item={item} ctx={ctx} />}
    </button>
  )
}

/** Nome da coluna em caixa de frase: o Jira mistura "BACKLOG", "Em refinamento", "PRONTO PARA EXECUÇÃO". */
function nomeDaColuna(nome: string) {
  const n = nome.trim().toLocaleLowerCase('pt-BR')
  return n.charAt(0).toLocaleUpperCase('pt-BR') + n.slice(1)
}

/** Altura fixa do cabeçalho, para as colunas (e as raias) ficarem alinhadas. */
const ALTURA_CABECALHO = 112

function Cabecalho({ col, itens, totalBeneficio, fechada, onAlternar }: {
  col: ColunaBoard; itens: ItemPortfolio[]; totalBeneficio: number; fechada: boolean; onAlternar: () => void
}) {
  const soma = itens.reduce((s, i) => s + (i.beneficio ?? 0), 0)
  const nome = nomeDaColuna(col.nome)
  const cor = COR_SITUACAO[col.situacao]
  if (fechada) {
    return (
      <button
        type="button"
        onClick={onAlternar}
        title={`Mostrar a coluna ${nome}`}
        className={cx('flex h-full w-full flex-col items-center gap-2 overflow-hidden rounded-2xl border border-beon-line bg-white py-3 text-beon-body hover:bg-beon-soft', focusRing)}
        style={{ borderTop: `3px solid ${cor}` }}
      >
        <span className="rounded-full bg-beon-soft px-1.5 text-[11px] font-semibold tabular-nums text-beon-ink">{itens.length}</span>
        <span className="text-[12.5px] font-semibold [writing-mode:vertical-rl]">{nome}</span>
      </button>
    )
  }
  const parte = totalBeneficio > 0 ? soma / totalBeneficio : 0
  return (
    <div
      className="flex flex-col rounded-2xl border border-beon-line bg-white px-3.5 pb-3 pt-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      style={{ borderTop: `3px solid ${cor}`, height: ALTURA_CABECALHO }}
      title={col.descricao}
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-beon-ink">{nome}</h3>
        <span className="rounded-full bg-beon-soft px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-beon-ink" title={`${itens.length} nesta coluna`}>{itens.length}</span>
        <button type="button" onClick={onAlternar} title="Recolher a coluna" aria-label={`Recolher a coluna ${nome}`}
          className={cx('-mr-1 rounded-md p-1 text-beon-muted hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
          <ChevronsLeftRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-beon-muted">Benefício potencial</p>
      <div className="flex items-baseline justify-between gap-2">
        <p className={cx('text-[20px] font-semibold leading-tight tracking-tight tabular-nums', soma ? 'text-beon-ink' : 'text-beon-muted/60')}>
          {soma ? formatarValor(soma) : '—'}
        </p>
        {soma > 0 && <p className="shrink-0 text-[11.5px] tabular-nums text-beon-muted">{Math.round(parte * 100)}% do quadro</p>}
      </div>
      <div className="mt-auto h-1 overflow-hidden rounded-full bg-beon-soft" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${Math.max(parte * 100, soma ? 2 : 0)}%`, background: cor }} />
      </div>
    </div>
  )
}

export function Kanban({ itens, colunas, ctx, raias, alternadas, filtrando, onAlternarColuna, onAbrir }: {
  itens: ItemPortfolio[]
  colunas: ColunaBoard[]
  ctx: Contexto
  /** Há busca ou filtro ativo: colunas vazias começam recolhidas. */
  filtrando: boolean
  /** Campo das raias (null = sem raias). */
  raias: string | null
  alternadas: string[]
  onAlternarColuna: (id: string) => void
  onAbrir: (item: ItemPortfolio) => void
}) {
  const porColuna = (lista: ItemPortfolio[]) => {
    const m = new Map<string, ItemPortfolio[]>(colunas.map(c => [c.id, []]))
    for (const i of lista) m.get(i.coluna)?.push(i)
    return m
  }
  const totais = porColuna(itens)
  const totalBeneficio = itens.reduce((s, i) => s + (i.beneficio ?? 0), 0)
  // Recolhidas por padrão: Cancelado e, com filtros, as colunas vazias. Clicar inverte o padrão da coluna.
  const recolhida = (c: ColunaBoard) =>
    (c.situacao === 'cancelado' || (filtrando && (totais.get(c.id)?.length ?? 0) === 0)) !== alternadas.includes(c.id)
  const largura = (c: ColunaBoard) => (recolhida(c) ? RECOLHIDA : LARGURA)

  if (!raias) {
    const mapa = totais
    return (
      <div className="flex h-full min-h-0 gap-3 overflow-x-auto px-4 pb-4 pt-3 sm:px-6">
        {colunas.map(c => {
          const lista = mapa.get(c.id) ?? []
          const fechada = recolhida(c)
          return (
            <section key={c.id} aria-label={`Coluna ${c.nome}`} className="flex h-full min-h-0 shrink-0 flex-col" style={{ width: largura(c) }}>
              <div className={cx('shrink-0', fechada ? 'h-full' : 'mb-2')}>
                <Cabecalho col={c} itens={lista} totalBeneficio={totalBeneficio} fechada={fechada} onAlternar={() => onAlternarColuna(c.id)} />
              </div>
              {!fechada && (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-stone-100/80 p-2">
                  {lista.map(i => <Cartao key={i.key} item={i} ctx={ctx} onAbrir={onAbrir} />)}
                  {lista.length === 0 && <p className="px-2 py-6 text-center text-xs text-beon-muted">Nada nesta coluna com os filtros atuais.</p>}
                </div>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  const grupos = agrupar(itens, raias, ctx)
  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="min-w-max px-4 pb-6 sm:px-6">
        <div className="sticky top-0 z-10 flex gap-3 bg-beon-soft pb-1 pt-3">
          {colunas.map(c => (
            <div key={c.id} className="shrink-0" style={{ width: largura(c), height: ALTURA_CABECALHO }}>
              <Cabecalho col={c} itens={totais.get(c.id) ?? []} totalBeneficio={totalBeneficio} fechada={recolhida(c)} onAlternar={() => onAlternarColuna(c.id)} />
            </div>
          ))}
        </div>
        {grupos.map(g => {
          const mapa = porColuna(g.itens)
          const soma = g.itens.reduce((s, i) => s + (i.beneficio ?? 0), 0)
          return (
            <section key={g.valor} aria-label={`${CAMPO.get(raias)?.label}: ${g.valor}`} className="mt-3">
              <div className="sticky left-0 mb-2 flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-[13px] ring-1 ring-inset ring-beon-line">
                <span className="text-beon-muted">{CAMPO.get(raias)?.label}:</span>
                <span className="font-semibold text-beon-ink">{g.valor}</span>
                <span className="tabular-nums text-beon-muted">· {g.itens.length} · {formatarValor(soma)}</span>
              </div>
              <div className="flex gap-3">
                {colunas.map(c => {
                  const lista = mapa.get(c.id) ?? []
                  return (
                    <div key={c.id} className={cx('shrink-0 rounded-2xl', !recolhida(c) && 'space-y-2 bg-stone-100/80 p-2')} style={{ width: largura(c) }}>
                      {!recolhida(c) && lista.map(i => <Cartao key={i.key} item={i} ctx={ctx} onAbrir={onAbrir} />)}
                      {recolhida(c) && lista.length > 0 && (
                        <p className="pt-1 text-center text-[11px] font-semibold tabular-nums text-beon-muted" title={`${lista.length} em ${c.nome}`}>{lista.length}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
        {grupos.length === 0 && <p className="py-10 text-center text-sm text-beon-muted">Nenhum item com os filtros atuais.</p>}
      </div>
    </div>
  )
}
