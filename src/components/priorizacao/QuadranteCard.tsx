'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ExperimentoPriorizacao, Voto } from './PriorizacaoClient'
import { formatarMoeda } from './PriorizacaoClient'

interface Props {
  titulo: string
  descricao: string
  cor: string
  experimentos: ExperimentoPriorizacao[]
  votos: Record<string, Record<string, Voto>>
  votanteAtual: string
  expanded: Set<string>
  onToggle: (key: string) => void
  onVotar: (key: string, voto: Voto) => void
  calcularScore: (exp: ExperimentoPriorizacao) => number
}

const STATUS_LABEL: Record<string, string> = {
  '10004': 'Backlog',
  '10139': 'Refinamento',
  '10067': 'Pronto p/ Execução',
  '3': 'Em andamento',
  '10204': 'Em validação',
}

export default function QuadranteCard({
  titulo,
  descricao,
  cor,
  experimentos,
  votos,
  votanteAtual,
  expanded,
  onToggle,
  onVotar,
  calcularScore,
}: Props) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="px-4 py-3 text-white font-bold flex items-center justify-between" style={{ background: cor }}>
        <div>
          <span>{titulo}</span>
          <span className="ml-2 text-sm opacity-80">({experimentos.length})</span>
        </div>
        <span className="text-xs opacity-70">{descricao}</span>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {experimentos.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Nenhum experimento neste quadrante
          </div>
        ) : (
          experimentos.map(exp => {
            const isOpen = expanded.has(exp.key)
            const score = calcularScore(exp)
            const votosExp = votos[exp.key] ?? {}
            const votosCount = Object.values(votosExp).filter(v => !!v).length
            const votosBreakdown = { Alta: 0, Média: 0, Baixa: 0 }
            for (const v of Object.values(votosExp)) {
              if (v === 'Alta') votosBreakdown.Alta++
              else if (v === 'Média') votosBreakdown.Média++
              else if (v === 'Baixa') votosBreakdown.Baixa++
            }

            return (
              <div key={exp.key} className="hover:bg-gray-50">
                {/* Linha principal */}
                <div
                  className="px-4 py-3 cursor-pointer flex items-center gap-3"
                  onClick={() => onToggle(exp.key)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{exp.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                        {exp.key}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{STATUS_LABEL[exp.statusId] ?? exp.statusNome}</span>
                      <span>Score: {score.toFixed(1)}</span>
                      <span>{formatarMoeda(exp.beneficioQuantitativo)}</span>
                      <span className="capitalize">{exp.complexidade ?? '?'}</span>
                    </div>
                  </div>

                  {/* Votos rápidos */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {(['Baixa', 'Média', 'Alta'] as Voto[]).map(v => {
                      const isSelected = votanteAtual && votosExp[votanteAtual] === v
                      return (
                        <button
                          key={v}
                          disabled={!votanteAtual}
                          onClick={() => onVotar(exp.key, v)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            isSelected
                              ? 'bg-red-700 text-white border-red-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-400'
                          } ${!votanteAtual ? 'opacity-30 cursor-not-allowed' : ''}`}
                          title={v}
                        >
                          {v === 'Alta' ? 'A' : v === 'Média' ? 'M' : 'B'}
                        </button>
                      )
                    })}
                  </div>

                  {/* Contagem de votos */}
                  <div className="text-xs text-gray-400 w-16 text-right shrink-0">
                    {votosCount > 0 ? (
                      <span>
                        {votosBreakdown.Alta > 0 && <span className="text-red-600">{votosBreakdown.Alta}A </span>}
                        {votosBreakdown.Média > 0 && <span className="text-orange-500">{votosBreakdown.Média}M </span>}
                        {votosBreakdown.Baixa > 0 && <span className="text-gray-400">{votosBreakdown.Baixa}B</span>}
                      </span>
                    ) : (
                      <span className="text-gray-300">0 votos</span>
                    )}
                  </div>

                  {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </div>

                {/* Detalhes expandidos */}
                {isOpen && (
                  <div className="px-4 pb-3 pt-1 bg-gray-50 text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {exp.parentNome && (
                        <div>
                          <span className="text-gray-400">Iniciativa:</span>
                          <p className="text-gray-700">{exp.parentNome}</p>
                        </div>
                      )}
                      {exp.sponsor && (
                        <div>
                          <span className="text-gray-400">Sponsor:</span>
                          <p className="text-gray-700">{exp.sponsor}</p>
                        </div>
                      )}
                      {exp.bo && (
                        <div>
                          <span className="text-gray-400">BO:</span>
                          <p className="text-gray-700">{exp.bo}</p>
                        </div>
                      )}
                      {exp.dominio && (
                        <div>
                          <span className="text-gray-400">Domínio:</span>
                          <p className="text-gray-700">{exp.dominio}</p>
                        </div>
                      )}
                      {exp.timeResponsavel && (
                        <div>
                          <span className="text-gray-400">Time:</span>
                          <p className="text-gray-700">{exp.timeResponsavel}</p>
                        </div>
                      )}
                      {exp.segmento && (
                        <div>
                          <span className="text-gray-400">Segmento:</span>
                          <p className="text-gray-700">{exp.segmento}</p>
                        </div>
                      )}
                      {exp.beneficioQualitativo && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Benefício Qualitativo:</span>
                          <p className="text-gray-700">{exp.beneficioQualitativo}</p>
                        </div>
                      )}
                    </div>
                    {/* Votos detalhados */}
                    {votosCount > 0 && (
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                        Votos: {Object.entries(votosExp).map(([nome, v]) => (
                          <span key={nome} className="mr-2">
                            <strong>{nome}</strong>: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}