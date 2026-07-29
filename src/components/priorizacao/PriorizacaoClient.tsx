'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, List, Presentation, Target } from 'lucide-react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import QuadranteCard from './QuadranteCard'
import NaoClassificadosList from './NaoClassificadosList'
import ModoReuniao from './ModoReuniao'
import VisaoEstrategica from './VisaoEstrategica'
import VisaoListaPriorizacao from './VisaoListaPriorizacao'

// --------------- Tipos ---------------

export interface ExperimentoPriorizacao {
  key: string
  nome: string
  statusId: string
  statusNome: string
  parentKey: string | null
  parentNome: string | null
  complexidade: string | null
  beneficioQuantitativo: number | null
  beneficioQualitativo: string | null
  sponsor: string | null
  bo: string | null
  timeResponsavel: string | null
  dominio: string | null
  segmento: string | null
  portfolio: string | null
  motivoBloqueio: string | null
  prioridade: string | null
  criadoEm: string | null
}

export type Voto = 'Baixa' | 'Média' | 'Alta'
export type Quadrante = 'estrategico' | 'alta' | 'media' | 'baixa' | 'nao-classificado'

export const DESENVOLVEDORES = ['Raiol', 'Hugo', 'Bruno', 'Matheus', 'Gui', 'Rogério', 'Luis']

export const COMPLEXIDADE_PESO: Record<string, number> = {
  'Baixa': 1,
  'Média': 2,
  'Alta': 3,
}

// --------------- Helpers ---------------

