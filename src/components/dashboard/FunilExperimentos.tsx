'use client'

import { useState, useMemo } from 'react'
import {
  List, LayoutDashboard, ChevronDown, Eye, MousePointer2,
  FlaskConical, CheckCircle2, Clock, Ban, FileSearch,
  ArrowRightFromLine, Rocket, Target, TrendingUp,
  AlertCircle, Layers, BarChart3, Sparkles
} from 'lucide-react'
import { DashboardData, EpicDetail, Iniciativa } from '@/lib/types'
import { getPipelineStage } from '@/lib/mappers'
import ExperimentoModal from './ExperimentoModal'
import IniciativaModal from './IniciativaModal'

interface Props { data: DashboardData }

// ── Ícones e metadados visuais para cada camada ──
const CAMADA_META: Record<string, { icon: React.ReactNode; desc: string }> = {
  'Total de Experimentos':   { icon: <Layers size={11} />, desc: 'Todos os experimentos do período' },
  'Em Andamento':            { icon: <FlaskConical size={11} />, desc: 'Experimentos em execução' },
  'Concluídos':              { icon: <CheckCircle2 size={11} />, desc: 'Experimentos finalizados' },
  'Cancelados':              { icon: <Ban size={11} />, desc: 'Experimentos cancelados' },
  'Em Validação':            { icon: <FileSearch size={11} />, desc: 'Experimentos em validação de resultados' },
  'Aguardando Piloto':       { icon: <Clock size={11} />, desc: 'Iniciativas prontas para iniciar piloto' },
  'Pilotos Executados':      { icon: <Target size={11} />, desc: 'Iniciativas em fase de piloto' },
  'Pilotos':                 { icon: <Target size={11} />, desc: 'Iniciativas em fase de piloto' },
  'Em Escala':               { icon: <Rocket size={11} />, desc: 'Iniciativas implementadas em escala' },
  'Escala':                  { icon: <Rocket size={11} />, desc: 'Iniciativas implementadas em escala' },
}

