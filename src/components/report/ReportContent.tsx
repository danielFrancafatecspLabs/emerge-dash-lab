'use client'

import { useCallback, useState } from 'react'
import { FileDown, Pencil, Check, X } from 'lucide-react'
import type { EpicDetail } from '@/lib/types'
import DominioCard from './DominioCard'

interface NovoNaEsteira {
  iniciativaKey: string
  iniciativaNome: string
  iniciativaCriadoEm: string | null
  epic: EpicDetail
  origem: 'iniciativa' | 'epic'
}

interface IniciativaDelivery {
  nome: string
  experimento: string
  situacaoAtual: string
  proximosPassos: string
  sponsor: string
  dominio: string
}

interface FunilStage {
  label: string
  value: number
  color: string
}

interface DominioSummary {
  nome: string
  total: number
  emAndamento: number
  emPiloto: number
  concluidos: number
  beneficioTotal: number
  epics: EpicDetail[]
  topEpics: EpicDetail[]
}

interface ReportContentProps {
  emAndamento: EpicDetail[]
  novosNaEsteira: NovoNaEsteira[]
  iniciativasDelivery: IniciativaDelivery[]
  funilStages: FunilStage[]
  funilMax: number
  top5Dominios: DominioSummary[]
  qtdExperimentos: number
  conversaoExperimentacaoParaPiloto: string
  beneficioPotencialEstimado: number
}

