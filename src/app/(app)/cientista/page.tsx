import { PortalPage } from '@/components/shell/PortalPage'
import CientistaChat from '@/components/cientista/CientistaChat'

export const dynamic = 'force-dynamic'

export default function CientistaPage() {
  return (
    <PortalPage title="Cientista beOn Labs" description="Assistente de IA do portfólio de experimentação" fit>
      <div className="flex-1 overflow-auto bg-white">
        <CientistaChat />
      </div>
    </PortalPage>
  )
}
