'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { PanelLeftOpen, Download, Loader2, Presentation } from 'lucide-react'
import { PortalPage } from '@/components/shell/PortalPage'
import { PeriodoSelect } from '@/components/shell/PeriodoSelect'
import ResumoExecutivo from '@/components/dashboard/ResumoExecutivo'
import MapaDiretorias from '@/components/dashboard/MapaDiretorias'
import Top5Experimentos from '@/components/dashboard/Top5Experimentos'
import GovernancaAlinhamento from '@/components/dashboard/GovernancaAlinhamento'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import LeadTimeJornada from '@/components/dashboard/LeadTimeJornada'
import FunilExperimentos from '@/components/dashboard/FunilExperimentos'
import GraficoComInsight from '@/components/dashboard/GraficoComInsight'
import { PeriodoFiltro } from '@/lib/periodo-filter'
import { DashboardData, EpicDetail, MonitoramentoData, InsightExecutivo } from '@/lib/types'
import { buildMonitoramentoData } from '@/lib/mappers'
import { ehCancelado, filtrarDashboardData, resultadosDaEstrategia } from '@/lib/estrategia/resultados'
import type { EstadoDaClassificacao } from '@/lib/portfolio-classifier'

// ── Componente principal ──

interface EstrategiaClientProps {
  data: DashboardData
  monitoramento: MonitoramentoData
  /** Benefício já validado pelo Financeiro, por Epic (controle em /beneficios). */
  beneficioValidadoPorEpic: Record<string, number>
  /** Situação da classificação das metas pela IA (por que há experimentos sem meta). */
  classificacao: EstadoDaClassificacao
}

