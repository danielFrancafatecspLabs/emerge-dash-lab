'use client'

import { EpicDetail } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import { X } from 'lucide-react'

interface Props {
  title: string
  epics: EpicDetail[]
  onClose: () => void
}

const COLS: { label: string; render: (e: EpicDetail) => string | null }[] = [
  { label: 'Chave',         render: e => e.key },
  { label: 'Tipo',          render: e => e.tipo },
  { label: 'Experimento',   render: e => e.nome },
  { label: 'Status',        render: e => e.status.name },
  { label: 'Domínio',       render: e => e.dominio },
  { label: 'Meta',          render: e => e.metaCategoria },
  { label: 'Sponsor',       render: e => e.sponsor },
  { label: 'BO',            render: e => e.bo },
  { label: 'Complexidade',  render: e => e.complexidade },
  { label: 'Time',          render: e => e.timeResponsavel },
  { label: 'Diretoria',     render: e => e.diretoria },
  { label: 'Benef. Quant.', render: e => e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : null },
  { label: 'Benef. Qual.',  render: e => e.beneficioQualitativo },
  { label: 'Custo Est.',    render: e => e.custoEstimado ? formatBRL(e.custoEstimado) : null },
  { label: 'Custo Real.',   render: e => e.custoRealizado },
]

export default function EpicModal({ title, epics, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '92vw', maxWidth: 1200, maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800" style={{ fontSize: 14 }}>{title}</p>
            <span className="text-gray-400 text-xs">
              {epics.length} experimento{epics.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: '#f9f9f9' }} className="sticky top-0 z-10">
                {COLS.map(c => (
                  <th
                    key={c.label}
                    className="text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap"
                    style={{ padding: '8px 10px' }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {epics.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} className="py-8 text-center text-gray-400">
                    Nenhum experimento encontrado
                  </td>
                </tr>
              )}
              {epics.map((epic, i) => (
                <tr
                  key={epic.key}
                  style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                  className="hover:bg-red-50 transition-colors"
                >
                  {COLS.map(c => {
                    const val = c.render(epic)
                    return (
                      <td
                        key={c.label}
                        className="border-b border-gray-100 text-gray-700 align-top"
                        style={{ padding: '7px 10px', maxWidth: c.label === 'Experimento' ? 240 : 180 }}
                      >
                        {c.label === 'Chave' ? (
                          <span className="font-mono font-semibold" style={{ color: '#CC0000' }}>
                            {val}
                          </span>
                        ) : c.label === 'Experimento' ? (
                          <span className="font-medium" title={val ?? ''} style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                          }}>
                            {val ?? '—'}
                          </span>
                        ) : (
                          <span className={val ? 'text-gray-700' : 'text-gray-300'}>{val ?? '—'}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
