'use client'

import { useState, useMemo } from 'react'
import type { DashboardData, MonitoramentoData, EpicDetail } from '@/lib/types'
import { formatBeneficioMM } from '@/lib/report-utils'
import { formatBRL } from '@/lib/mappers'
import MbrStatusFilter, { type FiltroFase } from './MbrStatusFilter'
import EpicsListModal from './EpicsListModal'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import LeadTimeJornadaComponent from '@/components/dashboard/LeadTimeJornada'
import MapaDiretorias from '@/components/dashboard/MapaDiretorias'
import Link from 'next/link'

interface MbrContentProps {
  data: DashboardData
  monitoramento: MonitoramentoData
}

const desiredOrder = [
  { match: 'Integridade do Produto', sponsor: 'Patrícia Mofato / Financeiro', beneficioNumeric: 254000000 },
  { match: 'Leads PME', sponsor: 'Sem Sponsor', beneficioNumeric: 0 },
  { match: 'Claro Box', sponsor: 'Rodrigo Assad / beOn', beneficioNumeric: 0 },
  { match: 'Logoff WhatsApp', sponsor: 'Fabio Nahoum', beneficioNumeric: 0 },
  { match: 'Antispam', sponsor: 'Gabriel Portugal / SVA', beneficioNumeric: 0 },
]

const STATUS_LABEL_MAP: Record<FiltroFase, string> = {
  tudo: 'total',
  'EM EXPERIMENTAÇÃO': 'em andamento',
  'EM VALIDAÇÃO': 'em validação',
  'EM PILOTO': 'em piloto',
  'EM ESCALA': 'em escala',
  FINALIZADO: 'concluídos',
  CANCELADO: 'cancelados',
}

