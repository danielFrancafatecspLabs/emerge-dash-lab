'use client'

import { useMemo, useRef, type RefObject } from 'react'
import type { WeeklyExperimentoRow } from '@/lib/weekly'
import { SLIDE_PAGE_SIZE, chunk, SlideDownloadButtons } from '@/components/report/slideExport'

const RED = '#8B0000'

interface Props {
  stageId: string
  stageLabel: string
  rows: WeeklyExperimentoRow[]
}

export default function StageDetalhesSlides({ stageId, stageLabel, rows }: Props) {
  const paginas = useMemo(() => chunk(rows, SLIDE_PAGE_SIZE), [rows])
  const totalPaginas = paginas.length

  const refs = useRef<Array<RefObject<HTMLDivElement>>>(
    paginas.map(() => ({ current: null }))
  )
  while (refs.current.length < totalPaginas) refs.current.push({ current: null })

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
        Nenhum experimento na fase &ldquo;{stageLabel}&rdquo; no momento.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {paginas.map((pageRows, pageIdx) => (
        <div key={pageIdx} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Slide {pageIdx + 1} de {totalPaginas}
            </p>
            <SlideDownloadButtons
              targetRef={refs.current[pageIdx]}
              filename={`weekly-detalhes-${stageId}-slide-${pageIdx + 1}`}
            />
          </div>

          {/* ═══ Slide exportável ═══ */}
          <div
            ref={refs.current[pageIdx]}
            className="relative bg-white rounded-2xl p-8"
            style={{ minWidth: 1180 }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                  Jornada de Experimentação · Weekly
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight mt-1" style={{ color: RED }}>
                  {stageLabel}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold" style={{ color: RED, lineHeight: 1, marginBottom: 6 }}>{rows.length}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">experimentos</p>
              </div>
            </div>

            <div className="relative rounded-2xl border-2 px-6 pt-7 pb-4" style={{ borderColor: '#F3D6D6' }}>
              <span
                className="absolute -top-[9px] left-8 bg-white px-2 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: '#B91C1C' }}
              >
                Lista de experimentos
              </span>

              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '33%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '13%' }} />
                </colgroup>
                <thead>
                  <tr className="align-bottom">
                    {['Nome da Iniciativa', 'Objetivo', 'Fase', 'Sponsor / Domínio', 'Benefício Potencial'].map(h => (
                      <th
                        key={h}
                        className="pb-2.5 font-bold text-gray-500 uppercase text-left"
                        style={{ fontSize: 10.5, letterSpacing: '0.02em', lineHeight: 1.25 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr key={row.key} className={i < pageRows.length - 1 ? 'border-b' : ''} style={{ borderColor: '#F3F4F6' }}>
                      <td className="py-3 pr-3 align-top">
                        <p className="font-bold text-gray-900" style={{ fontSize: 13, lineHeight: 1.3 }}>{row.nome}</p>
                        <p className="text-gray-400" style={{ fontSize: 10 }}>{row.key}</p>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <p className="text-gray-600" style={{ fontSize: 11.5, lineHeight: 1.35 }} title={row.objetivo}>
                          {row.objetivo.length > 160 ? row.objetivo.slice(0, 160) + '…' : row.objetivo}
                        </p>
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <span
                          className="inline-block rounded-full px-3 py-0.5 font-bold text-white"
                          style={{ fontSize: 10.5, background: RED }}
                        >
                          {row.fase}
                        </span>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.sponsor}</p>
                        <p className="font-bold text-gray-900 mt-0.5" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.dominio}</p>
                      </td>
                      <td className="py-3 align-top">
                        <p className={row.beneficioLabel === 'Não Mapeado' ? 'italic text-gray-400' : 'font-bold text-gray-900'} style={{ fontSize: 12 }}>
                          {row.beneficioLabel}
                        </p>
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
