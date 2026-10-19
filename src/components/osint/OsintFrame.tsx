'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function OsintFrame() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative h-[calc(100dvh-52px)] min-h-[560px] bg-slate-950">
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center gap-3 text-sm font-medium text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
          Carregando painel OSINT…
        </div>
      ) : null}
      <iframe
        title="Painel OSINT de sinais"
        src="/jira/osint-app/index.html"
        onLoad={() => setLoaded(true)}
        className="h-full w-full border-0"
      />
    </div>
  )
}
