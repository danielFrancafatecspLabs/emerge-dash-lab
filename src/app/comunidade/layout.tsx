import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CommunityProvider } from '@/components/comunidade/CommunityProvider'
import { CommunityShell } from '@/components/comunidade/CommunityShell'

export const metadata: Metadata = {
  title: 'Comunidade beOn Labs',
  description: 'Rede de tecnologias emergentes, experimentação e inteligência coletiva da Claro',
}

export default function ComunidadeLayout({ children }: { children: ReactNode }) {
  return (
    <CommunityProvider>
      <CommunityShell>{children}</CommunityShell>
    </CommunityProvider>
  )
}
