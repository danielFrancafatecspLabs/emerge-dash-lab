'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bot, Send, Sparkles, Loader2, Lightbulb
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
}

export default function CientistaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [llmLoading, setLlmLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mensagem inicial de boas-vindas
  useEffect(() => {
    setMessages([{
      role: 'bot',
      text: '👋 Olá! Sou o **Cientista BeOn Labs**, seu assistente de análise de portfólio.\n\nMe pergunte sobre os experimentos, benefícios, pipeline, ou qualquer dúvida sobre os dados do Jira. Quanto mais específica for sua pergunta, melhor será a resposta!',
    }])
  }, [])

  // Enviar pergunta para a LLM
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || llmLoading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInputValue('')
    setLlmLoading(true)

    try {
      // Constrói histórico das últimas interações para contexto
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'bot')
        .slice(-10) // últimas 5 interações (5 user + 5 bot)
        .map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
        }))

      const res = await fetch('/jira/api/cientista/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, history }),
      })
      const json = await res.json()
      const answer = json.answer ?? json.error ?? 'Não consegui gerar uma resposta.'
      setMessages(prev => [...prev, { role: 'bot', text: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Erro ao consultar a IA. Tente novamente.' }])
    } finally {
      setLlmLoading(false)
    }
  }

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do chat */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Bot size={22} className="text-red-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Cientista BeOn Labs</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-red-400" />
              Chat com IA — tire dúvidas sobre o portfólio
            </p>
          </div>
        </div>
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
        {llmLoading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 mr-2 mt-1">
              <div className="p-1.5 bg-red-100 rounded-full">
                <Lightbulb size={14} className="text-red-600" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-red-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input livre */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            placeholder={llmLoading ? 'Consultando IA...' : 'Digite sua pergunta sobre o portfólio...'}
            disabled={llmLoading}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-colors placeholder:text-gray-400 disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || llmLoading}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {llmLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
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