import type { ReactNode } from 'react'
import { CommunityProvider } from '@/components/comunidade/CommunityProvider'
import { AppChromeProvider } from '@/components/shell/AppChrome'
import { AppShell } from '@/components/shell/AppShell'

// Todas as páginas autenticadas compartilham a mesma moldura: o menu não é remontado ao trocar de
// área, e a Comunidade (publicar, notificações, mensagens) fica disponível em qualquer página.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CommunityProvider>
      <AppChromeProvider>
        <AppShell>{children}</AppShell>
      </AppChromeProvider>
    </CommunityProvider>
  )
}
