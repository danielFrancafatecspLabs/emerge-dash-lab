'use client'

import { useMemo, useRef, type RefObject } from 'react'
import { AlertTriangle } from 'lucide-react'
import { SLIDE_PAGE_SIZE, chunk, SlideDownloadButtons } from './slideExport'

export interface BloqueadoSlideRow {
  key: string
  nome: string
  fase: string
  motivoBloqueio: string
  dataLimite: string | null
  descricao: string
  sponsor: string
  diretoria: string
  beneficioLabel: string
  labResponsavel: string
}

interface Props {
  bloqueados: BloqueadoSlideRow[]
}

export default function BloqueadosSlide({ bloqueados }: Props) {
  const paginas = useMemo(() => chunk(bloqueados, SLIDE_PAGE_SIZE), [bloqueados])
  const totalPaginas = paginas.length

  const refs = useRef<Array<RefObject<HTMLDivElement>>>(
    paginas.map(() => ({ current: null }))
  )
  while (refs.current.length < totalPaginas) refs.current.push({ current: null })

  if (bloqueados.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {paginas.map((rows, pageIdx) => (
        <div key={pageIdx} className="flex flex-col gap-2">
          <div className="no-print flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Slide {pageIdx + 1} de {totalPaginas}
            </p>
            <SlideDownloadButtons
              targetRef={refs.current[pageIdx]}
              filename={`experimentos-bloqueados-slide-${pageIdx + 1}`}
            />
          </div>

          {/* ═══ Slide exportável ═══ */}
          <div
            ref={refs.current[pageIdx]}
            className="relative bg-white rounded-2xl p-8"
            style={{ minWidth: 1180 }}
          >
            {/* Cabeçalho do slide */}
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#7A1212' }}>
                Experimentos Bloqueados
              </h2>
              <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-10 w-auto" />
            </div>

            {/* Card com borda + legenda estilo fieldset */}
            <div className="relative rounded-2xl border-2 px-6 pt-7 pb-4" style={{ borderColor: '#FDE68A' }}>
              <span
                className="absolute -top-[9px] left-8 bg-white px-2 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: '#B45309' }}
              >
                Aguardando desbloqueio
              </span>

              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '9%' }} />
                </colgroup>
                <thead>
                  <tr className="align-bottom">
                    {[
                      'Nome do Experimento', 'Fase', 'Motivo do Bloqueio',
                      'Descrição', 'Sponsor & Diretoria', 'Benefício Potencial', 'Lab Resp.',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 font-bold text-gray-500 uppercase ${i === 0 ? 'text-left' : 'text-left'}`}
                        style={{ fontSize: 10.5, letterSpacing: '0.02em', lineHeight: 1.25 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} className={i < rows.length - 1 ? 'border-b' : ''} style={{ borderColor: '#FEF3C7' }}>
                      <td className="py-3 pr-3 align-top">
                        <p className="font-bold text-gray-900" style={{ fontSize: 13, lineHeight: 1.3 }}>{row.nome}</p>
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <span
                          className="inline-block rounded-full px-3 py-0.5 font-bold text-white"
                          style={{
                            fontSize: 11,
                            background: row.fase === 'EM VALIDAÇÃO' ? '#7A1212' :
                                       row.fase === 'Em andamento' ? '#B8860B' :
                                       row.fase === 'Em refinamento' ? '#2563EB' :
                                       row.fase === 'PRONTO PARA EXECUÇÃO' ? '#059669' :
                                       '#6B7280'
                          }}
                        >
                          {row.fase}
                        </span>
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#D97706' }} />
                          <p className="font-semibold text-gray-800" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
                            {row.motivoBloqueio}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <p className="text-gray-600" style={{ fontSize: 11.5, lineHeight: 1.35 }} title={row.descricao}>
                          {row.descricao.length > 200 ? row.descricao.slice(0, 200) + '…' : row.descricao}
                        </p>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.sponsor}</p>
                        <p className="font-bold text-gray-900 mt-0.5" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.diretoria}</p>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <p className={row.beneficioLabel === 'Não Mapeado' ? 'italic text-gray-400' : 'font-bold text-gray-900'} style={{ fontSize: 12 }}>
                          {row.beneficioLabel}
                        </p>
                      </td>
                      <td className="py-3 align-top">
                        <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.labResponsavel}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="absolute bottom-3 right-6 text-gray-300" style={{ fontSize: 10 }}>
              {String(pageIdx + 1).padStart(2, '0')}/{String(totalPaginas).padStart(2, '0')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}