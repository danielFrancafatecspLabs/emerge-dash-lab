'use client'

import { useState, useMemo } from 'react'
import type { ExperimentoPriorizacao } from './PriorizacaoClient'
import { formatarMoeda } from './PriorizacaoClient'

// --------------- Tipos ---------------

interface Props {
  experimentos: ExperimentoPriorizacao[]
}

type QuadranteEstrategico = 'estrategico' | 'alta-prioridade' | 'media-prioridade' | 'despriorizacao'

interface PontoExperimento {
  exp: ExperimentoPriorizacao
  x: number  // 0-100 (complexidade: Baixa=0, Média=50, Alta=100)
  y: number  // 0-100 (benefício normalizado)
  quadrante: QuadranteEstrategico
}

// --------------- Constantes ---------------

const COMPLEXIDADE_X: Record<string, number> = {
  'Baixa': 15,
  'Média': 50,
  'Alta': 85,
}

// Número de experimentos por nível de complexidade para espalhar pontos horizontalmente
// em vez de empilhar todos no mesmo X
function espalharPontos(
  experimentos: ExperimentoPriorizacao[],
): Map<string, { xBase: number; offset: number }> {
  const grupos = new Map<string, ExperimentoPriorizacao[]>()
  for (const exp of experimentos) {
    const chave = exp.complexidade ?? 'sem-dados'
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(exp)
  }

  const offsets = new Map<string, { xBase: number; offset: number }>()
  for (const [complexidade, exps] of grupos) {
    const xBase = COMPLEXIDADE_X[complexidade] ?? 50
    const n = exps.length
    // Range dinâmico: mínimo 20, escala com número de pontos
    const range = Math.max(20, Math.min(n * 3, 35))
    exps.forEach((exp, i) => {
      const offset = n > 1 ? ((i / (n - 1)) - 0.5) * range : 0
      offsets.set(exp.key, { xBase, offset })
    })
  }
  return offsets
}

const BENEFICIO_MAX = 10_000_000 // R$ 10M como teto para normalização

const QUADRANTE_CONFIG: Record<QuadranteEstrategico, {
  titulo: string
  descricao: string
  cor: string
  bgCor: string
  icone: string
}> = {
  'estrategico': {
    titulo: 'Estratégico',
    descricao: 'Alto benefício, baixa complexidade — prioridade máxima',
    cor: '#8B0000',
    bgCor: 'rgba(139, 0, 0, 0.06)',
    icone: '🎯',
  },
  'alta-prioridade': {
    titulo: 'Alta Prioridade',
    descricao: 'Alto benefício, alta complexidade — requer planejamento',
    cor: '#EF4444',
    bgCor: 'rgba(239, 68, 68, 0.06)',
    icone: '🔴',
  },
  'media-prioridade': {
    titulo: 'Média Prioridade',
    descricao: 'Baixo benefício, baixa complexidade — quick wins',
    cor: '#F97316',
    bgCor: 'rgba(249, 115, 22, 0.06)',
    icone: '🟠',
  },
  'despriorizacao': {
    titulo: 'Despriorização',
    descricao: 'Baixo benefício, alta complexidade — reavaliar',
    cor: '#9CA3AF',
    bgCor: 'rgba(156, 163, 175, 0.06)',
    icone: '⚪',
  },
}

// --------------- Helpers ---------------

function normalizarBeneficio(valor: number | null): number {
  if (!valor || valor <= 0) return 5 // sem benefício → quase zero
  const pct = Math.min(valor / BENEFICIO_MAX, 1)
  return 5 + pct * 90 // 5 a 95
}

function classificarQuadrante(
  exp: ExperimentoPriorizacao,
  x: number,
  y: number
): QuadranteEstrategico {
  // Jira priority "Highest" sempre vai para Estratégico
  if (exp.prioridade === 'Highest') return 'estrategico'

  const isAltaComplexidade = x >= 45
  const isAltoBeneficio = y >= 45

  if (isAltoBeneficio && !isAltaComplexidade) return 'estrategico'
  if (isAltoBeneficio && isAltaComplexidade) return 'alta-prioridade'
  if (!isAltoBeneficio && !isAltaComplexidade) return 'media-prioridade'
  return 'despriorizacao'
}

// Pequeno offset aleatório determinístico baseado na key para evitar overlap
function jitter(key: string, scale: number): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i)
    hash |= 0
  }
  return ((hash % 100) / 100 - 0.5) * scale
}

// --------------- Componente ---------------

