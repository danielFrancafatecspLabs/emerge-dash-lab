'use client'

import { DashboardData } from '@/lib/types'

interface Props { data: DashboardData }

export default function FunilExperimentos({ data }: Props) {
  // ── Board de Experimentação (2735) — Epics ──
  const totalExperimentos = data.allEpics.length
  const cancelados = data.allEpics.filter(e =>
    e.status?.id === '10015' || e.status?.name === 'Cancelado'
  ).length
  const emAndamento = data.allEpics.filter(e =>
    e.status?.id === '3' || e.status?.name === 'Em andamento'
  ).length
  const emValidacao = data.allEpics.filter(e =>
    e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'
  ).length
  const concluidos = data.allEpics.filter(e =>
    e.status?.id === '10003' || e.status?.id === '10019' || e.status?.name === 'Concluído'
  ).length

  // ── Board de Iniciativas (2734) — Pipeline ──
  const pilotos = data.pipeline['EM PILOTO']
  const escala = data.pipeline['EM ESCALA']

  // ── Conversão entre etapas (taxa de avanço) ──
  const taxaCancelamento = totalExperimentos > 0
    ? Math.round((cancelados / totalExperimentos) * 100)
    : 0
  const taxaAndamento = totalExperimentos > 0
    ? Math.round((emAndamento / totalExperimentos) * 100)
    : 0
  const taxaValidacao = emAndamento > 0
    ? Math.round((emValidacao / emAndamento) * 100)
    : 0
  const taxaConclusao = emValidacao > 0
    ? Math.round((concluidos / emValidacao) * 100)
    : 0
  const taxaPiloto = concluidos > 0
    ? Math.round((pilotos / concluidos) * 100)
    : 0
  const taxaEscala = pilotos > 0
    ? Math.round((escala / pilotos) * 100)
    : 0

  const camadas = [
    { label: 'Total de Experimentos', valor: totalExperimentos, pct: 100, cor: '#3B82F6' },
    { label: 'Cancelados', valor: cancelados, pct: taxaCancelamento, cor: '#EF4444' },
    { label: 'Em Andamento', valor: emAndamento, pct: taxaAndamento, cor: '#F59E0B' },
    { label: 'Em Validação', valor: emValidacao, pct: taxaValidacao, cor: '#8B5CF6' },
    { label: 'Concluídos', valor: concluidos, pct: taxaConclusao, cor: '#6B7280' },
    { label: 'Pilotos', valor: pilotos, pct: taxaPiloto, cor: '#16A34A' },
    { label: 'Escala', valor: escala, pct: taxaEscala, cor: '#22C55E' },
  ]

  const maxValor = Math.max(...camadas.map(c => c.valor), 1)

  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      {camadas.map((camada, i) => {
        const largura = maxValor > 0 ? (camada.valor / maxValor) * 100 : 0

        return (
          <div key={camada.label} className="flex flex-col items-center">
            {/* Barra horizontal */}
            <div className="w-full flex items-center gap-2">
              <span
                className="text-[11px] font-medium text-gray-600 w-28 md:w-32 text-right flex-shrink-0 leading-tight"
              >
                {camada.label}
              </span>
              <div className="flex-1 relative h-7 min-w-0">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-full rounded-md transition-all duration-500 flex items-center justify-center min-w-[36px]"
                  style={{
                    width: `${Math.max(largura, 8)}%`,
                    maxWidth: '100%',
                    background: camada.cor,
                    opacity: 0.85,
                  }}
                >
                  <span className="text-white font-bold text-xs drop-shadow-sm whitespace-nowrap">
                    {camada.valor}
                  </span>
                </div>
              </div>
            </div>

            {/* Seta de conversão entre camadas */}
            {i < camadas.length - 1 && (
              <div className="flex items-center gap-1 py-0.5">
                <svg width="10" height="10" viewBox="0 0 12 12" className="text-gray-400">
                  <path d="M6 1 L6 9 M3 7 L6 10 L9 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] text-gray-400 font-medium">
                  {camada.valor > 0
                    ? `${camadas[i + 1].pct}% → ${camadas[i + 1].label}`
                    : '—'
                  }
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}