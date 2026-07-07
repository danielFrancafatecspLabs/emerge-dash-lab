import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard Executivo de Experimentos Telecom',
  description: 'Portfólio de inovação BeOn Lab',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
