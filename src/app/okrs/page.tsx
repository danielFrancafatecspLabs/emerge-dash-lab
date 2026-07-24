import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import OkrContent from '@/components/okrs/OkrContent'

export const dynamic = 'force-dynamic'

export default function OkrsPage() {
  return (
    <div className="flex min-h-dvh" style={{ background: '#f0f0f0' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0" style={{ width: 72 }}>
        <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
          <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="fixed top-0 z-10" style={{ left: 72, right: 0 }}>
          <Header />
        </div>

        {/* Content */}
        <OkrContent />
      </div>
    </div>
  )
}