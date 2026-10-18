import { PortalShell } from '@/components/portal/PortalShell'
import OkrContent from '@/components/okrs/OkrContent'

export const dynamic = 'force-dynamic'

export default function OkrsPage() {
  return (
    <PortalShell title="OKRs" description="Objetivos e resultados-chave do beOn Labs" refreshable>
      <OkrContent />
    </PortalShell>
  )
}