export default function MbrContent({ data, monitoramento }: MbrContentProps) {
  const [filtroFase, setFiltroFase] = useState<FiltroFase>('tudo')

  // ── Função de agrupamento: mapeia status Epic para categoria do filtro ──
  function getCategoriaEpic(e: EpicDetail): FiltroFase | undefined {
    const id = String(e.status?.id ?? '')
    if (!id) return undefined
    // Alinhado com FunilExperimentos e contagens do filtro:
    // "Em Andamento" = emAndamento (id=3) + emValidacao (id=10204/11201)
    if (id === '3' || e.status?.name === 'Em andamento') return 'EM EXPERIMENTAÇÃO'
    if (id === '10204' || id === '11201') return 'EM EXPERIMENTAÇÃO'
    if (id === '10019' || id === '10003') return 'FINALIZADO'
    if (id === '10015') return 'CANCELADO'
    // Demais status (BACKLOG, EM REFINAMENTO, PRONTO P/ EXECUÇÃO) — não entram em "Em Andamento"
    return undefined
  }

  // ── Filtro centralizado ──
  const epicsFiltrados = useMemo(() => {
    if (filtroFase === 'tudo') return data.allEpics
    if (filtroFase === 'EM PILOTO' || filtroFase === 'EM ESCALA') {
      // Para pilotos e escala, filtramos pelo pipeline de iniciativas
      return []
    }
    return data.allEpics.filter(e => getCategoriaEpic(e) === filtroFase)
  }, [data.allEpics, filtroFase, data.pipeline])

  // Contagens para o filtro (alinhadas com FunilExperimentos visão detalhada)
  const EXCLUIR_CONCLUIDOS_FUNIL = useMemo(() => new Set([
    'Otimiza APP - Ciclo 1 (Análise de comentários das lojas de apps)',
    "IA para IP'S de rede",
    'Assistente IA Ágil - Ciclo 2',
    'Sumarização dos Contratos',
    'Jurisquery - Consulta de Pareceres Juridicos',
  ]), [])

  const contagens = useMemo(() => {
    const total = data.allEpics.length
    const cancelados = data.allEpics.filter(e =>
      e.status?.id === '10015' || e.status?.name === 'Cancelado'
    ).length
    // Alinhado com FunilExperimentos: "Em Andamento" = emAndamento (id=3) + emValidacao (id=10204)
    const emAndamentoCount = data.allEpics.filter(e =>
      e.status?.id === '3' || e.status?.name === 'Em andamento'
    ).length
    const emValidacaoCount = data.allEpics.filter(e =>
      e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'
    ).length
    const emAndamento = emAndamentoCount + emValidacaoCount
    const emValidacao = data.allEpics.filter(e =>
      e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'
    ).length
    const concluidos = data.allEpics.filter(e =>
      e.status?.id === '10019' && !EXCLUIR_CONCLUIDOS_FUNIL.has(e.nome)
    ).length
    const emPiloto = data.pipeline?.['EM PILOTO'] ?? 0
    const emEscala = data.pipeline?.['EM ESCALA'] ?? 0
    return {
      tudo: total,
      CANCELADO: cancelados,
      'EM EXPERIMENTAÇÃO': emAndamento,
      'EM VALIDAÇÃO': emValidacao,
      FINALIZADO: concluidos,
      'EM PILOTO': emPiloto,
      'EM ESCALA': emEscala,
    } as Record<FiltroFase, number>
  }, [data.allEpics, data.pipeline, EXCLUIR_CONCLUIDOS_FUNIL])

  // ── Métricas derivadas ──
  const beneficioEstimado = useMemo(
    () => epicsFiltrados.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
    [epicsFiltrados]
  )

  const emAndamento = useMemo(
    () => epicsFiltrados.filter(e => ['Em andamento', 'EM VALIDAÇÃO', 'Em validação'].includes(e.status.name ?? '')),
    [epicsFiltrados]
  )

  const concluidos = useMemo(
    () => epicsFiltrados.filter(e => e.status.id === '10019' || e.status.id === '10003'),
    [epicsFiltrados]
  )
  const totalEpicsConcluidos = concluidos.length

  const priorizados = useMemo(
    () => [...emAndamento].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20),
    [emAndamento]
  )

  const topFivePrioritized = useMemo(() => {
    return desiredOrder.map(d => {
      const found = priorizados.find(p => p.nome && p.nome.toLowerCase().includes(d.match.toLowerCase()))
      if (found) return { key: found.key, nome: found.nome, sponsor: d.sponsor ?? (found.sponsor ?? '—'), beneficioQuantitativo: d.beneficioNumeric ?? found.beneficioQuantitativo ?? 0 }
      return { key: `manual-${d.match.replace(/\s+/g, '-').toLowerCase()}`, nome: d.match, sponsor: d.sponsor ?? '—', beneficioQuantitativo: d.beneficioNumeric ?? 0 }
    })
  }, [priorizados])

  const topFiveKeys = useMemo(() => new Set(topFivePrioritized.map(t => t.key)), [topFivePrioritized])
  const remainingInProgress = useMemo(() => emAndamento.filter(e => !topFiveKeys.has(e.key)), [emAndamento, topFiveKeys])

  const priorizadosKeys = useMemo(() => new Set(topFivePrioritized.map(p => p.key)), [topFivePrioritized])

  const concluidosTop = useMemo(
    () => [...concluidos.filter(c => !priorizadosKeys.has(c.key))].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20),
    [concluidos, priorizadosKeys]
  )

  // ── "Sem Sponsor" e "Sem Benefício": usam epicsFiltrados para respeitar o filtro selecionado ──
  const epicsSemSponsor = useMemo(
    () => epicsFiltrados.filter(e => !(e.sponsor && e.sponsor.trim())),
    [epicsFiltrados]
  )
  const semSponsor = epicsSemSponsor.length

  const epicsSemBeneficio = useMemo(
    () => epicsFiltrados.filter(e => {
      const noQuant = !(e.beneficioQuantitativo && e.beneficioQuantitativo > 0)
      const noQual = !(e.beneficioQualitativo && String(e.beneficioQualitativo).trim())
      return noQuant && noQual
    }),
    [epicsFiltrados]
  )
  const semBeneficio = epicsSemBeneficio.length

  const parentStatusMap = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>()
    for (const ini of data.iniciativas) {
      for (const ep of ini.epics) m.set(ep.key, ini.status)
    }
    return m
  }, [data.iniciativas])

  // Sponsor map (mesma lógica do original)
  const sponsorMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const ini of data.iniciativas) {
      const sponsor = ini.sponsor ?? ini.sponsors?.[0] ?? '—'
      m.set(sponsor, (m.get(sponsor) ?? 0) + (ini.epics?.length ?? 0))
    }
    return m
  }, [data.iniciativas])

  return (
    <>
      {/* Título + Filtro lado a lado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">MBR — Métricas e Prioridades</h1>
          <p className="text-sm text-gray-500 mt-1">Visão consolidada para o Monthly Business Review (apenas admins)</p>
        </div>
        <MbrStatusFilter value={filtroFase} onChange={setFiltroFase} contagens={contagens} />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-3 shadow-sm border-t-4 border-[#8B0000]">
          <p className="text-xs text-gray-400 uppercase">Experimentos {STATUS_LABEL_MAP[filtroFase]}</p>
          <p className="text-xl font-bold">{contagens[filtroFase]}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border-t-4 border-[#8B0000]">
          <p className="text-xs text-gray-400 uppercase">Benefício estimado</p>
          <p className="text-xl font-bold">{formatBeneficioMM(beneficioEstimado)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border-t-4 border-[#8B0000]">
          <p className="text-xs text-gray-400 uppercase">Sem Sponsor</p>
          <EpicsListModal
            title="Sem Sponsor"
            items={epicsSemSponsor as any}
            trigger={<p className="text-xl font-bold">{semSponsor}</p>}
          />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border-t-4 border-[#8B0000]">
          <p className="text-xs text-gray-400 uppercase">Sem Benefício</p>
          <EpicsListModal
            title="Sem Benefício"
            items={epicsSemBeneficio as any}
            trigger={<p className="text-xl font-bold">{semBeneficio}</p>}
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] flex flex-col min-h-[400px]">
          <p className="text-xs text-gray-400 uppercase mb-3 flex-shrink-0">Jornada de adoção</p>
          <div className="flex-1 min-h-0">
            <LeadTimeJornadaComponent
              data={monitoramento.leadTimeJornada}
              cycleTimeExperimentacao={monitoramento.cycleTimeExperimentacao ?? []}
            />
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] min-h-[300px] flex flex-col overflow-hidden">
          <p className="text-xs text-gray-400 uppercase mb-3 flex-shrink-0">Diretorias por experimentos</p>
          <div className="flex-1 min-h-0">
            <MapaDiretorias epics={epicsFiltrados} />
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] flex flex-col min-h-[400px]">
          <p className="text-xs text-gray-400 uppercase mb-3 flex-shrink-0">Crescimento de experimentação</p>
          <div className="flex-1 min-h-0">
            <BurnupChart data={monitoramento.burnup} />
          </div>
        </div>
      </div>

      {/* Quadrantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-[#8B0000]">
          <p className="text-[10px] text-gray-400 uppercase mb-1">Priorizados</p>
          <div className="flex flex-col gap-1">
            {(() => {
              const items = topFivePrioritized
              const max = Math.max(...items.map(i => i.beneficioQuantitativo ?? 0), 1)
              return items.map((e, i) => {
                const barPct = Math.round(((e.beneficioQuantitativo ?? 0) / max) * 100)
                return (
                  <div key={e.key} className="flex items-start gap-1.5 rounded-lg px-1.5 py-1 -mx-1.5" title={e.nome}>
                    <span className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: 14, height: 14, fontSize: 7, background: '#CC0000', marginTop: 2 }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-gray-800 truncate" style={{ fontSize: 10 }}>{e.nome}</span>
                        <span className="font-bold flex-shrink-0" style={{ fontSize: 10, color: '#CC0000' }}>{e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : 'Não mapeado'}</span>
                      </div>
                      <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }} />
                      </div>
                      <p className="text-gray-400 truncate mt-0.5" style={{ fontSize: 9 }}>{e.sponsor ?? '—'}</p>
                    </div>
                  </div>
                )
              })
            })()}
            <div className="pt-1">
              <EpicsListModal
                title="Experimentos em Andamento"
                items={remainingInProgress as any}
                trigger={<button className="text-[10px] text-gray-500">Ver demais ({remainingInProgress.length})</button>}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-[#8B0000]">
          <p className="text-[10px] text-gray-400 uppercase mb-1">Realizados (top)</p>
          <div className="flex flex-col gap-1">
            {(() => {
              const items = concluidosTop.slice(0, 6)
              const max = Math.max(...items.map(i => i.beneficioQuantitativo ?? 0), 1)
              return items.map((e, i) => {
                const barPct = Math.round(((e.beneficioQuantitativo ?? 0) / max) * 100)
                return (
                  <div key={e.key} className="flex items-start gap-1.5 rounded-lg px-1.5 py-1 -mx-1.5" title={e.nome}>
                    <span className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: 14, height: 14, fontSize: 7, background: '#CC0000', marginTop: 2 }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-gray-800 truncate" style={{ fontSize: 10 }}>{e.nome}</span>
                        <span className="font-bold flex-shrink-0" style={{ fontSize: 10, color: '#CC0000' }}>{e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}</span>
                      </div>
                      <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }} />
                      </div>
                      <p className="text-gray-400 truncate mt-0.5" style={{ fontSize: 9 }}>{e.sponsor ?? '—'} · {parentStatusMap.get(e.key)?.name ?? '—'}</p>
                    </div>
                  </div>
                )
              })
            })()}
            {concluidosTop.length > 6 && (
              <div className="text-[10px] text-gray-400">+{concluidosTop.length - 6} adicionais</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}