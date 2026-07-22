'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { Info, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import type { CycleTimeEstagio, CycleTimeDiagnostico, LeadTimeStats } from '@/lib/types'

interface Props {
  data: CycleTimeEstagio[]        // quebrado por porte (P/M/G)
  leadTime?: LeadTimeStats
  diagnostico?: CycleTimeDiagnostico
  geral?: CycleTimeEstagio        // agregado geral (visão antiga, sem quebra)
}

// Cores por estágio (consistentes com o pipeline)
const CORES: Record<string, string> = {
  'BACKLOG':              '#D4D4D4',
  'EM REFINAMENTO':       '#60A5FA',
  'PRONTO PARA EXECUÇÃO': '#F97316',
  'EM EXPERIMENTAÇÃO':    '#FCD34D',
  'AGUARDANDO PILOTO':    '#F97316',
  'EM PILOTO':            '#EF4444',
  'FINALIZADO':           '#134E4A',
}

// Cores por porte (P, M, G)
const CORES_PORTE: Record<string, string> = {
  'P': '#22C55E',  // verde
  'M': '#F59E0B',  // âmbar
  'G': '#EF4444',  // vermelho
}

function getCor(estagio: string): string {
  // Separador
  if (estagio === 'SEPARADOR') return 'transparent'
  // Geral (visão antiga)
  if (estagio === 'EM EXPERIMENTAÇÃO') return '#FCD34D'
  // Extrai o porte do estagio: "EM EXPERIMENTAÇÃO (P)" → "P"
  const match = estagio.match(/\(([PMG])\)$/)
  if (match) return CORES_PORTE[match[1]] ?? '#888'
  return CORES[estagio] ?? '#888'
}

