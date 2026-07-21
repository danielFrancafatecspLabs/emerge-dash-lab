'use client'

import { useCallback, useState } from 'react'
import { FileDown, Pencil, Check, X, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Target, Zap, Loader2 } from 'lucide-react'
import type { EpicDetail } from '@/lib/types'
import DominioCard from './DominioCard'

interface NovoNaEsteira {
  key: string
  nome: string
  status: string
  sponsors: string[]
  dominios: string[]
  criadoEm: string | null
  qtdExperimentos: number
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
  qtdExperimentosAtivos: number
  iniciativasEmPilotoOuEscala: number
  conversaoPiloto: string
  conversaoEscala: string
  beneficioPotencialEstimado: number
}

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const accentColors = [
  '#6366F1', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6',
]

export default function ReportContent({
  emAndamento,
  novosNaEsteira,
  iniciativasDelivery: initialDelivery,
  funilStages,
  funilMax,
  top5Dominios,
  qtdExperimentosAtivos,
  iniciativasEmPilotoOuEscala,
  conversaoPiloto,
  conversaoEscala,
  beneficioPotencialEstimado,
}: ReportContentProps) {

  const [deliveryData, setDeliveryData] = useState(initialDelivery)
  const [editingCell, setEditingCell] = useState<{ nome: string; field: 'situacaoAtual' | 'proximosPassos' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAndamento, setShowAndamento] = useState(false)
  const [showNovos, setShowNovos] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      // Expand all collapsible sections before capturing
      setShowAndamento(true)
      setShowNovos(true)
      setShowDelivery(true)

      // Wait for DOM to update
      await new Promise(r => setTimeout(r, 300))

      const reportEl = document.getElementById('report-content')
      if (!reportEl) throw new Error('Elemento report-content não encontrado')

      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f0f0f0',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 10
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 5

      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - 10)

      while (heightLeft > 0) {
        position = -(pageHeight - 10) + 5
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight)
        heightLeft -= (pageHeight - 10)
      }

      pdf.save(`report-beon-lab-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }, [isExporting])

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
    setDeliveryData(prev =>
      prev.map(ini =>
        ini.nome === editingCell.nome
          ? { ...ini, [editingCell.field]: editValue }
          : ini
      )
    )
    setEditingCell(null)
    setEditValue('')
  }

  // ── Derivados ──
  const dominiosComAtividade = top5Dominios.filter(d => d.emAndamento + d.emPiloto > 0)
  const totalIniciativasPipeline = funilStages.reduce((s, f) => s + f.value, 0)
  const priorityColors: Record<string, string> = {
    'Highest': '#7F1D1D', 'High': '#CC0000', 'Medium': '#D97706',
    'Low': '#6B7280', 'Lowest': '#9CA3AF',
  }
  const statusColors: Record<string, { bg: string; text: string }> = {
    'BACKLOG': { bg: '#F3F4F6', text: '#6B7280' },
    'EM REFINAMENTO': { bg: '#DBEAFE', text: '#1D4ED8' },
    'PRONTO PARA EXECUÇÃO': { bg: '#FED7AA', text: '#C2410C' },
    'EM EXPERIMENTAÇÃO': { bg: '#FEF3C7', text: '#B45309' },
    'AGUARDANDO PILOTO': { bg: '#EDE9FE', text: '#6D28D9' },
    'EM PILOTO': { bg: '#FEE2E2', text: '#B91C1C' },
    'EM ESCALA': { bg: '#D1FAE5', text: '#047857' },
    'FINALIZADO': { bg: '#CCFBF1', text: '#0F766E' },
    'CANCELADO': { bg: '#F3F4F6', text: '#9CA3AF' },
  }

  return (
    <div id="report-content" className="flex-1 overflow-auto p-6 space-y-5">

      {/* ═══════════════ CABEÇALHO EXECUTIVO ═══════════════ */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl px-6 py-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mb-1">Relatório Executivo de Inovação</p>
            <h1 className="text-xl font-bold">BeOn Lab — Panorama do Portfólio</h1>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {isExporting ? 'Gerando...' : 'Exportar'}
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-3 max-w-3xl">
          O pipeline de inovação conta atualmente com <strong className="text-white">{totalIniciativasPipeline} iniciativas</strong> no funil.
          A taxa de conversão para Piloto é de <strong className="text-white">{conversaoPiloto}</strong> ({iniciativasEmPilotoOuEscala} iniciativas alcançaram os estágios de Piloto ou Escala)
          e a conversão para Escala é de <strong className="text-white">{conversaoEscala}</strong>.
          O benefício potencial estimado é de <strong className="text-white">{formatCurrency(beneficioPotencialEstimado)}</strong>.
        </p>
      </div>

      {/* ═══════════════ BIG NUMBERS ═══════════════ */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-amber-500" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Iniciativas</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalIniciativasPipeline}</p>
          <p className="text-xs text-gray-400 mt-1">no pipeline de inovação</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">Em Piloto/Escala</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{iniciativasEmPilotoOuEscala}</p>
          <p className="text-xs text-gray-400 mt-1">iniciativas (Piloto + Escala)</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-green-500" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">Conversão → Piloto</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{conversaoPiloto}</p>
          <p className="text-xs text-gray-400 mt-1">iniciativas → Piloto/Escala</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-purple-500" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">Benefício Potencial</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(beneficioPotencialEstimado)}</p>
          <p className="text-xs text-gray-400 mt-1">estimado do portfólio</p>
        </div>
      </div>

      {/* ═══════════════ LAYOUT 2 COLUNAS ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="space-y-5">

          {/* Funil de Iniciativas */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Funil de Iniciativas
            </p>
            <div className="space-y-2.5">
              {funilStages.map(stage => {
                const pct = funilMax > 0 ? (stage.value / funilMax) * 100 : 0
                return (
                  <div key={stage.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 font-medium">{stage.label}</span>
                      <span className="text-gray-800 font-bold">{stage.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color }}
                      >
                        <span className="text-white font-bold text-[10px]">{stage.value}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3 italic leading-relaxed">
              O funil mostra a distribuição das iniciativas ao longo das etapas do pipeline de inovação.
              {funilStages[0] && funilStages[funilStages.length - 1] && funilStages[0].value > funilStages[funilStages.length - 1].value
                ? ' O afunilamento natural indica maturidade na priorização das iniciativas.'
                : ''}
            </p>
          </div>

          {/* Domínios — cards completos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Portfólio por Domínio
            </p>
            <div className="space-y-3">
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
                  accent={accentColors[i % accentColors.length]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="space-y-5">

          {/* Destaques de Domínio — mini cards com barras */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Destaques por Domínio
            </p>
            <div className="grid grid-cols-1 gap-3">
              {dominiosComAtividade.length > 0 ? dominiosComAtividade.map((d, i) => {
                const totalAtivo = d.emAndamento + d.emPiloto
                const barraPct = d.total > 0 ? (totalAtivo / d.total) * 100 : 0
                const cor = accentColors[i % accentColors.length]
                return (
                  <div
                    key={d.nome}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: cor }}
                    >
                      {d.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">{d.nome}</p>
                        <p className="text-[11px] text-gray-500 ml-2 shrink-0 font-medium">
                          {totalAtivo}/{d.total} ativos
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(barraPct, 4)}%`,
                            background: `linear-gradient(90deg, ${cor}CC, ${cor})`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {d.emAndamento} and.
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {d.emPiloto} pil.
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700">
                          {formatCurrency(d.beneficioTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum domínio com experimentos ativos.</p>
              )}
            </div>
            {dominiosComAtividade.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-4 italic leading-relaxed">
                {dominiosComAtividade.length} domínios com experimentos em andamento ou em piloto.
                {dominiosComAtividade[0] && ` O domínio "${dominiosComAtividade[0].nome}" lidera com ${dominiosComAtividade[0].emAndamento + dominiosComAtividade[0].emPiloto} experimentos ativos e benefício potencial de ${formatCurrency(dominiosComAtividade[0].beneficioTotal)}.`}
              </p>
            )}
          </div>

          {/* Experimentos em Andamento — colapsável */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowAndamento(!showAndamento)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Experimentos em Andamento
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {emAndamento.length}
                </span>
              </div>
              {showAndamento ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showAndamento && (
              <div className="overflow-auto" style={{ maxHeight: '340px' }}>
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, letterSpacing: '0.06em' }}>Experimento</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Prioridade</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Status</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Sponsor</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Domínio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emAndamento.map((e, i) => {
                      const prioridade = e.prioridade ?? '—'
                      return (
                        <tr key={e.key} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                          style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900" style={{ fontSize: 11 }}>{e.nome}</p>
                            <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded font-semibold"
                              style={{
                                fontSize: 10,
                                color: priorityColors[prioridade] ?? '#374151',
                                background: prioridade === 'High' || prioridade === 'Highest' ? '#FEE2E2'
                                  : prioridade === 'Medium' ? '#FEF3C7' : '#F3F4F6'
                              }}>
                              {prioridade}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-gray-700" style={{ fontSize: 11 }}>{e.status?.name ?? '—'}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>{e.sponsor ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>{e.dominio ?? '—'}</td>
                        </tr>
                      )
                    })}
                    {emAndamento.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum experimento em andamento.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!showAndamento && emAndamento.length > 0 && (
              <p className="px-5 py-2 text-xs text-gray-400 italic border-t border-gray-50">
                Clique para expandir — {emAndamento.length} experimentos em execução, com {emAndamento.filter(e => e.prioridade === 'High' || e.prioridade === 'Highest').length} de alta prioridade.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ SEÇÕES FULL-WIDTH ═══════════════ */}

      {/* Novos na Esteira — colapsável */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowNovos(!showNovos)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Novos na Esteira (últimos 30 dias)
            </span>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {novosNaEsteira.length}
            </span>
          </div>
          {showNovos ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showNovos && (
          <div className="overflow-auto" style={{ maxHeight: '340px' }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 220 }}>Iniciativa</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Status</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Sponsor</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Domínio</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Exp.</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {novosNaEsteira.map((ini, i) => {
                  const statusColor = statusColors[ini.status] ?? { bg: '#F3F4F6', text: '#374151' }
                  return (
                    <tr
                      key={ini.key}
                      className="border-b border-gray-50 hover:bg-green-50/50 transition-colors"
                      style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900" style={{ fontSize: 11 }}>{ini.nome}</p>
                        <p className="text-gray-400" style={{ fontSize: 9 }}>#{ini.key}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ fontSize: 10, color: statusColor.text, background: statusColor.bg }}>
                          {ini.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>
                        {ini.sponsors.length > 0 ? ini.sponsors.join(', ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>
                        {ini.dominios.length > 0 ? ini.dominios.join(', ') : '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600" style={{ fontSize: 11 }}>
                        {ini.qtdExperimentos}
                      </td>
                      <td className="px-3 py-2 text-gray-500" style={{ fontSize: 10 }}>
                        {formatDate(ini.criadoEm)}
                      </td>
                    </tr>
                  )
                })}
                {novosNaEsteira.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhuma iniciativa nova nos últimos 30 dias.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!showNovos && novosNaEsteira.length > 0 && (
          <p className="px-5 py-2 text-xs text-gray-400 italic border-t border-gray-50">
            Clique para expandir — {novosNaEsteira.length} novas iniciativas ou experimentos entraram no pipeline nos últimos 30 dias.
          </p>
        )}
      </div>

      {/* Iniciativas Direcionadas para beOn Delivery — colapsável */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDelivery(!showDelivery)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Iniciativas Direcionadas para beOn Delivery
            </span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {deliveryData.length}
            </span>
          </div>
          {showDelivery ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showDelivery && (
          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 200 }}>Iniciativa</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, minWidth: 180 }}>Experimento</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, minWidth: 250 }}>Situação Atual</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9, minWidth: 250 }}>Próximos Passos</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Sponsor</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase" style={{ fontSize: 9 }}>Domínio</th>
                </tr>
              </thead>
              <tbody>
                {deliveryData.map((ini, i) => (
                  <tr
                    key={`${ini.nome}-${i}`}
                    className="border-b border-gray-50 hover:bg-purple-50/50 transition-colors"
                    style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900" style={{ fontSize: 11 }}>{ini.nome}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-700" style={{ fontSize: 11 }}>
                      {ini.experimento || '—'}
                    </td>
                    <td className="px-3 py-2" style={{ fontSize: 11, maxWidth: 280 }}>
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
                            <button onClick={saveEdit} className="p-0.5 rounded hover:bg-green-100 text-green-700" title="Salvar"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-100 text-red-600" title="Cancelar"><X size={14} /></button>
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
                    <td className="px-3 py-2" style={{ fontSize: 11, maxWidth: 280 }}>
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
                            <button onClick={saveEdit} className="p-0.5 rounded hover:bg-green-100 text-green-700" title="Salvar"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-100 text-red-600" title="Cancelar"><X size={14} /></button>
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
                    <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>
                      {ini.sponsor || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11 }}>
                      {ini.dominio || '—'}
                    </td>
                  </tr>
                ))}
                {deliveryData.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhuma iniciativa direcionada para beOn Delivery no momento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!showDelivery && deliveryData.length > 0 && (
          <p className="px-5 py-2 text-xs text-gray-400 italic border-t border-gray-50">
            Clique para expandir — {deliveryData.length} iniciativas direcionadas para beOn Delivery com acompanhamento de situação e próximos passos.
          </p>
        )}
      </div>
    </div>
  )
}