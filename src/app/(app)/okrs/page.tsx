import { PortalPage } from '@/components/shell/PortalPage'
import OkrContent from '@/components/okrs/OkrContent'

export const dynamic = 'force-dynamic'

export default function OkrsPage() {
  return (
    <PortalPage title="OKRs" description="Objetivos e resultados-chave do beOn Labs" refreshable>
      <OkrContent />
    </PortalPage>
  )
}
