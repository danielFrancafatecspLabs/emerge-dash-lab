'use client'

import { useState, useEffect } from 'react'
import { Flag, TrendingDown, TrendingUp, Brain, DollarSign, Loader2, AlertTriangle } from 'lucide-react'

interface KR {
  label: string
  base: string
  meta: string
  atual: string
  pct: string
}

interface Objetivo {
  titulo: string
  krs: KR[]
}

interface OkrResponse {
  objetivos: Objetivo[]
  atualizadoEm: string
}

// Ícones por palavra-chave no label do KR
function getKrIcon(label: string): React.ElementType {
  const l = label.toLowerCase()
  if (l.includes('tempo') || l.includes('reduzir')) return TrendingDown
  if (l.includes('financeiro') || l.includes('valor')) return DollarSign
  if (l.includes('ia') || l.includes('inteligência')) return Brain
  return TrendingUp
}

function getPctColor(pct: string): string {
  const v = parseFloat(pct.replace('%', '').replace(',', '.'))
  if (v >= 80) return 'text-green-600'
  if (v >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getPctBg(pct: string): string {
  const v = parseFloat(pct.replace('%', '').replace(',', '.'))
  if (v >= 80) return 'bg-green-100'
  if (v >= 50) return 'bg-yellow-100'
  return 'bg-red-100'
}

function getProgressWidth(pct: string): string {
  const v = parseFloat(pct.replace('%', '').replace(',', '.'))
  return `${Math.min(v, 100)}%`
}

function getProgressColor(pct: string): string {
  const v = parseFloat(pct.replace('%', '').replace(',', '.'))
  if (v >= 80) return '#16a34a'
  if (v >= 50) return '#ca8a04'
  return '#dc2626'
}

export default function OkrContent() {
  const [data, setData] = useState<OkrResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchOkrs() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/jira/api/okrs')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: OkrResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOkrs()
    return () => { cancelled = true }
  }, [])

  // Loading
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ marginTop: 52 }}>
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Carregando OKRs...</p>
        </div>
      </div>
    )
  }

  // Erro
  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ marginTop: 52 }}>
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <AlertTriangle size={32} className="text-yellow-500" />
          <p className="text-sm">Erro ao carregar OKRs</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const { objetivos, atualizadoEm } = data

  return (
    <div className="flex-1 p-3 gap-4 flex flex-col" style={{ marginTop: 52 }}>
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ background: '#8B0000' }}>
            <Flag size={20} color="white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">beOn Labs | OKRs Q3 2026</h1>
            <p className="text-xs text-gray-400">Time: P&amp;D</p>
          </div>
          <p className="text-xs text-gray-400">
            Atualizado: {new Date(atualizadoEm).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Objetivos e KRs */}
      {objetivos.map((obj, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Título do Objetivo */}
          <div className="px-4 py-3 border-b border-gray-100" style={{ background: '#fafafa' }}>
            <h2 className="text-sm font-semibold text-gray-700">{obj.titulo}</h2>
          </div>

          {/* Tabela de KRs */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="text-left px-4 py-2 font-medium">Key Result</th>
                  <th className="text-center px-3 py-2 font-medium w-16">Base</th>
                  <th className="text-center px-3 py-2 font-medium w-16">Meta</th>
                  <th className="text-center px-3 py-2 font-medium w-20">Atual</th>
                  <th className="text-center px-3 py-2 font-medium w-28">% Atingido</th>
                </tr>
              </thead>
              <tbody>
                {obj.krs.map((kr, j) => {
                  const Icon = getKrIcon(kr.label)
                  return (
                    <tr key={j} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700">{kr.label}</span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 text-gray-400">0</td>
                      <td className="text-center px-3 py-3 text-gray-400">0</td>
                      <td className="text-center px-3 py-3 text-gray-400">0</td>
                      <td className="text-center px-3 py-3 text-gray-400">0%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Rodapé */}
      <p className="text-xs text-gray-400 text-center">
        Dados calculados automaticamente via Jira API — Q3 2026 (Julho–Setembro)
      </p>
    </div>
  )
}