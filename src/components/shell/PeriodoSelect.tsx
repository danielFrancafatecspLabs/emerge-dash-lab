'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { getPeriodoLabel, getPeriodoOpcoes, type PeriodoFiltro } from '@/lib/periodo-filter'
import { cx, focusRing } from '@/components/ui'

function mesmoPeriodo(a: PeriodoFiltro, b: PeriodoFiltro) {
  if (a.tipo !== b.tipo) return false
  if (a.tipo === 'semestre' && b.tipo === 'semestre') return a.ano === b.ano && a.semestre === b.semestre
  if (a.tipo === 'ano' && b.tipo === 'ano') return a.ano === b.ano
  return true
}

/** Seletor de período da barra superior do portal. */
export function PeriodoSelect({ value, onChange }: { value: PeriodoFiltro; onChange: (p: PeriodoFiltro) => void }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => { document.removeEventListener('mousedown', fechar); document.removeEventListener('keydown', fechar) }
  }, [aberto])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={cx('flex h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3.5 text-sm font-medium text-beon-ink hover:bg-beon-soft', focusRing)}
      >
        <CalendarRange className="h-4 w-4 text-beon-muted" aria-hidden />
        <span className="hidden sm:inline">{getPeriodoLabel(value)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-beon-muted" aria-hidden />
      </button>
      {aberto && (
        <ul role="listbox" aria-label="Período" className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-beon-line bg-white p-1.5 shadow-xl">
          {getPeriodoOpcoes().map(opcao => {
            const ativo = mesmoPeriodo(opcao.value, value)
            return (
              <li key={opcao.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  onClick={() => { onChange(opcao.value); setAberto(false) }}
                  className={cx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm',
                    ativo ? 'bg-beon-tint font-semibold text-beon-red' : 'text-beon-body hover:bg-beon-soft hover:text-beon-ink',
                    focusRing,
                  )}
                >
                  {opcao.label}
                  {ativo && <Check className="h-4 w-4" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
