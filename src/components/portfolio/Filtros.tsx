'use client'

// Filtros do Portfólio: os rápidos na barra, o painel com todos os campos dos dois boards e as
// etiquetas dos filtros ativos.

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info, SlidersHorizontal, X } from 'lucide-react'
import { Button, cx, focusRing, IconButton } from '@/components/ui'
import {
  aplicaA, CAMPO, CAMPOS, facetas, GRUPOS, totalDeFiltros, type Contexto, type EstadoPortfolio,
} from '@/lib/portfolio/filtros'
import type { Entidade, ItemPortfolio } from '@/lib/portfolio/tipos'
import { Opcoes, Popover, botaoBarra } from './Comum'

interface Base {
  itens: ItemPortfolio[]
  entidade: Entidade
  estado: EstadoPortfolio
  ctx: Contexto
  onAlternar: (campo: string, valor: string) => void
  onLimparCampo: (campo: string) => void
}

export function FiltroRapido({ campoId, ...p }: Base & { campoId: string }) {
  const campo = CAMPO.get(campoId)!
  const marcados = p.estado.filtros[campoId] ?? []
  const rotulo = marcados.length === 0 ? campo.label : marcados.length === 1 ? `${campo.label}: ${marcados[0]}` : `${campo.label}: ${marcados[0]} +${marcados.length - 1}`
  return (
    <Popover
      rotulo={`Filtrar por ${campo.label}`}
      botao={({ aberto, alternar }) => (
        <button type="button" onClick={alternar} aria-expanded={aberto} className={cx(botaoBarra(marcados.length > 0), 'max-w-[240px]')}>
          <span className="truncate">{rotulo}</span>
          <ChevronDown className={cx('h-3.5 w-3.5 shrink-0 transition', aberto && 'rotate-180')} aria-hidden />
        </button>
      )}
    >
      {() => <ConteudoCampo campoId={campoId} {...p} />}
    </Popover>
  )
}

function ConteudoCampo({ campoId, itens, entidade, estado, ctx, onAlternar, onLimparCampo, altura }: Base & { campoId: string; altura?: number }) {
  const lista = useMemo(() => facetas(itens, entidade, estado, ctx, campoId), [itens, entidade, estado, ctx, campoId])
  const campo = CAMPO.get(campoId)!
  const nota = entidade === 'iniciativa' && campo.viaExperimentos
    ? 'Considera os experimentos de cada iniciativa.'
    : entidade === 'experimento' && campo.viaIniciativa ? 'Considera a iniciativa-mãe de cada experimento.' : null
  return (
    <div>
      {nota && <p className="flex items-center gap-1.5 px-2 pb-1.5 text-xs text-beon-muted"><Info className="h-3 w-3" aria-hidden />{nota}</p>}
      <Opcoes
        facetas={lista}
        marcados={estado.filtros[campoId] ?? []}
        onAlternar={v => onAlternar(campoId, v)}
        onLimpar={() => onLimparCampo(campoId)}
        altura={altura}
      />
    </div>
  )
}

