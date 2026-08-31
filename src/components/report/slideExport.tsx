'use client'

import { useState, type RefObject } from 'react'
import { Download, Loader2 } from 'lucide-react'

export const SLIDE_PAGE_SIZE = 10

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function SlideDownloadButtons({ targetRef, filename }: { targetRef: RefObject<HTMLDivElement>; filename: string }) {
  const [busy, setBusy] = useState<'png' | 'jpg' | null>(null)

  async function exportAs(format: 'png' | 'jpg') {
    if (!targetRef.current || busy) return
    setBusy(format)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mime, 0.95)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${filename}.${format}`
      a.click()
    } catch (err) {
      console.error('Erro ao exportar slide:', err)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="no-print flex items-center gap-2">
      <button
        onClick={() => exportAs('png')}
        disabled={busy !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-colors"
        style={{ background: '#8B0000' }}
      >
        {busy === 'png' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        PNG
      </button>
      <button
        onClick={() => exportAs('jpg')}
        disabled={busy !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        {busy === 'jpg' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        JPG
      </button>
    </div>
  )
}

/**
 * Campo de texto editável inline (clique → input/textarea → salva no blur/Enter).
 * Layout propositalmente sem `flex`/`gap` do Tailwind: o html2canvas 1.4.1 falha
 * silenciosamente ao renderizar texto dentro de containers inline-flex com gap
 * (ver IniciativasSlides.tsx), então usamos `display: inline-block` puro aqui.
 */
export function EditableField({
  value,
  onSave,
  multiline = false,
  placeholder = 'Clique para preencher',
  textStyle,
}: {
  value: string
  onSave: (v: string) => void
  multiline?: boolean
  placeholder?: string
  textStyle?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        rows={3}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        style={{ width: '100%', fontSize: 11.5, padding: 6, border: '1px solid #60A5FA', borderRadius: 8, resize: 'vertical', outline: 'none' }}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        style={{ width: '100%', fontSize: 11.5, padding: '4px 6px', border: '1px solid #60A5FA', borderRadius: 8, outline: 'none' }}
      />
    )
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Clique para editar"
      style={{ cursor: 'pointer', minHeight: 16, ...textStyle }}
    >
      {value
        ? value
        : <span style={{ color: '#D1D5DB', fontStyle: 'italic', fontWeight: 400 }}>{placeholder}</span>}
    </div>
  )
}
