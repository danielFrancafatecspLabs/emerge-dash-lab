'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardData } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import {
  Bot, Send, Sparkles, RotateCcw, Loader2, Lightbulb, CornerDownLeft
} from 'lucide-react'
import { DECISION_TREE, NodeId, ChatMessage } from './decisionTree'

// Mapa de palavras-chave → nodeId para busca por texto livre
const KEYWORD_MAP: { keywords: string[]; nodeId: NodeId }[] = [
  { keywords: ['experimento', 'andamento', 'ativo', 'ativos', 'quantos experimentos', 'qtd experimento'], nodeId: 'qtd_experimentos_ativos' },
  { keywords: ['prioridade', 'priorizado', 'priorização', 'high', 'medium', 'low'], nodeId: 'experimentos_priorizados' },
  { keywords: ['iniciativa', 'pipeline', 'total iniciativa', 'quantas iniciativa'], nodeId: 'total_iniciativas' },
  { keywords: ['potencial', 'total portfolio', 'beneficio total', 'valor total', 'r$'], nodeId: 'potencial_total' },
  { keywords: ['medio', 'média', 'beneficio medio', 'ticket medio'], nodeId: 'beneficio_medio' },
  { keywords: ['top 5', 'top5', 'maiores beneficios', 'maior beneficio', 'ranking'], nodeId: 'top5_beneficios' },
  { keywords: ['custo', 'custo total', 'investimento', 'orçamento', 'roi'], nodeId: 'custo_total' },
  { keywords: ['distribuicao', 'distribuição', 'impacto', 'por meta'], nodeId: 'distribuicao_impacto' },
  { keywords: ['ebitda'], nodeId: 'iniciativas_ebitda' },
  { keywords: ['receita'], nodeId: 'iniciativas_receita' },
  { keywords: ['nps'], nodeId: 'iniciativas_nps' },
  { keywords: ['status', 'funil', 'fluxo', 'estagio', 'estágio', 'coluna'], nodeId: 'status_pipeline' },
  { keywords: ['lead time', 'leadtime', 'tempo', 'ciclo', 'cycle time', 'sla'], nodeId: 'lead_time' },
  { keywords: ['sponsor', 'sponsors', 'dono', 'responsavel', 'responsável'], nodeId: 'top_sponsors' },
  { keywords: ['bloqueado', 'bloqueio', 'impedimento', 'parado'], nodeId: 'bloqueados' },
  { keywords: ['aguardando', 'delivery', 'esperando', 'fila'], nodeId: 'aguardando_delivery' },
  { keywords: ['sem sponsor', 'sem dono', 'orfao', 'orfão', 'abandonado'], nodeId: 'sem_sponsor' },
  { keywords: ['visao geral', 'geral', 'resumo', 'visão geral'], nodeId: 'visao_geral' },
  { keywords: ['financeiro', 'financeira', 'métrica financeira', 'dinheiro', 'metricas'], nodeId: 'metricas_financeiras' },
  { keywords: ['meta', 'metas', 'impacto', 'objetivo'], nodeId: 'metas_impacto' },
  { keywords: ['status pipeline', 'pipeline status'], nodeId: 'pipeline_status' },
  { keywords: ['sponsors times', 'times', 'equipe', 'pessoas'], nodeId: 'sponsors_times' },
  { keywords: ['alerta', 'alertas', 'risco', 'riscos', 'problema', 'atenção'], nodeId: 'alertas_riscos' },
]

function findNodeByKeywords(input: string): NodeId | null {
  const normalized = input.toLowerCase().trim()
  if (!normalized) return null

  // Pontuação: quantas palavras-chave batem
  let bestScore = 0
  let bestNode: NodeId | null = null

  for (const entry of KEYWORD_MAP) {
    let score = 0
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestNode = entry.nodeId
    }
  }

  return bestNode
}

