'use client'

// Peças da aba Portfólio: popover, lista de opções de filtro com contagem, selos de situação e bloqueio.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Search } from 'lucide-react'
import { cx, focusRing } from '@/components/ui'
import { SITUACAO_LABEL, type Situacao } from '@/lib/portfolio/tipos'
import { corDoLab } from '@/lib/semanal-deck'

export const COR_SITUACAO: Record<Situacao, string> = {
  'nao-iniciado': '#A8A29E',
  'em-execucao': '#2563EB',
  concluido: '#15803D',
  cancelado: '#57534E',
}

export function PontoSituacao({ situacao, className }: { situacao: Situacao; className?: string }) {
  return (
    <span
      className={cx('inline-block h-2 w-2 shrink-0 rounded-full', className)}
      style={{ background: COR_SITUACAO[situacao] }}
      title={SITUACAO_LABEL[situacao]}
      aria-hidden
    />
  )
}

export function Lab({ nome, className }: { nome: string | null; className?: string }) {
  if (!nome) return <span className={cx('text-beon-muted/70', className)}>—</span>
  return (
    <span className={cx('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: corDoLab(nome) }} aria-hidden />
      <span className="truncate">{nome}</span>
    </span>
  )
}

export function SeloBloqueado({ motivo }: { motivo?: string | null }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
      title={motivo ? `Bloqueado: ${motivo}` : 'Bloqueado'}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
      <span className="truncate">{motivo || 'Bloqueado'}</span>
    </span>
  )
}

/** Popover ancorado num botão (no celular, uma folha presa embaixo da tela): fecha com Esc ou clique fora. */
export function Popover({ botao, children, alinhar = 'esquerda', largura = 300, rotulo }: {
  botao: (p: { aberto: boolean; alternar: () => void }) => ReactNode
  children: (fechar: () => void) => ReactNode
  alinhar?: 'esquerda' | 'direita'
  largura?: number
  rotulo: string
}) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])
  return (
    <div ref={ref} className="relative">
      {botao({ aberto, alternar: () => setAberto(a => !a) })}
      {aberto && (
        <div
          role="dialog"
          aria-label={rotulo}
          className={cx(
            'absolute top-full z-40 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl border border-beon-line bg-white p-2 shadow-xl',
            'max-sm:fixed max-sm:inset-x-3 max-sm:bottom-20 max-sm:top-auto max-sm:max-h-[70dvh] max-sm:!w-auto max-sm:max-w-none max-sm:overflow-y-auto',
            alinhar === 'direita' ? 'right-0' : 'left-0',
          )}
          style={{ width: largura }}
        >
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  )
}

/** Opções de um filtro, com a contagem de itens de cada uma e busca quando a lista é longa. */
export function Opcoes({ facetas, marcados, onAlternar, onLimpar, altura = 280 }: {
  /** Valores com a quantidade de itens (sem `n`, a contagem não aparece). */
  facetas: { valor: string; n?: number }[]
  marcados: string[]
  onAlternar: (valor: string) => void
  onLimpar?: () => void
  altura?: number
}) {
  const [termo, setTermo] = useState('')
  const visiveis = useMemo(() => {
    const t = termo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return t ? facetas.filter(f => f.valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t)) : facetas
  }, [facetas, termo])

  if (facetas.length === 0) return <p className="px-2 py-3 text-sm text-beon-muted">Nenhum valor para os itens desta visão.</p>

  return (
    <div>
      {facetas.length > 8 && (
        <label className="mb-1 flex items-center gap-2 rounded-xl border border-beon-line px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-beon-muted" aria-hidden />
          <input
            value={termo}
            onChange={e => setTermo(e.target.value)}
            placeholder="Procurar valor"
            aria-label="Procurar valor"
            className="w-full bg-transparent text-sm text-beon-ink placeholder:text-beon-muted/80 focus:outline-none"
          />
        </label>
      )}
      <ul className="overflow-y-auto" style={{ maxHeight: altura }}>
        {visiveis.map(f => {
          const marcado = marcados.includes(f.valor)
          return (
            <li key={f.valor}>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={marcado}
                onClick={() => onAlternar(f.valor)}
                className={cx(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-beon-soft',
                  f.n === 0 && !marcado && 'opacity-50', focusRing,
                )}
              >
                <span className={cx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  marcado ? 'border-beon-ink bg-beon-ink text-white' : 'border-stone-300 bg-white',
                )}>
                  {marcado && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 truncate text-beon-ink">{f.valor}</span>
                {f.n !== undefined && <span className="text-xs tabular-nums text-beon-muted">{f.n}</span>}
              </button>
            </li>
          )
        })}
        {visiveis.length === 0 && <li className="px-2 py-2 text-sm text-beon-muted">Nada com “{termo}”.</li>}
      </ul>
      {onLimpar && marcados.length > 0 && (
        <div className="mt-1 border-t border-beon-line pt-1">
          <button type="button" onClick={onLimpar} className={cx('rounded-lg px-2 py-1.5 text-sm font-medium text-beon-red hover:bg-beon-tint', focusRing)}>
            Limpar seleção
          </button>
        </div>
      )}
    </div>
  )
}

export const botaoBarra = (ativo?: boolean) => cx(
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors',
  ativo ? 'border-beon-ink bg-beon-ink text-white' : 'border-beon-line bg-white text-beon-body hover:border-stone-300 hover:text-beon-ink',
  focusRing,
)
