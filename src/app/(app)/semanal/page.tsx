import { PortalPage } from '@/components/shell/PortalPage'
import SemanalDeck from '@/components/semanal/SemanalDeck'

export default function SemanalPage() {
  return (
    <PortalPage title="Semanal" description="Report do Comitê beOn Labs com dados do Jira — visível apenas para admins" fit>
      <div className="flex-1 overflow-auto p-6">
        <SemanalDeck />
      </div>
    </PortalPage>
  )
}
