'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, SkipForward, Users, CheckCircle2, Circle } from 'lucide-react'
import type { ExperimentoPriorizacao, Voto } from './PriorizacaoClient'
import { DESENVOLVEDORES, formatarMoeda, getPontuacaoBeneficio, getPontuacaoComplexidade } from './PriorizacaoClient'

interface Props {
  experimentos: ExperimentoPriorizacao[]
  votos: Record<string, Record<string, Voto>>
  onVotar: (key: string, desenvolvedor: string, voto: Voto) => void
  onVoltar: () => void
}

const STATUS_LABEL: Record<string, string> = {
  '10004': 'Backlog',
  '10139': 'Refinamento',
  '10067': 'Pronto p/ Execução',
  '3': 'Em andamento',
  '10204': 'Em validação',
}

export default function ModoReuniao({ experimentos, votos, onVotar, onVoltar }: Props) {
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [devSelecionado, setDevSelecionado] = useState<string>('')

  const exp = experimentos[indiceAtual] ?? null
  const votosExp = exp ? (votos[exp.key] ?? {}) : {}

  const devsQueVotaram = useMemo(() => {
    if (!exp) return []
    return DESENVOLVEDORES.filter(d => votosExp[d])
  }, [exp, votosExp])

  const totalVotos = devsQueVotaram.length

  const devsFaltantes = useMemo(() => {
    if (!exp) return []
    return DESENVOLVEDORES.filter(d => !votosExp[d])
  }, [exp, votosExp])

  const irPara = useCallback((index: number) => {
    if (index >= 0 && index < experimentos.length) {
      setIndiceAtual(index)
      setDevSelecionado('')
    }
  }, [experimentos.length])

  const avancar = useCallback(() => irPara(indiceAtual + 1), [indiceAtual, irPara])
  const voltar = useCallback(() => irPara(indiceAtual - 1), [indiceAtual, irPara])
  const pular = useCallback(() => irPara(indiceAtual + 1), [indiceAtual, irPara])

  const handleVotar = useCallback((voto: Voto) => {
    if (!exp || !devSelecionado) return
    onVotar(exp.key, devSelecionado, voto)
    // Auto-avançar para o próximo dev não votado
    const proximoDev = DESENVOLVEDORES.find(d => d !== devSelecionado && !votosExp[d])
    if (proximoDev) {
      setDevSelecionado(proximoDev)
    } else {
      setDevSelecionado('')
      avancar()
    }
  }, [exp, devSelecionado, onVotar, votosExp, avancar])

  if (!exp) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="text-center bg-white p-10 rounded-lg shadow">
          <p className="text-xl font-bold mb-2" style={{ color: '#8B0000' }}>🎉 Todos os experimentos foram votados!</p>
          <p className="text-gray-500 mb-4">Nenhum experimento pendente.</p>
          <button
            onClick={onVoltar}
            className="px-4 py-2 rounded text-white font-medium"
            style={{ background: '#CC0000' }}
          >
            Voltar para visão geral
          </button>
        </div>
      </div>
    )
  }

  const temBeneficio = (exp.beneficioQuantitativo ?? 0) > 0
  const temComplexidade = !!exp.complexidade
  const scoreBeneficio = getPontuacaoBeneficio(exp.beneficioQuantitativo)
  const scoreComplexidade = getPontuacaoComplexidade(exp.complexidade)

  return (
    <div className="min-h-dvh" style={{ background: '#f0f0f0' }}>
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#8B0000' }}>Modo Reunião — Votação Guiada</h1>
            <p className="text-sm text-gray-500 mt-1">
              Experimento {indiceAtual + 1} de {experimentos.length}
            </p>
          </div>
          <button
            onClick={onVoltar}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Sair do modo reunião
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${((indiceAtual + 1) / experimentos.length) * 100}%`, background: '#CC0000' }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Card do experimento */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cabeçalho do card */}
          <div className="px-6 py-5 border-b" style={{ background: 'linear-gradient(135deg, #8B0000 0%, #CC0000 100%)' }}>
            <div className="flex items-center gap-3 text-white">
              <span className="text-3xl font-bold">{indiceAtual + 1}</span>
              <div>
                <h2 className="text-xl font-bold">{exp.nome}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm opacity-80">
                  <span className="px-2 py-0.5 rounded bg-white/20">{exp.key}</span>
                  <span>{STATUS_LABEL[exp.statusId] ?? exp.statusNome}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes do experimento */}
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coluna 1: Info básica */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">Informações</h3>
              {exp.parentNome && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Iniciativa</span>
                  <p className="text-sm font-medium text-gray-800">{exp.parentNome}</p>
                </div>
              )}
              {exp.sponsor && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Sponsor</span>
                  <p className="text-sm font-medium text-gray-800">{exp.sponsor}</p>
                </div>
              )}
              {exp.bo && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Business Owner</span>
                  <p className="text-sm font-medium text-gray-800">{exp.bo}</p>
                </div>
              )}
              {exp.timeResponsavel && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Time</span>
                  <p className="text-sm font-medium text-gray-800">{exp.timeResponsavel}</p>
                </div>
              )}
            </div>

            {/* Coluna 2: Domínio e segmento */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">Classificação</h3>
              {exp.dominio && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Domínio</span>
                  <p className="text-sm font-medium text-gray-800">{exp.dominio}</p>
                </div>
              )}
              {exp.segmento && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Segmento</span>
                  <p className="text-sm font-medium text-gray-800">{exp.segmento}</p>
                </div>
              )}
              {exp.portfolio && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Portfólio</span>
                  <p className="text-sm font-medium text-gray-800">{exp.portfolio}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-400 uppercase">Complexidade</span>
                <p className={`text-sm font-medium ${temComplexidade ? 'text-gray-800' : 'text-yellow-600'}`}>
                  {exp.complexidade ?? '⚠️ Não preenchida'}
                </p>
              </div>
            </div>

            {/* Coluna 3: Benefício e scores */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">Benefício & Score</h3>
              <div>
                <span className="text-xs text-gray-400 uppercase">Benefício Quantitativo</span>
                <p className={`text-lg font-bold ${temBeneficio ? 'text-green-700' : 'text-yellow-600'}`}>
                  {formatarMoeda(exp.beneficioQuantitativo)}
                </p>
              </div>
              {exp.beneficioQualitativo && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Benefício Qualitativo</span>
                  <p className="text-sm text-gray-700">{exp.beneficioQualitativo}</p>
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Score Benefício</div>
                  <div className="text-lg font-bold" style={{ color: '#CC0000' }}>{scoreBeneficio}/5</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Score Complexidade</div>
                  <div className="text-lg font-bold text-gray-600">{scoreComplexidade}/3</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de dados faltantes */}
          {(!temBeneficio || !temComplexidade) && (
            <div className="px-6 py-3 bg-yellow-50 border-y border-yellow-200">
              <div className="flex items-start gap-2 text-sm text-yellow-700">
                <span>⚠️</span>
                <div>
                  {!temBeneficio && <p>Benefício Quantitativo não preenchido (customfield_13242)</p>}
                  {!temComplexidade && <p>Complexidade não preenchida (customfield_11664)</p>}
                </div>
              </div>
            </div>
          )}

          {/* Seção de votação */}
          <div className="px-6 py-5 bg-gray-50 border-t">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Users size={18} />
              Votação durante a reunião
            </h3>

            {/* Status atual dos votos */}
            <div className="mb-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {DESENVOLVEDORES.map(d => {
                  const voto = votosExp[d]
                  const isSelected = devSelecionado === d
                  return (
                    <button
                      key={d}
                      onClick={() => setDevSelecionado(d)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        isSelected
                          ? 'border-red-700 bg-red-50 shadow-md'
                          : voto
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {voto ? <CheckCircle2 size={14} className="text-green-600" /> : <Circle size={14} className="text-gray-300" />}
                        <span>{d}</span>
                      </div>
                      {voto && (
                        <span className={`text-xs font-bold ml-5 ${
                          voto === 'Alta' ? 'text-red-600' : voto === 'Média' ? 'text-orange-500' : 'text-gray-500'
                        }`}>
                          {voto}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-sm text-gray-500">
                {totalVotos} de {DESENVOLVEDORES.length} votaram • {devsFaltantes.length > 0 && `Faltam: ${devsFaltantes.join(', ')}`}
              </p>
            </div>

            {/* Botões de voto */}
            {devSelecionado ? (
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Registrando voto de <strong>{devSelecionado}</strong> para <strong>{exp.nome}</strong>:
                </p>
                <div className="flex gap-3">
                  {(['Baixa', 'Média', 'Alta'] as Voto[]).map(v => {
                    const jaVotouAssim = votosExp[devSelecionado] === v
                    return (
                      <button
                        key={v}
                        onClick={() => handleVotar(v)}
                        className={`flex-1 py-3 rounded-lg text-lg font-bold transition-all ${
                          jaVotouAssim
                            ? 'bg-red-700 text-white shadow-lg scale-105'
                            : v === 'Alta'
                              ? 'bg-red-50 text-red-700 border-2 border-red-300 hover:bg-red-100'
                              : v === 'Média'
                                ? 'bg-orange-50 text-orange-700 border-2 border-orange-300 hover:bg-orange-100'
                                : 'bg-gray-50 text-gray-600 border-2 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {v === 'Alta' ? '🔴 Alta' : v === 'Média' ? '🟠 Média' : '⚪ Baixa'}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-500">👆 Selecione um desenvolvedor acima para registrar o voto</p>
              </div>
            )}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={voltar}
            disabled={indiceAtual === 0}
            className="flex items-center gap-2 px-4 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={pular}
              className="flex items-center gap-2 px-4 py-2 rounded border bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <SkipForward size={18} />
              Pular
            </button>
          </div>

          <button
            onClick={avancar}
            disabled={indiceAtual >= experimentos.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Mini índice de experimentos */}
        <div className="mt-8 bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Índice rápido</h3>
          <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1">
            {experimentos.map((e, i) => {
              const vExp = votos[e.key] ?? {}
              const qtdVotos = Object.values(vExp).filter(v => !!v).length
              const completo = qtdVotos >= DESENVOLVEDORES.length
              const temAlgum = qtdVotos > 0
              return (
                <button
                  key={e.key}
                  onClick={() => irPara(i)}
                  className={`text-xs px-2 py-1.5 rounded text-center transition-colors ${
                    i === indiceAtual
                      ? 'bg-red-700 text-white font-bold'
                      : completo
                        ? 'bg-green-100 text-green-700'
                        : temAlgum
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={`${e.key}: ${e.nome} (${qtdVotos}/${DESENVOLVEDORES.length} votos)`}
                >
                  {e.key.replace('GL-', '')}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}