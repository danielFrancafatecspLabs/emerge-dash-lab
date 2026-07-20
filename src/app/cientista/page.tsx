import Sidebar from '@/components/layout/Sidebar'
import CientistaChat from '@/components/cientista/CientistaChat'
import LogoutButton from '@/components/layout/LogoutButton'

export const dynamic = 'force-dynamic'

export default function CientistaPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0">
          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🧪 Cientista BeOn Labs
          </h1>
          <LogoutButton />
        </header>
        <div className="flex-1 overflow-auto">
          <CientistaChat />
        </div>
      </main>
    </div>
  )
}