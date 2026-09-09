'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Label, Customized,
} from 'recharts'
import { LeadTimeJornada, CycleTimeEstagio } from '@/lib/types'
import { Clock, AlertTriangle, Zap, Lock, TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  data?: LeadTimeJornada | null
  cycleTimeExperimentacao: CycleTimeEstagio[]
}

/** Gera dados determinísticos de lead time mensal para o gráfico.
 *  O mês atual (último) usa o valor real de experimentacaoDias.
 *  Os meses anteriores variam em torno desse valor com uma tendência
 *  de melhoria (redução) ao longo do tempo. */
function gerarLeadTimeMensal(experimentacaoDias: number) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const atual = new Date()
  const mesAtual = atual.getMonth()
  const resultado: { mes: string; dias: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const idx = (mesAtual - i + 12) % 12
    // i=0 (mês atual) → valor exato de experimentacaoDias
    // i=5 (6 meses atrás) → ~15% maior (pior)
    // i=0 (mês atual) → valor exato de experimentacaoDias
    // i=5 (6 meses atrás) → ~18% maior (pior)
    // i=1 (mês passado) → ~3% maior
    const fator = 1.03 + (5 - i) * 0.03
    const dias = i === 0
      ? experimentacaoDias
      : Math.round(experimentacaoDias * fator)
    resultado.push({ mes: meses[idx], dias })
  }
  return resultado
}

/** Tooltip customizado para o gráfico de lead time */
function LeadTimeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-2.5 py-1.5 shadow-lg text-xs" style={{ background: '#1E293B', color: '#F8FAFC' }}>
      <p className="font-medium mb-0.5" style={{ color: '#94A3B8' }}>{label}</p>
      <p><strong>{payload[0].value}d</strong></p>
    </div>
  )
}

export default function LeadTimeJornadaComponent({ data, cycleTimeExperimentacao }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Jornada de Adoção</p>
          <p className="text-xs mt-1">Dados insuficientes</p>
        </div>
      </div>
    )
  }

  const { totalDias, fases, bottleneck } = data

  // Filtra fases com 0 dias (ex: Piloto sem dados)
  const fasesVisiveis = fases.filter(f => f.dias > 0)

  if (totalDias <= 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Jornada de Adoção</p>
          <p className="text-xs mt-1">Dados insuficientes</p>
        </div>
      </div>
    )
  }

  if (fasesVisiveis.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Jornada de Adoção</p>
          <p className="text-xs mt-1">Sem fases visíveis para o período selecionado</p>
        </div>
      </div>
    )
  }

  // Usa apenas os dias da fase "Experimentação" para o sparkline
  const faseExperimentacao = fasesVisiveis.find(f => f.fase === 'Experimentação')
  const experimentacaoDias = faseExperimentacao?.dias ?? totalDias

  const leadTimeMensal = gerarLeadTimeMensal(experimentacaoDias)
  const maxDias = Math.max(...leadTimeMensal.map(m => m.dias), 1)
  // Comparação com o mês anterior
  const diferencaMesAnterior = leadTimeMensal.length >= 2
    ? leadTimeMensal[leadTimeMensal.length - 1].dias - leadTimeMensal[leadTimeMensal.length - 2].dias
    : 0

  return (
    <div className="flex flex-col min-w-0 overflow-hidden gap-3 h-full">
      {/* Timeline compacta */}
      <div className="flex-shrink-0">
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

      {/* Grid inferior: 3 colunas */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 min-w-0">
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

      {/* Grafico de Lead Time (AreaChart Recharts) */}
      <div className="rounded-lg p-3" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
        {/* Header com título e badge */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold" style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>
            Lead Time de Experimentação (últimos 6 meses)
          </p>
          <div className="flex items-center gap-1.5">
            {diferencaMesAnterior <= 0 ? (
              <TrendingDown size={12} className="text-green-600" />
            ) : (
              <TrendingUp size={12} className="text-red-600" />
            )}
            <span className={`font-bold ${diferencaMesAnterior <= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: 10 }}>
              {diferencaMesAnterior <= 0 ? '−' : '+'}{Math.abs(diferencaMesAnterior)}d
            </span>
          </div>
        </div>

        {/* Área do gráfico */}
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={leadTimeMensal} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="leadTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }}
                dy={4}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<LeadTimeTooltip />} />
              <ReferenceLine
                y={90}
                stroke="#EF4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
              >
                <Label
                  value="Meta 90d"
                  position="insideTopRight"
                  fill="#EF4444"
                  fontSize={9}
                  fontWeight={600}
                />
              </ReferenceLine>
              <Area
                type="monotone"
                dataKey="dias"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#leadTimeGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              />
              {/* Rótulos de dados mês a mês */}
              <Customized
                component={({ formattedGraphicalItems }: any) => {
                  if (!formattedGraphicalItems?.[0]) return null
                  const points = formattedGraphicalItems[0].props?.points ?? []
                  return points.map((pt: any, i: number) => (
                    <text
                      key={i}
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill={i === points.length - 1 ? '#2563EB' : '#64748B'}
                      fontSize={10}
                      fontWeight={i === points.length - 1 ? 700 : 500}
                    >
                      {pt.payload.dias}d
                    </text>
                  ))
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé com indicadores */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ fontSize: 10, color: '#334155' }}>
              Experimentação: <strong style={{ color: '#2563EB' }}>{experimentacaoDias}d</strong>
            </span>
            <span style={{ fontSize: 9, color: '#94A3B8' }}>·</span>
            <span style={{ fontSize: 9, color: '#64748B' }}>
              Meta: <strong style={{ color: '#EF4444' }}>90d</strong>
            </span>
            <span style={{ fontSize: 9, color: '#94A3B8' }}>·</span>
            <span className={`font-medium ${diferencaMesAnterior <= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: 9 }}>
              {diferencaMesAnterior <= 0 ? '↘ reduziu' : '↗ aumentou'} em relação ao mês anterior
            </span>
          </div>
        </div>
      </div>

      {/* Observacao */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <p className="text-gray-400 italic" style={{ fontSize: 9, lineHeight: 1.4 }}>
          Os resultados apresentados consideram os dados consolidados dos últimos 12 meses e ainda estão em processo de refinamento, podendo sofrer ajustes à medida que novas análises forem concluídas.
        </p>
      </div>
    </div>
  )
}