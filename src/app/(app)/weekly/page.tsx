import { PortalPage } from '@/components/shell/PortalPage'
import WeeklySlide from '@/components/weekly/WeeklySlide'

export default function WeeklyPage() {
  return (
    <PortalPage title="Weekly" description="Slide executivo da jornada de experimentação — visível apenas para admins" fit>
      <div className="flex-1 overflow-auto p-6">
        <WeeklySlide />
      </div>
    </PortalPage>
  )
}
