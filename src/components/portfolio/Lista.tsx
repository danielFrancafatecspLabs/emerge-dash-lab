'use client'

// Lista de Iniciativas ou de Experimentos: colunas escolhidas pelo usuário, ordenação pelo cabeçalho e
// grupos (quando há agrupamento).

import { ArrowDown, Columns3 } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import {
  agrupar, CAMPO, COLUNAS_LISTA, COLUNAS_PADRAO, colunasVisiveis, formatarValor, nomeDaColuna,
  type Contexto, type EstadoPortfolio, type OrdemId,
} from '@/lib/portfolio/filtros'
import type { Entidade, ItemPortfolio } from '@/lib/portfolio/tipos'
import { Lab, Opcoes, Popover, PontoSituacao, SeloBloqueado, botaoBarra } from './Comum'

export function EscolherColunas({ entidade, estado, onMudar }: {
  entidade: Entidade
  estado: EstadoPortfolio
  onMudar: (colunas: string[] | null) => void
}) {
  const escolhidas = estado.colunas[entidade] ?? COLUNAS_PADRAO[entidade]
  const opcoes = COLUNAS_LISTA[entidade].filter(c => c.id !== 'nome').map(c => ({ valor: c.label }))
  const porLabel = new Map(COLUNAS_LISTA[entidade].map(c => [c.label, c.id]))
  return (
    <Popover
      rotulo="Colunas da lista"
      alinhar="direita"
      largura={260}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto} className={botaoBarra(!!estado.colunas[entidade])}>
          <Columns3 className="h-4 w-4" aria-hidden /> Colunas
        </button>
      )}
    >
      {() => (
        <div>
          <p className="px-2 pb-1 pt-1 text-xs text-beon-muted">Escolha o que aparece na lista.</p>
          <Opcoes
            facetas={opcoes}
            marcados={opcoes.filter(f => escolhidas.includes(porLabel.get(f.valor)!)).map(f => f.valor)}
            onAlternar={label => {
              const id = porLabel.get(label)!
              onMudar(escolhidas.includes(id) ? escolhidas.filter(c => c !== id) : [...escolhidas, id])
            }}
            altura={340}
          />
          {estado.colunas[entidade] && (
            <div className="mt-1 border-t border-beon-line pt-1">
              <button type="button" onClick={() => onMudar(null)} className={cx('rounded-lg px-2 py-1.5 text-sm font-medium text-beon-red hover:bg-beon-tint', focusRing)}>
                Voltar ao padrão
              </button>
            </div>
          )}
        </div>
      )}
    </Popover>
  )
}

function Celula({ id, item, ctx, valor }: { id: string; item: ItemPortfolio; ctx: Contexto; valor: string }) {
  switch (id) {
    case 'nome':
      return (
        <div className="min-w-[240px] max-w-[380px]">
          <p className="line-clamp-2 font-medium text-beon-ink">{item.nome}</p>
          <p className="text-[11px] tabular-nums text-beon-muted">{item.key}</p>
        </div>
      )
    case 'coluna':
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <PontoSituacao situacao={item.situacao} />
          {nomeDaColuna(item.coluna, ctx)}
        </span>
      )
    case 'lab':
      return <Lab nome={item.lab} className="max-w-[180px]" />
    case 'beneficio':
      return <span className={cx('whitespace-nowrap font-semibold tabular-nums', item.beneficio ? 'text-beon-ink' : 'font-normal text-beon-muted/70')}>{valor}</span>
    case 'bloqueio':
      return item.bloqueado ? <SeloBloqueado motivo={item.tipo === 'experimento' ? item.motivoBloqueio : null} /> : <span className="text-beon-muted/60">—</span>
    case 'iniciativa':
      return <span className="line-clamp-2 min-w-[160px] max-w-[260px]">{valor}</span>
    default:
      return <span title={valor} className={cx('block max-w-[200px] truncate', valor === '—' && 'text-beon-muted/60')}>{valor}</span>
  }
}

export function Lista({ itens, entidade, estado, ctx, onOrdenar, onAbrir }: {
  itens: ItemPortfolio[]
  entidade: Entidade
  estado: EstadoPortfolio
  ctx: Contexto
  onOrdenar: (o: OrdemId) => void
  onAbrir: (item: ItemPortfolio) => void
}) {
  const colunas = colunasVisiveis(estado, entidade)
  const grupos = estado.agrupar ? agrupar(itens, estado.agrupar, ctx) : [{ valor: '', itens }]

  return (
    <div className="h-full min-h-0 overflow-auto px-4 pb-6 pt-3 sm:px-6">
      {/* overflow-clip (e não hidden) para o cabeçalho continuar fixo na rolagem do contêiner de fora. */}
      <div className="w-max min-w-full overflow-clip rounded-2xl border border-beon-line bg-white">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-beon-line">
              {colunas.map(c => (
                <th key={c.id} scope="col" className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-beon-muted">
                  {c.ordem ? (
                    <button type="button" onClick={() => onOrdenar(c.ordem!)} className={cx('inline-flex items-center gap-1 uppercase tracking-wide hover:text-beon-ink', estado.ordem === c.ordem && 'text-beon-ink', focusRing)}>
                      {c.label}
                      {estado.ordem === c.ordem && <ArrowDown className="h-3 w-3" aria-label="ordenado" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map(g => (
              <GrupoLinhas key={g.valor} grupo={g} rotulo={estado.agrupar ? CAMPO.get(estado.agrupar)?.label : undefined} colunas={colunas} ctx={ctx} onAbrir={onAbrir} />
            ))}
            {itens.length === 0 && (
              <tr><td colSpan={colunas.length} className="px-4 py-12 text-center text-sm text-beon-muted">Nenhum item com os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GrupoLinhas({ grupo, rotulo, colunas, ctx, onAbrir }: {
  grupo: { valor: string; itens: ItemPortfolio[] }
  rotulo?: string
  colunas: ReturnType<typeof colunasVisiveis>
  ctx: Contexto
  onAbrir: (item: ItemPortfolio) => void
}) {
  const soma = grupo.itens.reduce((s, i) => s + (i.beneficio ?? 0), 0)
  return (
    <>
      {rotulo && (
        <tr className="border-b border-beon-line bg-beon-soft">
          <th colSpan={colunas.length} scope="rowgroup" className="px-3 py-2 text-left text-[13px] font-normal">
            <span className="text-beon-muted">{rotulo}:</span> <span className="font-semibold text-beon-ink">{grupo.valor}</span>
            <span className="tabular-nums text-beon-muted"> · {grupo.itens.length} · {formatarValor(soma)}</span>
          </th>
        </tr>
      )}
      {grupo.itens.map(item => (
        <tr
          key={item.key}
          tabIndex={0}
          onClick={() => onAbrir(item)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(item) } }}
          className="cursor-pointer border-b border-beon-line/70 align-top text-beon-body last:border-0 hover:bg-beon-soft focus:bg-beon-soft focus:outline-none"
        >
          {colunas.map(c => (
            <td key={c.id} className="px-3 py-2.5"><Celula id={c.id} item={item} ctx={ctx} valor={c.valor(item, ctx)} /></td>
          ))}
        </tr>
      ))}
    </>
  )
}
