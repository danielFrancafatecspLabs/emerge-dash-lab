'use client'

import { useState, useRef, useEffect } from 'react'
import { Radio, ChevronDown } from 'lucide-react'
import LogoutButton from './LogoutButton'
import RefreshButton from './RefreshButton'
import { PeriodoFiltro, getPeriodoOpcoes, getPeriodoLabel } from '@/lib/periodo-filter'

interface HeaderProps {
  periodoSelecionado?: PeriodoFiltro
  onPeriodoChange?: (periodo: PeriodoFiltro) => void
}

export default function Header({ periodoSelecionado = { tipo: 'ultimos12' }, onPeriodoChange = () => {} }: HeaderProps) {
  const [aberto, setAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const opcoes = getPeriodoOpcoes()
  const labelAtual = getPeriodoLabel(periodoSelecionado)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  return (
    <header
      className="flex items-center justify-between px-5 py-3"
      style={{ background: '#8B0000', minHeight: 52 }}
    >
      <div className="flex items-center gap-3">
        <Radio size={20} color="white" />
        <h1 className="text-white font-bold tracking-wide" style={{ fontSize: 15, letterSpacing: '0.08em' }}>
          DASHBOARD BEON LABS
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/80 text-xs">Visão Geral do Portfólio</span>

        {/* ── Dropdown de período ── */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setAberto(!aberto)}
            className="text-xs font-semibold px-3 py-1 rounded border border-white/40 text-white flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {labelAtual}
            <ChevronDown size={12} />
          </button>

          {aberto && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              style={{ background: 'white' }}
            >
              {opcoes.map((opcao) => {
                const isAtivo =
                  opcao.value.tipo === periodoSelecionado.tipo &&
                  (opcao.value.tipo === 'ultimos12' || opcao.value.tipo === 'tudo' ||
                    (opcao.value.tipo === 'semestre' && periodoSelecionado.tipo === 'semestre' &&
                      opcao.value.ano === periodoSelecionado.ano && opcao.value.semestre === periodoSelecionado.semestre) ||
                    (opcao.value.tipo === 'ano' && periodoSelecionado.tipo === 'ano' &&
                      opcao.value.ano === periodoSelecionado.ano))

                return (
                  <button
                    key={opcao.label}
                    onClick={() => {
                      onPeriodoChange(opcao.value)
                      setAberto(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      isAtivo
                        ? 'font-bold text-red-700 bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {opcao.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <RefreshButton />
        <LogoutButton />
      </div>
    </header>
  )
}
