import { ExternalLink } from 'lucide-react'
import { PortalPage } from '@/components/shell/PortalPage'
import { ResearchExplorer } from '@/components/research/ResearchExplorer'

export default function PesquisasPage() {
  return (
    <PortalPage
      title="Acervo de pesquisas"
      description="Navegação pelo conhecimento produzido no beOn Labs"
      fit
      actions={
        <a
          href="https://github.com/Colab-Claro/research-obsidian"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-9 items-center gap-2 rounded-full border border-beon-line bg-white px-3.5 text-sm font-medium text-beon-ink hover:bg-beon-soft sm:inline-flex"
        >
          <ExternalLink className="h-4 w-4 text-beon-muted" aria-hidden />
          Abrir no GitHub
        </a>
      }
    >
      <ResearchExplorer />
    </PortalPage>
  )
}