export function formatarMoeda(valor: number | null): string {
  if (!valor) return '—'
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(0)}K`
  return `R$ ${valor}`
}

export function getPontuacaoBeneficio(beneficio: number | null): number {
  if (!beneficio) return 0
  if (beneficio >= 10_000_000) return 5
  if (beneficio >= 1_000_000) return 4
  if (beneficio >= 500_000) return 3
  if (beneficio >= 100_000) return 2
  return 1
}

export function getPontuacaoComplexidade(complexidade: string | null): number {
  return COMPLEXIDADE_PESO[complexidade ?? ''] ?? 2
}

export function getVotoPeso(voto: Voto): number {
  return voto === 'Alta' ? 3 : voto === 'Média' ? 2 : 1
}

// --------------- Componente ---------------

export default function PriorizacaoClient() {
  const [experimentos, setExperimentos] = useState<ExperimentoPriorizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [votos, setVotos] = useState<Record<string, Record<string, Voto>>>({})
  const [votanteAtual, setVotanteAtual] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('priorizacao_votante') ?? ''
    return ''
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [mostrarSoSemDados, setMostrarSoSemDados] = useState(false)
  const [modoReuniao, setModoReuniao] = useState(false)
  const [visaoEstrategica, setVisaoEstrategica] = useState(false)
  const [visaoLista, setVisaoLista] = useState(true)  // Lista executiva como padrão

  // Carregar dados da API
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/jira/api/priorizacao')
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setExperimentos(data.experimentos ?? [])
      } catch (e) {
        setErro(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Carregar votos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('priorizacao_votos')
    if (saved) {
      try { setVotos(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Salvar votos no localStorage
  const salvarVotos = useCallback((novosVotos: Record<string, Record<string, Voto>>) => {
    setVotos(novosVotos)
    localStorage.setItem('priorizacao_votos', JSON.stringify(novosVotos))
  }, [])

  const setVotante = useCallback((nome: string) => {
    setVotanteAtual(nome)
    localStorage.setItem('priorizacao_votante', nome)
  }, [])

  const votar = useCallback((key: string, voto: Voto) => {
    if (!votanteAtual) return
    const novosVotos = { ...votos }
    if (!novosVotos[key]) novosVotos[key] = {}
    novosVotos[key][votanteAtual] = voto
    salvarVotos(novosVotos)
  }, [votanteAtual, votos, salvarVotos])

  // Versão do votar para o modo reunião (recebe o dev explicitamente)
  const votarModoReuniao = useCallback((key: string, desenvolvedor: string, voto: Voto) => {
    const novosVotos = { ...votos }
    if (!novosVotos[key]) novosVotos[key] = {}
    novosVotos[key][desenvolvedor] = voto
    salvarVotos(novosVotos)
  }, [votos, salvarVotos])

  const toggleExpand = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Calcular score de prioridade combinando benefício, complexidade e votos
  const calcularScore = useCallback((exp: ExperimentoPriorizacao): number => {
    const scoreBeneficio = getPontuacaoBeneficio(exp.beneficioQuantitativo)
    const scoreComplexidade = getPontuacaoComplexidade(exp.complexidade)
    const scoreBase = scoreComplexidade > 0 ? scoreBeneficio / scoreComplexidade : scoreBeneficio

    const votosExp = votos[exp.key] ?? {}
    const votosValidos = Object.values(votosExp).filter((v): v is Voto => !!v)
    const scoreVotos = votosValidos.length > 0
      ? votosValidos.reduce((s, v) => s + getVotoPeso(v), 0) / votosValidos.length
      : 0

    return scoreBase + scoreVotos * 0.5
  }, [votos])

  // Classificar experimentos nos quadrantes
  const quadrantes = useMemo(() => {
    const result: Record<Quadrante, ExperimentoPriorizacao[]> = {
      'estrategico': [],
      'alta': [],
      'media': [],
      'baixa': [],
      'nao-classificado': [],
    }

    for (const exp of experimentos) {
      const temBeneficio = (exp.beneficioQuantitativo ?? 0) > 0
      const temComplexidade = !!exp.complexidade

      const votosExp = votos[exp.key] ?? {}
      const votosAlta = Object.values(votosExp).filter(v => v === 'Alta').length
      const totalVotos = Object.values(votosExp).filter(v => !!v).length

      // Estratégico: maioria absoluta votou Alta E tem benefício
      if (totalVotos >= 3 && votosAlta > totalVotos / 2 && temBeneficio) {
        result['estrategico'].push(exp)
        continue
      }

      // Sem benefício ou sem complexidade → não classificado
      if (!temBeneficio || !temComplexidade) {
        result['nao-classificado'].push(exp)
        continue
      }

      // Precisa de pelo menos 2 votos para ser priorizado
      if (totalVotos < 2) {
        result['nao-classificado'].push(exp)
        continue
      }

      const score = calcularScore(exp)

      if (score >= 3.0) result['alta'].push(exp)
      else if (score >= 1.5) result['media'].push(exp)
      else result['baixa'].push(exp)
    }

    for (const q of Object.keys(result) as Quadrante[]) {
      result[q].sort((a, b) => calcularScore(b) - calcularScore(a))
    }

    return result
  }, [experimentos, votos, calcularScore])

  const votosDoVotante = useMemo(() => {
    if (!votanteAtual) return 0
    return Object.values(votos).filter(v => v[votanteAtual]).length
  }, [votos, votanteAtual])

  const resetarVotos = useCallback(() => {
    if (confirm('Resetar TODOS os votos? Esta ação não pode ser desfeita.')) {
      salvarVotos({})
      localStorage.removeItem('priorizacao_votante')
      setVotanteAtual('')
    }
  }, [salvarVotos])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: '#CC0000' }} />
          <p className="text-gray-600">Carregando experimentos do board 2707...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar</p>
          <p className="text-gray-600 text-sm">{erro}</p>
        </div>
      </div>
    )
  }

  const totalClassificados = quadrantes.estrategico.length + quadrantes.alta.length + quadrantes.media.length + quadrantes.baixa.length

  // Modo reunião
  if (modoReuniao) {
    return (
      <ModoReuniao
        experimentos={experimentos}
        votos={votos}
        onVotar={votarModoReuniao}
        onVoltar={() => setModoReuniao(false)}
      />
    )
  }

  return (
    <div className="flex min-h-dvh" style={{ background: '#f0f0f0' }}>
      {/* Sidebar fixa */}
      <div className="flex-shrink-0" style={{ width: 72 }}>
        <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
          <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header fixo */}
        <div className="fixed top-0 z-10" style={{ left: 72, right: 0 }}>
          <Header />
        </div>

        {/* Content */}
        <main className="flex-1 p-3 md:p-4 lg:p-5 gap-3 md:gap-4 flex flex-col min-w-0" style={{ marginTop: 52 }}>
          {/* Header interno da priorização */}
          <div className="bg-white border rounded-lg shadow-sm px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#8B0000' }}>Priorização de Experimentos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Board 2707 — {experimentos.length} experimentos em backlog/refinamento/andamento
                </p>
              </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setVisaoLista(false); setVisaoEstrategica(!visaoEstrategica) }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${
                visaoEstrategica && !visaoLista
                  ? 'bg-white border-2 text-gray-800'
                  : 'text-white'
              }`}
              style={visaoEstrategica && !visaoLista ? { borderColor: '#8B0000' } : { background: '#8B0000' }}
              title="Visão Estratégica: matriz Complexidade × Benefício"
            >
              <Target size={18} />
              Visão Estratégica
            </button>
            <button
              onClick={() => { setVisaoEstrategica(false); setVisaoLista(!visaoLista) }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${
                visaoLista
                  ? 'bg-white border-2 text-gray-800'
                  : 'text-white'
              }`}
              style={visaoLista ? { borderColor: '#8B0000' } : { background: '#8B0000' }}
              title="Lista: experimentos ordenados por prioridade (Highest → Low)"
            >
              <List size={18} />
              Lista
            </button>
            <button
              onClick={() => setModoReuniao(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-white font-medium transition-colors"
              style={{ background: '#8B0000' }}
              title="Modo reunião: votar experimento por experimento"
            >
              <Presentation size={18} />
              Modo Reunião
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Votante:</span>
              <select
                value={votanteAtual}
                onChange={e => setVotante(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                <option value="">Selecionar...</option>
                {DESENVOLVEDORES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {votanteAtual && (
                <span className="text-xs text-gray-400">
                  ({votosDoVotante} votos)
                </span>
              )}
            </div>
            <button
              onClick={resetarVotos}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Resetar votos
            </button>
          </div>
        </div>
      </div>

      {/* Sumário */}
      <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#8B0000' }} />
          <span className="font-medium">Estratégico:</span>
          <span>{quadrantes.estrategico.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
          <span className="font-medium">Alta:</span>
          <span>{quadrantes.alta.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#F97316' }} />
          <span className="font-medium">Média:</span>
          <span>{quadrantes.media.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#6B7280' }} />
          <span className="font-medium">Baixa:</span>
          <span>{quadrantes.baixa.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border" style={{ borderColor: '#D4D4D4' }} />
          <span className="font-medium">Não classificados:</span>
          <span>{quadrantes['nao-classificado'].length}</span>
        </div>
        <div className="ml-auto text-gray-400">
          {totalClassificados} classificados de {experimentos.length}
        </div>
      </div>

      {/* Visão Estratégica, Lista ou Grid de quadrantes */}
      <div className="pb-8">
        {visaoLista ? (
          <VisaoListaPriorizacao experimentos={experimentos} />
        ) : visaoEstrategica ? (
          <VisaoEstrategica experimentos={experimentos} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuadranteCard
            titulo="🎯 Estratégico"
            descricao="Maioria votou Alta + tem benefício"
            cor="#8B0000"
            experimentos={quadrantes.estrategico}
            votos={votos}
            votanteAtual={votanteAtual}
            expanded={expanded}
            onToggle={toggleExpand}
            onVotar={votar}
            calcularScore={calcularScore}
          />
          <QuadranteCard
            titulo="🔴 Alta Prioridade"
            descricao="Score ≥ 3.0"
            cor="#EF4444"
            experimentos={quadrantes.alta}
            votos={votos}
            votanteAtual={votanteAtual}
            expanded={expanded}
            onToggle={toggleExpand}
            onVotar={votar}
            calcularScore={calcularScore}
          />
          <QuadranteCard
            titulo="🟠 Média Prioridade"
            descricao="Score 1.5–3.0"
            cor="#F97316"
            experimentos={quadrantes.media}
            votos={votos}
            votanteAtual={votanteAtual}
            expanded={expanded}
            onToggle={toggleExpand}
            onVotar={votar}
            calcularScore={calcularScore}
          />
          <QuadranteCard
            titulo="⚪ Baixa Prioridade"
            descricao="Score &lt; 1.5"
            cor="#6B7280"
            experimentos={quadrantes.baixa}
            votos={votos}
            votanteAtual={votanteAtual}
            expanded={expanded}
            onToggle={toggleExpand}
            onVotar={votar}
            calcularScore={calcularScore}
          />
        </div>

        {/* Não classificados */}
        <NaoClassificadosList
          experimentos={quadrantes['nao-classificado']}
          votos={votos}
          votanteAtual={votanteAtual}
          expanded={expanded}
          onToggle={toggleExpand}
          onVotar={votar}
          mostrarSoSemDados={mostrarSoSemDados}
          onToggleFiltro={() => setMostrarSoSemDados(prev => !prev)}
        />
          </>
        )}
      </div>
        </main>
      </div>
    </div>
  )
}