export default function VisaoEstrategica({ experimentos }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [filtroQuadrante, setFiltroQuadrante] = useState<QuadranteEstrategico | 'todos'>('todos')

  const pontos = useMemo(() => {
    const result: PontoExperimento[] = []
    const offsets = espalharPontos(experimentos)

    for (const exp of experimentos) {
      const temComplexidade = !!exp.complexidade
      const temBeneficio = (exp.beneficioQuantitativo ?? 0) > 0

      // Sem dados → pular (não aparece no gráfico)
      if (!temComplexidade && !temBeneficio) continue

      const offsetInfo = offsets.get(exp.key)
      const xBase = offsetInfo?.xBase ?? 50
      const spread = offsetInfo?.offset ?? 0

      const x = temComplexidade
        ? xBase + spread + jitter(exp.key + 'x', 6)
        : 50 + jitter(exp.key + 'x', 15)

      const y = temBeneficio
        ? normalizarBeneficio(exp.beneficioQuantitativo) + jitter(exp.key + 'y', 8)
        : 5 + jitter(exp.key + 'y', 4)

      const quadrante = classificarQuadrante(exp, x, y)

      result.push({ exp, x, y, quadrante })
    }

    return result
  }, [experimentos])

  const pontosFiltrados = useMemo(() => {
    if (filtroQuadrante === 'todos') return pontos
    return pontos.filter(p => p.quadrante === filtroQuadrante)
  }, [pontos, filtroQuadrante])

  const contagem = useMemo(() => {
    const c: Record<QuadranteEstrategico, number> = {
      'estrategico': 0,
      'alta-prioridade': 0,
      'media-prioridade': 0,
      'despriorizacao': 0,
    }
    for (const p of pontos) c[p.quadrante]++
    return c
  }, [pontos])

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      {/* Título e legenda */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Matriz Estratégica</h2>
          <p className="text-xs text-gray-500">
            Posicionamento por Complexidade × Benefício • {pontos.length} experimentos com dados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(QUADRANTE_CONFIG) as QuadranteEstrategico[]).map(q => (
            <button
              key={q}
              onClick={() => setFiltroQuadrante(filtroQuadrante === q ? 'todos' : q)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filtroQuadrante === q
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 hover:border-gray-400'
              }`}
              style={filtroQuadrante === q ? { background: QUADRANTE_CONFIG[q].cor, borderColor: QUADRANTE_CONFIG[q].cor } : {}}
            >
              {QUADRANTE_CONFIG[q].icone} {QUADRANTE_CONFIG[q].titulo}
              <span className="ml-1 opacity-70">({contagem[q]})</span>
            </button>
          ))}
          {filtroQuadrante !== 'todos' && (
            <button
              onClick={() => setFiltroQuadrante('todos')}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative bg-gray-50 rounded-lg border" style={{ height: '520px' }}>
        {/* Eixos */}
        {/* Linha vertical central (divisão complexidade) */}
        <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-gray-300" />

        {/* Linha horizontal central (divisão benefício) */}
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-300" />

        {/* Labels dos quadrantes */}
        <div className="absolute top-3 left-3 text-xs font-medium" style={{ color: QUADRANTE_CONFIG['estrategico'].cor }}>
          🎯 Estratégico ({contagem['estrategico']})
        </div>
        <div className="absolute top-3 right-3 text-xs font-medium" style={{ color: QUADRANTE_CONFIG['alta-prioridade'].cor }}>
          🔴 Alta Prioridade ({contagem['alta-prioridade']})
        </div>
        <div className="absolute bottom-3 left-3 text-xs font-medium" style={{ color: QUADRANTE_CONFIG['media-prioridade'].cor }}>
          🟠 Média Prioridade ({contagem['media-prioridade']})
        </div>
        <div className="absolute bottom-3 right-3 text-xs font-medium" style={{ color: QUADRANTE_CONFIG['despriorizacao'].cor }}>
          ⚪ Despriorização ({contagem['despriorizacao']})
        </div>

        {/* Labels dos eixos */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-medium">
          Complexidade →
        </div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium" style={{ writingMode: 'vertical-rl' }}>
          Benefício →
        </div>

        {/* Ticks eixo X */}
        <div className="absolute -bottom-5 left-0 text-[10px] text-gray-400" style={{ left: '8%' }}>Baixa</div>
        <div className="absolute -bottom-5 text-[10px] text-gray-400" style={{ left: '46%' }}>Média</div>
        <div className="absolute -bottom-5 right-0 text-[10px] text-gray-400" style={{ right: '8%' }}>Alta</div>

        {/* Ticks eixo Y */}
        <div className="absolute left-0 top-0 text-[10px] text-gray-400" style={{ top: '3%' }}>R$10M</div>
        <div className="absolute left-0 text-[10px] text-gray-400" style={{ top: '47%' }}>R$5M</div>
        <div className="absolute left-0 bottom-0 text-[10px] text-gray-400" style={{ bottom: '3%' }}>R$0</div>

        {/* Área de plotagem com padding */}
        <div className="absolute" style={{ top: '8%', bottom: '12%', left: '8%', right: '5%' }}>
          {/* Pontos */}
          {pontosFiltrados.map(({ exp, x, y, quadrante }) => {
            const config = QUADRANTE_CONFIG[quadrante]
            const isHovered = hoveredKey === exp.key
            const isHighest = exp.prioridade === 'Highest'

            // Normalizar coordenadas para a área de plotagem
            const left = `${x}%`
            const bottom = `${y}%`

            return (
              <div
                key={exp.key}
                className="absolute transition-transform"
                style={{
                  left,
                  bottom,
                  transform: 'translate(-50%, 50%)',
                  zIndex: isHovered ? 50 : 10,
                }}
                onMouseEnter={() => setHoveredKey(exp.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {/* Bolha */}
                <div
                  className={`rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                    isHovered ? 'scale-150 shadow-lg' : 'scale-100 shadow-sm'
                  } ${isHighest ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}
                  style={{
                    width: isHovered ? '28px' : '20px',
                    height: isHovered ? '28px' : '20px',
                    background: config.cor,
                    borderColor: isHighest ? '#EAB308' : config.cor,
                    opacity: filtroQuadrante !== 'todos' && filtroQuadrante !== quadrante ? 0.3 : 0.85,
                  }}
                  title={`${exp.key}: ${exp.nome}`}
                >
                  {isHighest && (
                    <span className="text-white text-[8px]">★</span>
                  )}
                </div>

                {/* Tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
                    style={{ minWidth: '240px', zIndex: 100 }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold">{exp.key}</span>
                      {isHighest && (
                        <span className="bg-yellow-500 text-yellow-900 text-[10px] px-1 rounded font-bold">HIGHEST</span>
                      )}
                      <span className="text-gray-400 text-[10px]">{quadrante === 'estrategico' ? '🎯 Estratégico' : quadrante === 'alta-prioridade' ? '🔴 Alta' : quadrante === 'media-prioridade' ? '🟠 Média' : '⚪ Despriorização'}</span>
                    </div>
                    <p className="text-gray-300 mb-2 leading-snug">{exp.nome}</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div><span className="text-gray-400">Benefício:</span> {formatarMoeda(exp.beneficioQuantitativo)}</div>
                      <div><span className="text-gray-400">Complexidade:</span> {exp.complexidade ?? '?'}</div>
                      {exp.prioridade && (
                        <div><span className="text-gray-400">Prioridade:</span> {exp.prioridade}</div>
                      )}
                      {exp.dominio && (
                        <div><span className="text-gray-400">Domínio:</span> {exp.dominio}</div>
                      )}
                      {exp.sponsor && (
                        <div><span className="text-gray-400">Sponsor:</span> {exp.sponsor}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela de resumo */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(QUADRANTE_CONFIG) as QuadranteEstrategico[]).map(q => {
          const config = QUADRANTE_CONFIG[q]
          const itens = pontos.filter(p => p.quadrante === q)
          const totalBeneficio = itens.reduce((s, p) => s + (p.exp.beneficioQuantitativo ?? 0), 0)
          return (
            <div
              key={q}
              className="rounded-lg border p-3 cursor-pointer transition-colors hover:shadow-sm"
              style={{
                borderColor: filtroQuadrante === q ? config.cor : 'transparent',
                background: config.bgCor,
                boxShadow: filtroQuadrante === q ? `0 0 0 1px ${config.cor}` : undefined,
              }}
              onClick={() => setFiltroQuadrante(filtroQuadrante === q ? 'todos' : q)}
            >
              <div className="text-lg mb-1">{config.icone}</div>
              <div className="font-bold text-sm" style={{ color: config.cor }}>{config.titulo}</div>
              <div className="text-2xl font-bold mt-1">{itens.length}</div>
              <div className="text-xs text-gray-400 mt-1">
                Σ {formatarMoeda(totalBeneficio)}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{config.descricao}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}