export default function CientistaChat() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentNodeId, setCurrentNodeId] = useState<NodeId>('root')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [history, setHistory] = useState<NodeId[]>(['root'])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carrega dados do dashboard
  useEffect(() => {
    fetch('/jira/api/cientista')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setData(d)
        // Mensagem inicial
        const rootNode = DECISION_TREE.root
        setMessages([{ role: 'bot', text: rootNode.message, nodeId: 'root' }])
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const currentNode = DECISION_TREE[currentNodeId]

  // Navega para um nó
  const navigate = useCallback((nextId: NodeId) => {
    const node = DECISION_TREE[nextId]
    if (!node || !data) return

    const newMessages: ChatMessage[] = []

    // Adiciona escolha do usuário (pega o label da opção)
    const prevNode = DECISION_TREE[currentNodeId]
    const chosenOption = prevNode?.options.find(o => o.nextId === nextId)
    if (chosenOption) {
      newMessages.push({ role: 'user', text: chosenOption.label, nodeId: nextId })
    }

    // Se for leaf, computa resposta
    if (node.isLeaf && node.computeAnswer) {
      const answer = node.computeAnswer(data)
      newMessages.push({ role: 'bot', text: answer, nodeId: nextId })
    } else if (node.message) {
      newMessages.push({ role: 'bot', text: node.message, nodeId: nextId })
    }

    setMessages(prev => [...prev, ...newMessages])
    setCurrentNodeId(nextId)
    setHistory(prev => [...prev, nextId])
  }, [currentNodeId, data])

  // Voltar um nível
  const goBack = useCallback(() => {
    if (history.length <= 1) return
    const newHistory = history.slice(0, -1)
    const prevId = newHistory[newHistory.length - 1]
    setHistory(newHistory)
    setCurrentNodeId(prevId)
  }, [history])

  // Reiniciar
  const restart = useCallback(() => {
    setMessages([{ role: 'bot', text: DECISION_TREE.root.message, nodeId: 'root' }])
    setCurrentNodeId('root')
    setHistory(['root'])
    setInputValue('')
  }, [])

  // Enviar pergunta livre
  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || !data) return

    const targetId = findNodeByKeywords(text)
    const newMessages: ChatMessage[] = [{ role: 'user', text, nodeId: undefined }]

    if (targetId) {
      const node = DECISION_TREE[targetId]
      if (node) {
        // Se for leaf, computa resposta
        if (node.isLeaf && node.computeAnswer) {
          const answer = node.computeAnswer(data)
          newMessages.push({ role: 'bot', text: answer, nodeId: targetId })
        } else if (node.message) {
          newMessages.push({ role: 'bot', text: node.message, nodeId: targetId })
        }
        setMessages(prev => [...prev, ...newMessages])
        setCurrentNodeId(targetId)
        setHistory(prev => [...prev, targetId])
      }
    } else {
      // Não encontrou — mostra ajuda
      const suggestions = currentNode?.options
        ? currentNode.options.filter(o => !o.label.includes('Voltar') && !o.label.includes('Menu Principal'))
        : DECISION_TREE.root.options
      const suggestionText = suggestions.map(o => `• ${o.label}`).join('\n')
      newMessages.push({
        role: 'bot',
        text: `🤔 Não entendi sua pergunta. Tente usar uma das opções abaixo ou reformule:\n\n${suggestionText}\n\n💡 Dica: você pode perguntar coisas como "quantos experimentos ativos?", "qual o potencial total?", "top 5 sponsors", etc.`,
        nodeId: undefined,
      })
      setMessages(prev => [...prev, ...newMessages])
    }
    setInputValue('')
  }, [inputValue, data, currentNode])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-red-600" />
        <span className="ml-3 text-gray-500">Carregando dados do portfólio...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold">Erro ao carregar dados</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Bot size={22} className="text-red-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Cientista BeOn Labs</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-red-400" />
              Assistente de análise de portfólio
            </p>
          </div>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="flex-shrink-0 mr-2 mt-1">
                <div className="p-1.5 bg-red-100 rounded-full">
                  <Lightbulb size={14} className="text-red-600" />
                </div>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-red-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
              }`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {msg.role === 'bot' ? renderMarkdown(msg.text) : msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input livre + botões de navegação */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-3 shrink-0">
        {/* Campo de texto livre */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            placeholder="Digite sua pergunta... (ex: quantos experimentos ativos?)"
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-colors placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Send size={15} />
          </button>
        </div>

        {/* Botões de navegação */}
        {currentNode && (
          <>
            {currentNode.question && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {currentNode.question}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {currentNode.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => navigate(opt.nextId)}
                  className={`text-xs font-medium px-3.5 py-2 rounded-xl transition-all border hover:shadow-sm ${
                    opt.label.includes('Voltar') || opt.label.includes('Menu Principal')
                      ? 'border-gray-200 text-gray-500 hover:bg-gray-100 bg-white'
                      : 'border-red-200 text-red-700 hover:bg-red-50 bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {history.length > 1 && (
              <button
                onClick={goBack}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                ← Voltar um nível
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Renderização simples de markdown (bold, quebras de linha)
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-gray-900">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}