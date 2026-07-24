import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard Executivo de Experimentos Telecom',
  description: 'Portfólio de inovação beOn Labs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preload" href="/jira/logobeonlabs.png" as="image" />
      </head>
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
