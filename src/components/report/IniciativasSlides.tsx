'use client'

import { useMemo, useRef, useState, type RefObject } from 'react'
import { Download, Loader2, Pencil, Check } from 'lucide-react'

export interface IniciativaSlideRow {
  key: string
  nome: string
  prioridade: 'Alta' | 'Média' | 'Baixa' | '—'
  statusDetalhado: string
  sponsor: string
  diretoria: string
  beneficioLabel: string
  labResponsavel: string
}

interface Props {
  iniciativas: IniciativaSlideRow[]
}

const PAGE_SIZE = 10

const PRIORIDADE_STYLE: Record<string, string> = {
  'Alta': 'border-red-600 text-red-600',
  'Média': 'border-gray-300 text-gray-400',
  'Baixa': 'border-gray-200 text-gray-300',
  '—': 'border-gray-200 text-gray-300',
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function SlideDownloadButtons({ targetRef, filename }: { targetRef: RefObject<HTMLDivElement>; filename: string }) {
  const [busy, setBusy] = useState<'png' | 'jpg' | null>(null)

  async function exportAs(format: 'png' | 'jpg') {
    if (!targetRef.current || busy) return
    setBusy(format)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mime, 0.95)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${filename}.${format}`
      a.click()
    } catch (err) {
      console.error('Erro ao exportar slide:', err)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="no-print flex items-center gap-2">
      <button
        onClick={() => exportAs('png')}
        disabled={busy !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-colors"
        style={{ background: '#8B0000' }}
      >
        {busy === 'png' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        PNG
      </button>
      <button
        onClick={() => exportAs('jpg')}
        disabled={busy !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        {busy === 'jpg' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        JPG
      </button>
    </div>
  )
}

export default function IniciativasSlides({ iniciativas }: Props) {
  const paginas = useMemo(() => chunk(iniciativas, PAGE_SIZE), [iniciativas])
  const totalPaginas = paginas.length

  // Previsão de Conclusão não existe como campo estruturado no Jira — é preenchida
  // manualmente pelo time antes de cada apresentação (mesmo padrão de edição inline
  // já usado na tabela "Iniciativas Direcionadas para beOn Delivery").
  const [previsoes, setPrevisoes] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (key: string, current: string) => {
    setEditingKey(key)
    setEditValue(current)
  }
  const saveEdit = () => {
    if (!editingKey) return
    setPrevisoes(prev => ({ ...prev, [editingKey]: editValue.trim() || 'TBD' }))
    setEditingKey(null)
  }

  const refs = useRef<Array<RefObject<HTMLDivElement>>>(
    paginas.map(() => ({ current: null }))
  )
  // Garante que exista uma ref para cada página, mesmo se a quantidade mudar
  while (refs.current.length < totalPaginas) refs.current.push({ current: null })

  if (iniciativas.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
        Nenhuma iniciativa em refinamento, andamento ou validação no momento.
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
              filename={`experimentos-em-andamento-slide-${pageIdx + 1}`}
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
                Experimentos em andamento
              </h2>
              <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-10 w-auto" />
            </div>

            {/* Card com borda + legenda estilo fieldset */}
            <div className="relative rounded-2xl border-2 px-6 pt-7 pb-4" style={{ borderColor: '#F3D6D6' }}>
              <span
                className="absolute -top-[9px] left-8 bg-white px-2 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: '#B91C1C' }}
              >
                Iniciativas Gerais
              </span>

              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr className="align-bottom">
                    {[
                      'Nome da Iniciativa', 'Prioridade', 'Previsão de Conclusão',
                      'Status Detalhado', 'Sponsor & Diretoria', 'Benefício Potencial', 'Lab Resp.',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 font-bold text-gray-500 uppercase ${i === 0 ? 'text-left' : i >= 5 ? 'text-left' : 'text-left'}`}
                        style={{ fontSize: 10.5, letterSpacing: '0.02em', lineHeight: 1.25 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const previsao = previsoes[row.key] ?? 'TBD'
                    return (
                      <tr key={row.key} className={i < rows.length - 1 ? 'border-b' : ''} style={{ borderColor: '#F3F4F6' }}>
                        <td className="py-3 pr-3 align-top">
                          <p className="font-bold text-gray-900" style={{ fontSize: 13, lineHeight: 1.3 }}>{row.nome}</p>
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <span
                            className={`inline-block rounded-full border-2 px-3 py-0.5 font-bold ${PRIORIDADE_STYLE[row.prioridade]}`}
                            style={{ fontSize: 11 }}
                          >
                            {row.prioridade}
                          </span>
                        </td>
                        <td className="py-3 pr-2 align-top">
                          {editingKey === row.key ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                onBlur={saveEdit}
                                className="w-20 rounded-lg border border-blue-400 px-2 py-0.5 text-xs focus:outline-none"
                              />
                              <button onMouseDown={saveEdit} className="text-emerald-600"><Check size={13} /></button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(row.key, previsao)}
                              title="Clique para editar"
                              style={{ background: '#F3F4F6', borderRadius: 8, padding: '4px 10px', display: 'inline-block', cursor: 'pointer' }}
                            >
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5563' }}>{previsao}</span>
                              <Pencil size={10} className="no-print" style={{ color: '#D1D5DB', marginLeft: 4, opacity: 0.6, verticalAlign: -1 }} />
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-600" style={{ fontSize: 11.5, lineHeight: 1.35 }}>{row.statusDetalhado}</p>
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
