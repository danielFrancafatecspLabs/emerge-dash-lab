import { PortalShell } from '@/components/portal/PortalShell'
import CientistaChat from '@/components/cientista/CientistaChat'

export const dynamic = 'force-dynamic'

export default function CientistaPage() {
  return (
    <PortalShell title="Cientista beOn Labs" description="Assistente de IA do portfólio de experimentação" fit>
      <div className="flex-1 overflow-auto bg-white">
        <CientistaChat />
      </div>
    </PortalShell>
  )
}
