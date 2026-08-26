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

  // ── % sobre o total de experimentos (mesma base para todas as camadas) ──
  // Nota: Pilotos/Escala vêm do board de Iniciativas (2734), não do de Experimentos
  // (2735) — por isso são apresentados como % do total de experimentos, e não como
  // conversão sequencial entre etapas (que misturaria duas populações diferentes).
  const pct = (v: number) => totalExperimentos > 0 ? Math.round((v / totalExperimentos) * 100) : 0

  const camadas = [
    { label: 'Total de Experimentos', valor: totalExperimentos, pct: 100, cor: '#3B82F6' },
    { label: 'Cancelados', valor: cancelados, pct: pct(cancelados), cor: '#EF4444' },
    { label: 'Em Andamento', valor: emAndamento, pct: pct(emAndamento), cor: '#F59E0B' },
    { label: 'Em Validação', valor: emValidacao, pct: pct(emValidacao), cor: '#8B5CF6' },
    { label: 'Concluídos', valor: concluidos, pct: pct(concluidos), cor: '#6B7280' },
    { label: 'Pilotos', valor: pilotos, pct: pct(pilotos), cor: '#16A34A', nota: 'iniciativas' },
    { label: 'Escala', valor: escala, pct: pct(escala), cor: '#22C55E', nota: 'iniciativas' },
  ]

  const maxValor = Math.max(...camadas.map(c => c.valor), 1)

  return (
    <div className="flex flex-col gap-1 min-w-0 justify-center h-full">
      {camadas.map((camada, i) => {
        const largura = maxValor > 0 ? (camada.valor / maxValor) * 100 : 0

        return (
          <div key={camada.label} className="w-full flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-600 w-24 md:w-28 text-right flex-shrink-0 leading-tight">
              {camada.label}
              {camada.nota && <span className="block text-gray-300" style={{ fontSize: 8 }}>({camada.nota})</span>}
            </span>
            <div className="flex-1 relative h-4 min-w-0">
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-full rounded transition-all duration-500 flex items-center justify-center min-w-[26px]"
                style={{
                  width: `${Math.max(largura, 6)}%`,
                  maxWidth: '100%',
                  background: camada.cor,
                  opacity: i === 0 ? 1 : 0.85,
                }}
              >
                <span className="text-white font-bold drop-shadow-sm whitespace-nowrap" style={{ fontSize: 10 }}>
                  {camada.valor}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-semibold text-gray-400 w-8 text-right flex-shrink-0 tabular-nums">
              {i === 0 ? '' : `${camada.pct}%`}
            </span>
          </div>
        )
      })}
      <p className="text-gray-300 mt-0.5" style={{ fontSize: 8 }}>% em relação ao total de experimentos no período</p>
    </div>
  )
}