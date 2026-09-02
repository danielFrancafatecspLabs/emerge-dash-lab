'use client'

import { useMemo, useRef, type RefObject } from 'react'
import { SLIDE_PAGE_SIZE, chunk, SlideDownloadButtons } from './slideExport'

export interface NovoExperimentoSlideRow {
  key: string
  nome: string
  sponsor: string
  criadoEm: string
}

interface Props {
  iniciativas: NovoExperimentoSlideRow[]
}

function formatDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function NovosExperimentosSlides({ iniciativas }: Props) {
  const paginas = useMemo(() => chunk(iniciativas, SLIDE_PAGE_SIZE), [iniciativas])
  const totalPaginas = paginas.length

  const refs = useRef<Array<RefObject<HTMLDivElement>>>(
    paginas.map(() => ({ current: null }))
  )
  while (refs.current.length < totalPaginas) refs.current.push({ current: null })

  if (iniciativas.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
        Nenhum novo experimento nos últimos 15 dias.
      </div>
    )
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
              filename={`novos-experimentos-slide-${pageIdx + 1}`}
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
                Novos Experimentos
              </h2>
              <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-10 w-auto" />
            </div>

            {/* Card com borda + legenda estilo fieldset */}
            <div className="relative rounded-2xl border-2 px-6 pt-7 pb-4" style={{ borderColor: '#F3D6D6' }}>
              <span
                className="absolute -top-[9px] left-8 bg-white px-2 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: '#B91C1C' }}
              >
                Últimos 15 dias
              </span>

              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr className="align-bottom">
                    {[
                      'Nome da Iniciativa',
                      'Sponsor',
                      'Criado em',
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
                    <tr
                      key={row.key}
                      className="border-b border-gray-100"
                      style={{ background: i % 2 === 1 ? '#FAFAFA' : undefined }}
                    >
                      <td className="py-2.5 pr-3 align-top">
                        <p className="font-bold text-gray-900" style={{ fontSize: 12, lineHeight: 1.3 }}>
                          {row.nome}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: 9, marginTop: 1 }}>
                          #{row.key}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <p className="text-gray-700" style={{ fontSize: 11 }}>
                          {row.sponsor || '—'}
                        </p>
                      </td>
                      <td className="py-2.5 align-top">
                        <p className="text-gray-500" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                          {formatDate(row.criadoEm)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}