'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, X, TrendingUp, CheckCircle2, Clock, XCircle,
  HelpCircle, ArrowUpDown, ExternalLink, FileSpreadsheet,
} from 'lucide-react'
import { formatBRL } from '@/lib/mappers'
import type { ValidacaoBeneficio, StatusValidacao } from '@/lib/beneficios'
import BeneficioDetailDrawer from './BeneficioDetailDrawer'

export interface BeneficioEpicRow {
  key: string
  nome: string
  status: string
  dominio: string | null
  segmento: string | null
  sponsor: string | null
  labResponsavel: string
  prioridade: string | null
  beneficioPotencial: number | null
  beneficioQualitativo: string | null
  custoEstimado: number | null
  custoRealizado: string | null
  criadoEm: string | null
  concluidoEm: string | null
  validacao: ValidacaoBeneficio | null
}

interface Props {
  rows: BeneficioEpicRow[]
  currentRole: string | null
  currentUsername: string | null
}

export const STATUS_CONFIG: Record<StatusValidacao, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  nao_validado: { label: 'Não Validado', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', icon: HelpCircle },
  em_validacao: { label: 'Em Validação', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: Clock },
  validado: { label: 'Validado', bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', icon: CheckCircle2 },
  rejeitado: { label: 'Rejeitado', bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: XCircle },
}

function statusOf(row: BeneficioEpicRow): StatusValidacao {
  return row.validacao?.statusValidacao ?? 'nao_validado'
}

function formatBRLFull(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

type Ordenacao = 'potencial_desc' | 'validado_desc' | 'nome_asc' | 'atualizado_desc'

export default function BeneficiosClient({ rows, currentRole, currentUsername }: Props) {
  const [liveRows, setLiveRows] = useState(rows)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusValidacao | 'todos'>('todos')
  const [dominioFiltro, setDominioFiltro] = useState('todos')
  const [sponsorFiltro, setSponsorFiltro] = useState('todos')
  const [labFiltro, setLabFiltro] = useState('todos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('potencial_desc')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [selecionado, setSelecionado] = useState<BeneficioEpicRow | null>(null)

  const canEdit = currentRole === 'admin' || currentRole === 'financeiro'

  // ── Opções dinâmicas dos filtros ──
  const dominios = useMemo(
    () => Array.from(new Set(liveRows.map(r => r.dominio).filter(Boolean) as string[])).sort(),
    [liveRows]
  )
  const sponsors = useMemo(
    () => Array.from(new Set(liveRows.map(r => r.sponsor).filter(Boolean) as string[])).sort(),
    [liveRows]
  )
  const labs = useMemo(
    () => Array.from(new Set(liveRows.map(r => r.labResponsavel).filter(Boolean))).sort(),
    [liveRows]
  )

  // ── KPIs (sempre sobre o universo completo, não o filtrado) ──
  const kpis = useMemo(() => {
    let potencialTotal = 0
    let validadoTotal = 0
    let comQualitativo = 0
    const contagem: Record<StatusValidacao, number> = { nao_validado: 0, em_validacao: 0, validado: 0, rejeitado: 0 }

    for (const r of liveRows) {
      potencialTotal += r.beneficioPotencial ?? 0
      if (r.beneficioQualitativo) comQualitativo++
      const st = statusOf(r)
      contagem[st]++
      if (st === 'validado') validadoTotal += r.validacao?.beneficioValidado ?? r.beneficioPotencial ?? 0
    }

    const taxaValidacao = potencialTotal > 0 ? Math.round((validadoTotal / potencialTotal) * 100) : 0
    return { potencialTotal, validadoTotal, comQualitativo, contagem, taxaValidacao, total: liveRows.length }
  }, [liveRows])

  // ── Filtragem + ordenação ──
  const filtrados = useMemo(() => {
    let out = liveRows
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      out = out.filter(r => r.nome.toLowerCase().includes(q) || r.key.toLowerCase().includes(q))
    }
    if (statusFiltro !== 'todos') out = out.filter(r => statusOf(r) === statusFiltro)
    if (dominioFiltro !== 'todos') out = out.filter(r => r.dominio === dominioFiltro)
    if (sponsorFiltro !== 'todos') out = out.filter(r => r.sponsor === sponsorFiltro)
    if (labFiltro !== 'todos') out = out.filter(r => r.labResponsavel === labFiltro)

    const sorted = [...out]
    switch (ordenacao) {
      case 'potencial_desc':
        sorted.sort((a, b) => (b.beneficioPotencial ?? 0) - (a.beneficioPotencial ?? 0)); break
      case 'validado_desc':
        sorted.sort((a, b) => (b.validacao?.beneficioValidado ?? 0) - (a.validacao?.beneficioValidado ?? 0)); break
      case 'nome_asc':
        sorted.sort((a, b) => a.nome.localeCompare(b.nome)); break
      case 'atualizado_desc':
        sorted.sort((a, b) => (b.validacao?.atualizadoEm ?? '').localeCompare(a.validacao?.atualizadoEm ?? '')); break
    }
    return sorted
  }, [liveRows, busca, statusFiltro, dominioFiltro, sponsorFiltro, labFiltro, ordenacao])

  const filtrosAtivos = statusFiltro !== 'todos' || dominioFiltro !== 'todos' || sponsorFiltro !== 'todos' || labFiltro !== 'todos' || busca.trim() !== ''

  function limparFiltros() {
    setBusca(''); setStatusFiltro('todos'); setDominioFiltro('todos'); setSponsorFiltro('todos'); setLabFiltro('todos')
  }

  function handleUpdated(epicKey: string, validacao: ValidacaoBeneficio) {
    setLiveRows(prev => prev.map(r => r.key === epicKey ? { ...r, validacao } : r))
    setSelecionado(prev => prev && prev.key === epicKey ? { ...prev, validacao } : prev)
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Header ── */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0" style={{ background: '#8B0000' }}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <FileSpreadsheet size={20} color="white" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide" style={{ fontSize: 16, letterSpacing: '0.03em' }}>
              CONTROLE FINANCEIRO DE BENEFÍCIOS
            </h1>
            <p className="text-white/70" style={{ fontSize: 11 }}>
              Benefício quantitativo potencial × validado pelo Financeiro — board de Experimentação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!canEdit && (
            <span className="text-[11px] text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
              Modo leitura
            </span>
          )}
          <Link
            href="/estrategia"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors border border-white/20"
          >
            Ver Estratégia <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      <main className="flex-1 p-5 md:p-6 flex flex-col gap-5 min-w-0">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={13} className="text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Benefício Potencial</p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatBRL(kpis.potencialTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.total} Epics no controle</p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-4" style={{ background: 'linear-gradient(135deg, #F0FDF4, #FFFFFF)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Benefício Validado</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 tracking-tight">{formatBRL(kpis.validadoTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.contagem.validado} Epics validados</p>
          </div>

          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FFFFFF)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-amber-500" />
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pendente de Validação</p>
            </div>
            <p className="text-2xl font-extrabold text-amber-700 tracking-tight">
              {formatBRL(Math.max(kpis.potencialTotal - kpis.validadoTotal, 0))}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {kpis.contagem.nao_validado} não validados · {kpis.contagem.em_validacao} em validação
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <SlidersHorizontal size={13} className="text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Taxa de Validação</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{kpis.taxaValidacao}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700" style={{ width: `${Math.max(kpis.taxaValidacao, 2)}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {kpis.comQualitativo} de {kpis.total} com justificativa qualitativa
            </p>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou chave (ex.: GL-501)"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </div>

            {/* Chips de status */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setStatusFiltro('todos')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFiltro === 'todos' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Todos ({kpis.total})
              </button>
              {(Object.keys(STATUS_CONFIG) as StatusValidacao[]).map(st => {
                const cfg = STATUS_CONFIG[st]
                const ativo = statusFiltro === st
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFiltro(ativo ? 'todos' : st)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
                    style={ativo
                      ? { background: cfg.text, color: 'white', borderColor: cfg.text }
                      : { background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                  >
                    {cfg.label} ({kpis.contagem[st]})
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setMostrarFiltros(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${mostrarFiltros ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <SlidersHorizontal size={13} /> Mais filtros
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown size={13} className="text-gray-300" />
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as Ordenacao)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none"
              >
                <option value="potencial_desc">Maior potencial</option>
                <option value="validado_desc">Maior validado</option>
                <option value="atualizado_desc">Atualizado recentemente</option>
                <option value="nome_asc">Nome (A-Z)</option>
              </select>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
              <select value={dominioFiltro} onChange={e => setDominioFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option value="todos">Todos os domínios</option>
                {dominios.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={sponsorFiltro} onChange={e => setSponsorFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option value="todos">Todos os sponsors</option>
                {sponsors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={labFiltro} onChange={e => setLabFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option value="todos">Todos os labs</option>
                {labs.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {filtrosAtivos && (
                <button onClick={limparFiltros} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium ml-1">
                  <X size={12} /> Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Tabela ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex-1">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando <strong className="text-gray-600">{filtrados.length}</strong> de {kpis.total} Epics
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 12.5 }}>
              <thead>
                <tr className="border-b border-gray-100" style={{ background: '#FAFAFA' }}>
                  {['Epic', 'Domínio', 'Sponsor', 'Status', 'Benefício Potencial', 'Benefício Validado', 'Diferença', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 10 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r, i) => {
                  const st = statusOf(r)
                  const cfg = STATUS_CONFIG[st]
                  const Icon = cfg.icon
                  const validado = r.validacao?.beneficioValidado ?? null
                  const potencial = r.beneficioPotencial ?? 0
                  const diff = validado !== null ? validado - potencial : null
                  return (
                    <tr
                      key={r.key}
                      onClick={() => setSelecionado(r)}
                      className="border-b border-gray-50 hover:bg-red-50/40 cursor-pointer transition-colors"
                      style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.6)' : undefined }}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-gray-800 truncate max-w-[220px]">{r.nome}</p>
                        <p className="text-gray-400 font-mono" style={{ fontSize: 10 }}>{r.key}</p>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{r.dominio ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{r.sponsor ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold border"
                          style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border, fontSize: 10.5 }}
                        >
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">
                        {r.beneficioPotencial ? formatBRLFull(r.beneficioPotencial) : <span className="text-gray-300 font-normal">—</span>}
                      </td>
                      <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: validado !== null ? '#15803D' : undefined }}>
                        {validado !== null ? formatBRLFull(validado) : <span className="text-gray-300 font-normal">—</span>}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {diff !== null ? (
                          <span className={diff >= 0 ? 'text-emerald-600' : 'text-red-600'} style={{ fontSize: 11.5, fontWeight: 600 }}>
                            {diff >= 0 ? '+' : '-'}{formatBRL(Math.abs(diff))}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-gray-300 text-xs">Ver detalhe →</span>
                      </td>
                    </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Nenhum Epic encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selecionado && (
        <BeneficioDetailDrawer
          row={selecionado}
          canEdit={canEdit}
          onClose={() => setSelecionado(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
