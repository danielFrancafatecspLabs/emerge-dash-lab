'use client'

import { DashboardData } from '@/lib/types'
import { TrendingDown } from 'lucide-react'

interface Props { data: DashboardData }

export default function FunilExperimentos({ data }: Props) {
  // Total de experimentos excluindo cancelados (status 10015)
  const totalExperimentos = data.allEpics.filter(e => e.status?.id !== '10015').length
  // Experimentos concluídos = Epics do board 2707 com status 10003 (FINALIZADO)
  const concluidos = data.allEpics.filter(e => e.status?.id === '10003').length
  const emPilotoEscala = data.pipeline['EM PILOTO'] + data.pipeline['EM ESCALA']
  const emEscala = data.pipeline['EM ESCALA']

  const conversaoConcluidos = totalExperimentos > 0
    ? Math.round((concluidos / totalExperimentos) * 100)
    : 0
  const conversaoPiloto = totalExperimentos > 0
    ? Math.round((emPilotoEscala / totalExperimentos) * 100)
    : 0
  const conversaoEscala = totalExperimentos > 0
    ? Math.round((emEscala / totalExperimentos) * 100)
    : 0

  const camadas = [
    { label: 'Total de Experimentos', valor: totalExperimentos, pct: 100, cor: '#DC2626' },
    { label: 'Concluídos', valor: concluidos, pct: conversaoConcluidos, cor: '#6B7280' },
    { label: 'Pilotos', valor: emPilotoEscala, pct: conversaoPiloto, cor: '#F59E0B' },
    { label: 'Escala', valor: emEscala, pct: conversaoEscala, cor: '#F59E0B' },
  ]

  const maxValor = Math.max(...camadas.map(c => c.valor), 1)

  return (
    <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 h-full flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <TrendingDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Funil de Experimentos
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3 min-h-0">
        {camadas.map((camada, i) => {
          const largura = maxValor > 0 ? (camada.valor / maxValor) * 100 : 0

          return (
            <div key={camada.label} className="flex flex-col items-center">
              {/* Barra horizontal */}
              <div className="w-full flex items-center gap-2">
                <span
                  className="text-xs font-medium text-gray-600 w-20 md:w-24 text-right flex-shrink-0 truncate"
                >
                  {camada.label}
                </span>
                <div className="flex-1 relative h-8 min-w-0">
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-full rounded-md transition-all duration-500 flex items-center justify-center min-w-[40px]"
                    style={{
                      width: `${Math.max(largura, 8)}%`,
                      maxWidth: '100%',
                      background: camada.cor,
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-white font-bold text-sm drop-shadow-sm whitespace-nowrap">
                      {camada.valor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seta de conversão entre camadas */}
              {i < camadas.length - 1 && (
                <div className="flex items-center gap-1 py-0.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-400">
                    <path d="M6 1 L6 9 M3 7 L6 10 L9 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {camadas[i + 1].pct}% de conversão
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}