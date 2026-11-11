import { PortalPage } from '@/components/shell/PortalPage'
import AuditorClient from '@/components/auditor/AuditorClient'

export const dynamic = 'force-dynamic'

export default function AuditorPage() {
  return (
    <PortalPage title="Auditor de Analytics" description="Confere se as telas contam a mesma história e explica cada diferença: o que acontece, por quê, o impacto e o que fazer" refreshable aviso={null}>
      <AuditorClient />
    </PortalPage>
  )
}
