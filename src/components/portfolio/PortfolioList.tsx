'use client'

import { useState, useMemo } from 'react'
import { DashboardData, EpicDetail } from '@/lib/types'
import { formatBRL, META_LABELS } from '@/lib/mappers'
import { Filter, X, Search, Eye, ChevronDown, TrendingUp, Users, DollarSign, Maximize2, Minimize2, Target, Layers, Zap } from 'lucide-react'
import ExperimentoModal from '@/components/dashboard/ExperimentoModal'

interface Props { data: DashboardData }

const IMPACTO_COLORS: Record<string, { background: string; color: string }> = {
  'EBITDA':  { background: '#DBEAFE', color: '#1D4ED8' },
  'Receita': { background: '#DCFCE7', color: '#166534' },
  'NPS':     { background: '#FEE2E2', color: '#991B1B' },
}

function Select({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
      >
        <option value="">Todos</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function PortfolioList({ data }: Props) {
  const epics = useMemo(
    () => [...data.allEpics].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)),
    [data.allEpics]
  )

  const [search,       setSearch]       = useState('')
  const [mercado,      setMercado]      = useState('')
  const [sponsor,      setSponsor]      = useState('')
  const [lab,          setLab]          = useState('')
  const [status,       setStatus]       = useState('')
  const [impactos,     setImpactos]     = useState<string[]>([])
  const [selectedEpic, setSelectedEpic] = useState<EpicDetail | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    sponsor: true,
    lab: true,
    mercado: true,
    statusDetalhado: true,
    alinhamentos: true,
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const mercadoOptions = useMemo(() =>
    Array.from(new Set(epics.map(e => e.mercado))).sort(), [epics])

  const sponsorOptions = useMemo(() =>
    Array.from(new Set(epics.map(e => e.sponsor).filter((s): s is string => !!s))).sort(), [epics])

  const labOptions = useMemo(() =>
    Array.from(new Set(epics.map(e => e.timeResponsavel).filter((s): s is string => !!s))).sort(), [epics])

  const statusOptions = useMemo(() =>
    Array.from(new Set(epics.map(e => e.status.name))).sort(), [epics])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return epics.filter(e => {
      if (q) {
        const inNome    = e.nome.toLowerCase().includes(q)
        const inSponsor = (e.sponsor ?? '').toLowerCase().includes(q)
        const inLab     = (e.timeResponsavel ?? '').toLowerCase().includes(q)
        if (!inNome && !inSponsor && !inLab) return false
      }
      if (mercado && e.mercado !== mercado) return false
      if (sponsor && e.sponsor !== sponsor) return false
      if (lab    && e.timeResponsavel !== lab) return false
      if (status && e.status.name !== status) return false
      if (impactos.length > 0 && !impactos.includes(e.metaCategoria ?? '')) return false
      return true
    })
  }, [epics, search, mercado, sponsor, lab, status, impactos])

  const hasFilter = !!(search || mercado || sponsor || lab || status || impactos.length > 0)

  function clearFilters() {
    setSearch(''); setMercado(''); setSponsor('')
    setLab(''); setStatus(''); setImpactos([])
  }

  function toggleImpacto(v: string) {
    setImpactos(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const filteredBeneficio = filtered.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
  const filteredMetas = {
    EBITDA:  filtered.filter(e => e.metaCategoria === 'EBITDA').length,
    Receita: filtered.filter(e => e.metaCategoria === 'Receita').length,
    NPS:     filtered.filter(e => e.metaCategoria === 'NPS').length,
  }
  const totalMetas = filteredMetas.EBITDA + filteredMetas.Receita + filteredMetas.NPS
  const pctEBITDA  = totalMetas > 0 ? (filteredMetas.EBITDA  / totalMetas * 100).toFixed(0) : '0'
  const pctReceita = totalMetas > 0 ? (filteredMetas.Receita / totalMetas * 100).toFixed(0) : '0'
  const pctNPS     = totalMetas > 0 ? (filteredMetas.NPS     / totalMetas * 100).toFixed(0) : '0'

  // Agregações para o resumo
  const activeCount   = epics.filter(e => !['Concluído','Cancelado'].includes(e.status.name)).length
  const concludedCount = epics.filter(e => e.status.name === 'Concluído').length

  return (
    <>
    <div className="flex flex-col gap-4">
      {/* ===== RESUMO DO PORTFÓLIO (SEMPRE VISÍVEL) ===== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cabeçalho do resumo */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-50 rounded-lg">
              <Zap size={16} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Resumo do Portfólio</h2>
              <p className="text-xs text-gray-400">Visão consolidada dos experimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Total: <strong className="text-gray-700">{epics.length}</strong></span>
            <span className="w-px h-4 bg-gray-200" />
            <span>Ativos: <strong className="text-green-600">{activeCount}</strong></span>
            <span className="w-px h-4 bg-gray-200" />
            <span>Concluídos: <strong className="text-blue-600">{concludedCount}</strong></span>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card: Total de Experimentos */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Layers size={22} className="text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Experimentos</p>
              <p className="text-2xl font-extrabold text-gray-900">{epics.length}</p>
              {hasFilter && (
                <p className="text-xs text-amber-600 mt-0.5">{filtered.length} exibidos com filtros</p>
              )}
            </div>
          </div>

          {/* Card: Benefício Potencial */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <DollarSign size={22} className="text-green-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">Benefício Potencial</p>
              <p className="text-xl font-extrabold text-gray-900 truncate">{formatBRL(filteredBeneficio)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Estimado dos experimentos</p>
            </div>
          </div>

          {/* Card: Distribuição por Impacto */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-purple-600" />
              <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider">Distribuição por Impacto</p>
            </div>
            <div className="space-y-2.5">
              {/* EBITDA */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 w-16">EBITDA</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctEBITDA}%`, background: IMPACTO_COLORS.EBITDA?.background ?? '#F59E0B' }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-10 text-right">{filteredMetas.EBITDA}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pctEBITDA}%</span>
              </div>
              {/* Receita */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 w-16">Receita</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctReceita}%`, background: IMPACTO_COLORS.Receita?.background ?? '#3B82F6' }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-10 text-right">{filteredMetas.Receita}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pctReceita}%</span>
              </div>
              {/* NPS */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 w-16">NPS</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctNPS}%`, background: IMPACTO_COLORS.NPS?.background ?? '#10B981' }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-10 text-right">{filteredMetas.NPS}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pctNPS}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTROS + TABELA ===== */}
      <div className={`grid gap-4 ${isMaximized ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr]'}`}>
        {/* Filtros */}
        {!isMaximized && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Cabeçalho dos filtros */}
            <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Filtros</p>
                {hasFilter && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    {[
                      search ? 1 : 0,
                      mercado ? 1 : 0,
                      sponsor ? 1 : 0,
                      lab ? 1 : 0,
                      status ? 1 : 0,
                      impactos.length,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </div>
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                >
                  <X size={12} /> Limpar todos
                </button>
              )}
            </div>

            {/* Corpo dos filtros */}
            <div className="p-4 space-y-3">
              {/* Linha 1: Busca + Mercado + Sponsor + Lab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nome, sponsor, lab..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                    />
                  </div>
                </div>
                <Select label="Mercado"        value={mercado} onChange={setMercado} options={mercadoOptions} />
                <Select label="Sponsor"        value={sponsor} onChange={setSponsor} options={sponsorOptions} />
                <Select label="Lab responsável" value={lab}    onChange={setLab}     options={labOptions}     />
              </div>

              {/* Linha 2: Status + Impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select label="Status" value={status} onChange={setStatus} options={statusOptions} />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Impacto</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {(['EBITDA', 'Receita', 'NPS'] as const).map(v => (
                      <label
                        key={v}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all text-sm ${
                          impactos.includes(v)
                            ? 'border-red-300 bg-red-50 text-red-700 font-semibold'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={impactos.includes(v)}
                          onChange={() => toggleImpacto(v)}
                          className="sr-only"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: IMPACTO_COLORS[v]?.background ?? '#9CA3AF' }}
                        />
                        {META_LABELS[v] ?? v}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chips de filtros ativos */}
              {hasFilter && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400 mr-1">Ativos:</span>
                  {search && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                      Busca: "{search}"
                      <button onClick={() => setSearch('')} className="hover:text-red-600"><X size={10} /></button>
                    </span>
                  )}
                  {mercado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                      Mercado: {mercado}
                      <button onClick={() => setMercado('')} className="hover:text-red-600"><X size={10} /></button>
                    </span>
                  )}
                  {sponsor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">
                      Sponsor: {sponsor}
                      <button onClick={() => setSponsor('')} className="hover:text-red-600"><X size={10} /></button>
                    </span>
                  )}
                  {lab && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">
                      Lab: {lab}
                      <button onClick={() => setLab('')} className="hover:text-red-600"><X size={10} /></button>
                    </span>
                  )}
                  {status && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs">
                      Status: {status}
                      <button onClick={() => setStatus('')} className="hover:text-red-600"><X size={10} /></button>
                    </span>
                  )}
                  {impactos.map(v => (
                    <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs">
                      {META_LABELS[v] ?? v}
                      <button onClick={() => toggleImpacto(v)} className="hover:text-red-900"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Lista completa de experimentos ({filtered.length})
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filtered.length} registros</span>
            <button
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => setIsMaximized(s => !s)}
              aria-label={isMaximized ? 'Restaurar visão' : 'Maximizar visão'}
              title={isMaximized ? 'Restaurar visão' : 'Maximizar visão'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <div className="relative">
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setShowColumnMenu(s => !s)}
                aria-label="Mostrar/ocultar colunas"
              >
                <Eye size={14} />
                <ChevronDown size={12} className="inline-block ml-1" />
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-20 p-2 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Colunas</span>
                    <button className="text-xs text-gray-500" onClick={() => setVisibleColumns({ sponsor: true, lab: true, mercado: true, statusDetalhado: true, alinhamentos: true })}>Restaurar</button>
                  </div>
                  {([
                    ['Sponsor', 'sponsor'],
                    ['Lab', 'lab'],
                    ['Mercado', 'mercado'],
                    ['Status Detalhado', 'statusDetalhado'],
                    ['Alinhamentos', 'alinhamentos'],
                  ] as [string, keyof typeof visibleColumns][]).map(([label, key]) => (
                    <label key={key} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="w-3 h-3"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 260 }}>Experimento</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Prioridade</th>
                  {visibleColumns.sponsor && (<th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Sponsor</th>)}
                  {visibleColumns.lab && (<th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Lab</th>)}
                  {visibleColumns.mercado && (<th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Mercado</th>)}
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Status</th>
                  {visibleColumns.statusDetalhado && (<th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Status Detalhado</th>)}
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Benefício Potencial Estimado</th>
                  {visibleColumns.alinhamentos && (<th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Alinhamentos</th>)}
                </>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.key}
                  className="border-b border-gray-50 hover:bg-red-50 transition-colors cursor-pointer"
                  style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                  onClick={() => setSelectedEpic(e)}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{e.nome}</p>
                    <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap" style={{ fontSize: 11 }}>
                    {e.prioridade ?? '—'}
                  </td>
                  {visibleColumns.sponsor && (
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                      {e.sponsor ?? '—'}
                    </td>
                  )}
                  {visibleColumns.lab && (
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                      {e.timeResponsavel ?? '—'}
                    </td>
                  )}
                  {visibleColumns.mercado && (
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                      {e.mercado}
                    </td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap" style={{ fontSize: 11 }}>
                    <span className="text-gray-700">{e.status.name}</span>
                  </td>
                  {visibleColumns.statusDetalhado && (
                    <td className="px-3 py-2 text-gray-600" style={{ fontSize: 11, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.statusDetalhado ?? '—'}
                    </td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ fontSize: 11, color: '#CC0000' }}>
                    {e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}
                  </td>
                  {visibleColumns.alinhamentos && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e.metaCategoria ? (
                        <span
                          className="px-1.5 py-0.5 rounded font-semibold"
                          style={{ fontSize: 10, ...(IMPACTO_COLORS[e.metaCategoria] ?? { background: '#F3F4F6', color: '#374151' }) }}
                        >
                          {META_LABELS[e.metaCategoria] ?? e.metaCategoria}
                        </span>
                      ) : (
                        <span className="text-gray-400" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum experimento encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {selectedEpic && (
      <ExperimentoModal epic={selectedEpic} onClose={() => setSelectedEpic(null)} />
    )}
  </>
  )
}
