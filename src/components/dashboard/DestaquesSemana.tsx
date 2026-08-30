'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Lightbulb, CheckCircle2, FlaskConical, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/lib/mappers'

interface DestaquesData {
  iniciativasNovasAgosto: number
  experimentosConcluidos: number
  novoLaboratorioCriado: number
  beneficioIncrementado30d: number
}

const DESTAQUE_ITENS = [
  {
    key: 'iniciativasNovasAgosto' as const,
    icon: Lightbulb,
    label: 'Novas Iniciativas',
    desc: 'criadas em agosto/2026',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-500',
    textColor: 'text-amber-800',
  },
  {
    key: 'experimentosConcluidos' as const,
    icon: CheckCircle2,
    label: 'Experimentos Concluídos',
    desc: 'no total do laboratório',
    color: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-500',
    textColor: 'text-emerald-800',
  },
  {
    key: 'novoLaboratorioCriado' as const,
    icon: FlaskConical,
    label: 'Novo Lab. de Experimentação',
    desc: 'criado em agosto/2026',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-500',
    textColor: 'text-purple-800',
  },
  {
    key: 'beneficioIncrementado30d' as const,
    icon: TrendingUp,
    label: 'Benefício Incrementado',
    desc: 'nos últimos 30 dias',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-800',
    format: (v: number) => formatBRL(v),
  },
]

export default function DestaquesSemana() {
  const [data, setData] = useState<DestaquesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/destaques', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json.error) {
          setError(json.error)
        } else {
          setData(json)
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
        <Sparkles size={14} className="animate-pulse" />
        <span>Carregando destaques...</span>
      </div>
    )
  }

  if (error || !data) {
    return null // silencioso se falhar
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} className="text-red-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#CC0000' }}>
          Destaques da Semana
        </p>
        <span className="text-[10px] text-gray-400 ml-1">— resumo rápido do que está acontecendo</span>
      </div>

      {/* Cards */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {DESTAQUE_ITENS.map(item => {
          const valor = data[item.key]
          const Icon = item.icon
          const isBeneficio = item.key === 'beneficioIncrementado30d'
          const displayValor = item.format ? item.format(valor) : valor

          return (
            <div
              key={item.key}
              className={`rounded-lg border ${item.color} p-3 flex items-center gap-3 transition-all hover:shadow-sm`}
            >
              <div className={`rounded-lg p-2 ${item.iconBg} shadow-sm flex-shrink-0`}>
                <Icon size={16} color="white" />
              </div>
              <div className="min-w-0">
                <p className={`text-lg font-extrabold tracking-tight leading-tight ${item.textColor}`}>
                  {isBeneficio ? displayValor : String(displayValor)}
                </p>
                <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                  {item.label}
                </p>
                <p className="text-[9px] text-gray-400 leading-tight mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}