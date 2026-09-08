import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { formatBeneficioMM } from '@/lib/report-utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MBRPage() {
  let data
  let error: string | null = null
  try {
    const raw = await fetchDashboardRaw()
    data = buildDashboardData(raw.iniciativas, raw.epics, [], [], raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Métricas de destaque
  const totalIniciativas = data.iniciativas.length
  const totalEpics = data.allEpics.length
  const beneficioEstimado = data.allEpics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)

  // Experimentos priorizados — em andamento ordenados por beneficio estimado desc
  const emAndamento = data.allEpics.filter(e => ['Em andamento', 'EM VALIDAÇÃO', 'Em validação'].includes(e.status.name ?? ''))
  const priorizados = [...emAndamento].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20)

  // Experimentos realizados de maior potencial (concluídos)
  const concluidos = data.allEpics.filter(e => e.status.id === '10019' || e.status.id === '10003')
  const concluidosTop = [...concluidos].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20)

  // Mapa dos sponsors
  const sponsorMap = new Map<string, number>()
  for (const ini of data.iniciativas) {
    const sponsor = ini.sponsor ?? ini.sponsors?.[0] ?? '—'
    sponsorMap.set(sponsor, (sponsorMap.get(sponsor) ?? 0) + (ini.epics?.length ?? 0))
  }

  // Quantidades sem sponsor e sem beneficio potencial
  const semSponsor = data.allEpics.filter(e => !(e.sponsor && e.sponsor.trim())).length
  const semBeneficio = data.allEpics.filter(e => !e.beneficioQuantitativo).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MBR — Métricas e Prioridades</h1>
          <p className="text-sm text-gray-500">Visão consolidada para o Monthly Business Review (apenas admins)</p>
        </div>
        <div className="flex gap-2">
          <Link href="/report" className="text-sm text-slate-600 underline">Voltar ao Report</Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Iniciativas</p>
          <p className="text-2xl font-bold">{totalIniciativas}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Experimentos</p>
          <p className="text-2xl font-bold">{totalEpics}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Benefício estimado</p>
          <p className="text-2xl font-bold">{formatBeneficioMM(beneficioEstimado)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase">Sem Sponsor / Sem Benefício</p>
          <p className="text-2xl font-bold">{semSponsor} / {semBeneficio}</p>
        </div>
      </div>

      {/* Experimentos Priorizados */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-bold mb-2">Experimentos Priorizados — Maior potencial</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          {priorizados.map(ep => (
            <li key={ep.key}>
              <strong>{ep.nome}</strong> — {ep.sponsor ?? '—'} — {formatBeneficioMM(ep.beneficioQuantitativo ?? 0)}
            </li>
          ))}
        </ol>
      </div>

      {/* Experimentos Realizados */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-bold mb-2">Experimentos Realizados — Maior potencial</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          {concluidosTop.map(ep => (
            <li key={ep.key}>
              <strong>{ep.nome}</strong> — {ep.sponsor ?? '—'} — {formatBeneficioMM(ep.beneficioQuantitativo ?? 0)} — Situação: {ep.status?.name ?? '—'}
            </li>
          ))}
        </ol>
      </div>

      {/* Mapa dos Sponsors */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-bold mb-2">Mapa dos Sponsors</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from(sponsorMap.entries()).map(([s, count]) => (
            <div key={s} className="bg-gray-50 border rounded px-3 py-1 text-sm">
              <strong>{s}</strong>: {count}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
