'use client'

import { useState, useMemo } from 'react'
import { DashboardData } from '@/lib/types'
import { formatBRL, META_LABELS } from '@/lib/mappers'
import { Filter, X, Search } from 'lucide-react'

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
      <p className="text-gray-500 mb-1 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-red-400"
        style={{ fontSize: 11 }}
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

  const [search,   setSearch]   = useState('')
  const [mercado,  setMercado]  = useState('')
  const [sponsor,  setSponsor]  = useState('')
  const [lab,      setLab]      = useState('')
  const [status,   setStatus]   = useState('')
  const [impactos, setImpactos] = useState<string[]>([])

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
    <div className="flex flex-col gap-3">
      {/* Row 1: Resumo + Filtros */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[300px_1fr]">

        {/* Resumo */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Resumo do Portfólio
          </p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div>
              <p className="text-gray-400 uppercase tracking-wider" style={{ fontSize: 9 }}>Total de experimentos</p>
              <p className="font-bold text-gray-900" style={{ fontSize: 24, lineHeight: 1.1 }}>{epics.length}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider" style={{ fontSize: 9 }}>Filtrados</p>
              <p className="font-bold text-gray-900" style={{ fontSize: 24, lineHeight: 1.1 }}>{filtered.length}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider" style={{ fontSize: 9 }}>Benefício potencial</p>
              <p className="font-bold text-gray-900" style={{ fontSize: 18, lineHeight: 1.1 }}>{formatBRL(filteredBeneficio)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider" style={{ fontSize: 9 }}>Ef. Operacional / Receita / Exp. Cliente</p>
              <p className="font-bold text-gray-900" style={{ fontSize: 16, lineHeight: 1.1 }}>
                {filteredMetas.EBITDA} / {filteredMetas.Receita} / {filteredMetas.NPS}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            {/* Buscar */}
            <div>
              <p className="text-gray-500 mb-1 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>
                Buscar
              </p>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome, sponsor, lab..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-6 pr-2 py-1.5 text-gray-700 focus:outline-none focus:border-red-400"
                  style={{ fontSize: 11 }}
                />
              </div>
            </div>

            <Select label="Mercado"        value={mercado} onChange={setMercado} options={mercadoOptions} />
            <Select label="Sponsor"        value={sponsor} onChange={setSponsor} options={sponsorOptions} />
            <Select label="Lab responsável" value={lab}    onChange={setLab}     options={labOptions}     />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select label="Status" value={status} onChange={setStatus} options={statusOptions} />

            <div>
              <p className="text-gray-500 mb-1 uppercase font-semibold tracking-widest" style={{ fontSize: 9 }}>
                Impacto
              </p>
              <div className="flex items-center gap-4 h-[30px]">
                {(['EBITDA', 'Receita', 'NPS'] as const).map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer select-none">
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Lista completa de experimentos ({filtered.length})
          </p>
          <span className="text-xs text-gray-400">{filtered.length} registros</span>
        </div>

        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 370px)' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                {[
                  { label: 'Experimento',     wide: true  },
                  { label: 'Sponsor',         wide: false },
                  { label: 'Lab',             wide: false },
                  { label: 'Mercado',         wide: false },
                  { label: 'Status',          wide: false },
                  { label: 'Benefício Potencial Estimado', wide: false },
                  { label: 'Alinhamentos',    wide: false },
                ].map(col => (
                  <th
                    key={col.label}
                    className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap"
                    style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: col.wide ? 260 : undefined }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.key}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{e.nome}</p>
                    <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                    {e.sponsor ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                    {e.timeResponsavel ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
                    {e.mercado}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ fontSize: 11 }}>
                    <span className="text-gray-700">{e.status.name}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ fontSize: 11, color: '#CC0000' }}>
                    {e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}
                  </td>
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
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum experimento encontrado com os filtros aplicados.
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
