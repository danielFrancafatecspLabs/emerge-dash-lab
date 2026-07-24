'use client'

import { LeadTimeJornada, CycleTimeEstagio } from '@/lib/types'
import { Clock, AlertTriangle, Zap, Lock } from 'lucide-react'

interface Props {
  data: LeadTimeJornada
  cycleTimeExperimentacao: CycleTimeEstagio[]
}

export default function LeadTimeJornadaComponent({ data, cycleTimeExperimentacao }: Props) {
  const { totalDias, fases, bottleneck } = data

  // Filtra fases com 0 dias (ex: Piloto sem dados)
  const fasesVisiveis = fases.filter(f => f.dias > 0)

  if (totalDias <= 0 || fasesVisiveis.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Jornada de Adoção</p>
          <p className="text-xs mt-1">Dados insuficientes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Header do card (padrão) ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-red-500" />
          <h3 className="text-sm font-bold text-gray-800">Jornada de Adoção</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>Lead Time: <strong className="text-gray-700">{totalDias}d</strong></span>
        </div>
      </div>

      {/* ── Timeline compacta ── */}
      <div className="mb-3">
        {/* Blocos da timeline */}
        <div className="flex rounded-full overflow-hidden" style={{ height: 22 }}>
          {fasesVisiveis.map((fase, i) => {
            const widthPct = totalDias > 0 ? (fase.dias / totalDias) * 100 : 0
            return (
              <div
                key={fase.fase}
                className="flex items-center justify-center relative"
                style={{
                  width: `${widthPct}%`,
                  minWidth: widthPct < 5 ? `${widthPct}%` : undefined,
                  background: fase.destaque
                    ? `linear-gradient(135deg, #F59E0B 0%, #F97316 100%)`
                    : fase.cor,
                  borderRight: i < fasesVisiveis.length - 1 ? '2px solid white' : undefined,
                }}
                title={`${fase.fase}: ${fase.dias}d (${fase.pct}%)`}
              >
                {widthPct >= 12 && (
                  <span className="font-semibold truncate px-1 text-white" style={{ fontSize: 10 }}>
                    {fase.dias}d
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Labels abaixo dos blocos */}
        <div className="flex mt-1">
          {fasesVisiveis.map((fase) => {
            const widthPct = totalDias > 0 ? (fase.dias / totalDias) * 100 : 0
            return (
              <div
                key={fase.fase}
                className="flex flex-col items-center"
                style={{ width: `${widthPct}%`, minWidth: widthPct < 10 ? 'auto' : undefined }}
              >
                <span className="font-semibold truncate text-gray-500" style={{ fontSize: 9 }}>
                  {fase.fase}
                </span>
                <span className="text-gray-400" style={{ fontSize: 9 }}>
                  {fase.pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Grid inferior: 3 colunas ── */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Cycle Time por Complexidade */}
        <div className="rounded-lg p-2.5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <Zap size={11} style={{ color: '#F59E0B' }} />
            <p className="font-semibold text-gray-700" style={{ fontSize: 10 }}>Cycle Time de Experimentação</p>
          </div>
          <div className="space-y-1">
            {(cycleTimeExperimentacao ?? []).slice(0, 3).map((item) => {
              const porteMatch = item.label.match(/Porte ([PMG])/)
              const porte = porteMatch ? porteMatch[1] : null
              const labelMap: Record<string, string> = { 'P': 'Baixa', 'M': 'Média', 'G': 'Alta' }
              const corMap: Record<string, string> = { 'P': '#22C55E', 'M': '#F59E0B', 'G': '#EF4444' }
              return (
                <div key={item.estagio} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: porte ? corMap[porte] : '#888' }}
                    />
                    <span className="text-gray-600" style={{ fontSize: 10 }}>
                      {porte ? `${labelMap[porte]} (${porte})` : item.label}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800" style={{ fontSize: 10 }}>
                    {item.mediaDias}d
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Blocked Time */}
        <div className="rounded-lg p-2.5" style={{ background: '#F3F4F6', border: '1px solid #D1D5DB' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <Lock size={11} style={{ color: '#6B7280' }} />
            <p className="font-semibold text-gray-700" style={{ fontSize: 10 }}>Tempo Bloqueado</p>
          </div>
          <p className="text-gray-600" style={{ fontSize: 10, lineHeight: 1.4 }}>
            <span className="font-bold text-gray-800">{data.blockedTimeDias}d</span>
            {' '}em média dos experimentos concluídos
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex-1 rounded-full h-1" style={{ background: '#E5E7EB' }}>
              <div
                className="rounded-full h-1"
                style={{
                  width: `${Math.min(data.blockedTimePct, 100)}%`,
                  background: 'linear-gradient(90deg, #9CA3AF, #6B7280)',
                }}
              />
            </div>
            <span className="font-bold text-gray-600" style={{ fontSize: 10 }}>{data.blockedTimePct}%</span>
          </div>
        </div>

        {/* Bottleneck */}
        <div className="rounded-lg p-2.5" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <AlertTriangle size={11} style={{ color: '#EF4444' }} />
            <p className="font-semibold text-gray-700" style={{ fontSize: 10 }}>Gargalo</p>
          </div>
          <p className="text-gray-600" style={{ fontSize: 10, lineHeight: 1.4 }}>
            <span className="font-bold text-red-600">{bottleneck.fase}</span>{' '}
            <span className="font-bold text-red-600">{bottleneck.dias}d</span> ({bottleneck.pct}%)
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex-1 rounded-full h-1" style={{ background: '#E5E7EB' }}>
              <div
                className="rounded-full h-1"
                style={{ width: `${bottleneck.pct}%`, background: 'linear-gradient(90deg, #EF4444, #DC2626)' }}
              />
            </div>
            <span className="font-bold text-red-600" style={{ fontSize: 10 }}>{bottleneck.pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Observação ── */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <p className="text-gray-400 italic" style={{ fontSize: 9, lineHeight: 1.4 }}>
          Os resultados apresentados consideram os dados consolidados dos últimos 12 meses e ainda estão em processo de refinamento, podendo sofrer ajustes à medida que novas análises forem concluídas.
        </p>
      </div>
    </div>
  )
}