'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { PeriodoFiltro, isDataNoPeriodo } from '@/lib/periodo-filter'
import { DashboardData, Iniciativa, EpicDetail, PipelineCount, MercadoAgregado, MetaCategoria, MonitoramentoData } from '@/lib/types'
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
    e => e.status.id !== '10015' && e.status.id !== '10003'
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
  // ── Status distribuição (donut) — baseado nos Epics do board 2707 ──
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

  const dadosFiltrados = useMemo(
    () => filtrarDashboardData(data, periodoFiltro),
    [data, periodoFiltro]
  )

  const monitoramentoFiltrado = useMemo(
    () => buildMonitoramentoData(dadosFiltrados, periodoFiltro),
    [dadosFiltrados, periodoFiltro]
  )

  // Escuta evento da Sidebar para alternar modo slide (toggle sidebar)
  useEffect(() => {
    const handler = () => setModoSlide(prev => !prev)
    window.addEventListener('open-slide-mode', handler)
    return () => window.removeEventListener('open-slide-mode', handler)
  }, [])

  return (
    <div className="flex min-h-dvh" style={{ background: '#f0f0f0' }}>
      {/* Sidebar — oculta no modo slide */}
      {!modoSlide && (
        <div className="flex-shrink-0" style={{ width: 72 }}>
          <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
            <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — oculto no modo slide */}
        {!modoSlide && (
          <div className="fixed top-0 z-10" style={{ left: 72, right: 0 }}>
            <Header
              periodoSelecionado={periodoFiltro}
              onPeriodoChange={setPeriodoFiltro}
            />
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-5 gap-4 flex flex-col" style={{ marginTop: modoSlide ? 0 : 52 }}>

          {/* Row 1: Resumo Executivo + Portfólio + Funil */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <ResumoExecutivo data={dadosFiltrados} />
            <PortfolioPorMercado data={dadosFiltrados.mercadosSegmento} />
            <FunilExperimentos data={dadosFiltrados} />
          </div>

          {/* Row 2: Top 5 + Burnup + Jornada de Adoção */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[20fr_45fr_35fr]" style={{ minHeight: 320, maxHeight: 420 }}>
            <Top5Experimentos data={dadosFiltrados} />
            <BurnupChart data={monitoramentoFiltrado.burnup} />
            <LeadTimeJornada
              data={dadosFiltrados.leadTimeJornada}
              cycleTimeExperimentacao={dadosFiltrados.cycleTimeExperimentacao}
            />
          </div>

        </main>
      </div>

      {/* Botão flutuante para reexibir sidebar no modo slide */}
      {modoSlide && (
        <button
          onClick={() => setModoSlide(false)}
          className="fixed bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
          title="Mostrar menu lateral"
        >
          <PanelLeftOpen size={14} />
          Menu
        </button>
      )}
    </div>
  )
}