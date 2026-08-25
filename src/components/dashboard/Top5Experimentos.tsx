'use client'

import { useState } from 'react'
import { DashboardData, EpicDetail } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import { List } from 'lucide-react'
import EpicModal from './EpicModal'

interface Props { data: DashboardData }

export default function Top5Experimentos({ data }: Props) {
  const [selected, setSelected] = useState<EpicDetail | null>(null)

  return (
    <>
      <div className="overflow-auto min-h-0">
        <table className="w-full" style={{ fontSize: 11 }}>
          <thead>
            <tr className="border-b border-gray-200">
              {['Experimento', 'Lab Responsável', 'Domínio', 'Valor Potencial', ''].map(h => (
                <th key={h} className="text-left pb-2 text-gray-500 font-semibold pr-1 md:pr-2 whitespace-nowrap" style={{ fontSize: 10 }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.top5Epics.map((e, i) => (
              <tr key={e.key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 pr-1 md:pr-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                      style={{ width: 20, height: 20, fontSize: 10, background: '#CC0000' }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800 truncate max-w-[100px] md:max-w-[160px]">
                      {e.nome}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 pr-1 md:pr-2 text-gray-600 truncate max-w-[80px] md:max-w-[120px]">{e.timeResponsavel ?? '—'}</td>
                <td className="py-1.5 pr-1 md:pr-2 text-gray-600 truncate max-w-[70px] md:max-w-[100px]">{e.dominio ?? '—'}</td>
                <td className="py-1.5 font-semibold whitespace-nowrap" style={{ color: '#CC0000' }}>
                  {e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}
                </td>
                <td className="py-1.5 pl-1">
                  <button
                    onClick={() => setSelected(e)}
                    className="rounded p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    title="Ver detalhe"
                  >
                    <List size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {data.top5Epics.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                  Nenhum experimento com valor potencial informado
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
