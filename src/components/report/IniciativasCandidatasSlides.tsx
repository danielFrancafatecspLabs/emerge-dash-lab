'use client'

import { useMemo, useRef, useState, type RefObject } from 'react'
import { SLIDE_PAGE_SIZE, chunk, SlideDownloadButtons, EditableField } from './slideExport'

export interface IniciativaCandidataRow {
  key: string
  nome: string
  experimento: 'Sim' | 'Não'
  situacaoBadge: 'CONCLUÍDO' | 'EM ANDAMENTO' | 'NOVO CICLO' | 'N/A'
  situacaoTexto: string
  proximosPassos: string
  sponsor: string
  diretoria: string
}

interface Props {
  iniciativas: IniciativaCandidataRow[]
}

const SITUACAO_OPTIONS: IniciativaCandidataRow['situacaoBadge'][] = ['CONCLUÍDO', 'EM ANDAMENTO', 'NOVO CICLO', 'N/A']
const SITUACAO_COLOR: Record<string, { bg: string; text: string }> = {
  'CONCLUÍDO': { bg: '#DCFCE7', text: '#15803D' },
  'EM ANDAMENTO': { bg: '#DBEAFE', text: '#1D4ED8' },
  'NOVO CICLO': { bg: '#FEF3C7', text: '#B45309' },
  'N/A': { bg: '#F3F4F6', text: '#6B7280' },
}

// Estado editável por linha. Todos os campos partem do que dá pra inferir do
// Jira (ver report/page.tsx), mas o time pode corrigir tudo antes de exportar —
// não existe "situação atual" ou "próximos passos" estruturados no board de
// Iniciativas, então esses campos nascem em branco/inferidos e são só um ponto
// de partida.
type RowState = Omit<IniciativaCandidataRow, 'key'>

export default function IniciativasCandidatasSlides({ iniciativas }: Props) {
  const paginas = useMemo(() => chunk(iniciativas, SLIDE_PAGE_SIZE), [iniciativas])
  const totalPaginas = paginas.length

  const [overrides, setOverrides] = useState<Record<string, Partial<RowState>>>({})

  function getRow(row: IniciativaCandidataRow): RowState {
    return { ...row, ...overrides[row.key] }
  }
  function setField<K extends keyof RowState>(key: string, field: K, value: RowState[K]) {
    setOverrides(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const refs = useRef<Array<RefObject<HTMLDivElement>>>(
    paginas.map(() => ({ current: null }))
  )
  while (refs.current.length < totalPaginas) refs.current.push({ current: null })

  if (iniciativas.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
        Nenhuma iniciativa em Aguardando Piloto no momento.
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
              filename={`candidatas-delivery-slide-${pageIdx + 1}`}
            />
          </div>

          {/* ═══ Slide exportável ═══ */}
          <div
            ref={refs.current[pageIdx]}
            className="relative bg-white rounded-2xl p-8"
            style={{ minWidth: 1180 }}
          >
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#7A1212' }}>
                Iniciativas Concluídas / Candidatas a Delivery
              </h2>
              <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-10 w-auto" />
            </div>

            <div className="relative rounded-2xl border-2 px-6 pt-7 pb-4" style={{ borderColor: '#F3D6D6' }}>
              <span
                className="absolute -top-[9px] left-8 bg-white px-2 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: '#B91C1C' }}
              >
                Visão Geral
              </span>

              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr className="align-bottom">
                    {['Nome da Iniciativa', 'Experimento', 'Situação Atual do Experimento', 'Próximos Passos', 'Sponsor & Diretoria'].map(h => (
                      <th
                        key={h}
                        className="pb-2.5 text-left font-bold text-gray-500 uppercase"
                        style={{ fontSize: 10.5, letterSpacing: '0.02em', lineHeight: 1.25 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((raw, i) => {
                    const row = getRow(raw)
                    const situacaoColor = SITUACAO_COLOR[row.situacaoBadge]
                    const isSim = row.experimento === 'Sim'
                    return (
                      <tr key={raw.key} className={i < rows.length - 1 ? 'border-b' : ''} style={{ borderColor: '#F3F4F6' }}>
                        <td className="py-3 pr-3 align-top">
                          <EditableField
                            value={row.nome}
                            onSave={v => setField(raw.key, 'nome', v)}
                            textStyle={{ fontWeight: 700, color: '#111827', fontSize: 13, lineHeight: 1.3 }}
                          />
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <span
                            onClick={() => setField(raw.key, 'experimento', isSim ? 'Não' : 'Sim')}
                            title="Clique para alternar"
                            style={{
                              display: 'inline-block', cursor: 'pointer', borderRadius: 999,
                              border: `2px solid ${isSim ? '#16A34A' : '#DC2626'}`,
                              color: isSim ? '#16A34A' : '#DC2626',
                              fontSize: 11, fontWeight: 700, padding: '2px 12px',
                            }}
                          >
                            {row.experimento}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <span
                            onClick={() => {
                              const next = SITUACAO_OPTIONS[(SITUACAO_OPTIONS.indexOf(row.situacaoBadge) + 1) % SITUACAO_OPTIONS.length]
                              setField(raw.key, 'situacaoBadge', next)
                            }}
                            title="Clique para alternar"
                            style={{
                              display: 'inline-block', cursor: 'pointer', borderRadius: 999,
                              background: situacaoColor.bg, color: situacaoColor.text,
                              fontSize: 10, fontWeight: 700, padding: '3px 10px', letterSpacing: '0.02em', marginBottom: 4,
                            }}
                          >
                            {row.situacaoBadge}
                          </span>
                          <EditableField
                            value={row.situacaoTexto}
                            onSave={v => setField(raw.key, 'situacaoTexto', v)}
                            multiline
                            placeholder="Descreva a situação atual"
                            textStyle={{ color: '#4B5563', fontSize: 11.5, lineHeight: 1.35 }}
                          />
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <EditableField
                            value={row.proximosPassos}
                            onSave={v => setField(raw.key, 'proximosPassos', v)}
                            multiline
                            placeholder="Descreva os próximos passos"
                            textStyle={{ color: '#4B5563', fontSize: 11.5, lineHeight: 1.35 }}
                          />
                        </td>
                        <td className="py-3 align-top">
                          <EditableField
                            value={row.sponsor}
                            onSave={v => setField(raw.key, 'sponsor', v)}
                            placeholder="Sponsor"
                            textStyle={{ color: '#374151', fontSize: 11.5, lineHeight: 1.3 }}
                          />
                          <div style={{ marginTop: 3 }}>
                            <EditableField
                              value={row.diretoria}
                              onSave={v => setField(raw.key, 'diretoria', v)}
                              placeholder="Diretoria"
                              textStyle={{ color: '#111827', fontWeight: 700, fontSize: 11.5, lineHeight: 1.3 }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
