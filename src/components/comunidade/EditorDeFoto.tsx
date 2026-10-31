'use client'

// Editor da foto de perfil: escolher uma imagem, aproximar e arrastar para enquadrar no círculo. Sai em 400×400 (JPEG),
// pequena o bastante para o envio e nítida nos avatares.

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { ImageUp, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button, Dialog, cx, focusRing } from '@/components/ui'

const VISOR = 280
const SAIDA = 400

export function EditorDeFoto({ open, origem, onClose, onSalvar }: {
  open: boolean
  /** Imagem inicial (a foto atual, ao editar); sem ela, o editor pede um arquivo. */
  origem?: string
  onClose: () => void
  onSalvar: (dataUrl: string) => Promise<void>
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const arraste = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const arquivo = useRef<HTMLInputElement>(null)

  const carregar = useCallback((src: string) => {
    const i = new Image()
    // Foto antiga em outro domínio: só pode ser recortada se o servidor de lá permitir (CORS).
    if (/^https?:/.test(src) && !src.startsWith(window.location.origin)) i.crossOrigin = 'anonymous'
    i.onload = () => { setImg(i); setZoom(1); setPos({ x: 0, y: 0 }); setErro(null) }
    i.onerror = () => setErro('Não foi possível abrir essa imagem.')
    i.src = src
  }, [])

  useEffect(() => {
    if (!open) return
    setImg(null)
    setErro(null)
    if (origem) carregar(origem)
  }, [open, origem, carregar])

  // Escala para a imagem cobrir o visor; o zoom multiplica a partir daí.
  const base = img ? Math.max(VISOR / img.naturalWidth, VISOR / img.naturalHeight) : 1
  const escala = base * zoom
  const limite = (p: { x: number; y: number }) => {
    if (!img) return p
    const mx = Math.max(0, (img.naturalWidth * escala - VISOR) / 2)
    const my = Math.max(0, (img.naturalHeight * escala - VISOR) / 2)
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) }
  }

  useEffect(() => {
    const c = canvas.current
    if (!c || !img) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, VISOR, VISOR)
    const w = img.naturalWidth * escala, h = img.naturalHeight * escala
    ctx.drawImage(img, (VISOR - w) / 2 + pos.x, (VISOR - h) / 2 + pos.y, w, h)
  }, [img, escala, pos])

  function escolher(f: File | undefined) {
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setErro('Use uma imagem JPG, PNG ou WEBP.'); return }
    if (f.size > 15_000_000) { setErro('A imagem passa de 15 MB.'); return }
    const r = new FileReader()
    r.onload = () => carregar(String(r.result))
    r.readAsDataURL(f)
  }

  function mudarZoom(z: number) {
    const novo = Math.min(4, Math.max(1, z))
    setZoom(novo)
    setPos(p => limite(p))
  }

  const down = (e: PointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); arraste.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y } }
  const move = (e: PointerEvent) => {
    const a = arraste.current
    if (a) setPos(limite({ x: a.px + e.clientX - a.x, y: a.py + e.clientY - a.y }))
  }

  async function salvar() {
    if (!img) return
    const out = document.createElement('canvas')
    out.width = out.height = SAIDA
    const k = SAIDA / VISOR
    const w = img.naturalWidth * escala * k, h = img.naturalHeight * escala * k
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, SAIDA, SAIDA)
    ctx.drawImage(img, (SAIDA - w) / 2 + pos.x * k, (SAIDA - h) / 2 + pos.y * k, w, h)
    let dataUrl: string
    try { dataUrl = out.toDataURL('image/jpeg', 0.9) } catch { setErro('Não dá para editar esta foto: escolha uma nova imagem.'); return }
    setSalvando(true)
    try { await onSalvar(dataUrl) } finally { setSalvando(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} title={origem ? 'Editar foto de perfil' : 'Nova foto de perfil'} description="Aproxime e arraste para enquadrar no círculo">
      <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { escolher(e.target.files?.[0]); e.target.value = '' }} />
      <div className="flex flex-col items-center gap-4">
        {img ? (
          <div className="relative overflow-hidden rounded-2xl bg-beon-soft" style={{ width: VISOR, height: VISOR }}>
            <canvas ref={canvas} width={VISOR} height={VISOR} aria-label="Pré-visualização da foto"
              className="cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={down} onPointerMove={move} onPointerUp={() => { arraste.current = null }} onPointerCancel={() => { arraste.current = null }}
              onWheel={e => mudarZoom(zoom - e.deltaY / 600)} />
            {/* Máscara: escurece o que fica fora do círculo. */}
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at center, transparent ${VISOR / 2 - 1}px, rgba(28,25,23,0.45) ${VISOR / 2}px)` }} aria-hidden />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/90" aria-hidden />
          </div>
        ) : (
          <button type="button" onClick={() => arquivo.current?.click()}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); escolher(e.dataTransfer.files?.[0]) }}
            className={cx('flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-beon-line bg-beon-soft text-beon-body hover:border-beon-red/50 hover:text-beon-ink', focusRing)}
            style={{ width: VISOR, height: VISOR }}>
            <ImageUp className="h-8 w-8 text-beon-red" aria-hidden />
            <span className="text-sm font-medium">Escolher uma imagem</span>
            <span className="text-xs text-beon-muted">ou arraste para cá · JPG, PNG ou WEBP</span>
          </button>
        )}

        {img && (
          <div className="flex w-full max-w-[280px] items-center gap-2">
            <button type="button" aria-label="Afastar" onClick={() => mudarZoom(zoom - 0.25)} className={cx('rounded-full p-1.5 text-beon-muted hover:bg-beon-soft', focusRing)}><ZoomOut className="h-4 w-4" /></button>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={e => mudarZoom(Number(e.target.value))} aria-label="Zoom" className="flex-1 accent-beon-red" />
            <button type="button" aria-label="Aproximar" onClick={() => mudarZoom(zoom + 0.25)} className={cx('rounded-full p-1.5 text-beon-muted hover:bg-beon-soft', focusRing)}><ZoomIn className="h-4 w-4" /></button>
            <button type="button" aria-label="Recentralizar" title="Recentralizar" onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }) }} className={cx('rounded-full p-1.5 text-beon-muted hover:bg-beon-soft', focusRing)}><RotateCcw className="h-4 w-4" /></button>
          </div>
        )}
        {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

        <div className="flex w-full flex-wrap justify-between gap-2 border-t border-beon-line pt-4">
          <Button variant="ghost" icon={ImageUp} onClick={() => arquivo.current?.click()}>{img ? 'Trocar imagem' : 'Escolher'}</Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="primary" disabled={!img} loading={salvando} onClick={salvar}>Salvar foto</Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
