'use client'

import { CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useCommunity } from './CommunityProvider'
import { cx } from '@/components/ui'

const ICON = { success: CheckCircle2, error: XCircle, info: Info }

export function Toaster() {
  const { toasts, dismissToast } = useCommunity()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map(t => {
        const Icon = ICON[t.tone]
        return (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-beon-ink py-2.5 pl-4 pr-2 text-sm text-white shadow-xl">
            <Icon className={cx('h-4 w-4 shrink-0', t.tone === 'error' ? 'text-red-300' : t.tone === 'success' ? 'text-emerald-300' : 'text-white/70')} aria-hidden />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dispensar aviso" className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
