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
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-full">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Top 5 Experimentos por Valor Potencial
        </p>
        <table className="w-full" style={{ fontSize: 11 }}>
          <thead>
            <tr className="border-b border-gray-200">
              {['Experimento', 'Lab Responsável', 'Domínio', 'Meta', 'Valor Potencial', ''].map(h => (
                <th key={h} className="text-left pb-2 text-gray-500 font-semibold pr-2" style={{ fontSize: 9 }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.top5Epics.map((e, i) => (
              <tr key={e.key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                      style={{ width: 18, height: 18, fontSize: 9, background: '#CC0000' }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800 truncate" style={{ maxWidth: 160 }}>
                      {e.nome}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-2 text-gray-600">{e.timeResponsavel ?? '—'}</td>
                <td className="py-2 pr-2 text-gray-600">{e.dominio ?? '—'}</td>
                <td className="py-2 pr-2 text-gray-600">{e.metaCategoria ?? '—'}</td>
                <td className="py-2 font-semibold" style={{ color: '#CC0000' }}>
                  {e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}
                </td>
                <td className="py-2 pl-1">
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
                <td colSpan={6} className="py-4 text-center text-gray-400 text-xs">
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