const accentColors = [
  '#6366F1', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6',
]

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function ReportContent({
  emAndamento,
  novosNaEsteira,
  iniciativasDelivery: initialDelivery,
  funilStages,
  funilMax,
  top5Dominios,
  qtdExperimentos,
  conversaoExperimentacaoParaPiloto,
  beneficioPotencialEstimado,
}: ReportContentProps) {

  const [iniciativasDelivery, setIniciativasDelivery] = useState(initialDelivery)
  const [editingCell, setEditingCell] = useState<{ nome: string; field: 'situacaoAtual' | 'proximosPassos' } | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleExport = useCallback(() => {
    window.print()
  }, [])

  const startEdit = (nome: string, field: 'situacaoAtual' | 'proximosPassos', currentValue: string) => {
    setEditingCell({ nome, field })
    setEditValue(currentValue)
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const saveEdit = () => {
    if (!editingCell) return
    setIniciativasDelivery(prev =>
      prev.map(ini =>
        ini.nome === editingCell.nome
          ? { ...ini, [editingCell.field]: editValue }
          : ini
      )
    )
    setEditingCell(null)
    setEditValue('')
  }

  return (
    <div id="report-content" className="flex-1 overflow-auto p-6">

      {/* ── Big Numbers ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-gray-800">{qtdExperimentos}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Quantidade de Experimentos</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-purple-600">{conversaoExperimentacaoParaPiloto}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Conversão de Experimentação para Piloto</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-green-700">{formatCurrency(beneficioPotencialEstimado)}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Benefício Potencial Estimado</p>
        </div>
      </div>

      {/* ── Funil de Iniciativas + Exportar ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Funil de Iniciativas — Board Ideação
          </p>
          <button
            onClick={handleExport}
            className="no-print flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#CC0000' }}
          >
            <FileDown size={14} />
            Exportar
          </button>
        </div>
        <div className="p-5 space-y-3">
          {funilStages.map((stage) => {
            const pct = Math.round((stage.value / funilMax) * 100)
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-40 text-right shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 h-7 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: stage.color,
                      minWidth: stage.value > 0 ? '2rem' : '0',
                    }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {stage.value}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Resumo do Portfólio por Domínio ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Resumo do Portfólio — Domínios
          </p>
        </div>
        <div className="p-4 space-y-4">
          {top5Dominios.map((dom, i) => (
            <DominioCard
              key={dom.nome}
              nome={dom.nome}
              total={dom.total}
              emAndamento={dom.emAndamento}
              emPiloto={dom.emPiloto}
              concluidos={dom.concluidos}
              beneficioTotal={dom.beneficioTotal}
              topEpics={dom.topEpics}
              allEpics={dom.epics}
              accent={accentColors[i]}
            />
          ))}
        </div>
      </div>

      {/* ── Experimentos em andamento ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Experimentos em andamento ({emAndamento.length})
          </p>
        </div>

        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 260 }}>Experimento</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Prioridade</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Status</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, minWidth: 280 }}>Status Detalhado</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Sponsor</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Domínio</th>
              </tr>
            </thead>
            <tbody>
              {emAndamento.map((e, i) => {
                const prioridade = e.prioridade ?? '—'
                const priorityColors: Record<string, string> = {
                  'Highest': '#7F1D1D',
                  'High': '#CC0000',
                  'Medium': '#D97706',
                  'Low': '#6B7280',
                  'Lowest': '#9CA3AF',
                }
                return (
                  <tr
                    key={e.key}
                    className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                    style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{e.nome}</p>
                      <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className="px-1.5 py-0.5 rounded font-semibold"
                        style={{ fontSize: 10, color: priorityColors[prioridade] ?? '#374151', background: prioridade === 'High' || prioridade === 'Highest' ? '#FEE2E2' : prioridade === 'Medium' ? '#FEF3C7' : '#F3F4F6' }}
                      >
                        {prioridade}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-gray-700" style={{ fontSize: 11 }}>{e.status.name}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11, maxWidth: 300 }}>
                      <div className="truncate" title={e.statusDetalhado ?? undefined}>
                        {e.statusDetalhado ?? '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                      {e.sponsor ?? '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                      {e.dominio ?? '—'}
                    </td>
                  </tr>
                )
              })}

              {emAndamento.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum experimento em andamento no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Novos na esteira — últimos 30 dias ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-6">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Novos na esteira — últimos 30 dias ({novosNaEsteira.length})
          </p>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 260 }}>Experimento</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Prioridade</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Status</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, minWidth: 280 }}>Status Detalhado</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Sponsor</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Domínio</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {novosNaEsteira.map((item, i) => {
                const e = item.epic
                const hasEpic = e && e.key
                const prioridade = hasEpic ? (e.prioridade ?? '—') : '—'
                const priorityColors: Record<string, string> = {
                  'Highest': '#7F1D1D',
                  'High': '#CC0000',
                  'Medium': '#D97706',
                  'Low': '#6B7280',
                  'Lowest': '#9CA3AF',
                }
                return (
                  <tr
                    key={hasEpic ? e.key : item.iniciativaKey}
                    className="border-b border-gray-50 hover:bg-blue-50 transition-colors"
                    style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                  >
                    <td className="px-3 py-2">
                      {hasEpic ? (
                        <>
                          <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{e.nome}</p>
                          <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                        </>
                      ) : (
                        <span className="text-gray-400 italic" style={{ fontSize: 11 }}>Sem experimento</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {hasEpic ? (
                        <span
                          className="px-1.5 py-0.5 rounded font-semibold"
                          style={{ fontSize: 10, color: priorityColors[prioridade] ?? '#374151', background: prioridade === 'High' || prioridade === 'Highest' ? '#FEE2E2' : prioridade === 'Medium' ? '#FEF3C7' : '#F3F4F6' }}
                        >
                          {prioridade}
                        </span>
                      ) : (
                        <span className="text-gray-300" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-gray-700" style={{ fontSize: 11 }}>{hasEpic ? e.status.name : '—'}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11, maxWidth: 300 }}>
                      <div className="truncate" title={hasEpic ? (e.statusDetalhado ?? undefined) : undefined}>
                        {hasEpic ? (e.statusDetalhado ?? '—') : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                      {hasEpic ? (e.sponsor ?? '—') : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                      {hasEpic ? (e.dominio ?? '—') : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500" style={{ fontSize: 10 }}>
                      {formatDate(
                        item.origem === 'epic' && item.epic?.criadoEm
                          ? item.epic.criadoEm
                          : item.iniciativaCriadoEm
                      )}
                    </td>
                  </tr>
                )
              })}

              {novosNaEsteira.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhuma iniciativa nova nos últimos 30 dias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Iniciativas Direcionadas para beOn Delivery ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-6">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Iniciativas Direcionadas para beOn Delivery ({iniciativasDelivery.length})
          </p>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 220 }}>Iniciativa</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, minWidth: 220 }}>Experimento</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, minWidth: 280 }}>Situação Atual</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, minWidth: 280 }}>Próximos Passos</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Sponsor</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Domínio</th>
              </tr>
            </thead>
            <tbody>
              {iniciativasDelivery.map((ini, i) => (
                <tr
                  key={`${ini.nome}-${i}`}
                  className="border-b border-gray-50 hover:bg-green-50 transition-colors"
                  style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{ini.nome}</p>
                  </td>
                  <td className="px-3 py-2 text-gray-700" style={{ fontSize: 11 }}>
                    {ini.experimento || '—'}
                  </td>
                  <td className="px-3 py-2" style={{ fontSize: 11, maxWidth: 300 }}>
                    {editingCell?.nome === ini.nome && editingCell?.field === 'situacaoAtual' ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          className="w-full border border-blue-400 rounded p-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                          rows={3}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="p-0.5 rounded hover:bg-green-100 text-green-700" title="Salvar">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-100 text-red-600" title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="group flex items-start gap-1 cursor-pointer rounded p-1 -m-1 hover:bg-blue-50 min-h-[24px]"
                        onClick={() => startEdit(ini.nome, 'situacaoAtual', ini.situacaoAtual)}
                        title="Clique para editar"
                      >
                        <span className="text-gray-600 flex-1">{ini.situacaoAtual || '—'}</span>
                        <Pencil size={11} className="text-gray-300 group-hover:text-blue-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ fontSize: 11, maxWidth: 300 }}>
                    {editingCell?.nome === ini.nome && editingCell?.field === 'proximosPassos' ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          className="w-full border border-blue-400 rounded p-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                          rows={3}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="p-0.5 rounded hover:bg-green-100 text-green-700" title="Salvar">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-100 text-red-600" title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="group flex items-start gap-1 cursor-pointer rounded p-1 -m-1 hover:bg-blue-50 min-h-[24px]"
                        onClick={() => startEdit(ini.nome, 'proximosPassos', ini.proximosPassos)}
                        title="Clique para editar"
                      >
                        <span className="text-gray-600 flex-1">{ini.proximosPassos || '—'}</span>
                        <Pencil size={11} className="text-gray-300 group-hover:text-blue-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                    {ini.sponsor || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                    {ini.dominio || '—'}
                  </td>
                </tr>
              ))}

              {iniciativasDelivery.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhuma iniciativa direcionada para beOn Delivery no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}