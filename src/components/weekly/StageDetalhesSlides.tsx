'use client'

import React, { useMemo, useRef, type RefObject } from 'react'
import type { WeeklyExperimentoRow } from '@/lib/weekly'
import { SLIDE_PAGE_SIZE, chunk, SlideDownloadButtons } from '@/components/report/slideExport'

const RED = '#8B0000'

interface Props {
  stageId: string
  stageLabel: string
  rows: WeeklyExperimentoRow[]
}

// ── Pendências hardcoded para Aguardando Piloto ──
const PENDENCIAS_AGUARDANDO: Record<string, string> = {
  'ARI': 'Aguardando Viabilidade Financeira',
  'Processamento de Manifestos': 'Aguardando Viabilidade Financeira',
  'OCR do Solar': 'Aguardando Viabilidade Financeira',
  'Tabulação por Leitura de Contexto': 'Aguardando Viabilidade Financeira',
  'Qualificações de Segurança': 'Aguardando Viabilidade Financeira',
  'Logoff': 'Aguardando Aprovação do Sponsor',
  'Zelador': 'Aguardando Aprovação do Sponsor',
  'Reajuste Telmex': 'Aguardando Alocação de Delivery',
  'Integridade do Produto': 'Aguardando Alocação de Delivery',
  'EditAI': 'Aguardando Alocação de Delivery',
  'Claro Ajuda': 'Aguardando Alocação de Delivery',
  'Smart Sales': 'Atualização Pendente',
  'Match HP': 'Atualização Pendente',
  'Busca Avançada Site': 'Atualização Pendente',
  'IA para Mercado Desenvolvimento': 'Atualização Pendente',
  'Gestão Inteligente de Incidentes': 'Atualização Pendente',
  'Chatbot App Conectado': 'Atualização Pendente',
  'Piloto Agente Diagnóstico Financeiro': 'Atualização Pendente',
  'ISA - Analista Rede B2B': 'Atualização Pendente',
  'Agente de IA RH': 'GO Wide',
}

function getPendencia(nomeIniciativa: string): string {
  for (const [chave, pendencia] of Object.entries(PENDENCIAS_AGUARDANDO)) {
    if (nomeIniciativa.toLowerCase().includes(chave.toLowerCase())) {
      return pendencia
    }
  }
  return 'Pendência não classificada'
}

// ── Pendências hardcoded para Experimentos em Andamento ──
const PENDENCIAS_EM_ANDAMENTO: Record<string, string> = {
  'Devex: Agente de Discovery': 'Pendente Cronograma',
  'Claro Box': 'Pendente Cronograma',
  'Aprendizado por tamanho de Domicílios': 'Pendente Cronograma',
  'Voice AI': 'Pendente Cronograma',
  'Controle do Voluntariado': 'Pendente Cronograma',
  'Métricas de Rede com Crowdsourcing': 'Pendente Cronograma',
  'Métricas da Rede com Crowdsourcing': 'Pendente Cronograma',
  'COP Rede - RAG': 'Pendente Cronograma',
  'NovoBot Claro': 'Pendente Cronograma',
  'Leads PME': 'Falta Engajamento BO/Sponsor',
  'IA para Entrantes RRE': 'Falta Engajamento BO/Sponsor',
  'VOC - Correlação de Alarmes': 'Falta Engajamento BO/Sponsor',
  'Personas Sintéticas': 'Falta Definição Sponsor',
  'Clio IA': 'Problemas com Ambiente',
  'Agente para Treinamento Comercial': 'Direcionamento para Outras Áreas/Labs',
  'Agente Criador de SD': 'Direcionamento para Outras Áreas/Labs',
  'Validação de SD': 'Direcionamento para Outras Áreas/Labs',
}

function getPendenciaEmAndamento(nomeIniciativa: string): string | null {
  for (const [chave, pendencia] of Object.entries(PENDENCIAS_EM_ANDAMENTO)) {
    if (nomeIniciativa.toLowerCase().includes(chave.toLowerCase())) {
      return pendencia
    }
  }
  return null
}

// Ordem de exibição das pendências no slide Aguardando Piloto
const ORDEM_PENDENCIAS = [
  'Aguardando Viabilidade Financeira',
  'Aguardando Aprovação do Sponsor',
  'Aguardando Alocação de Delivery',
  'GO Wide',
  'Atualização Pendente',
]

