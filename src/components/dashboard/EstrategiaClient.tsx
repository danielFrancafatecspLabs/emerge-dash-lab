'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ResumoExecutivo from '@/components/dashboard/ResumoExecutivo'
import PortfolioPorMercado from '@/components/dashboard/PortfolioPorMercado'
import Top5Experimentos from '@/components/dashboard/Top5Experimentos'
import GovernancaAlinhamento from '@/components/dashboard/GovernancaAlinhamento'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import LeadTimeJornada from '@/components/dashboard/LeadTimeJornada'
import FunilExperimentos from '@/components/dashboard/FunilExperimentos'
import GraficoComInsight from '@/components/dashboard/GraficoComInsight'
import { PeriodoFiltro, isDataNoPeriodo } from '@/lib/periodo-filter'
import { DashboardData, Iniciativa, EpicDetail, PipelineCount, MercadoAgregado, MetaCategoria, MonitoramentoData, InsightExecutivo } from '@/lib/types'
import { getPipelineStage, buildMonitoramentoData } from '@/lib/mappers'

/**
 * Recalcula o DashboardData completo filtrando apenas iniciativas e epics
 * criados dentro do período selecionado.
 */
function filtrarDashboardData(data: DashboardData, periodo: PeriodoFiltro): DashboardData {
  if (periodo.tipo === 'tudo') return data

  // ── Filtra iniciativas e seus epics ──
  const iniciativasFiltradas: Iniciativa[] = data.iniciativas
    .filter(ini => isDataNoPeriodo(ini.criadoEm, periodo))
    .map(ini => {
      const epicsFiltrados: EpicDetail[] = ini.epics.filter(epic =>
        isDataNoPeriodo(epic.criadoEm, periodo)
      )
      return {
        ...ini,
        epics: epicsFiltrados,
        beneficioQuantitativoTotal: epicsFiltrados.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
        dominios: Array.from(new Set(epicsFiltrados.map(e => e.dominio).filter(Boolean) as string[])),
        sponsors: Array.from(new Set(epicsFiltrados.map(e => e.sponsor).filter(Boolean) as string[])),
        segmentos: Array.from(new Set(epicsFiltrados.map(e => e.segmento).filter(Boolean) as string[])),
      }
    })

  // ── Filtra todos os epics ──
  const allEpicsFiltrados: EpicDetail[] = data.allEpics.filter(epic =>
    isDataNoPeriodo(epic.criadoEm, periodo)
  )

  // ── Pipeline counts (pelas iniciativas filtradas) ──
  const pipeline: PipelineCount = {
    BACKLOG: 0, 'EM REFINAMENTO': 0, 'PRONTO PARA EXECUÇÃO': 0,
    'EM EXPERIMENTAÇÃO': 0, 'AGUARDANDO PILOTO': 0, 'EM PILOTO': 0,
    'EM ESCALA': 0, FINALIZADO: 0, CANCELADO: 0,
  }

  // Usa getPipelineStage do mappers.ts (funciona com status de Iniciativa E de Epic)
  for (const ini of iniciativasFiltradas) {
    const stage = getPipelineStage(ini.status) ?? 'BACKLOG'
    pipeline[stage]++
  }

  // ── Benefícios ──
  const epicsComBeneficio = allEpicsFiltrados.filter(e => (e.beneficioQuantitativo ?? 0) > 0)
  const beneficioTotal = epicsComBeneficio.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
  const beneficioMedio = epicsComBeneficio.length ? beneficioTotal / epicsComBeneficio.length : 0

  // ── Epics ativos ──
  const epicsAtivos = allEpicsFiltrados.filter(
    e => e.status.id !== '10015' && e.status.id !== '10019'
  )

  // ── Top 5 epics ──
  const top5Epics = [...allEpicsFiltrados]
    .filter(e => (e.beneficioQuantitativo ?? 0) > 0)
    .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
    .slice(0, 5)

  // ── Top sponsors ──
  const sponsorCount = new Map<string, number>()
  for (const e of allEpicsFiltrados) {
    if (e.sponsor) sponsorCount.set(e.sponsor, (sponsorCount.get(e.sponsor) ?? 0) + 1)
  }
  const topSponsors = Array.from(sponsorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, count]) => ({ nome, count }))

  // ── Status distribuição (donut) ──
  const DONUT_COLORS: Record<string, string> = {
    'EM ESCALA': '#22c55e', 'EM PILOTO': '#16a34a', 'AGUARDANDO PILOTO': '#84cc16',
    'FINALIZADO': '#6b7280', 'EM EXPERIMENTAÇÃO': '#ea580c', 'PRONTO PARA EXECUÇÃO': '#d4d4d4',
    'EM REFINAMENTO': '#a8a29e', 'BACKLOG': '#9ca3af', 'CANCELADO': '#ef4444',
  }
  const STATUS_DONUT_ORDER: (keyof PipelineCount)[] = [
    'EM ESCALA', 'EM PILOTO', 'AGUARDANDO PILOTO', 'FINALIZADO',
    'EM EXPERIMENTAÇÃO', 'PRONTO PARA EXECUÇÃO', 'EM REFINAMENTO', 'BACKLOG', 'CANCELADO',
  ]
  const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = {
    'CANCELADO': 'DESCONTINUADO', 'FINALIZADO': 'CONCLUÍDO',
  }
  // ── Status distribuição (donut) — baseado nos Epics do board 2735 ──
  const statusDistribuicao = STATUS_DONUT_ORDER
    .map(key => ({
      name: STATUS_DISPLAY_NAME[key] ?? key,
      value: allEpicsFiltrados.filter(e => getPipelineStage(e.status) === key).length,
      color: DONUT_COLORS[key] ?? '#888',
    }))
    .filter(d => d.value > 0)

  // ── Mercados (por meta categoria) ──
  const mercadoMap = new Map<string, EpicDetail[]>()
  for (const e of allEpicsFiltrados) {
    const cat = e.metaCategoria ?? 'Não classificado'
    if (!mercadoMap.has(cat)) mercadoMap.set(cat, [])
    mercadoMap.get(cat)!.push(e)
  }
  const mercados: MercadoAgregado[] = Array.from(mercadoMap.entries()).map(([nome, epics]) => {
    const domCount = new Map<string, number>()
    for (const e of epics) {
      if (e.dominio) domCount.set(e.dominio, (domCount.get(e.dominio) ?? 0) + 1)
    }
    const total = epics.length
    const dominios = Array.from(domCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n, count]) => ({ nome: n, count, pct: Math.round((count / total) * 100) }))
    return {
      nome,
      qtdExperimentos: epics.length,
      valorPotencial: epics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
      dominios,
      epics,
      alertas: {
        bloqueadosIA: epics.filter(e => !!e.motivoBloqueio).length,
        aguardandoDelivery: epics.filter(e => e.status.id === '10067').length,
        semSponsor: epics.filter(e => !e.sponsor).length,
      },
    }
  }).sort((a, b) => b.qtdExperimentos - a.qtdExperimentos)

  // ── Mercados por segmento ──
  const mercadosSegmento = (data.mercadosSegmento ?? []).map(ms => {
    const epicsFiltrados = ms.epics.filter(e => isDataNoPeriodo(e.criadoEm, periodo))
    const domCount = new Map<string, number>()
    for (const e of epicsFiltrados) {
      if (e.dominio) domCount.set(e.dominio, (domCount.get(e.dominio) ?? 0) + 1)
    }
    const total = epicsFiltrados.length
    const dominios = Array.from(domCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n, count]) => ({ nome: n, count, pct: total ? Math.round((count / total) * 100) : 0 }))
    return {
      ...ms,
      epics: epicsFiltrados,
      qtdExperimentos: epicsFiltrados.length,
      valorPotencial: epicsFiltrados.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0),
      dominios,
      alertas: {
        bloqueadosIA: epicsFiltrados.filter(e => !!e.motivoBloqueio).length,
        aguardandoDelivery: epicsFiltrados.filter(e => e.status.id === '10067').length,
        semSponsor: epicsFiltrados.filter(e => !e.sponsor).length,
      },
    }
  })

  // ── Metas agregadas ──
  const metasAgregadas: Record<MetaCategoria, { count: number; valor: number }> = {
    EBITDA: { count: 0, valor: 0 },
    NPS: { count: 0, valor: 0 },
    Receita: { count: 0, valor: 0 },
  }
  const iniciativasPorMeta: Record<MetaCategoria, Iniciativa[]> = {
    EBITDA: [], NPS: [], Receita: [],
  }
  for (const ini of iniciativasFiltradas) {
    const seenMetas = new Set<MetaCategoria>()
    for (const epic of ini.epics) {
      const meta = epic.metaCategoria
      if (!meta || seenMetas.has(meta)) continue
      seenMetas.add(meta)
      metasAgregadas[meta].count++
      metasAgregadas[meta].valor += ini.beneficioQuantitativoTotal
      iniciativasPorMeta[meta].push(ini)
    }
  }

  // ── Contagens específicas ──
  const iniciativasAguardandoPiloto = iniciativasFiltradas.filter(i => i.status.id === '13045').length
  const iniciativasEmPiloto = iniciativasFiltradas.filter(i => i.status.id === '12847').length

  return {
    ...data,
    iniciativas: iniciativasFiltradas,
    allEpics: allEpicsFiltrados,
    totalEpicsAtivos: epicsAtivos.length,
    beneficioTotal,
    beneficioMedio,
    pipeline,
    iniciativasAguardandoPiloto,
    iniciativasEmPiloto,
    mercados,
    mercadosSegmento,
    top5Epics,
    topSponsors,
    statusDistribuicao,
    metasAgregadas,
    iniciativasPorMeta,
  }
}

