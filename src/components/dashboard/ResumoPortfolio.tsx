'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa } from '@/lib/types'
import { formatBRL, getPipelineStage } from '@/lib/mappers'
import { TrendingUp, Zap, Rocket, ArrowUpRight, Eye } from 'lucide-react'
import IniciativaModal from './IniciativaModal'

interface Props { data: DashboardData }

export default function ResumoPortfolio({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ title: string; items: Iniciativa[] } | null>(null)

  const totalIniciativas = data.iniciativas.length
  const escaladoIniciativas = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
  const emPilotoIniciativas = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM PILOTO')
  const emExperimentacao = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM EXPERIMENTAÇÃO')

  // Métricas calculadas
  const taxaEscala = totalIniciativas > 0
    ? `${Math.round((escaladoIniciativas.length / totalIniciativas) * 100)}%`
    : '0%'
  const taxaPiloto = totalIniciativas > 0
    ? `${Math.round(((emPilotoIniciativas.length + escaladoIniciativas.length) / totalIniciativas) * 100)}%`
    : '0%'

  const cards = [
    {
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-100',
      value: formatBRL(data.beneficioTotal),
      label: 'Benefício Potencial',
      subtitle: 'Valor total do portfólio',
      items: escaladoIniciativas,
      itemLabel: 'Iniciativas em escala',
    },
    {
      icon: Rocket,
      gradient: 'from-red-500 to-red-700',
      bgLight: 'bg-red-50',
      borderLight: 'border-red-100',
      value: taxaEscala,
      label: 'Conversão p/ Escala',
      subtitle: `${escaladoIniciativas.length} de ${totalIniciativas} iniciativas`,
      items: escaladoIniciativas,
      itemLabel: 'Iniciativas em escala',
    },
    {
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-100',
      value: taxaPiloto,
      label: 'Conversão p/ Piloto',
      subtitle: `${emPilotoIniciativas.length + escaladoIniciativas.length} de ${totalIniciativas} iniciativas`,
      items: [...emPilotoIniciativas, ...escaladoIniciativas],
      itemLabel: 'Iniciativas em piloto/escala',
    },
  ]

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 rounded-full" style={{ background: '#CC0000' }} />
            <div>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Resumo do Portfólio
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Pipeline de inovação • {totalIniciativas} iniciativas (board 2706)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelected({ title: 'Todas as Iniciativas', items: data.iniciativas })
              setOpen(true)
            }}
            className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Eye size={12} />
            Ver todas
          </button>
        </div>

        {/* Cards */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-md cursor-pointer group ${card.bgLight} ${card.borderLight}`}
              onClick={() => {
                if (card.items.length > 0) {
                  setSelected({ title: card.itemLabel, items: card.items })
                  setOpen(true)
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 bg-gradient-to-br ${card.gradient} shadow-sm`}>
                    <card.icon size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
                {card.items.length > 0 && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-medium text-gray-400">
                      {card.items.length}
                    </span>
                    <ArrowUpRight size={12} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Mini progress bar */}
              {card.label === 'Conversão p/ Escala' && (
                <div className="mt-3 pt-3 border-t border-red-100/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-400">Progresso para escala</span>
                    <span className="text-[9px] font-semibold text-red-600">{card.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                      style={{
                        width: totalIniciativas > 0
                          ? `${Math.round((escaladoIniciativas.length / totalIniciativas) * 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              )}

              {card.label === 'Conversão p/ Piloto' && (
                <div className="mt-3 pt-3 border-t border-amber-100/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-400">Progresso para piloto</span>
                    <span className="text-[9px] font-semibold text-amber-600">{card.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: totalIniciativas > 0
                          ? `${Math.round(((emPilotoIniciativas.length + escaladoIniciativas.length) / totalIniciativas) * 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              )}

              {card.label === 'Benefício Potencial' && (
                <div className="mt-3 pt-3 border-t border-emerald-100/60">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] text-gray-400">Em experimentação</span>
                      <p className="text-xs font-bold text-emerald-700">{emExperimentacao.length}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400">Em piloto</span>
                      <p className="text-xs font-bold text-amber-700">{emPilotoIniciativas.length}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400">Em escala</span>
                      <p className="text-xs font-bold text-red-700">{escaladoIniciativas.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {open && selected && (
        <IniciativaModal
          title={selected.title}
          iniciativas={selected.items}
          onClose={() => {
            setOpen(false)
            setSelected(null)
          }}
        />
      )}
    </>
  )
}
