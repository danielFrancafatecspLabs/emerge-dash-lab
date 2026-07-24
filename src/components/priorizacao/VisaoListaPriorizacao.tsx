'use client'

import { useMemo } from 'react'
import type { ExperimentoPriorizacao } from './PriorizacaoClient'
import { formatarMoeda } from './PriorizacaoClient'
import { TrendingUp, DollarSign, Layers, Target } from 'lucide-react'

// --------------- Tipos ---------------

interface Props {
  experimentos: ExperimentoPriorizacao[]
}

const ORDEM_PRIORIDADE: Record<string, number> = {
  'Highest': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
  'Lowest': 4,
}

const COR_PRIORIDADE: Record<string, string> = {
  'Highest': '#8B0000',
  'High': '#EF4444',
  'Medium': '#F97316',
  'Low': '#6B7280',
  'Lowest': '#9CA3AF',
}

const LABEL_PRIORIDADE: Record<string, string> = {
  'Highest': 'Highest',
  'High': 'High',
  'Medium': 'Medium',
  'Low': 'Low',
  'Lowest': 'Lowest',
}

const COR_COMPLEXIDADE: Record<string, string> = {
  'Alta': '#EF4444',
  'Média': '#F97316',
  'Baixa': '#22C55E',
}

// --------------- Componente ---------------

export default function VisaoListaPriorizacao({ experimentos }: Props) {
  const lista = useMemo(() => {
    return [...experimentos]
      .sort((a, b) => {
        const pa = ORDEM_PRIORIDADE[a.prioridade ?? ''] ?? 99
        const pb = ORDEM_PRIORIDADE[b.prioridade ?? ''] ?? 99
        if (pa !== pb) return pa - pb
        return (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)
      })
  }, [experimentos])

  // KPIs
  const kpis = useMemo(() => {
    const total = lista.length
    const comBeneficio = lista.filter(e => (e.beneficioQuantitativo ?? 0) > 0)
    const beneficioTotal = comBeneficio.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
    const highHighest = lista.filter(e => e.prioridade === 'Highest' || e.prioridade === 'High').length
    const dominios = new Set(lista.map(e => e.dominio).filter(Boolean))
    return { total, comBeneficio: comBeneficio.length, beneficioTotal, highHighest, dominios: dominios.size }
  }, [lista])

  if (lista.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhum experimento encontrado.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <Layers size={14} />
            Total
          </div>
          <div className="text-2xl font-bold text-gray-900">{kpis.total}</div>
          <div className="text-xs text-gray-400 mt-0.5">experimentos ativos</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <Target size={14} />
            Alta Prioridade
          </div>
          <div className="text-2xl font-bold" style={{ color: '#8B0000' }}>{kpis.highHighest}</div>
          <div className="text-xs text-gray-400 mt-0.5">Highest + High</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <DollarSign size={14} />
            Benefício Potencial
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatarMoeda(kpis.beneficioTotal)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{kpis.comBeneficio} com benefício mapeado</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <TrendingUp size={14} />
            Domínios
          </div>
          <div className="text-2xl font-bold text-gray-900">{kpis.dominios}</div>
          <div className="text-xs text-gray-400 mt-0.5">domínios distintos</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4 font-semibold w-12">#</th>
                <th className="py-3 px-4 font-semibold">Experimento</th>
                <th className="py-3 px-4 font-semibold">Prioridade</th>
                <th className="py-3 px-4 font-semibold">Domínio</th>
                <th className="py-3 px-4 font-semibold">Sponsor</th>
                <th className="py-3 px-4 font-semibold">Complexidade</th>
                <th className="py-3 px-4 font-semibold text-right">Benefício</th>
                <th className="py-3 px-4 font-semibold">Lab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map((exp, idx) => (
                <tr
                  key={exp.key}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Posição */}
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono tabular-nums">
                    {idx + 1}
                  </td>

                  {/* Nome */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 leading-tight">
                      {exp.nome}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {exp.key}
                      {exp.parentNome && (
                        <span> · {exp.parentKey}: {exp.parentNome}</span>
                      )}
                    </div>
                  </td>

                  {/* Prioridade */}
                  <td className="py-3 px-4">
                    {exp.prioridade ? (
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: COR_PRIORIDADE[exp.prioridade] ?? '#9CA3AF' }}
                      >
                        {LABEL_PRIORIDADE[exp.prioridade] ?? exp.prioridade}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Domínio */}
                  <td className="py-3 px-4">
                    {exp.dominio ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {exp.dominio}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Sponsor */}
                  <td className="py-3 px-4 text-gray-700">
                    {exp.sponsor ?? <span className="text-gray-300">—</span>}
                  </td>

                  {/* Complexidade */}
                  <td className="py-3 px-4">
                    {exp.complexidade ? (
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          color: COR_COMPLEXIDADE[exp.complexidade] ?? '#6B7280',
                          background: `${COR_COMPLEXIDADE[exp.complexidade] ?? '#6B7280'}15`,
                        }}
                      >
                        {exp.complexidade}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Benefício */}
                  <td className="py-3 px-4 text-right font-mono text-sm tabular-nums">
                    {exp.beneficioQuantitativo != null && exp.beneficioQuantitativo > 0 ? (
                      <span className="font-semibold text-gray-900">
                        {formatarMoeda(exp.beneficioQuantitativo)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Lab */}
                  <td className="py-3 px-4">
                    {exp.timeResponsavel ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                        {exp.timeResponsavel}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
          {lista.length} experimentos
        </div>
      </div>
    </div>
  )
}