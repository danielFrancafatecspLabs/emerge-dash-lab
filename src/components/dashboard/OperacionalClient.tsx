'use client'

import { useState, useMemo } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import CycleTimeEstrategia from '@/components/dashboard/CycleTimeEstrategia'
import GovernancaAlinhamento from '@/components/dashboard/GovernancaAlinhamento'
import LeadTimeJornada from '@/components/dashboard/LeadTimeJornada'
import IniciativasPorLab from '@/components/monitoramento/IniciativasPorLab'
import Top5Experimentos from '@/components/dashboard/Top5Experimentos'
import PipelineIniciativasHorizontal from '@/components/dashboard/PipelineIniciativasHorizontal'
import SituacaoPortfolioOperacional from '@/components/dashboard/SituacaoPortfolioOperacional'
import Top5Dominios from '@/components/dashboard/Top5Dominios'
import { PeriodoFiltro } from '@/lib/periodo-filter'
import { DashboardData, MonitoramentoData } from '@/lib/types'

interface Props {
  data: DashboardData
  monitoramento: MonitoramentoData
}

export default function OperacionalClient({ data, monitoramento }: Props) {
  // Sempre usa dados completos (sem filtro de período no Operacional)
  const dados = data

  // Iniciativas por Lab (do monitoramento)
  const iniciativasLab = monitoramento?.iniciativasPorLab ?? []

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
          <Header />
        </div>

        {/* Content */}
        <main className="flex-1 p-3 gap-3 flex flex-col" style={{ marginTop: 52 }}>
          {/* Título */}
          <div className="mb-1">
            <h1 className="text-lg font-bold text-gray-900">
              Dashboard Operacional de Experimentos
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento detalhado da execução e do pipeline de experimentos.
            </p>
          </div>

          {/* Row 1: Jornada de Adoção + Cycle Time + Gargalo */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
            <LeadTimeJornada
              data={dados.leadTimeJornada}
              cycleTimeExperimentacao={dados.cycleTimeExperimentacao}
            />
            <CycleTimeEstrategia
              porPorte={dados.cycleTimeExperimentacao}
              geral={dados.cycleTimeExperimentacaoGeral}
              leadTime={dados.leadTime}
            />
            <GovernancaAlinhamento data={dados} />
          </div>

          {/* Row 2: Pipeline das Iniciativas (full width) */}
          <PipelineIniciativasHorizontal data={dados} />

          {/* Row 3: Situação do Portfólio + Iniciativas por Lab */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
            <SituacaoPortfolioOperacional data={dados} />
            <IniciativasPorLab data={iniciativasLab} />
          </div>

          {/* Row 4: Top 5 Experimentos + Top 5 Domínios */}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
            <Top5Experimentos data={dados} />
            <Top5Dominios data={dados} />
          </div>
        </main>
      </div>
    </div>
  )
}