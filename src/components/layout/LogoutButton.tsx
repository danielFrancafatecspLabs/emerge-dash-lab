'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
      title="Sair"
      style={{ fontSize: 11 }}
    >
      <LogOut size={14} />
      Sair
    </button>
  )
}
