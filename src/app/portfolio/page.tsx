import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import Sidebar from '@/components/layout/Sidebar'
import PortfolioList from '@/components/portfolio/PortfolioList'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import LogoutButton from '@/components/layout/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  let data
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_16400?.value ?? null,
    }))
    const classification = await classifyPortfolios(epicInputs)
    data = buildDashboardData(raw.iniciativas, raw.epics, classification)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
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
          <header
            className="flex items-center justify-between px-5"
            style={{ background: '#8B0000', minHeight: 52 }}
          >
            <div className="flex items-center gap-3">
              <Radio size={20} color="white" />
              <div>
                <h1
                  className="text-white font-bold tracking-wide leading-none"
                  style={{ fontSize: 15, letterSpacing: '0.08em' }}
                >
                  PORTFÓLIO DE EXPERIMENTOS
                </h1>
                <p className="text-white/60 mt-0.5" style={{ fontSize: 10 }}>
                  Lista completa com filtros por mercado, sponsor, lab e status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/estrategia"
                className="text-xs font-semibold px-3 py-1 rounded border border-white/40 text-white hover:bg-white/10 transition-colors"
              >
                ← Voltar ao dashboard
              </Link>
              <button
                className="text-xs font-semibold px-3 py-1 rounded border border-white/40 text-white"
                style={{ background: 'rgba(255,255,255,0.15)', fontSize: 10 }}
              >
                Semestre Atual ▾
              </button>
              <LogoutButton />
            </div>
          </header>
        </div>

        {/* Content */}
        <main className="flex-1 p-3 flex flex-col gap-3" style={{ marginTop: 52 }}>
          <PortfolioList data={data} />
        </main>
      </div>
    </div>
  )
}
