import { PortalPage } from '@/components/shell/PortalPage'
import SemanalDeck from '@/components/semanal/SemanalDeck'
import AcompanhamentoSemanal from '@/components/weekly/AcompanhamentoSemanal'

export default function SemanalPage() {
  return (
    <PortalPage title="Semanal" description="Report do Comitê beOn Labs e acompanhamento da semana, com dados do Jira — visível apenas para admins" fit>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-12" style={{ maxWidth: 1280 }}>
          <SemanalDeck />
          <AcompanhamentoSemanal />
        </div>
      </div>
    </PortalPage>
  )
}