export default function CycleTimeIdeacao({ data, leadTime, diagnostico, geral }: Props) {
  const [showSemPorte, setShowSemPorte] = useState(false)

  // Combinar visão geral (antiga) + quebra por porte
  const chartData = useMemo(() => {
    const result: CycleTimeEstagio[] = []
    if (geral && geral.qtdIniciativas > 0) {
      result.push(geral)
    }
    // Separador visual: inserir um item "—" entre geral e portes
    if (geral && geral.qtdIniciativas > 0 && data.length > 0) {
      result.push({
        estagio: 'SEPARADOR',
        label: '— Por porte —',
        mediaDias: 0,
        medianaDias: 0,
        qtdIniciativas: 0,
      })
    }
    result.push(...data)
    return result
  }, [data, geral])

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-400">
        Sem dados de cycle time disponíveis.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Cycle Time — Board de Experimentação</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Tempo médio (dias) que os experimentos permanecem em execução ("Em andamento" / "EM VALIDAÇÃO"), descontando bloqueios. Quebrado por porte (P = Baixa, M = Média, G = Alta).
        </p>
      </div>

      {/* Diagnóstico: quantos experimentos foram analisados */}
      {diagnostico && (
        <div className="px-5 py-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
            <span className="font-medium text-gray-700">{diagnostico.analisados} de {diagnostico.totalEpics} analisados</span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-600">{diagnostico.semChangelog} sem changelog</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">{diagnostico.semPeriodo} sem período em experimentação</span>
            {diagnostico.semPorte && diagnostico.semPorte.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setShowSemPorte(!showSemPorte)}
                  className="inline-flex items-center gap-0.5 text-amber-600 hover:text-amber-800 font-medium transition-colors"
                >
                  {showSemPorte ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {diagnostico.semPorte.length} sem porte (complexidade)
                </button>
              </>
            )}
          </div>

          {/* Lista expansível de experimentos sem porte */}
          {showSemPorte && diagnostico.semPorte && diagnostico.semPorte.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-amber-200 rounded-md bg-white">
              <table className="w-full text-[11px]">
                <thead className="bg-amber-50 sticky top-0">
                  <tr className="text-amber-800">
                    <th className="text-left py-1 px-2 font-medium">Key</th>
                    <th className="text-left py-1 px-2 font-medium">Nome</th>
                    <th className="text-right py-1 px-2 font-medium">Cycle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostico.semPorte.map((epic) => (
                    <tr key={epic.key} className="border-t border-amber-100 hover:bg-amber-50/50">
                      <td className="py-1 px-2 font-mono text-amber-700">{epic.key}</td>
                      <td className="py-1 px-2 text-gray-600 max-w-[300px] truncate" title={epic.nome}>{epic.nome}</td>
                      <td className="py-1 px-2 text-right text-gray-500">{epic.cycleTimeDias}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cards de resumo: Cycle Time + Tempo Bloqueado */}
      {leadTime && (
        <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-gray-100">
          {/* Cycle Time (sem bloqueio) */}
          <div className="rounded-lg p-3" style={{ background: '#ECFDF5' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-800">Cycle Time</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{leadTime.cycleTimeExperimentacaoDias}d</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Tempo em execução (sem bloqueios)</p>
          </div>

          {/* Tempo Bloqueado */}
          <div className="rounded-lg p-3" style={{ background: '#FEF3C7' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">Tempo Bloqueado</p>
            </div>
            <p className="text-xl font-bold text-amber-700">{leadTime.blockedTimeExperimentacaoDias}d</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Média dos experimentos em execução</p>
          </div>
        </div>
      )}

      <div className="p-4">
        <ResponsiveContainer width="100%" height={Math.max(320, chartData.length * 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              label={{ value: 'Dias', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#9CA3AF' }}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'mediaDias') return [`${value} dias`, 'Média']
                if (name === 'medianaDias') return [`${value} dias`, 'Mediana']
                return [value, name]
              }}
              labelFormatter={(label: string) => `Estágio: ${label}`}
            />
            <Bar
              dataKey="mediaDias"
              radius={[0, 4, 4, 0]}
              barSize={28}
              name="mediaDias"
            >
              {chartData.map((entry) => (
                <Cell key={entry.estagio} fill={getCor(entry.estagio)} fillOpacity={entry.estagio === 'SEPARADOR' ? 0 : 0.85} />
              ))}
              <LabelList
                dataKey="mediaDias"
                position="right"
                formatter={(v: number) => `${v}d`}
                style={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela resumo */}
      <div className="px-5 pb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">Etapa</th>
              <th className="text-right py-1.5 font-medium">Média (dias)</th>
              <th className="text-right py-1.5 font-medium">Mediana (dias)</th>
              <th className="text-right py-1.5 font-medium">Qtd. Experimentos</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.estagio} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${item.estagio === 'SEPARADOR' ? 'bg-gray-100' : ''}`}>
                <td className="py-1.5 flex items-center gap-2">
                  {item.estagio === 'SEPARADOR' ? (
                    <span className="text-[10px] text-gray-400 font-medium pl-3">{item.label}</span>
                  ) : (
                    <>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: getCor(item.estagio) }}
                      />
                      <span className="text-gray-700">{item.label}</span>
                    </>
                  )}
                </td>
                <td className="text-right py-1.5 font-semibold text-gray-800">{item.estagio === 'SEPARADOR' ? '' : `${item.mediaDias}d`}</td>
                <td className="text-right py-1.5 text-gray-500">{item.estagio === 'SEPARADOR' ? '' : `${item.medianaDias}d`}</td>
                <td className="text-right py-1.5 text-gray-500">{item.estagio === 'SEPARADOR' ? '' : item.qtdIniciativas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Funil de Iniciativas ── */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-bold text-gray-800">Funil de Iniciativas</h4>
          <div className="relative group">
            <Info size={12} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-1.5 w-56 p-2 rounded-lg bg-gray-900 text-white text-[10px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
              Quantidade de iniciativas que passaram por cada estágio. O funil mostra o fluxo real: quantas iniciativas já transitaram por cada etapa do pipeline de ideação.
              <div className="absolute top-full left-3 -mt-px border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Funil visual */}
        <div className="flex flex-col items-center gap-1">
          {data.map((item, idx) => {
            const maxQtd = Math.max(...data.map(d => d.qtdIniciativas), 1)
            const widthPct = Math.max((item.qtdIniciativas / maxQtd) * 100, 8)
            const isLast = idx === data.length - 1
            return (
              <div key={item.estagio} className="flex flex-col items-center w-full">
                {/* Barra do funil */}
                <div className="flex items-center gap-3 w-full justify-center">
                  <span className="text-[10px] text-gray-500 w-24 text-right truncate">{item.label}</span>
                  <div
                    className="h-7 rounded flex items-center justify-center transition-all duration-500 relative"
                    style={{
                      width: `${widthPct}%`,
                      maxWidth: '400px',
                      minWidth: '60px',
                      background: getCor(item.estagio),
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-white font-bold text-xs drop-shadow-sm">
                      {item.qtdIniciativas}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 w-16 text-left">
                    {Math.round((item.qtdIniciativas / maxQtd) * 100)}%
                  </span>
                </div>
                {/* Conector (seta para baixo) */}
                {!isLast && (
                  <div className="text-gray-300 text-xs leading-none my-0.5">▼</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda compacta */}
        <div className="flex flex-wrap gap-3 justify-center mt-3 pt-2 border-t border-gray-50">
          {data.map(item => (
            <div key={item.estagio} className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: getCor(item.estagio) }}
              />
              <span className="text-[9px] text-gray-500">{item.label}</span>
              <span className="text-[9px] font-semibold text-gray-700">{item.qtdIniciativas}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}