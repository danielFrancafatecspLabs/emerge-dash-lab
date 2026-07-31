'use client'

import { useState } from 'react'
import { ImageIcon, Loader2, Download } from 'lucide-react'

export default function GenerateImageButton() {
  const [loading, setLoading] = useState(false)
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setImageB64(null)
    try {
      const res = await fetch('/jira/api/report/image')
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Erro ao gerar imagem'); return }
      setImageB64(data.image)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!imageB64) return
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${imageB64}`
    a.download = `report-beon-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
          style={{ background: '#8B0000' }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
          {loading ? 'Gerando imagem...' : 'Gerar Imagem'}
        </button>
        {imageB64 && (
          <button
            onClick={download}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={13} /> Baixar PNG
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {imageB64 && (
        <img
          src={`data:image/png;base64,${imageB64}`}
          alt="Prévia do relatório em imagem"
          className="rounded-xl border border-gray-200 shadow-sm max-w-sm"
        />
      )}
    </div>
  )
}
