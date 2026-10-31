'use client'

// O que a pessoa já leu no beOn Radar e quando foi a visita anterior (neste navegador), para marcar o que é novo e o
// que já foi lido. Sem armazenamento disponível, tudo funciona, só sem essas marcas.

import { useCallback, useEffect, useRef, useState } from 'react'

const LIDAS = 'beon:radar:lidas'
const VISITA = 'beon:radar:ultima-visita'

export function useLeituraDoRadar() {
  const [lidas, setLidas] = useState<Set<string>>(new Set())
  const [visitaAnterior, setVisitaAnterior] = useState<number | null>(null)
  // Lê a visita anterior e grava a atual uma vez só (o efeito pode rodar de novo; a segunda leitura veria "agora").
  const registrou = useRef(false)

  useEffect(() => {
    if (registrou.current) return
    registrou.current = true
    try {
      setLidas(new Set(JSON.parse(window.localStorage.getItem(LIDAS) ?? '[]')))
      const v = Number(window.localStorage.getItem(VISITA))
      setVisitaAnterior(v > 0 ? v : null)
      window.localStorage.setItem(VISITA, String(Date.now()))
    } catch { /* sem armazenamento */ }
  }, [])

  const marcarLida = useCallback((id: string) => {
    setLidas(atual => {
      if (atual.has(id)) return atual
      const nova = new Set(atual).add(id)
      try { window.localStorage.setItem(LIDAS, JSON.stringify([...nova].slice(-500))) } catch { /* sem armazenamento */ }
      return nova
    })
  }, [])

  /** Publicada depois da visita anterior (na primeira visita, nada é marcado como novo). */
  const ehNova = useCallback((publicadoEm: string | null) => !!visitaAnterior && !!publicadoEm && Date.parse(publicadoEm) > visitaAnterior, [visitaAnterior])

  return { lidas, marcarLida, ehNova }
}
