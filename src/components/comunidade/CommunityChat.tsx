'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatMessage, ChatPresence } from '@/lib/chat'
import { Send, Users, Circle, Building2 } from 'lucide-react'

export default function CommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [presence, setPresence] = useState<ChatPresence[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [showUsers, setShowUsers] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch('/jira/api/community/chat')
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch { /* silent */ }
  }, [])

  const loadPresence = useCallback(async () => {
    try {
      const res = await fetch('/jira/api/community/presence')
      const data = await res.json()
      if (Array.isArray(data)) setPresence(data)
    } catch { /* silent */ }
  }, [])

  const heartbeat = useCallback(async () => {
    try {
      await fetch('/jira/api/community/presence', { method: 'POST' })
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    // Get current user
    fetch('/jira/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) setCurrentUser(d.username)
    }).catch(() => {})

    loadMessages()
    loadPresence()
    heartbeat()

    // Poll every 3 seconds
    pollRef.current = setInterval(() => {
      loadMessages()
      loadPresence()
      heartbeat()
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadMessages, loadPresence, heartbeat])

  useEffect(() => {
    // Só faz scroll automático se o chat estiver visível na viewport
    // (evita que a página inteira role para baixo ao carregar)
    const el = chatEndRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight
    if (isVisible) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch('/jira/api/community/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (res.ok) {
        setText('')
        await loadMessages()
      }
    } catch { /* silent */ } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const onlineCount = presence.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Chat da Comunidade</h3>
            <p className="text-xs text-gray-400">
              {onlineCount > 0 ? `${onlineCount} online` : 'Ninguém online'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUsers(!showUsers)}
          className={`p-2 rounded-lg transition-colors ${showUsers ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'}`}
          title="Ver online"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Inicie a conversa!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMine = currentUser === msg.userId
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.userName.charAt(0).toUpperCase()}
                    </div>
                    {/* Bubble */}
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{msg.userName}</span>
                        {msg.userLab && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5" /> {msg.userLab}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-red-600 text-white rounded-tr-md'
                          : 'bg-gray-100 text-gray-800 rounded-tl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-red-400"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Online users sidebar */}
        {showUsers && (
          <div className="w-56 border-l border-gray-100 bg-gray-50/30 overflow-y-auto flex-shrink-0">
            <div className="px-3 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Online ({onlineCount})</p>
            </div>
            <div className="p-2 space-y-1">
              {presence.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Ninguém online</p>
              ) : (
                presence.map(p => (
                  <div key={p.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                        {p.userName.charAt(0).toUpperCase()}
                      </div>
                      <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.userName}</p>
                      {p.userLab && (
                        <p className="text-[10px] text-gray-400 truncate">{p.userLab}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}