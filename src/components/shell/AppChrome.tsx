'use client'

// Permite que uma página esconda o menu e as barras do app (modo apresentação).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ChromeContext = createContext<{ hidden: boolean; setHidden: (v: boolean) => void }>({ hidden: false, setHidden: () => {} })

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  return <ChromeContext.Provider value={{ hidden, setHidden }}>{children}</ChromeContext.Provider>
}

export function useChromeHidden() {
  return useContext(ChromeContext).hidden
}

/** Esconde o menu e as barras enquanto `hide` for verdadeiro (e os devolve ao sair da página). */
export function useHideChrome(hide: boolean) {
  const { setHidden } = useContext(ChromeContext)
  useEffect(() => {
    setHidden(hide)
    return () => setHidden(false)
  }, [hide, setHidden])
}
