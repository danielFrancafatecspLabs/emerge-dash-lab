'use client'

import { useState, useMemo } from 'react'
import { DashboardData, EpicDetail } from '@/lib/types'
import { formatBRL, META_LABELS } from '@/lib/mappers'
import { Filter, X, Search, Eye, ChevronDown, TrendingUp, Users, DollarSign, Maximize2, Minimize2 } from 'lucide-react'
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
      <p className="text-gray-500 mb-0 uppercase font-semibold tracking-widest" style={{ fontSize: 8 }}>
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:border-red-400"
        style={{ fontSize: 10 }}
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

  return (
    <>
    <div className="flex flex-col gap-3">
      {/* Row 1: Resumo + Filtros */}
      <div className={`grid gap-3 ${isMaximized ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[300px_1fr]'}`}>

        {/* Resumo */}
        {!isMaximized && (
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Resumo do Portfólio</p>
              <h2 className="text-lg font-extrabold text-gray-900">Visão Executiva</h2>
              <p className="text-sm text-gray-500 mt-1">Resumo consolidado e filtros rápidos para tomada de decisão</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Total de Experimentos</p>
                <p className="text-xl font-bold text-gray-900">{epics.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-full">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Filtrados</p>
                <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-full">
                <DollarSign size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Benefício Potencial</p>
                <p className="text-xl font-bold text-gray-900">{formatBRL(filteredBeneficio)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">Ef. Operacional / Receita / Exp. Cliente: <span className="font-semibold text-gray-900">{filteredMetas.EBITDA} / {filteredMetas.Receita} / {filteredMetas.NPS}</span></div>
        </div>
        )}

        {/* Filtros */}
        {!isMaximized && (
          <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm" style={{ minHeight: 72 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Filter size={12} color="#6B7280" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Filtros</p>
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium hover:text-red-800 transition-colors"
                style={{ color: '#CC0000' }}
              >
                <X size={11} /> Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-1">
            {/* Buscar */}
            <div>
              <p className="text-gray-500 mb-0 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>
                Buscar
              </p>
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome, sponsor, lab..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-7 pr-2 py-1 text-gray-700 focus:outline-none focus:border-red-400"
                  style={{ fontSize: 10 }}
                />
              </div>
            </div>

            <Select label="Mercado"        value={mercado} onChange={setMercado} options={mercadoOptions} />
            <Select label="Sponsor"        value={sponsor} onChange={setSponsor} options={sponsorOptions} />
            <Select label="Lab responsável" value={lab}    onChange={setLab}     options={labOptions}     />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1">
              <Select label="Status" value={status} onChange={setStatus} options={statusOptions} />
            </div>

            <div className="sm:col-span-2">
              <p className="text-gray-500 mb-0 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>Impacto</p>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                {(['EBITDA', 'Receita', 'NPS'] as const).map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={impactos.includes(v)}
                      onChange={() => toggleImpacto(v)}
                      className="accent-red-600 w-3 h-3"
                    />
                    <span style={{ fontSize: 11 }}>{META_LABELS[v] ?? v}</span>
                  </label>
                ))}
              </div>
            </div>
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
