'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

export default function RefreshButton() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/jira/api/clear-cache', { method: 'POST' })
    } finally {
      // Recarrega a página — vai mostrar o loading.tsx enquanto reprocessa
      window.location.reload()
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title="Limpar cache e reprocessar dados"
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded border border-white/40 text-white transition-opacity"
      style={{ background: 'rgba(255,255,255,0.15)', opacity: loading ? 0.6 : 1 }}
    >
      <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Reprocessando…' : 'Reprocessar'}
    </button>
  )
}
