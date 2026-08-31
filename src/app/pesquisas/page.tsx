import { BookOpen, ExternalLink } from 'lucide-react'
import LogoutButton from '@/components/layout/LogoutButton'
import Sidebar from '@/components/layout/Sidebar'
import { ResearchExplorer } from '@/components/research/ResearchExplorer'

export default function PesquisasPage() {
  return (
    <div className="flex min-h-dvh bg-slate-100">
      <div className="w-[72px] shrink-0">
        <div className="fixed bottom-0 left-0 top-0 z-30 w-[72px] bg-[#8B0000] pt-[52px]">
          <Sidebar />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <header className="fixed left-[72px] right-0 top-0 z-30 flex h-[52px] items-center justify-between bg-[#8B0000] px-5 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <BookOpen className="h-5 w-5 shrink-0 text-white" />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold tracking-[0.08em] text-white">
                ACERVO DE PESQUISAS
              </h1>
              <p className="truncate text-[10px] text-white/60">
                Navegação pelo conhecimento produzido no beOn Labs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Colab-Claro/research-obsidian"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/20 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir no GitHub
            </a>
            <LogoutButton />
          </div>
        </header>

        <main className="mt-[52px]">
          <ResearchExplorer />
        </main>
      </div>
    </div>
  )
}
