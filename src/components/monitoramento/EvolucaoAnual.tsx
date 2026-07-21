'use client'

import { useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChevronDown } from 'lucide-react'

// ── Tipos ──

interface EvolucaoAnualProps {
  epics: {
    key: string
    nome: string
    criadoEm: string | null
    beneficioQuantitativo: number | null
    status: { name: string }
    sponsor: string | null
    dominio: string | null
  }[]
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type PeriodoFiltro =
  | { tipo: 'ultimos12' }
  | { tipo: 'total' }
  | { tipo: 'semestre'; ano: number; semestre: 1 | 2 }

const STATUS_CONCLUIDO = new Set(['Concluído', 'FINALIZADO', 'CANCELADO'])

// Cores por ano (cíclicas)
const CORES_ANO = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#F97316', '#EC4899', '#06B6D4', '#84CC16']

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// ── Componente ──

export default function EvolucaoAnual({ epics }: EvolucaoAnualProps) {
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>()
    for (const e of epics) {
      if (e.criadoEm) {
        const ano = new Date(e.criadoEm).getFullYear()
        if (ano >= 2024) anos.add(ano)
      }
    }
    return Array.from(anos).sort()
  }, [epics])

  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    () => anosDisponiveis[anosDisponiveis.length - 1] ?? new Date().getFullYear()
  )
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>({ tipo: 'ultimos12' })
  const [periodoAberto, setPeriodoAberto] = useState(false)

  // Opções de período (semestres gerados dinamicamente)
  const periodos = useMemo(() => {
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const opcoes: { label: string; value: PeriodoFiltro }[] = [
      { label: 'Últimos 12 meses', value: { tipo: 'ultimos12' } },
      { label: 'Total (todos os períodos)', value: { tipo: 'total' } },
    ]
    // Gera semestres para o ano atual e anterior
    for (let ano = anoAtual; ano >= 2024; ano--) {
      opcoes.push({ label: `1º Semestre ${ano}`, value: { tipo: 'semestre', ano, semestre: 1 } })
      opcoes.push({ label: `2º Semestre ${ano}`, value: { tipo: 'semestre', ano, semestre: 2 } })
    }
    return opcoes
  }, [anosDisponiveis])

  // Label do período atual
  const periodoLabel = useMemo(() => {
    return periodos.find(p =>
      p.value.tipo === periodoSelecionado.tipo &&
      (p.value.tipo === 'ultimos12' || p.value.tipo === 'total' ||
        (p.value.tipo === 'semestre' && periodoSelecionado.tipo === 'semestre' &&
         p.value.ano === periodoSelecionado.ano && p.value.semestre === periodoSelecionado.semestre))
    )?.label ?? 'Últimos 12 meses'
  }, [periodoSelecionado, periodos])

  // ── Timeline contínua baseada no período selecionado ──
  const timeline = useMemo(() => {
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const mesAtual = hoje.getMonth() // 0-indexed

    // Determina os meses que compõem o período
    let labels: { label: string; ano: number; mesIdx: number }[] = []

    if (periodoSelecionado.tipo === 'ultimos12') {
      // Últimos 12 meses: do mês atual para trás
      for (let i = 11; i >= 0; i--) {
        const d = new Date(anoAtual, mesAtual - i, 1)
        labels.push({
          label: `${MESES[d.getMonth()].toLowerCase()}/${String(d.getFullYear()).slice(2)}`,
          ano: d.getFullYear(),
          mesIdx: d.getMonth(),
        })
      }
    } else if (periodoSelecionado.tipo === 'total') {
      // Total: do primeiro registro até o mês atual
      let primeiroAno = anoAtual
      let primeiroMes = mesAtual
      for (const e of epics) {
        if (!e.criadoEm) continue
        const d = new Date(e.criadoEm)
        if (d.getFullYear() < primeiroAno || (d.getFullYear() === primeiroAno && d.getMonth() < primeiroMes)) {
          primeiroAno = d.getFullYear()
          primeiroMes = d.getMonth()
        }
      }
      // Gera todos os meses do primeiro registro até o mês atual
      const totalMeses = (anoAtual - primeiroAno) * 12 + (mesAtual - primeiroMes) + 1
      for (let i = totalMeses - 1; i >= 0; i--) {
        const d = new Date(anoAtual, mesAtual - i, 1)
        labels.push({
          label: `${MESES[d.getMonth()].toLowerCase()}/${String(d.getFullYear()).slice(2)}`,
          ano: d.getFullYear(),
          mesIdx: d.getMonth(),
        })
      }
    } else if (periodoSelecionado.tipo === 'semestre') {
      const { ano, semestre } = periodoSelecionado
      const mesInicio = semestre === 1 ? 0 : 6 // Jan ou Jul
      const mesFim = semestre === 1 ? 5 : 11    // Jun ou Dez
      for (let m = mesInicio; m <= mesFim; m++) {
        labels.push({
          label: `${MESES[m].toLowerCase()}/${String(ano).slice(2)}`,
          ano,
          mesIdx: m,
        })
      }
    }

    // Conta concluídos por mês
    const rows = labels.map(l => ({
      label: l.label,
      concluidos: 0,
    }))

    for (const e of epics) {
      if (!e.criadoEm) continue
      const d = new Date(e.criadoEm)
      const ano = d.getFullYear()
      const mesIdx = d.getMonth()

      if (!STATUS_CONCLUIDO.has(e.status.name)) continue

      const idx = labels.findIndex(l => l.ano === ano && l.mesIdx === mesIdx)
      if (idx === -1) continue

      rows[idx].concluidos++
    }

    // Calcula acumulado
    let acum = 0
    for (const r of rows) {
      acum += r.concluidos
      ;(r as any).acumulado = acum
    }

    return rows
  }, [epics, periodoSelecionado])

  // ── Agregados anuais ──
  const { totalCriados, totalConcluidos, beneficioTotal, beneficioLabel } = useMemo(() => {
    let criados = 0
    let concluidos = 0
    let benef = 0
    for (const e of epics) {
      if (!e.criadoEm) continue
      const ano = new Date(e.criadoEm).getFullYear()
      if (ano !== anoSelecionado) continue
      criados++
      benef += e.beneficioQuantitativo ?? 0
      if (STATUS_CONCLUIDO.has(e.status.name)) concluidos++
    }
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const mesAtual = hoje.getMonth() // 0-indexed

    // Label dinâmico para o benefício potencial
    const beneficioLabel = anoSelecionado === anoAtual
      ? `Benefício Potencial até ${MESES[mesAtual]} de ${anoSelecionado}`
      : `Benefício Potencial em ${anoSelecionado}`

    return { totalCriados: criados, totalConcluidos: concluidos, beneficioTotal: benef, beneficioLabel }
  }, [epics, anoSelecionado])

  // ── Recorte dos últimos 12 meses ──
  const ultimos12Meses = useMemo(() => {
    const corte = new Date()
    corte.setMonth(corte.getMonth() - 12)
    let qtd = 0
    let benef = 0
    for (const e of epics) {
      if (!e.criadoEm) continue
      const d = new Date(e.criadoEm)
      if (d < corte) continue
      qtd++
      benef += e.beneficioQuantitativo ?? 0
    }
    return { qtd, benef }
  }, [epics])

  // ── Epics do ano filtrado ──
  const epicsDoAno = useMemo(() => {
    return epics
      .filter(e => {
        if (!e.criadoEm) return false
        return new Date(e.criadoEm).getFullYear() === anoSelecionado
      })
      .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
  }, [epics, anoSelecionado])

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho com filtros ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">Evolução da Experimentação</h2>
        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="relative">
            <button
              onClick={() => setPeriodoAberto(!periodoAberto)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {periodoLabel}
              <ChevronDown size={12} className={`transition-transform ${periodoAberto ? 'rotate-180' : ''}`} />
            </button>
            {periodoAberto && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                {periodos.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setPeriodoSelecionado(p.value); setPeriodoAberto(false) }}
                    className={`w-full text-left px-4 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                      p.label === periodoLabel ? 'font-semibold text-red-700 bg-red-50' : 'text-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Filtro de ano */}
          <div className="relative">
            <button
              onClick={() => setFiltroAberto(!filtroAberto)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {anoSelecionado}
              <ChevronDown size={14} className={`transition-transform ${filtroAberto ? 'rotate-180' : ''}`} />
            </button>
            {filtroAberto && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                {anosDisponiveis.map(ano => (
                  <button
                    key={ano}
                    onClick={() => { setAnoSelecionado(ano); setFiltroAberto(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      ano === anoSelecionado ? 'font-semibold text-red-700 bg-red-50' : 'text-gray-700'
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Big Numbers + Recorte 12 meses lado a lado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Big Numbers do ano */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Visão {anoSelecionado}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{totalCriados}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Criados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{totalConcluidos}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-700">{formatCurrency(beneficioTotal)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Benefício</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">{beneficioLabel}</p>
        </div>

        {/* Recorte últimos 12 meses */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Últimos 12 Meses</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{ultimos12Meses.qtd}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Criados</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-700">{formatCurrency(ultimos12Meses.benef)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Benefício</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráficos: acumulado + barras lado a lado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Acumulado */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Acumulado de Concluídos
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras mensais */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Concluídos por Mês
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="concluidos" name="Concluídos" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tabela de experimentos do ano ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Experimentos de {anoSelecionado} ({epicsDoAno.length})
          </p>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.06em', minWidth: 280 }}>Experimento</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Criado em</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Status</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Sponsor</th>
                <th className="px-3 py-2 text-left text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Domínio</th>
                <th className="px-3 py-2 text-right text-gray-400 font-semibold uppercase whitespace-nowrap" style={{ fontSize: 9 }}>Benefício</th>
              </tr>
            </thead>
            <tbody>
              {epicsDoAno.map((e, i) => (
                <tr
                  key={e.key}
                  className="border-b border-gray-50 hover:bg-blue-50 transition-colors"
                  style={{ background: i % 2 === 1 ? 'rgba(249,250,251,0.5)' : undefined }}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{e.nome}</p>
                    <p className="text-gray-400" style={{ fontSize: 9 }}>#{e.key}</p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                    {e.criadoEm ? new Date(e.criadoEm).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        STATUS_CONCLUIDO.has(e.status.name)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {e.status.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                    {e.sponsor || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600" style={{ fontSize: 11 }}>
                    {e.dominio || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-gray-800 font-medium" style={{ fontSize: 11 }}>
                    {e.beneficioQuantitativo ? formatCurrency(e.beneficioQuantitativo) : '—'}
                  </td>
                </tr>
              ))}

              {epicsDoAno.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum experimento encontrado para {anoSelecionado}.
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