export default function FunilExperimentos({ data }: Props) {
  const [visaoSimplificada, setVisaoSimplificada] = useState(true)
  const [modalEpics, setModalEpics] = useState<EpicDetail[] | null>(null)
  const [modalIniciativas, setModalIniciativas] = useState<Iniciativa[] | null>(null)
  const [modalTitulo, setModalTitulo] = useState('')
  const [selectedEpic, setSelectedEpic] = useState<EpicDetail | null>(null)
  const [hoveredCamada, setHoveredCamada] = useState<string | null>(null)

  // ── Board de Experimentação (2735) — Epics ──
  const totalExperimentos = data.allEpics.length
  const emAndamento = data.allEpics.filter(e =>
    e.status?.id === '3' || e.status?.name === 'Em andamento'
  ).length
  const emValidacao = data.allEpics.filter(e =>
    e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'
  ).length
  const emAndamentoTotal = emAndamento + emValidacao
  // Exclui os mesmos experimentos que o burnup exclui para manter consistência
  const EXCLUIR_CONCLUIDOS = new Set([
    'Otimiza APP - Ciclo 1 (Análise de comentários das lojas de apps)',
    "IA para IP'S de rede",
    'Assistente IA Ágil - Ciclo 2',
    'Sumarização dos Contratos',
    'Jurisquery - Consulta de Pareceres Juridicos',
  ])
  // Alinhado com o burnup (mappers.ts): apenas status 10019 (FINALIZADO)
  const concluidos = data.allEpics.filter(e =>
    e.status?.id === '10019' && !EXCLUIR_CONCLUIDOS.has(e.nome)
  ).length
  const cancelados = data.allEpics.filter(e =>
    e.status?.id === '10015' || e.status?.name === 'Cancelado'
  ).length

  // ── Board de Iniciativas (2734) — Pipeline ──
  const aguardandoPiloto = data.pipeline['AGUARDANDO PILOTO']
  const emPiloto = data.pipeline['EM PILOTO']
  const emEscala = data.pipeline['EM ESCALA']

  // ── Iniciativas agrupadas por estágio do pipeline ──
  const iniciativasPorPipeline = useMemo(() => {
    const map: Record<string, Iniciativa[]> = {
      'EM PILOTO': [],
      'EM ESCALA': [],
      'AGUARDANDO PILOTO': [],
    }
    for (const ini of data.iniciativas) {
      const stage = getPipelineStage(ini.status)
      if (stage && stage in map) {
        map[stage].push(ini)
      }
    }
    return map
  }, [data.iniciativas])

  // ── Epics filtrados por status (para camadas clicáveis de Epic) ──
  const epicsPorStatus = useMemo(() => {
    const emAndamentoList = data.allEpics.filter(e =>
      e.status?.id === '3' || e.status?.name === 'Em andamento'
    )
    const EXCLUIR_CONCLUIDOS = new Set([
      'Otimiza APP - Ciclo 1 (Análise de comentários das lojas de apps)',
      "IA para IP'S de rede",
      'Assistente IA Ágil - Ciclo 2',
      'Sumarização dos Contratos',
      'Jurisquery - Consulta de Pareceres Juridicos',
    ])
    // Alinhado com o burnup: apenas status 10019 (FINALIZADO)
    const concluidosList = data.allEpics.filter(e =>
      e.status?.id === '10019' && !EXCLUIR_CONCLUIDOS.has(e.nome)
    )
    const canceladosList = data.allEpics.filter(e =>
      e.status?.id === '10015' || e.status?.name === 'Cancelado'
    )
    const emValidacaoList = data.allEpics.filter(e =>
      e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação'
    )
    const emAndamentoCompletoList = [...emAndamentoList, ...emValidacaoList]
    return { emAndamentoList, emAndamentoCompletoList, concluidosList, canceladosList, emValidacaoList }
  }, [data.allEpics])

  // ── % sobre o total de experimentos ──
  const pct = (v: number) => totalExperimentos > 0 ? Math.round((v / totalExperimentos) * 100) : 0

  // ── Definição das camadas ──
  // ── Paleta de vermelhos ──
  // Do mais escuro (base do funil) ao mais claro (topo)
  const RED_900 = '#7F1D1D'
  const RED_800 = '#991B1B'
  const RED_700 = '#B91C1C'
  const RED_600 = '#DC2626'
  const RED_500 = '#EF4444'
  const RED_400 = '#F87171'
  const RED_300 = '#FCA5A5'
  const RED_200 = '#FECACA'
  const RED_100 = '#FEE2E2'
  const RED_50  = '#FEF2F2'

  const camadasSimplificadas = [
    { id: 'total',        label: 'Total de Experimentos', valor: totalExperimentos, pct: 100, cor: RED_600, grad: 'from-red-600 to-red-700', chave: null as string | null, isIniciativa: false, epicFilter: null as string | null },
    { id: 'andamento',    label: 'Em Andamento',          valor: emAndamentoTotal,  pct: pct(emAndamentoTotal), cor: RED_500, grad: 'from-red-500 to-red-600', chave: 'emAndamentoCompletoList', isIniciativa: false, epicFilter: 'emAndamentoCompletoList' },
    { id: 'concluidos',   label: 'Concluídos',            valor: concluidos,        pct: pct(concluidos), cor: RED_400, grad: 'from-red-400 to-red-500', chave: 'concluidosList', isIniciativa: false, epicFilter: 'concluidosList' },
    { id: 'aguardando',   label: 'Aguardando Piloto',     valor: aguardandoPiloto,  pct: pct(aguardandoPiloto), cor: RED_300, grad: 'from-red-300 to-red-400', chave: 'AGUARDANDO PILOTO', isIniciativa: true, epicFilter: null },
    { id: 'pilotos',      label: 'Pilotos Executados',    valor: emPiloto + emEscala, pct: pct(emPiloto + emEscala), cor: RED_700, grad: 'from-red-700 to-red-800', chave: 'EM PILOTO', isIniciativa: true, epicFilter: null },
    { id: 'escala',       label: 'Em Escala',             valor: emEscala,          pct: pct(emEscala), cor: RED_800, grad: 'from-red-800 to-red-900', chave: 'EM ESCALA', isIniciativa: true, epicFilter: null },
  ]

  const camadasDetalhadas = [
    { id: 'total',        label: 'Total de Experimentos', valor: totalExperimentos, pct: 100, cor: RED_600, grad: 'from-red-600 to-red-700', chave: null as string | null, isIniciativa: false, epicFilter: null as string | null },
    { id: 'cancelados',   label: 'Cancelados',            valor: cancelados,        pct: pct(cancelados), cor: RED_900, grad: 'from-red-900 to-red-950', chave: 'canceladosList', isIniciativa: false, epicFilter: 'canceladosList' },
    { id: 'andamento',    label: 'Em Andamento',          valor: emAndamentoTotal,  pct: pct(emAndamentoTotal), cor: RED_500, grad: 'from-red-500 to-red-600', chave: 'emAndamentoCompletoList', isIniciativa: false, epicFilter: 'emAndamentoCompletoList' },
    { id: 'validacao',    label: 'Em Validação',          valor: emValidacao,       pct: pct(emValidacao), cor: RED_300, grad: 'from-red-300 to-red-400', chave: 'emValidacaoList', isIniciativa: false, epicFilter: 'emValidacaoList' },
    { id: 'concluidos',   label: 'Concluídos',            valor: concluidos,        pct: pct(concluidos), cor: RED_400, grad: 'from-red-400 to-red-500', chave: 'concluidosList', isIniciativa: false, epicFilter: 'concluidosList' },
    { id: 'pilotos',      label: 'Pilotos',               valor: emPiloto,          pct: pct(emPiloto), cor: RED_700, grad: 'from-red-700 to-red-800', chave: 'EM PILOTO', isIniciativa: true, epicFilter: null },
    { id: 'escala',       label: 'Escala',                valor: emEscala,          pct: pct(emEscala), cor: RED_800, grad: 'from-red-800 to-red-900', chave: 'EM ESCALA', isIniciativa: true, epicFilter: null },
  ]

  const camadas = visaoSimplificada ? camadasSimplificadas : camadasDetalhadas
  const maxValor = Math.max(...camadas.map(c => c.valor), 1)

  function abrirModal(camada: typeof camadas[number]) {
    if (camada.isIniciativa && camada.chave) {
      const iniciativas = iniciativasPorPipeline[camada.chave]
      if (!iniciativas || iniciativas.length === 0) return
      setModalTitulo(camada.label)
      setModalIniciativas(iniciativas)
    } else if (camada.epicFilter) {
      const epics = epicsPorStatus[camada.epicFilter as keyof typeof epicsPorStatus]
      if (!epics || epics.length === 0) return
      setModalTitulo(camada.label)
      setModalEpics(epics)
    }
  }

  function temDetalhes(camada: typeof camadas[number]): boolean {
    if (camada.isIniciativa && camada.chave) {
      return (iniciativasPorPipeline[camada.chave]?.length ?? 0) > 0
    }
    if (camada.epicFilter) {
      return (epicsPorStatus[camada.epicFilter as keyof typeof epicsPorStatus]?.length ?? 0) > 0
    }
    return false
  }

  return (
    <div className="flex flex-col gap-2 min-w-0 justify-center h-full select-none">
      {/* ── Header com toggle ── */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={13} className="text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Funil de Experimentos</span>
          <span className="text-[8px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full font-medium">
            {totalExperimentos} total
          </span>
        </div>
        <button
          onClick={() => setVisaoSimplificada(prev => !prev)}
          className={`
            group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold
            transition-all duration-200 border shadow-sm
            ${visaoSimplificada
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            }
          `}
          title={visaoSimplificada ? 'Ver visão detalhada do funil' : 'Ver visão simplificada do funil'}
        >
          {visaoSimplificada ? (
            <LayoutDashboard size={11} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
          ) : (
            <List size={11} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
          <span>{visaoSimplificada ? 'Detalhado' : 'Simplificado'}</span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${visaoSimplificada ? 'text-blue-400' : 'text-gray-400'}`}
            style={{ transform: 'rotate(-90deg)' }}
          />
        </button>
      </div>

      {/* ── BARRAS DO FUNIL ── */}
      <div className="flex flex-col gap-1.5">
        {camadas.map((camada, i) => {
          const largura = maxValor > 0 ? (camada.valor / maxValor) * 100 : 0
          const temClick = temDetalhes(camada)
          const isHovered = hoveredCamada === camada.id
          const meta = CAMADA_META[camada.label]

          return (
            <div
              key={camada.id}
              className="w-full flex items-center gap-2 group/bar"
              onMouseEnter={() => setHoveredCamada(camada.id)}
              onMouseLeave={() => setHoveredCamada(null)}
            >
              {/* Label */}
              <div className="w-24 md:w-28 text-right flex-shrink-0 leading-tight">
                <span className="text-[10px] font-medium text-gray-600 flex items-center justify-end gap-1">
                  {meta?.icon}
                  {camada.label}
                </span>
                {camada.nota && (
                  <span className="block text-[7px] text-gray-400 font-normal tracking-wide uppercase">
                    {camada.nota}
                  </span>
                )}
              </div>

              {/* Barra */}
              <div className="flex-1 relative h-6 min-w-0">
                {/* Track de fundo */}
                <div className="absolute inset-0 rounded-lg bg-gray-100/80 border border-gray-100/50" />

                {/* Barra preenchida */}
                <div
                  onClick={() => temClick && abrirModal(camada)}
                  className={`
                    absolute top-0 left-1/2 -translate-x-1/2 h-full rounded-lg
                    transition-all duration-500 ease-out flex items-center justify-center min-w-[32px]
                    shadow-sm
                    ${temClick
                      ? 'cursor-pointer hover:brightness-110 hover:shadow-md active:brightness-95 active:scale-[0.98]'
                      : 'cursor-default'
                    }
                    ${isHovered && temClick ? 'shadow-md scale-[1.02]' : ''}
                  `}
                  style={{
                    width: `${Math.max(largura, 7)}%`,
                    maxWidth: '100%',
                    background: `linear-gradient(135deg, ${camada.cor}, ${camada.cor}dd)`,
                    opacity: i === 0 ? 1 : 0.88,
                  }}
                  title={temClick ? `Clique para ver detalhes — ${meta?.desc ?? camada.label}` : undefined}
                >
                  <span className="text-white font-bold drop-shadow-sm whitespace-nowrap flex items-center gap-1" style={{ fontSize: 11 }}>
                    {camada.valor}
                    {temClick && isHovered && (
                      <MousePointer2 size={9} className="text-white/70 animate-pulse" />
                    )}
                  </span>
                </div>

                {/* Tooltip flutuante no hover */}
                {isHovered && temClick && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  >
                    <div className="bg-gray-900 text-white text-[9px] font-medium px-2 py-1 rounded-md shadow-lg whitespace-nowrap flex items-center gap-1">
                      <Eye size={9} />
                      Ver {camada.isIniciativa ? 'iniciativas' : 'experimentos'}
                    </div>
                  </div>
                )}
              </div>

              {/* % + badge de interatividade */}
              <div className="w-10 text-right flex-shrink-0 flex items-center justify-end gap-1">
                <span className="text-[9px] font-semibold text-gray-400 tabular-nums">
                  {i === 0 ? '' : `${camada.pct}%`}
                </span>
                {temClick && (
                  <span className="text-[7px] text-gray-300 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    <MousePointer2 size={8} />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Taxa de conversão (só na visão simplificada) ── */}
      {visaoSimplificada && (
        <div className="mt-2 pt-2.5 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={11} className="text-gray-400" />
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa de Conversão
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-red-50/80 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full" style={{ background: RED_400 }} />
              <span className="text-[10px] text-gray-500 font-medium">Concluídos</span>
              <span className="text-xs font-bold text-gray-800">{pct(concluidos)}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50/80 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full" style={{ background: RED_700 }} />
              <span className="text-[10px] text-gray-500 font-medium">Piloto</span>
              <span className="text-xs font-bold text-gray-800">{pct(emPiloto + emEscala)}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50/80 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full" style={{ background: RED_800 }} />
              <span className="text-[10px] text-gray-500 font-medium">Escala</span>
              <span className="text-xs font-bold text-gray-800">{pct(emEscala)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer info ── */}
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[7px] text-gray-300">
          % em relação ao total de experimentos no período
        </p>
        <p className="text-[7px] text-gray-300 flex items-center gap-1">
          <MousePointer2 size={7} />
          Clique nas barras para detalhes
        </p>
      </div>

      {/* ── Modal de detalhes do experimento ── */}
      {selectedEpic && (
        <ExperimentoModal epic={selectedEpic} onClose={() => setSelectedEpic(null)} />
      )}

      {/* ── Modal de Epics (para camadas de Epic) ── */}
      {modalEpics && (
        <ModalEpicsList
          title={modalTitulo}
          epics={modalEpics}
          onClose={() => setModalEpics(null)}
          onSelectEpic={setSelectedEpic}
        />
      )}

      {/* ── Modal de Iniciativas (para camadas de pipeline) ── */}
      {modalIniciativas && (
        <IniciativaModal
          title={modalTitulo}
          iniciativas={modalIniciativas}
          onClose={() => setModalIniciativas(null)}
        />
      )}
    </div>
  )
}

// ── Modal de lista de Epics (substitui o modal inline anterior) ──
function ModalEpicsList({
  title, epics, onClose, onSelectEpic
}: {
  title: string
  epics: EpicDetail[]
  onClose: () => void
  onSelectEpic: (epic: EpicDetail) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '92vw', maxWidth: 900, maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800" style={{ fontSize: 14 }}>{title}</p>
            <span className="text-gray-400 text-xs">
              {epics.length} experimento{epics.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-auto flex-1 px-5 py-3 flex flex-col gap-2">
          {epics.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum experimento encontrado</p>
          )}
          {epics.map(epic => (
            <div
              key={epic.key}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => onSelectEpic(epic)}
            >
              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#FFF0F0', color: '#CC0000' }}>
                {epic.key}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{epic.nome}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                    {epic.status.name}
                  </span>
                  {epic.sponsor && (
                    <span className="text-[10px] text-gray-400">{epic.sponsor}</span>
                  )}
                  {epic.dominio && (
                    <span className="text-[10px] text-gray-400">· {epic.dominio}</span>
                  )}
                </div>
              </div>
              {epic.beneficioQuantitativo != null && epic.beneficioQuantitativo > 0 && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#CC0000' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(epic.beneficioQuantitativo)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}