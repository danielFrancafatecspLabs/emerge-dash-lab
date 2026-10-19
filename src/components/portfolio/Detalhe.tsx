'use client'

// Painel lateral com a ficha de uma Iniciativa ou de um Experimento: todos os campos do Jira, a ligação
// Iniciativa ↔ Experimentos e atalhos para filtrar o quadro por um valor.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Check, CornerDownRight, Filter, Link2, Paperclip, X } from 'lucide-react'
import { cx, focusRing, IconButton } from '@/components/ui'
import {
  faixaPrazo, filhosDe, formatarData, formatarValor, IMPACTO_LABEL, maeDe, nomeDaColuna, type Contexto,
} from '@/lib/portfolio/filtros'
import { SITUACAO_LABEL, type ExperimentoItem, type IniciativaItem, type ItemPortfolio } from '@/lib/portfolio/tipos'
import { COR_SITUACAO, PontoSituacao, SeloBloqueado } from './Comum'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

interface Campo {
  label: string
  valor: string | null | undefined
  /** Campo e valor de filtro aplicados ao clicar. */
  filtro?: [string, string]
  conteudo?: ReactNode
}

function Campos({ campos, onFiltrar }: { campos: Campo[]; onFiltrar: (campo: string, valor: string) => void }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {campos.map(c => (
        <div key={c.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-beon-muted">{c.label}</dt>
          <dd className="mt-0.5 text-sm text-beon-ink">
            {c.conteudo ?? (c.valor
              ? c.filtro
                ? (
                  <button type="button" onClick={() => onFiltrar(...c.filtro!)} title={`Filtrar o quadro por ${c.label}: ${c.filtro[1]}`}
                    className={cx('group inline-flex max-w-full items-center gap-1 rounded text-left hover:text-beon-red', focusRing)}>
                    <span className="truncate">{c.valor}</span>
                    <Filter className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </button>
                )
                : <span className="break-words">{c.valor}</span>
              : <span className="text-beon-muted/70">Não informado</span>)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Copia o endereço da página, que já abre este item (?d=CHAVE). */
function CopiarLink() {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(window.location.href); setOk(true); setTimeout(() => setOk(false), 1800) } catch { /* sem permissão */ }
      }}
      className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-beon-body hover:bg-beon-soft hover:text-beon-ink', focusRing)}
    >
      {ok ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
      {ok ? 'Link copiado' : 'Copiar link'}
    </button>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-beon-line px-6 py-5">
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{titulo}</h3>
      {children}
    </section>
  )
}

function LinhaItem({ item, ctx, onAbrir }: { item: ItemPortfolio; ctx: Contexto; onAbrir: (i: ItemPortfolio) => void }) {
  return (
    <button type="button" onClick={() => onAbrir(item)}
      className={cx('flex w-full items-center gap-3 rounded-xl border border-beon-line px-3 py-2.5 text-left hover:border-stone-300 hover:bg-beon-soft', focusRing)}>
      <PontoSituacao situacao={item.situacao} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-beon-ink">{item.nome}</span>
        <span className="block truncate text-xs text-beon-muted">{item.key} · {nomeDaColuna(item.coluna, ctx)}{item.bloqueado ? ' · bloqueado' : ''}</span>
      </span>
      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-beon-ink">{item.beneficio ? formatarValor(item.beneficio) : ''}</span>
    </button>
  )
}

function camposIniciativa(i: IniciativaItem): Campo[] {
  return [
    { label: 'Lab responsável', valor: i.lab, filtro: i.lab ? ['lab', i.lab] : undefined },
    { label: 'Sponsor', valor: i.sponsor, filtro: i.sponsor ? ['sponsor', i.sponsor] : undefined },
    { label: 'Domínio', valor: i.dominio, filtro: i.dominio ? ['dominio', i.dominio] : undefined },
    { label: 'Impacto na meta', valor: i.impacto ? IMPACTO_LABEL[i.impacto] ?? i.impacto : null, filtro: i.impacto ? ['impacto', IMPACTO_LABEL[i.impacto] ?? i.impacto] : undefined },
    { label: 'Criada em', valor: i.criadoEm ? formatarData(i.criadoEm) : null },
    { label: 'Próximo prazo', valor: i.prazo ? formatarData(i.prazo) : null },
  ]
}

function camposExperimento(e: ExperimentoItem): Campo[] {
  const f = (campo: string, v: string | null): [string, string] | undefined => (v ? [campo, v] : undefined)
  const impacto = e.impacto ? IMPACTO_LABEL[e.impacto] ?? e.impacto : null
  return [
    { label: 'Lab responsável', valor: e.lab, filtro: f('lab', e.lab) },
    { label: 'Sponsor', valor: e.sponsor, filtro: f('sponsor', e.sponsor) },
    { label: 'Business Owner', valor: e.bo, filtro: f('bo', e.bo) },
    { label: 'Diretoria', valor: e.diretoria, filtro: f('diretoria', e.diretoria) },
    { label: 'Domínio', valor: e.dominio, filtro: f('dominio', e.dominio) },
    { label: 'Segmento', valor: e.segmento, filtro: f('segmento', e.segmento) },
    { label: 'Mercado', valor: e.mercado, filtro: f('mercado', e.mercado) },
    { label: 'Portfólio', valor: e.portfolio, filtro: f('portfolio', e.portfolio) },
    { label: 'Impacto na meta', valor: impacto, filtro: f('impacto', impacto) },
    { label: 'Complexidade', valor: e.complexidade, filtro: f('complexidade', e.complexidade) },
    { label: 'Tecnologia', valor: e.tecnologia, filtro: f('tecnologia', e.tecnologia) },
    { label: 'Prioridade', valor: e.prioridade, filtro: f('prioridade', e.prioridade) },
    { label: 'Data limite', valor: e.prazo ? formatarData(e.prazo) : null },
    { label: 'Criado em', valor: e.criadoEm ? formatarData(e.criadoEm) : null },
    ...(e.concluidoEm ? [{ label: 'Concluído em', valor: formatarData(e.concluidoEm) }] : []),
  ]
}

export function Detalhe({ item, ctx, jiraUrl, onFechar, onAbrir, onFiltrar }: {
  item: ItemPortfolio
  ctx: Contexto
  jiraUrl: string | null
  onFechar: () => void
  onAbrir: (i: ItemPortfolio) => void
  onFiltrar: (campo: string, valor: string) => void
}) {
  const painel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onFechar])
  useEffect(() => { painel.current?.focus() }, [item.key])

  const exp = item.tipo === 'experimento' ? item : null
  const mae = exp ? maeDe(exp, ctx) : undefined
  const filhos = item.tipo === 'iniciativa' ? filhosDe(item, ctx) : []
  const irmaos = mae ? filhosDe(mae, ctx).filter(e => e.key !== item.key) : []
  const prazo = faixaPrazo(item.prazo, item.situacao, ctx.hoje)
  const cancelado = item.situacao === 'cancelado'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" />
      <div
        ref={painel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-titulo"
        className="relative flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl focus:outline-none"
      >
        <header className="border-b border-beon-line px-6 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-beon-muted">
              {item.tipo === 'iniciativa' ? 'Iniciativa · board de Ideação' : 'Experimento · board de Experimentação/Piloto'}
            </p>
            <IconButton icon={X} label="Fechar" onClick={onFechar} className="-mr-2 -mt-1.5" />
          </div>
          <h2 id="detalhe-titulo" className="text-xl font-semibold leading-snug tracking-tight text-beon-ink">{item.nome}</h2>
          {mae && (
            <button type="button" onClick={() => onAbrir(mae)} className={cx('mt-1.5 inline-flex max-w-full items-center gap-1 text-sm text-beon-body hover:text-beon-red', focusRing)}>
              <CornerDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Iniciativa {mae.key} · {mae.nome}</span>
            </button>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-beon-line">
              <PontoSituacao situacao={item.situacao} />
              {nomeDaColuna(item.coluna, ctx)}
              {item.status.toUpperCase() !== nomeDaColuna(item.coluna, ctx).toUpperCase() && <span className="text-beon-muted">· {item.status}</span>}
            </span>
            {norm(nomeDaColuna(item.coluna, ctx)) !== norm(SITUACAO_LABEL[item.situacao]) && (
              <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${COR_SITUACAO[item.situacao]}14`, color: COR_SITUACAO[item.situacao] }}>
                {SITUACAO_LABEL[item.situacao]}
              </span>
            )}
            {item.bloqueado && <SeloBloqueado motivo={exp?.motivoBloqueio} />}
            {prazo === 'Vencido' && <span className="rounded-full bg-beon-tint px-2.5 py-1 text-xs font-medium text-beon-red">Prazo vencido</span>}
            <span className="text-xs tabular-nums text-beon-muted">{item.key}</span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 px-6 py-5">
            <div className="rounded-2xl bg-beon-soft px-4 py-3">
              <p className="text-xs text-beon-muted">Benefício potencial</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-beon-ink">{formatarValor(item.beneficio)}</p>
              {item.tipo === 'iniciativa' && filhos.length > 0 && <p className="text-[11px] text-beon-muted">Soma dos {filhos.length} experimentos</p>}
            </div>
            <div className="rounded-2xl bg-beon-soft px-4 py-3">
              {exp ? (
                <>
                  <p className="text-xs text-beon-muted">Custo estimado · realizado</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-beon-ink">{formatarValor(exp.custoEstimado)}</p>
                  <p className="truncate text-[11px] text-beon-muted">Realizado: {exp.custoRealizado || 'não informado'}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-beon-muted">Experimentos</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-beon-ink">{filhos.length}</p>
                  <p className="text-[11px] text-beon-muted">{filhos.filter(f => f.situacao === 'em-execucao').length} em execução</p>
                </>
              )}
            </div>
          </div>

          {item.descricao && (
            <Secao titulo={item.tipo === 'iniciativa' ? 'Solução proposta' : 'Descrição'}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-beon-body">{item.descricao}</p>
            </Secao>
          )}

          <Secao titulo="Campos do Jira">
            <Campos campos={item.tipo === 'iniciativa' ? camposIniciativa(item) : camposExperimento(item)} onFiltrar={onFiltrar} />
          </Secao>

          {exp?.beneficioQualitativo && (
            <Secao titulo="Benefício qualitativo">
              <p className="text-sm leading-relaxed text-beon-body">{exp.beneficioQualitativo}</p>
            </Secao>
          )}

          {exp && (exp.motivoBloqueio || exp.tipoImpedimento) && (
            <Secao titulo={cancelado ? 'Motivo do cancelamento' : 'Bloqueio'}>
              <Campos
                onFiltrar={onFiltrar}
                campos={[
                  { label: 'Motivo', valor: exp.motivoBloqueio, filtro: exp.motivoBloqueio ? ['motivoBloqueio', exp.motivoBloqueio] : undefined },
                  { label: 'Tipo de impedimento', valor: exp.tipoImpedimento, filtro: exp.tipoImpedimento ? ['tipoImpedimento', exp.tipoImpedimento] : undefined },
                ]}
              />
            </Secao>
          )}

          {exp?.ultimoComentario && (
            <Secao titulo="Último comentário no Jira">
              <p className="rounded-xl bg-beon-soft px-4 py-3 text-sm leading-relaxed text-beon-body">{exp.ultimoComentario}</p>
            </Secao>
          )}

          {item.tipo === 'iniciativa' && (
            <Secao titulo={`Experimentos desta iniciativa (${filhos.length})`}>
              {filhos.length ? (
                <div className="space-y-2">{filhos.map(f => <LinhaItem key={f.key} item={f} ctx={ctx} onAbrir={onAbrir} />)}</div>
              ) : (
                <p className="text-sm text-beon-muted">Ainda não há experimento vinculado a esta iniciativa no Jira.</p>
              )}
            </Secao>
          )}

          {irmaos.length > 0 && (
            <Secao titulo={`Outros ciclos da mesma iniciativa (${irmaos.length})`}>
              <div className="space-y-2">{irmaos.map(f => <LinhaItem key={f.key} item={f} ctx={ctx} onAbrir={onAbrir} />)}</div>
            </Secao>
          )}

          {exp && exp.anexos.length > 0 && (
            <Secao titulo={`Anexos (${exp.anexos.length})`}>
              <ul className="space-y-1.5">
                {exp.anexos.map(a => (
                  <li key={a.url}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className={cx('inline-flex max-w-full items-center gap-2 text-sm text-beon-body hover:text-beon-red', focusRing)}>
                      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{a.nome}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Secao>
          )}
        </div>

        {jiraUrl && (
          <footer className="flex items-center justify-between gap-3 border-t border-beon-line px-6 py-3">
            <CopiarLink />
            <a
              href={`${jiraUrl}/browse/${item.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cx('inline-flex h-9 items-center gap-1.5 rounded-full bg-beon-ink px-4 text-sm font-medium text-white hover:bg-stone-800', focusRing)}
            >
              Abrir no Jira <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </footer>
        )}
      </div>
    </div>
  )
}
