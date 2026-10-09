import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import SemanalDeck from '@/components/semanal/SemanalDeck'

export default function SemanalPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f0f0' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Semanal</h1>
            <p className="text-xs text-gray-500">Report do Comitê beOn Labs com dados do Jira — visível apenas para admins</p>
          </div>
          <LogoutButton />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <SemanalDeck />
        </div>
      </main>
    </div>
  )
}