/** Painel lateral com todos os campos filtráveis, por grupo. */
export function PainelFiltros({ aberto, onFechar, onLimparTudo, total, ...p }: Base & {
  aberto: boolean
  onFechar: () => void
  onLimparTudo: () => void
  /** Itens que passam pelos filtros atuais. */
  total: number
}) {
  const [abertos, setAbertos] = useState<string[]>([])
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [aberto, onFechar])
  if (!aberto) return null

  const campos = CAMPOS.filter(c => aplicaA(c, p.entidade))
  const alternar = (id: string) => setAbertos(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fechar filtros" onClick={onFechar} className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" />
      <div role="dialog" aria-modal="true" aria-labelledby="filtros-titulo" className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-beon-line px-6 py-4">
          <div>
            <h2 id="filtros-titulo" className="text-lg font-semibold tracking-tight text-beon-ink">Todos os filtros</h2>
            <p className="mt-0.5 text-sm text-beon-muted">
              Campos dos boards de Ideação e de Experimentação. Valores do mesmo campo somam; campos diferentes se combinam.
            </p>
          </div>
          <IconButton icon={X} label="Fechar" onClick={onFechar} className="-mr-2" />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {GRUPOS.map(g => {
            const doGrupo = campos.filter(c => c.grupo === g)
            if (!doGrupo.length) return null
            return (
              <section key={g} className="mb-2">
                <h3 className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{g}</h3>
                {doGrupo.map(c => {
                  const n = (p.estado.filtros[c.id] ?? []).length
                  const exp = abertos.includes(c.id) || n > 0
                  return (
                    <div key={c.id} className="rounded-xl">
                      <button
                        type="button"
                        onClick={() => alternar(c.id)}
                        aria-expanded={exp}
                        className={cx('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-beon-soft', focusRing)}
                      >
                        <span className="flex-1 font-medium text-beon-ink">{c.label}</span>
                        {n > 0 && <span className="rounded-full bg-beon-ink px-1.5 text-[11px] font-semibold text-white">{n}</span>}
                        <ChevronDown className={cx('h-4 w-4 text-beon-muted transition', exp && 'rotate-180')} aria-hidden />
                      </button>
                      {exp && <div className="px-1 pb-2"><ConteudoCampo campoId={c.id} altura={220} {...p} /></div>}
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-beon-line px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onLimparTudo} disabled={totalDeFiltros(p.estado) === 0}>Limpar tudo</Button>
          <Button variant="primary" size="sm" onClick={onFechar}>Ver {total} {total === 1 ? 'resultado' : 'resultados'}</Button>
        </footer>
      </div>
    </div>
  )
}

export function BotaoTodosFiltros({ estado, rapidos, onAbrir }: { estado: EstadoPortfolio; rapidos: string[]; onAbrir: () => void }) {
  const outros = Object.entries(estado.filtros).filter(([id]) => !rapidos.includes(id)).reduce((s, [, v]) => s + v.length, 0)
  return (
    <button type="button" onClick={onAbrir} className={botaoBarra(outros > 0)}>
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      Todos os filtros
      {outros > 0 && <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-beon-ink">{outros}</span>}
    </button>
  )
}

/** Etiquetas dos filtros ativos (os da barra rápida já aparecem nos próprios botões). */
export function FiltrosAtivos({ estado, entidade, rapidos, onAlternar, onLimparTudo, onLimparBusca }: {
  estado: EstadoPortfolio
  entidade: Entidade
  rapidos: string[]
  onAlternar: (campo: string, valor: string) => void
  onLimparTudo: () => void
  onLimparBusca: () => void
}) {
  const etiquetas = Object.entries(estado.filtros)
    .filter(([id]) => !rapidos.includes(id))
    .flatMap(([id, valores]) => valores.map(v => ({ id, v, campo: CAMPO.get(id)! })))
  const temAlgo = totalDeFiltros(estado) > 0 || !!estado.busca.trim()
  if (!temAlgo) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {estado.busca.trim() && (
        <Etiqueta texto={`Busca: “${estado.busca.trim()}”`} onRemover={onLimparBusca} />
      )}
      {etiquetas.map(({ id, v, campo }) => (
        <Etiqueta
          key={`${id}:${v}`}
          texto={`${campo.label}: ${v}`}
          inativa={!aplicaA(campo, entidade)}
          onRemover={() => onAlternar(id, v)}
        />
      ))}
      <button type="button" onClick={onLimparTudo} className={cx('rounded-full px-2 py-1 text-[13px] font-medium text-beon-red hover:bg-beon-tint', focusRing)}>
        Limpar tudo
      </button>
    </div>
  )
}

function Etiqueta({ texto, onRemover, inativa }: { texto: string; onRemover: () => void; inativa?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex h-7 max-w-[320px] items-center gap-1 rounded-full pl-2.5 pr-1 text-[12.5px] ring-1 ring-inset',
        inativa ? 'bg-white text-beon-muted ring-dashed ring-beon-line' : 'bg-beon-tint text-beon-ink ring-beon-red/15',
      )}
      title={inativa ? 'Este filtro não se aplica a esta visão' : undefined}
    >
      <span className="truncate">{texto}</span>
      <button type="button" onClick={onRemover} aria-label={`Remover ${texto}`} className={cx('rounded-full p-0.5 hover:bg-black/5', focusRing)}>
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  )
}
