'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Escala um slide fixo (padrão 1280×720) para a largura disponível, sem nunca aumentar. */
export default function FitSlide({ children, width = 1280, height = 720 }: { children: ReactNode; width?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const calc = () => setScale(Math.min(1, el.clientWidth / width))
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={ref} style={{ width: '100%', maxWidth: width }}>
      <div style={{ width: width * scale, height: height * scale, overflow: 'hidden', borderRadius: 6, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  )
}
