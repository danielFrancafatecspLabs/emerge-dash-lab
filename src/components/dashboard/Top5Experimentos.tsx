'use client'

import { useState } from 'react'
import { DashboardData, EpicDetail } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

export default function Top5Experimentos({ data }: Props) {
  const [selected, setSelected] = useState<EpicDetail | null>(null)
  const top5 = data.top5Epics
  const maxValor = Math.max(...top5.map(e => e.beneficioQuantitativo ?? 0), 1)

  if (top5.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-6 text-center text-gray-400" style={{ fontSize: 11 }}>
        Nenhum experimento com valor potencial informado
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {top5.map((e, i) => {
          const barPct = Math.round(((e.beneficioQuantitativo ?? 0) / maxValor) * 100)
          return (
            <div
              key={e.key}
              onClick={() => setSelected(e)}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 -mx-2 cursor-pointer hover:bg-gray-50 transition-colors"
              title="Ver detalhe"
            >
              <span
                className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                style={{ width: 18, height: 18, fontSize: 9, background: '#CC0000', marginTop: 1 }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800 truncate" style={{ fontSize: 11.5 }}>{e.nome}</span>
                  <span className="font-bold flex-shrink-0" style={{ fontSize: 11.5, color: '#CC0000' }}>
                    {e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}
                  </span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }}
                  />
                </div>
                <p className="text-gray-400 truncate mt-1" style={{ fontSize: 10 }}>
                  {e.timeResponsavel ?? '—'} · {e.dominio ?? '—'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <EpicModal
          title={selected.nome}
          epics={[selected]}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