export default function StageDetalhesSlides({ stageId, stageLabel, rows }: Props) {
  const isAguardando = stageId === 'aguardando'
  const isCanceladosStage = (
    ['cancelados', 'cancelado', 'cancelada', 'canceladas'].includes(String(stageId).trim().toLowerCase()) ||
    String(stageLabel).trim().toLowerCase() === 'cancelados'
  )

  const paginas = useMemo(() => {
    if (!isAguardando) return chunk(rows, SLIDE_PAGE_SIZE)
    // Para Aguardando Piloto: ordena pela ordem das pendências e chunk de 12
    const sorted = [...rows].sort((a, b) => {
      const pa = ORDEM_PENDENCIAS.indexOf(getPendencia(a.nome))
      const pb = ORDEM_PENDENCIAS.indexOf(getPendencia(b.nome))
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    })
    return chunk(sorted, 8)
  }, [rows, isAguardando])
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

              {isAguardando ? (
                /* ── Aguardando Piloto: Fase + Previsão viram "Pendências"
                    com badge mostarda, linhas agrupadas por pendência ── */
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '11%' }} />
                  </colgroup>
                  <thead>
                    <tr className="align-bottom">
                      {['Nome da Iniciativa', 'Descrição', 'Pendências', 'Lab', 'Diretor / Ponto Focal', 'Área / Departamento', 'Benefício Potencial'].map(h => (
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
                        <td className="py-3 pr-3 align-top">
                          <span
                            className="inline-block rounded-full px-3 py-0.5 font-semibold"
                            style={{ fontSize: 10.5, background: '#F3F4F6', color: '#374151' }}
                          >
                            {getPendencia(row.nome)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
                            {row.timeResponsavel || '—'}
                          </p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.sponsor}</p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="font-bold text-gray-900" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.dominio}</p>
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
              ) : stageId === 'andamento' ? (
                /* ── Layout Em Andamento: Fase vira "Fase / Pendências" + Previsão de Conclusão ── */
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <thead>
                    <tr className="align-bottom">
                      {['Nome da Iniciativa', 'Objetivo', 'Fase / Pendências', 'Previsão de Conclusão', 'Lab', 'Diretor / Ponto Focal', 'Área / Departamento', 'Benefício Potencial'].map(h => (
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
                    {pageRows.map((row, i) => {
                      const temBloqueio = !!row.motivoBloqueio
                      const dataLimite = row.duedate
                        ? new Date(row.duedate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : null
                      const pend = getPendenciaEmAndamento(row.nome)
                      return (
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
                        <td className="py-3 pr-3 align-top">
                          {pend ? (
                            <span
                              className="inline-block rounded-full px-3 py-0.5 font-semibold"
                              style={{ fontSize: 10.5, background: '#F3F4F6', color: '#374151' }}
                            >
                              {pend}
                            </span>
                          ) : (
                            <span
                              className="inline-block rounded-full px-3 py-0.5 font-bold text-white"
                              style={{ fontSize: 10.5, background: RED }}
                            >
                              {row.fase}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top">
                          {temBloqueio ? (
                            <div className="flex items-start gap-1">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-bold flex-shrink-0 mt-0.5" style={{ fontSize: 10, lineHeight: 1 }}>
                                !
                              </span>
                              <div>
                                <p className="font-bold text-amber-600" style={{ fontSize: 11, lineHeight: 1.3 }}>Pendente</p>
                                <p className="text-gray-500" style={{ fontSize: 10, lineHeight: 1.3 }}>{row.motivoBloqueio}</p>
                              </div>
                            </div>
                          ) : dataLimite ? (
                            <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{dataLimite}</p>
                          ) : (
                            <p className="text-gray-400 italic" style={{ fontSize: 11, lineHeight: 1.3 }}>—</p>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
                            {row.timeResponsavel || '—'}
                          </p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.sponsor}</p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="font-bold text-gray-900" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.dominio}</p>
                        </td>
                        <td className="py-3 align-top">
                          <p className={row.beneficioLabel === 'Não Mapeado' ? 'italic text-gray-400' : 'font-bold text-gray-900'} style={{ fontSize: 12 }}>
                            {row.beneficioLabel}
                          </p>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                /* ── Layout padrão (demais fases) ── */
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '8%' }} />
                    {isCanceladosStage && <col style={{ width: '18%' }} />}
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '11%' }} />
                  </colgroup>
                  <thead>
                    <tr className="align-bottom">
                      {isCanceladosStage
                        ? ['Nome da Iniciativa', 'Objetivo', 'Fase', 'Motivo de bloqueio', 'Lab', 'Diretor / Ponto Focal', 'Área / Departamento', 'Benefício Potencial']
                        : ['Nome da Iniciativa', 'Objetivo', 'Fase', 'Lab', 'Diretor / Ponto Focal', 'Área / Departamento', 'Benefício Potencial']
                      .map(h => (
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
                    {pageRows.map((row, i) => {
                      return (
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
                        {isCanceladosStage && (
                          <td className="py-3 pr-3 align-top">
                            <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
                              {row.motivoBloqueio || '—'}
                            </p>
                          </td>
                        )}
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
                            {row.timeResponsavel || '—'}
                          </p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="text-gray-700" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.sponsor}</p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="font-bold text-gray-900" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{row.dominio}</p>
                        </td>
                        <td className="py-3 align-top">
                          <p className={row.beneficioLabel === 'Não Mapeado' ? 'italic text-gray-400' : 'font-bold text-gray-900'} style={{ fontSize: 12 }}>
                            {row.beneficioLabel}
                          </p>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
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
