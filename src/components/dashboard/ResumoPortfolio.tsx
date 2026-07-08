'use client'

import { useState } from 'react'
import { DashboardData, Iniciativa } from '@/lib/types'
import { formatBRL, getPipelineStage, getPipelineConversionRate } from '@/lib/mappers'
import IniciativaModal from './IniciativaModal'

interface Props { data: DashboardData }

export default function ResumoPortfolio({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ title: string; items: Iniciativa[] } | null>(null)

  const totalIniciativas = data.iniciativas.length
  const escalaCount = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA').length
  // Taxas fixas solicitadas
  const taxaEscala = '6%'
  const taxaPiloto = '11.54%'
  const escaladoIniciativas = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')

  const kpis = [
    {
      value: formatBRL(data.beneficioTotal),
      label: 'Benefício potencial do portfólio',
      details: escaladoIniciativas,
      detailLabel: 'Benefício potencial do portfólio',
      showDetails: false,
    },
    {
      value: taxaEscala,
      label: 'Taxa de conversão para escala',
      details: escaladoIniciativas,
      detailLabel: 'Iniciativas em escala',
      showDetails: true,
    },
    {
      value: taxaPiloto,
      label: 'Taxa de conversão para piloto',
      details: [],
      detailLabel: 'Taxa de conversão para piloto',
      showDetails: false,
    },
  ]

  return (
    <>
      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.3em]">
              Resumo do Portfólio
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Conversão do pipeline
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
            title="Ver detalhes das iniciativas relacionadas"
          >
            Ver detalhes
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl border border-gray-100 p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">
                    {k.label}
                  </p>
                  <p className="font-semibold text-gray-900" style={{ fontSize: 18 }}>
                    {k.value}
                  </p>
                </div>
                {k.showDetails && (
                  <button
                    onClick={() => {
                      setSelected({ title: k.detailLabel, items: k.details })
                      setOpen(true)
                    }}
                    className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition"
                    title={`Ver detalhes de ${k.label}`}
                  >
                    Ver detalhes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && selected && (
        <IniciativaModal
          title={selected.title}
          iniciativas={selected.items}
          onClose={() => {
            setOpen(false)
            setSelected(null)
          }}
        />
      )}
    </>
  )
}
