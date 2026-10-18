import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'beOn Labs',
  description: 'Portal executivo e Comunidade de experimentação do beOn Labs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preload" href="/jira/logobeonlabs.png" as="image" />
      </head>
      <body className="bg-gray-100 min-h-dvh">{children}</body>
    </html>
  )
}
