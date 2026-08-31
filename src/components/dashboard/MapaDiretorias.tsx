'use client'

import { useMemo, useState } from 'react'
import { formatBRL } from '@/lib/mappers'
import type { EpicDetail } from '@/lib/types'
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react'

// ── Cores para as barras ──
const BARRAS_CORES = [
  '#CC0000', '#DC2626', '#Ef4444', '#F87171', '#FCA5A5',
  '#9D174D', '#DB2777', '#F472B6',
  '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA',
  '#047857', '#059669', '#10B981', '#34D399',
  '#B45309', '#D97706', '#F59E0B',
]

interface DominioAgregado {
  nome: string
  qtdExperimentos: number
  valorPotencial: number
}

interface Props {
  epics: EpicDetail[]
}

const LIMITE_VISIVEL = 10 // mostra até o 10º item (Comercial), esconde o resto

export default function MapaDiretorias({ epics }: Props) {
  const [expandido, setExpandido] = useState(false)

  const { linhas, maxExp, totalInvestido, totalExperimentos } = useMemo(() => {
    const map = new Map<string, DominioAgregado>()
    for (const e of epics) {
      const nome = e.dominio || 'Sem domínio'
      if (!map.has(nome)) {
        map.set(nome, { nome, qtdExperimentos: 0, valorPotencial: 0 })
      }
      const d = map.get(nome)!
      d.qtdExperimentos++
      d.valorPotencial += e.beneficioQuantitativo ?? 0
    }

    // Ordenar por qtd de experimentos (decrescente) — apenas quem tem > 0
    const sorted = Array.from(map.values())
      .filter(d => d.qtdExperimentos > 0)
      .sort((a, b) => b.qtdExperimentos - a.qtdExperimentos)

    const maxE = sorted.length > 0 ? Math.max(...sorted.map(d => d.qtdExperimentos)) : 1
    const totalInv = sorted.reduce((s, d) => s + d.valorPotencial, 0)
    const totalExp = sorted.reduce((s, d) => s + d.qtdExperimentos, 0)

    return { linhas: sorted, maxExp: maxE, totalInvestido: totalInv, totalExperimentos: totalExp }
  }, [epics])

  if (!epics || epics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2" style={{ padding: 32 }}>
        <BarChart3 size={32} strokeWidth={1} />
        <p className="text-sm">Nenhum experimento encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 h-full">
      {/* Cabeçalho com totalizador */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums px-0.5">
        <span>Diretoria / Domínio</span>
        <div className="flex items-center gap-3">
          <span>Experimentos</span>
          <span style={{ width: 72, textAlign: 'right' }}>Benefício Pot.</span>
        </div>
      </div>

      {/* Barras — scroll se necessário */}
      <div className="flex-1 overflow-y-auto space-y-1" style={{ minHeight: 0 }}>
        {(expandido ? linhas : linhas.slice(0, LIMITE_VISIVEL)).map((d, i) => {
          const pct = maxExp > 0 ? (d.qtdExperimentos / maxExp) * 100 : 0
          const cor = BARRAS_CORES[i % BARRAS_CORES.length]

          return (
            <div key={d.nome} className="flex items-center gap-2">
              {/* Nome da diretoria */}
              <span
                className="text-[11px] font-medium text-gray-700 truncate shrink-0"
                style={{ width: 100 }}
              >
                {d.nome}
              </span>

              {/* Barra de experimentos */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <div className="flex-1 h-3.5 rounded-sm bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{ width: `${Math.max(pct, 4)}%`, background: cor }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-gray-700 shrink-0" style={{ width: 24, textAlign: 'right' }}>
                  {d.qtdExperimentos}
                </span>
              </div>

              {/* Benefício potencial */}
              <span className="text-[11px] tabular-nums text-gray-500 shrink-0 text-right" style={{ width: 72 }}>
                {formatBRL(d.valorPotencial)}
              </span>
            </div>
          )
        })}

        {/* Botão Ver mais / Ver menos */}
        {linhas.length > LIMITE_VISIVEL && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="flex items-center justify-center gap-1 w-full py-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            {expandido ? (
              <>
                <ChevronUp size={14} /> Ver menos
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Ver mais ({linhas.length - LIMITE_VISIVEL} ocultos)
              </>
            )}
          </button>
        )}
      </div>

      {/* Totalizador */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] tabular-nums text-gray-500">
        <span>
          <strong className="text-gray-800">{totalExperimentos}</strong> experimentos
        </span>
        <span>
          <strong className="text-gray-800">{formatBRL(totalInvestido)}</strong> benefício potencial
        </span>
      </div>
    </div>
  )
}