export default function EstrategiaClient({ data, beneficioValidadoPorEpic, classificacao }: EstrategiaClientProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>({ tipo: 'ultimos12' })
  const [modoSlide, setModoSlide] = useState(() =>
    typeof document !== 'undefined' && document.body.classList.contains('modo-apresentacao')
  )
  const [insightsMap, setInsightsMap] = useState<Record<string, InsightExecutivo>>({})
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [exportingImage, setExportingImage] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Sincroniza o estado modoSlide com uma classe no <body> para garantir
  // que o estado persista mesmo se o React não re-renderizar imediatamente.
  useEffect(() => {
    if (modoSlide) {
      document.body.classList.add('modo-apresentacao')
    } else {
      document.body.classList.remove('modo-apresentacao')
    }
  }, [modoSlide])

  const dadosFiltrados = useMemo(
    () => filtrarDashboardData(data, periodoFiltro),
    [data, periodoFiltro]
  )

  // Benefício, cancelados e hipóteses do período (regras em lib/estrategia/resultados.ts).
  const resultados = useMemo(() => resultadosDaEstrategia(dadosFiltrados), [dadosFiltrados])
  // Validado pelo Financeiro: só os experimentos do período que não foram cancelados.
  const beneficioValidadoTotal = useMemo(
    () => dadosFiltrados.allEpics.reduce((s, e) => s + (ehCancelado(e) ? 0 : beneficioValidadoPorEpic[e.key] ?? 0), 0),
    [dadosFiltrados, beneficioValidadoPorEpic],
  )

  // Diretorias: a contagem é por experimento; sem domínio no experimento, vale o da iniciativa-mãe.
  const dominioDaIniciativa = useMemo(() => {
    const porKey = new Map(data.iniciativas.map(i => [i.key, i.dominio || i.dominios[0] || null]))
    return (e: EpicDetail) => (e.parentKey ? porKey.get(e.parentKey) : null)
  }, [data.iniciativas])

  const monitoramentoFiltrado = useMemo(
    // O burnup usa todos os Epics (data.allEpics): concluídos não podem sumir por terem sido criados antes do período.
    () => buildMonitoramentoData(dadosFiltrados, periodoFiltro, data.allEpics),
    [dadosFiltrados, periodoFiltro, data.allEpics]
  )

  // ── Dados de lead time (usa os dados originais sem filtro por domínio) ──
  const leadTimeJornadaFiltrado = dadosFiltrados.leadTimeJornada

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
            hipotesesValidadas: resultados.hipoteses.validadas.length,
            hipotesesRefutadas: resultados.hipoteses.refutadas.length,
            metasAgregadas: dadosFiltrados.metasAgregadas,
            beneficioPotencialSemCancelados: resultados.beneficio,
            beneficioDosCancelados: resultados.cancelados.valor,
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
          descricao: 'Funil: experimentos → concluídos → hipóteses validadas (iniciativas em aguardando piloto, piloto ou escala) e refutadas (iniciativas concluídas).',
          dados: {
            total: dadosFiltrados.allEpics.filter(e => !ehCancelado(e)).length,
            concluidos: dadosFiltrados.allEpics.filter(e => e.status?.id === '10019').length,
            validadas: resultados.hipoteses.validadas.length,
            refutadas: resultados.hipoteses.refutadas.length,
            aguardandoPiloto: resultados.hipoteses.porEtapa['AGUARDANDO PILOTO'].length,
            emPiloto: resultados.hipoteses.porEtapa['EM PILOTO'].length,
            emEscala: resultados.hipoteses.porEtapa['EM ESCALA'].length,
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
          descricao: 'Acumulado mês a mês de experimentos concluídos (mesma contagem do report Semanal: status Concluído), partindo do que já estava concluído antes do período, e benefício quantitativo.',
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
  }, [dadosFiltrados, monitoramentoFiltrado, resultados])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  // ── Exportar dashboard como imagem ──
  async function exportarComoImagem() {
    if (!mainContentRef.current || exportingImage) return
    setExportingImage(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(mainContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `estrategia-beon-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
    } catch (err) {
      console.error('Erro ao exportar imagem:', err)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setExportingImage(false)
    }
  }

  return (
    <PortalPage
      title="Estratégia"
      description="Panorama do portfólio de inovação beOn Labs"
      chrome={!modoSlide}
      refreshable
      actions={
        <>
          <PeriodoSelect value={periodoFiltro} onChange={setPeriodoFiltro} />
          <button
            type="button"
            onClick={() => {
              setModoSlide(true)
              // Fallback: manipula o DOM diretamente caso o React não re-renderize
              document.body.classList.add('modo-apresentacao')
            }}
            title="Esconder menu e barra para apresentar"
            className="hidden h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3.5 text-sm font-medium text-beon-ink hover:bg-beon-soft lg:flex"
          >
            <Presentation size={16} className="text-beon-muted" aria-hidden />
            Apresentar
          </button>
        </>
      }
    >
        {/* Content */}
        <div
          ref={mainContentRef}
          className="flex-1 p-3 md:p-4 gap-3 flex flex-col min-w-0"
        >
          {/* ── Cabeçalho executivo ── */}
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Resultados da Experimentação
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Panorama estratégico do portfólio de inovação BeOn Lab — de onde partimos ao valor entregue, em {dadosFiltrados.iniciativas.length} iniciativas.
              </p>
            </div>
            <button
              onClick={exportarComoImagem}
              disabled={exportingImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60 transition-colors"
              style={{ background: '#8B0000' }}
              title="Baixar dashboard como imagem PNG"
            >
              {exportingImage ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {exportingImage ? 'Gerando...' : 'Baixar Imagem'}
            </button>
          </div>

          {/* ── Linha 1: Impacto Entregue ── */}
          <section className="flex flex-col gap-2 min-w-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#CC0000' }}>
                1 · Impacto Entregue
              </p>
            </div>
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 auto-rows-fr min-w-0">
              <GraficoComInsight
                insight={insightsMap['resumo']}
                loading={insightsLoading}
                ocultarInsight
              >
                <ResumoExecutivo data={dadosFiltrados} resultados={resultados} beneficioValidadoTotal={beneficioValidadoTotal} classificacao={classificacao} />
              </GraficoComInsight>

              <GraficoComInsight
                step={1}
                titulo="Crescimento da Experimentação"
                subtitulo="Acumulado de experimentos concluídos (mesma contagem do Semanal)"
                insight={insightsMap['burnup']}
                loading={insightsLoading}
                ocultarInsight
              >
                <BurnupChart data={monitoramentoFiltrado.burnup} />
              </GraficoComInsight>

              <GraficoComInsight
                step={2}
                titulo="Jornada de Adoção"
                subtitulo="Lead time e gargalos do pipeline"
                insight={insightsMap['leadtime']}
                loading={insightsLoading}
                ocultarInsight
              >
                <LeadTimeJornada
                  data={leadTimeJornadaFiltrado}
                  cycleTimeExperimentacao={dadosFiltrados.cycleTimeExperimentacao}
                />
              </GraficoComInsight>
            </div>
          </section>

          {/* ── Linha 2: Como Chegamos Lá ── */}
          <section className="flex flex-col gap-2 min-w-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#CC0000' }}>
                2 · Como Chegamos Lá
              </p>
            </div>
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 auto-rows-fr min-w-0">
              <GraficoComInsight
                step={3}
                titulo="Funil de Experimentos"
                subtitulo="Distribuição por etapa do pipeline"
                insight={insightsMap['funil']}
                loading={insightsLoading}
                ocultarInsight
              >
                <FunilExperimentos data={dadosFiltrados} resultados={resultados} />
              </GraficoComInsight>

              <GraficoComInsight
                step={4}
                titulo="Top 5 Experimentos"
                subtitulo="Maior valor potencial (R$)"
                insight={insightsMap['top5']}
                loading={insightsLoading}
                ocultarInsight
              >
                <Top5Experimentos data={dadosFiltrados} />
              </GraficoComInsight>

              <GraficoComInsight
                step={5}
                titulo="Diretorias por Experimentos"
                subtitulo="Ordenado por volume de experimentos · benefício potencial"
                insight={insightsMap['portfolio']}
                loading={insightsLoading}
                ocultarInsight
              >
                <MapaDiretorias epics={dadosFiltrados.allEpics.filter(e => !ehCancelado(e))} dominioReserva={dominioDaIniciativa} />
              </GraficoComInsight>
            </div>
          </section>
        </div>

      {/* Botão flutuante para reexibir o menu no modo apresentação */}
      {/* Renderizado sempre, mas controlado por CSS via classe modo-apresentacao no <body> */}
      <button
        onClick={() => {
          setModoSlide(false)
          // Fallback: manipula o DOM diretamente caso o React não re-renderize
          document.body.classList.remove('modo-apresentacao')
        }}
        className="fixed bottom-4 left-4 z-30 hidden items-center gap-1.5 px-3 py-2 rounded-lg shadow-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium [body.modo-apresentacao_&]:flex"
        title="Mostrar menu lateral"
      >
        <PanelLeftOpen size={14} />
        Menu
      </button>
    </PortalPage>
  )
}