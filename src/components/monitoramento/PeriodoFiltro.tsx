'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const PERIODOS = [
  { label: 'Últimos 12 meses', value: 'ultimos12' },
  { label: '1º Semestre 2025', value: '1s2025' },
  { label: '2º Semestre 2025', value: '2s2025' },
  { label: '1º Semestre 2026', value: '1s2026' },
  { label: '2º Semestre 2026', value: '2s2026' },
  { label: 'Tudo', value: 'tudo' },
]

function valueToLabel(value: string): string {
  return PERIODOS.find(p => p.value === value)?.label ?? 'Últimos 12 meses'
}

export default function PeriodoFiltro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const periodoAtual = searchParams.get('periodo') ?? 'ultimos12'

  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selecionar(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ultimos12') {
      params.delete('periodo')
    } else {
      params.set('periodo', value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
    setAberto(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                   bg-red-50 border border-red-200 text-red-700 hover:border-red-300 hover:bg-red-100"
      >
        {valueToLabel(periodoAtual)}
        <ChevronDown size={12} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
          {PERIODOS.map(p => (
            <button
              key={p.value}
              onClick={() => selecionar(p.value)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors
                ${periodoAtual === p.value
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}