// ── Componente principal ──

interface EstrategiaClientProps {
  data: DashboardData
  monitoramento: MonitoramentoData
}

export default function EstrategiaClient({ data, monitoramento }: EstrategiaClientProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>({ tipo: 'ultimos12' })
  const [modoSlide, setModoSlide] = useState(false)
  const [insightsMap, setInsightsMap] = useState<Record<string, InsightExecutivo>>({})
  const [insightsLoading, setInsightsLoading] = useState(false)

  const dadosFiltrados = useMemo(
    () => filtrarDashboardData(data, periodoFiltro),
    [data, periodoFiltro]
  )

  const monitoramentoFiltrado = useMemo(
    () => buildMonitoramentoData(dadosFiltrados, periodoFiltro),
    [dadosFiltrados, periodoFiltro]
  )

  // ── Buscar insights via LLM quando os dados mudam ──
  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      // Prepara contexto de cada gráfico para enviar ao LLM
      const graficos = [
        {
          id: 'resumo',
          titulo: 'Resumo Executivo',
          descricao: 'KPIs de metas estratégicas (EBITDA, Receita, NPS) e pipeline de experimentos.',
          dados: {
            totalIniciativas: dadosFiltrados.iniciativas.length,
            totalExperimentos: dadosFiltrados.allEpics.length,
            concluidos: dadosFiltrados.allEpics.filter(e => e.status?.id === '10019').length,
            emPilotoEscala: dadosFiltrados.pipeline['EM PILOTO'] + dadosFiltrados.pipeline['EM ESCALA'],
            emEscala: dadosFiltrados.pipeline['EM ESCALA'],
            metasAgregadas: dadosFiltrados.metasAgregadas,
            beneficioTotal: dadosFiltrados.beneficioTotal,
          },
        },
        {
          id: 'portfolio',
          titulo: 'Portfólio por Mercado',
          descricao: 'Distribuição de experimentos por segmento de mercado (Consumo, Corporativo, PME/GE/GOV) com valor potencial.',
          dados: {
            mercados: (dadosFiltrados.mercadosSegmento ?? []).map(m => ({
              nome: m.nome,
              qtdExperimentos: m.qtdExperimentos,
              valorPotencial: m.valorPotencial,
              dominios: m.dominios,
            })),
          },
        },
        {
          id: 'funil',
          titulo: 'Funil de Experimentos',
          descricao: 'Taxa de conversão do funil: Total → Concluídos → Pilotos → Escala.',
          dados: {
            total: dadosFiltrados.allEpics.filter(e => e.status?.id !== '10015').length,
            concluidos: dadosFiltrados.allEpics.filter(e => e.status?.id === '10019').length,
            emPilotoEscala: dadosFiltrados.pipeline['EM PILOTO'] + dadosFiltrados.pipeline['EM ESCALA'],
            emEscala: dadosFiltrados.pipeline['EM ESCALA'],
          },
        },
        {
          id: 'top5',
          titulo: 'Top 5 Experimentos por Valor Potencial',
          descricao: 'Os 5 experimentos com maior benefício quantitativo (R$).',
          dados: {
            experimentos: dadosFiltrados.top5Epics.map(e => ({
              nome: e.nome,
              key: e.key,
              beneficio: e.beneficioQuantitativo,
              dominio: e.dominio,
              timeResponsavel: e.timeResponsavel,
              status: e.status?.name,
            })),
          },
        },
        {
          id: 'burnup',
          titulo: 'Crescimento da Experimentação no Período',
          descricao: 'Acumulado mês a mês de experimentos concluídos (status 10003) e benefício quantitativo.',
          dados: {
            realizado: monitoramentoFiltrado.burnup.realizado,
            beneficio: monitoramentoFiltrado.burnup.beneficio,
            totalConcluidos: monitoramentoFiltrado.experimentosConcluidos,
            taxaConversao: monitoramentoFiltrado.taxaConversao,
          },
        },
        {
          id: 'leadtime',
          titulo: 'Jornada de Adoção',
          descricao: 'Lead time total e por fase (Backlog, Refinamento, Experimentação, Piloto) com identificação de gargalo.',
          dados: {
            totalDias: dadosFiltrados.leadTimeJornada?.totalDias,
            fases: dadosFiltrados.leadTimeJornada?.fases?.map(f => ({ fase: f.fase, dias: f.dias, pct: f.pct })),
            bottleneck: dadosFiltrados.leadTimeJornada?.bottleneck,
            cycleTimeExperimentacao: dadosFiltrados.cycleTimeExperimentacao?.map(c => ({
              label: c.label,
              mediaDias: c.mediaDias,
              qtdIniciativas: c.qtdIniciativas,
            })),
          },
        },
      ]

      const res = await fetch('/jira/api/estrategia/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ graficos }),
      })
      const json = await res.json()
      if (json.insights?.length) {
        const map: Record<string, InsightExecutivo> = {}
        for (const ins of json.insights) {
          map[ins.id] = { texto: ins.texto, tipo: ins.tipo }
        }
        setInsightsMap(map)
      }
    } catch (e) {
      console.error('Erro ao buscar insights:', e)
    } finally {
      setInsightsLoading(false)
    }
  }, [dadosFiltrados, monitoramentoFiltrado])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  // Escuta evento da Sidebar para alternar modo slide (toggle sidebar)
  useEffect(() => {
    const handler = () => setModoSlide(prev => !prev)
    window.addEventListener('open-slide-mode', handler)
    return () => window.removeEventListener('open-slide-mode', handler)
  }, [])

  return (
    <div className="flex min-h-dvh bg-gray-50">
      {/* Sidebar — oculta no modo slide */}
      {!modoSlide && (
        <div className="flex-shrink-0" style={{ width: 64 }}>
          <div className="fixed top-0 left-0 h-full z-20" style={{ width: 64 }}>
            <div className="h-full bg-gradient-to-b from-[#8B0000] to-[#6B0000]">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — oculto no modo slide */}
        {!modoSlide && (
          <div className="fixed top-0 z-10" style={{ left: 64, right: 0 }}>
            <Header
              periodoSelecionado={periodoFiltro}
              onPeriodoChange={setPeriodoFiltro}
            />
          </div>
        )}

        {/* Content */}
        <main
          className="flex-1 p-4 md:p-5 lg:p-6 gap-5 md:gap-6 flex flex-col min-w-0"
          style={{ marginTop: modoSlide ? 0 : 52 }}
        >
          {/* ── Cabeçalho executivo ── */}
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Resultados da Experimentação
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Panorama estratégico do portfólio de inovação BeOn Lab — de onde partimos ao valor entregue, em {dadosFiltrados.iniciativas.length} iniciativas.
              </p>
            </div>
          </div>

          {/* ── Linha 1: Panorama Estratégico ── */}
          <section className="flex flex-col gap-3 min-w-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#CC0000' }}>
                Panorama Estratégico
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Onde estamos: metas, portfólio e conversão do funil</p>
            </div>
            <div className="grid gap-4 md:gap-5 grid-cols-1 lg:grid-cols-3 auto-rows-fr min-w-0">
              <GraficoComInsight
                step={1}
                titulo="Resumo Executivo"
                subtitulo="Metas estratégicas & pipeline (board 2734)"
                insight={insightsMap['resumo']}
                loading={insightsLoading}
              >
                <ResumoExecutivo data={dadosFiltrados} />
              </GraficoComInsight>

              <GraficoComInsight
                step={2}
                titulo="Portfólio por Mercado"
                subtitulo="Distribuição por segmento de mercado"
                insight={insightsMap['portfolio']}
                loading={insightsLoading}
              >
                <PortfolioPorMercado data={dadosFiltrados.mercadosSegmento} />
              </GraficoComInsight>

              <GraficoComInsight
                step={3}
                titulo="Funil de Experimentos"
                subtitulo="Taxa de conversão do pipeline"
                insight={insightsMap['funil']}
                loading={insightsLoading}
              >
                <FunilExperimentos data={dadosFiltrados} />
              </GraficoComInsight>
            </div>
          </section>

          {/* ── Linha 2: Resultados & Performance ── */}
          <section className="flex flex-col gap-3 min-w-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#CC0000' }}>
                Resultados & Performance
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">O que estamos entregando: valor gerado, crescimento e velocidade</p>
            </div>
            <div className="grid gap-4 md:gap-5 grid-cols-1 lg:grid-cols-3 auto-rows-fr min-w-0">
              <GraficoComInsight
                step={4}
                titulo="Top 5 Experimentos"
                subtitulo="Maior valor potencial (R$)"
                insight={insightsMap['top5']}
                loading={insightsLoading}
              >
                <Top5Experimentos data={dadosFiltrados} />
              </GraficoComInsight>

              <GraficoComInsight
                step={5}
                titulo="Crescimento da Experimentação"
                subtitulo="Acumulado de experimentos concluídos no período"
                insight={insightsMap['burnup']}
                loading={insightsLoading}
              >
                <BurnupChart data={monitoramentoFiltrado.burnup} />
              </GraficoComInsight>

              <GraficoComInsight
                step={6}
                titulo="Jornada de Adoção"
                subtitulo="Lead time e gargalos do pipeline"
                insight={insightsMap['leadtime']}
                loading={insightsLoading}
              >
                <LeadTimeJornada
                  data={dadosFiltrados.leadTimeJornada}
                  cycleTimeExperimentacao={dadosFiltrados.cycleTimeExperimentacao}
                />
              </GraficoComInsight>
            </div>
          </section>
        </main>
      </div>

      {/* Botão flutuante para reexibir sidebar no modo slide */}
      {modoSlide && (
        <button
          onClick={() => setModoSlide(false)}
          className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
          title="Mostrar menu lateral"
        >
          <PanelLeftOpen size={14} />
          Menu
        </button>
      )}
    </div>
  )
}