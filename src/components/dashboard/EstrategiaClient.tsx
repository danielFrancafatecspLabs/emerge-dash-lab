'use client'

import { useState, useMemo } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ResumoExecutivo from '@/components/dashboard/ResumoExecutivo'
import PortfolioPorMercado from '@/components/dashboard/PortfolioPorMercado'
import Top5Experimentos from '@/components/dashboard/Top5Experimentos'
import SituacaoPortfolio from '@/components/dashboard/SituacaoPortfolio'
import PipelineInovacao from '@/components/dashboard/PipelineInovacao'
import GovernancaAlinhamento from '@/components/dashboard/GovernancaAlinhamento'
import { PeriodoFiltro, isDataNoPeriodo } from '@/lib/periodo-filter'
import { DashboardData, Iniciativa, EpicDetail, PipelineCount, MercadoAgregado, MetaCategoria } from '@/lib/types'

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

  // Usa a mesma lógica do buildDashboardData para mapear status → pipeline
  const STATUS_PIPELINE: Record<string, keyof PipelineCount> = {
    '10004': 'BACKLOG',
    '10139': 'EM REFINAMENTO',
    '10067': 'PRONTO PARA EXECUÇÃO',
    '13045': 'AGUARDANDO PILOTO',
    '12848': 'EM EXPERIMENTAÇÃO',
    '12847': 'EM PILOTO',
    '10504': 'EM ESCALA',
    '10003': 'FINALIZADO',
    '10015': 'CANCELADO',
  }

  for (const ini of iniciativasFiltradas) {
    const stage = STATUS_PIPELINE[ini.status.id] ?? 'BACKLOG'
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
    'EM ESCALA': '#22c55e', 'EM PILOTO': '#3b82f6', 'AGUARDANDO PILOTO': '#a78bfa',
    'FINALIZADO': '#6b7280', 'EM EXPERIMENTAÇÃO': '#f59e0b', 'PRONTO PARA EXECUÇÃO': '#06b6d4',
    'EM REFINAMENTO': '#8b5cf6', 'BACKLOG': '#9ca3af', 'CANCELADO': '#ef4444',
  }
  const STATUS_DONUT_ORDER: (keyof PipelineCount)[] = [
    'EM ESCALA', 'EM PILOTO', 'AGUARDANDO PILOTO', 'FINALIZADO',
    'EM EXPERIMENTAÇÃO', 'PRONTO PARA EXECUÇÃO', 'EM REFINAMENTO', 'BACKLOG', 'CANCELADO',
  ]
  const STATUS_DISPLAY_NAME: Partial<Record<keyof PipelineCount, string>> = {
    'CANCELADO': 'DESCONTINUADO', 'FINALIZADO': 'CONCLUÍDO',
  }
  const statusDistribuicao = STATUS_DONUT_ORDER
    .map(key => ({
      name: STATUS_DISPLAY_NAME[key] ?? key,
      value: pipeline[key] ?? 0,
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
  const mercadosSegmento = data.mercadosSegmento.map(ms => {
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
}

export default function EstrategiaClient({ data }: EstrategiaClientProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>({ tipo: 'ultimos12' })

  const dadosFiltrados = useMemo(
    () => filtrarDashboardData(data, periodoSelecionado),
    [data, periodoSelecionado]
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0" style={{ width: 72 }}>
        <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
          <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="fixed top-0 z-10" style={{ left: 72, right: 0 }}>
          <Header
            periodoSelecionado={periodoSelecionado}
            onPeriodoChange={setPeriodoSelecionado}
          />
        </div>

        {/* Content */}
        <main className="flex-1 p-3 gap-3 flex flex-col" style={{ marginTop: 52 }}>

          {/* Row 1: Resumo Executivo (Metas + Pipeline) */}
          <ResumoExecutivo data={dadosFiltrados} />

          {/* Row 2: Portfólio Mercado (45%) + Top 5 (35%) + Situação (20%) */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-[45fr_35fr_20fr]">
            <PortfolioPorMercado data={dadosFiltrados} />
            <Top5Experimentos data={dadosFiltrados} />
            <SituacaoPortfolio data={dadosFiltrados} />
          </div>

          {/* Row 3: Pipeline (60%) + Governança (40%) */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-[60fr_40fr]">
            <PipelineInovacao data={dadosFiltrados} />
            <GovernancaAlinhamento data={dadosFiltrados} />
          </div>

        </main>
      </div>
    </div>
  )
}