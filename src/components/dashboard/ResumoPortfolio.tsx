'use client'

import { useState } from 'react'
import { DashboardData } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import { List } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

export default function ResumoPortfolio({ data }: Props) {
  const [open, setOpen] = useState(false)

  const totalIniciativasAtivas =
    data.pipeline.BACKLOG +
    data.pipeline['EM REFINAMENTO'] +
    data.pipeline['PRONTO PARA EXECUÇÃO'] +
    data.pipeline['EM EXPERIMENTAÇÃO'] +
    data.pipeline['AGUARDANDO PILOTO'] +
    data.pipeline['EM PILOTO']

  const kpis = [
    { value: String(totalIniciativasAtivas),          label: 'Iniciativas ativas' },
    { value: formatBRL(data.beneficioTotal),           label: 'Benefício potencial' },
    { value: String(data.iniciativasAguardandoPiloto), label: 'Iniciativas aguardando piloto' },
    { value: String(data.iniciativasEmPiloto),         label: 'Iniciativas em piloto' },
  ]

  return (
    <>
      <div className="bg-white rounded-lg p-4 h-full border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Resumo do Portfólio
          </p>
          <button
            onClick={() => setOpen(true)}
            className="rounded p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Ver todos os experimentos"
          >
            <List size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 h-full">
          {kpis.map(k => (
            <div key={k.label} className="flex flex-col justify-center">
              <span className="font-bold text-gray-900 leading-none" style={{ fontSize: 22 }}>
                {k.value}
              </span>
              <span className="text-gray-500 mt-1 leading-tight" style={{ fontSize: 11 }}>
                {k.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <EpicModal
          title="Todos os Experimentos"
          epics={data.allEpics}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
