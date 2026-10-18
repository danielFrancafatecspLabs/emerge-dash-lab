import { PortalShell } from '@/components/portal/PortalShell'
import SemanalDeck from '@/components/semanal/SemanalDeck'

export default function SemanalPage() {
  return (
    <PortalShell title="Semanal" description="Report do Comitê beOn Labs com dados do Jira — visível apenas para admins" fit>
      <div className="flex-1 overflow-auto p-6">
        <SemanalDeck />
      </div>
    </PortalShell>
  )
}
