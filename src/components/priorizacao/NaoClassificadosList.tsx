'use client'

import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ExperimentoPriorizacao, Voto } from './PriorizacaoClient'
import { formatarMoeda } from './PriorizacaoClient'

interface Props {
  experimentos: ExperimentoPriorizacao[]
  votos: Record<string, Record<string, Voto>>
  votanteAtual: string
  expanded: Set<string>
  onToggle: (key: string) => void
  onVotar: (key: string, voto: Voto) => void
  mostrarSoSemDados: boolean
  onToggleFiltro: () => void
}

const STATUS_LABEL: Record<string, string> = {
  '10004': 'Backlog',
  '10139': 'Refinamento',
  '10067': 'Pronto p/ Execução',
  '3': 'Em andamento',
  '10204': 'Em validação',
}

export default function NaoClassificadosList({
  experimentos,
  votos,
  votanteAtual,
  expanded,
  onToggle,
  onVotar,
  mostrarSoSemDados,
  onToggleFiltro,
}: Props) {
  const filtrados = mostrarSoSemDados
    ? experimentos.filter(e => (e.beneficioQuantitativo ?? 0) === 0 || !e.complexidade)
    : experimentos

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-600 flex items-center gap-2">
          <AlertTriangle size={18} />
          Não Classificados ({experimentos.length})
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarSoSemDados}
            onChange={onToggleFiltro}
            className="rounded"
          />
          Mostrar apenas sem benefício/complexidade
        </label>
      </div>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {mostrarSoSemDados ? 'Nenhum sem dados' : 'Todos os experimentos foram classificados!'}
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filtrados.map(exp => {
              const isOpen = expanded.has(exp.key)
              const votosExp = votos[exp.key] ?? {}
              const votosCount = Object.values(votosExp).filter(v => !!v).length
              const temBeneficio = (exp.beneficioQuantitativo ?? 0) > 0
              const temComplexidade = !!exp.complexidade
              const faltamVotos = votosCount < 2

              return (
                <div key={exp.key} className="hover:bg-gray-50">
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
                        <span>{formatarMoeda(exp.beneficioQuantitativo)}</span>
                        <span className="capitalize">{exp.complexidade ?? '?'}</span>
                        {/* Badges de pendência */}
                        {!temBeneficio && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs">
                            sem benefício
                          </span>
                        )}
                        {!temComplexidade && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs">
                            sem complexidade
                          </span>
                        )}
                        {faltamVotos && temBeneficio && temComplexidade && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                            aguardando votos ({votosCount}/2)
                          </span>
                        )}
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
                          >
                            {v === 'Alta' ? 'A' : v === 'Média' ? 'M' : 'B'}
                          </button>
                        )
                      })}
                    </div>

                    <div className="text-xs text-gray-400 w-16 text-right shrink-0">
                      {votosCount > 0 ? `${votosCount} voto${votosCount > 1 ? 's' : ''}` : '0'}
                    </div>

                    {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </div>

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
                      </div>
                      {votosCount > 0 && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                          Votos: {Object.entries(votosExp).map(([nome, v]) => (
                            <span key={nome} className="mr-2">
                              <strong>{nome}</strong>: {v}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        {!temBeneficio && '⚠️ Preencha o Benefício Quantitativo (customfield_13242) no Jira. '}
                        {!temComplexidade && '⚠️ Preencha a Complexidade (customfield_11664) no Jira. '}
                        {faltamVotos && temBeneficio && temComplexidade && 'Precisa de pelo menos 2 votos para ser classificado.'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}