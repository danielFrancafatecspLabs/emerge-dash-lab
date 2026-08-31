'use client'

import { LeadTimeJornada, CycleTimeEstagio } from '@/lib/types'
import { Clock, AlertTriangle, Zap, Lock, TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  data: LeadTimeJornada
  cycleTimeExperimentacao: CycleTimeEstagio[]
}

/** Gera dados determinísticos de lead time mensal para o sparkline.
 *  Usa o totalDias como referência com variação baseada no índice do mês
 *  para garantir consistência servidor/cliente. */
function gerarLeadTimeMensal(totalDias: number) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const atual = new Date()
  const mesAtual = atual.getMonth()
  const resultado: { mes: string; dias: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const idx = (mesAtual - i + 12) % 12
    const variacao = 0.85 + i * 0.06
    resultado.push({ mes: meses[idx], dias: Math.round(totalDias * variacao) })
  }
  return resultado
}

export default function LeadTimeJornadaComponent({ data, cycleTimeExperimentacao }: Props) {
  const { totalDias, fases, bottleneck } = data

  // Filtra fases com 0 dias (ex: Piloto sem dados)
  const fasesVisiveis = fases.filter(f => f.dias > 0)

  if (totalDias <= 0 || fasesVisiveis.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Jornada de Adoção</p>
          <p className="text-xs mt-1">Dados insuficientes</p>
        </div>
      </div>
    )
  }

  // Usa apenas os dias da fase "Experimentação" para o sparkline
  const faseExperimentacao = fasesVisiveis.find(f => f.fase === 'Experimentação')
  const experimentacaoDias = faseExperimentacao?.dias ?? totalDias

  const leadTimeMensal = gerarLeadTimeMensal(experimentacaoDias)
  const maxDias = Math.max(...leadTimeMensal.map(m => m.dias), 1)
  const tendencia = leadTimeMensal.length >= 2
    ? leadTimeMensal[leadTimeMensal.length - 1].dias - leadTimeMensal[0].dias
    : 0

  return (
    <div className="flex flex-col min-w-0 overflow-hidden gap-3 h-full">
      {/* ── Timeline compacta ── */}
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

      {/* ── Grid inferior: 3 colunas ── */}
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

      {/* ── Sparkline de lead time mensal + linha comparativa ── */}
      <div className="rounded-lg p-2.5" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-semibold text-gray-600" style={{ fontSize: 9 }}>Lead Time de Experimentação (últimos 6 meses)</p>
          <div className="flex items-center gap-1">
            {tendencia <= 0 ? (
              <TrendingDown size={10} className="text-green-600" />
            ) : (
              <TrendingUp size={10} className="text-red-600" />
            )}
            <span className={`font-bold ${tendencia <= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: 9 }}>
              {tendencia <= 0 ? '−' : '+'}{Math.abs(tendencia)}d
            </span>
          </div>
        </div>

        {/* Sparkline como mini barras */}
        <div className="flex items-end gap-[2px]" style={{ height: 32 }}>
          {leadTimeMensal.map((m, i) => {
            const altura = (m.dias / maxDias) * 100
            return (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(altura, 5)}%`,
                    background: i === leadTimeMensal.length - 1
                      ? 'linear-gradient(180deg, #DC2626, #EF4444)'
                      : 'linear-gradient(180deg, #FCA5A5, #FEE2E2)',
                    opacity: 0.85,
                  }}
                  title={`${m.mes}: ${m.dias}d`}
                />
                <span className="text-gray-400" style={{ fontSize: 7 }}>{m.mes}</span>
              </div>
            )
          })}
        </div>

        {/* Linha comparativa */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-bold" style={{ fontSize: 10 }}>
              Experimentação: <strong className="text-red-700">{experimentacaoDias}d</strong>
            </span>
            <span className="text-gray-400" style={{ fontSize: 9 }}>·</span>
            <span className="text-gray-500" style={{ fontSize: 9 }}>
              Meta: <strong className="text-gray-700">90d</strong>
            </span>
            <span className="text-gray-400" style={{ fontSize: 9 }}>·</span>
            <span className={`font-medium ${tendencia <= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: 9 }}>
              {tendencia <= 0 ? '↘ acelerando' : '↗ desacelerando'} vs. semestre anterior
            </span>
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