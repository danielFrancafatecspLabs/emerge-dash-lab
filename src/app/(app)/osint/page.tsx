import { Radar, ExternalLink } from 'lucide-react'
import { OsintFrame } from '@/components/osint/OsintFrame'

export default function OsintPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <Radar className="h-5 w-5 shrink-0 text-red-700" />
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-[0.08em] text-slate-800">
            OSINT
          </h1>
          <p className="truncate text-[10px] text-slate-500">
            Mapa estratégico de sinais e inteligência de fontes abertas
          </p>
        </div>
        <div className="ml-auto">
          <a
            href="https://github.com/Colab-Claro/signals-osint"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir no GitHub
          </a>
        </div>
      </div>
      <div className="flex-1">
        <OsintFrame />
      </div>
    </div>
  )
}
