import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, buildMonitoramentoData } from '@/lib/mappers'
import { formatBeneficioMM } from '@/lib/report-utils'
import { formatBRL } from '@/lib/mappers'
import EpicsListModal from '@/components/report/EpicsListModal'
import BurnupChart from '@/components/monitoramento/BurnupChart'
import LeadTimeJornadaComponent from '@/components/dashboard/LeadTimeJornada'
import MapaDiretorias from '@/components/dashboard/MapaDiretorias'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

export default async function MBRPage() {
  let data
  let monitoramento
  let error: string | null = null
  try {
    const raw = await fetchDashboardRaw()
    data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
    monitoramento = buildMonitoramentoData(data, { tipo: 'tudo' })
  } catch (e) {
    error = String(e)
  }

  if (error || !data || !monitoramento) {
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
  const beneficioEstimado = data.allEpics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)

  // Experimentos priorizados — em andamento ordenados por beneficio estimado desc
  const emAndamento = data.allEpics.filter(e => ['Em andamento', 'EM VALIDAÇÃO', 'Em validação'].includes(e.status.name ?? ''))
  const priorizados = [...emAndamento].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20)

  // Construir lista priorizada com overrides e ordem solicitada pelo usuário
  const desiredOrder = [
    { match: 'Integridade do Produto', sponsor: 'Patrícia Mofato / Financeiro', beneficioLabel: 'R$ 254 MM', beneficioNumeric: 254000000 },
    { match: 'Leads PME', sponsor: 'Sem Sponsor', beneficioLabel: 'Não Mapeado' },
    { match: 'Claro Box', sponsor: 'Rodrigo Assad / beOn', beneficioLabel: 'Não Mapeado' },
    { match: 'Logoff WhatsApp', sponsor: 'Fabio Nahoum', beneficioLabel: 'Não Mapeado' },
    { match: 'Antispam', sponsor: 'Gabriel Portugal / SVA', beneficioLabel: null },
  ]

  const addedKeys = new Set<string>()
  const addedNames = new Set<string>()
  const priorizadosOrdered: { key: string; nome: string; sponsor: string; beneficioLabel: string }[] = []

  for (const d of desiredOrder) {
    const found = priorizados.find(p => p.nome && p.nome.toLowerCase().includes(d.match.toLowerCase()))
    if (found && !addedKeys.has(found.key) && !addedNames.has(found.nome)) {
      priorizadosOrdered.push({
        key: found.key,
        nome: found.nome,
        sponsor: d.sponsor ?? (found.sponsor ?? '—'),
        beneficioLabel: d.beneficioLabel ?? (found.beneficioQuantitativo ? formatBeneficioMM(found.beneficioQuantitativo) : 'Não Mapeado'),
      })
      addedKeys.add(found.key)
      addedNames.add(found.nome)
    }
  }

  // Append the remaining priorizados (skip duplicates)
  for (const p of priorizados) {
    if (addedKeys.has(p.key) || addedNames.has(p.nome)) continue
    priorizadosOrdered.push({
      key: p.key,
      nome: p.nome,
      sponsor: p.sponsor ?? '—',
      beneficioLabel: p.beneficioQuantitativo ? formatBeneficioMM(p.beneficioQuantitativo) : (p.beneficioQualitativo ? p.beneficioQualitativo : 'Não Mapeado'),
    })
  }

  // Ensure desiredOrder items are present even if not found in current priorizados (create placeholders)
  for (const d of desiredOrder) {
    const exists = priorizadosOrdered.some(x => x.nome.toLowerCase().includes(d.match.toLowerCase()))
    if (!exists) {
      const placeholderName = d.match === 'Claro Box' ? 'Claro Box - Ativação e Login Automático de Streamings' : d.match
      priorizadosOrdered.push({
        key: `manual-${d.match.replace(/\s+/g, '-').toLowerCase()}`,
        nome: placeholderName,
        sponsor: d.sponsor ?? '—',
        beneficioLabel: d.beneficioLabel ?? 'Não Mapeado',
      })
    }
  }

  // Remove possible duplicates again (keep first occurrence)
  const seenNames = new Set<string>()
  const finalPriorizados: typeof priorizadosOrdered = []
  for (const it of priorizadosOrdered) {
    const keyName = it.nome.trim().toLowerCase()
    if (seenNames.has(keyName)) continue
    seenNames.add(keyName)
    finalPriorizados.push(it)
  }

  // Experimentos realizados de maior potencial (concluídos)
  // Preferir o status da iniciativa-pai quando disponível
  const parentStatusMap = new Map<string, { id: string; name: string }>()
  for (const ini of data.iniciativas) {
    for (const ep of ini.epics) parentStatusMap.set(ep.key, ini.status)
  }

  const concluidos = data.allEpics.filter(e => {
    const statusId = e.status.id
    return statusId === '10019' || statusId === '10003'
  })
  const totalEpicsConcluidos = concluidos.length
  // Excluir da lista de concluidos os que já aparecem em priorizados (por nome/key)
  const priorizadosKeys = new Set(finalPriorizados.map(p => p.key))
  const concluidosFiltered = concluidos.filter(c => !priorizadosKeys.has(c.key))
  const concluidosTop = [...concluidosFiltered].sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0)).slice(0, 20)

  // Mapa dos sponsors
  const sponsorMap = new Map<string, number>()
  for (const ini of data.iniciativas) {
    const sponsor = ini.sponsor ?? ini.sponsors?.[0] ?? '—'
    sponsorMap.set(sponsor, (sponsorMap.get(sponsor) ?? 0) + (ini.epics?.length ?? 0))
  }

  // Quantidades sem sponsor e sem beneficio potencial
  const concluidosSemSponsor = data.allEpics.filter(e => {
    const statusId = e.status.id
    const isConcluido = statusId === '10003' || statusId === '10019'
    if (!isConcluido) return false
    return !(e.sponsor && e.sponsor.trim())
  })
  const semSponsor = concluidosSemSponsor.length
  const concluidosSemBeneficio = data.allEpics.filter(e => {
    const statusId = e.status.id
    const isConcluido = statusId === '10003' || statusId === '10019'
    if (!isConcluido) return false
    const noQuant = !(e.beneficioQuantitativo && e.beneficioQuantitativo > 0)
    const noQual = !(e.beneficioQualitativo && String(e.beneficioQualitativo).trim())
    return noQuant && noQual
  })
  const semBeneficio = concluidosSemBeneficio.length

  const topSponsors = (() => {
    const map = new Map<string, { sponsor: string; qtdExperimentos: number; dominios: Map<string, number> }>()

    for (const epic of data.allEpics) {
      const sponsor = (epic.sponsor ?? '').trim() || 'Sem Sponsor'
      const dominio = (epic.dominio ?? '').trim() || 'Sem domínio'

      const current = map.get(sponsor)
      if (current) {
        current.qtdExperimentos += 1
        current.dominios.set(dominio, (current.dominios.get(dominio) ?? 0) + 1)
      } else {
        map.set(sponsor, {
          sponsor,
          qtdExperimentos: 1,
          dominios: new Map([[dominio, 1]]),
        })
      }
    }

    return Array.from(map.values())
      .map(item => {
        const dominioMaisFrequente = Array.from(item.dominios.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? 'Sem domínio'

        return {
          sponsor: item.sponsor,
          dominio: dominioMaisFrequente,
          qtdExperimentos: item.qtdExperimentos,
        }
      })
      .sort((a, b) => b.qtdExperimentos - a.qtdExperimentos || a.sponsor.localeCompare(b.sponsor))
      .slice(0, 5)
  })()

  // Build top-5 prioritized exactly as requested by user (preserve order)
  const topFivePrioritized = desiredOrder.map(d => {
    const found = priorizados.find(p => p.nome && p.nome.toLowerCase().includes(d.match.toLowerCase()))
    if (found) {
      return {
        key: found.key,
        nome: found.nome,
        sponsor: d.sponsor ?? (found.sponsor ?? '—'),
        beneficioQuantitativo: d.beneficioNumeric ?? found.beneficioQuantitativo ?? 0,
      }
    }
    const placeholderName = d.match === 'Claro Box' ? 'Claro Box - Ativação e Login Automático de Streamings' : d.match
    return {
      key: `manual-${d.match.replace(/\s+/g, '-').toLowerCase()}`,
      nome: placeholderName,
      sponsor: d.sponsor ?? '—',
      beneficioQuantitativo: d.beneficioNumeric ?? 0,
    }
  })

  const topFiveKeys = new Set(topFivePrioritized.map(t => t.key))
  const remainingInProgress = emAndamento.filter(e => !topFiveKeys.has(e.key))

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between bg-[#8B0000] text-white px-6 py-3 rounded-md">
          <div>
            <h1 className="text-2xl font-bold">MBR — Métricas e Prioridades</h1>
            <p className="text-sm text-white/80">Visão consolidada para o Monthly Business Review (apenas admins)</p>
          </div>
          <div className="flex gap-2">
            <Link href="/report" className="text-sm underline text-white/90">Voltar ao Report</Link>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase">Experimentos concluídos</p>
            <p className="text-2xl font-bold">{totalEpicsConcluidos}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase">Benefício estimado</p>
            <p className="text-2xl font-bold">{formatBeneficioMM(beneficioEstimado)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase">Sem Sponsor</p>
            <EpicsListModal
              title="Sem Sponsor"
              items={concluidosSemSponsor as any}
              trigger={<p className="text-2xl font-bold">{semSponsor}</p>}
            />
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase">Sem Benefício</p>
            <EpicsListModal
              title="Sem Benefício"
              items={concluidosSemBeneficio as any}
              trigger={<p className="text-2xl font-bold">{semBeneficio}</p>}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] min-h-[260px]">
            <p className="text-xs text-gray-400 uppercase mb-3">Jornada de adoção</p>
            <LeadTimeJornadaComponent
              data={data.leadTimeJornada}
              cycleTimeExperimentacao={data.cycleTimeExperimentacao}
            />
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] min-h-[260px] flex flex-col overflow-hidden">
            <p className="text-xs text-gray-400 uppercase mb-3">Crescimento de experimentação</p>
            <div className="flex-1 min-h-0">
              <BurnupChart data={monitoramento.burnup} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] min-h-[280px] flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400 uppercase">Top 5 sponsors por experimentos</p>
              <p className="text-sm text-gray-500">Sponsor, domínio e quantidade de experimentos</p>
            </div>
            <span className="text-xs text-gray-400">{topSponsors.length} itens</span>
          </div>

          <div className="flex-1 min-h-0 grid gap-3">
            {topSponsors.map((item, index) => {
              const max = Math.max(...topSponsors.map(s => s.qtdExperimentos), 1)
              const width = Math.max(Math.round((item.qtdExperimentos / max) * 100), 8)

              return (
                <div key={`${item.sponsor}-${item.dominio}`} className="grid grid-cols-[28px_minmax(0,1fr)_72px] items-center gap-3">
                  <div className="text-xs font-bold text-[#8B0000] text-right tabular-nums">{index + 1}</div>

                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.sponsor}</p>
                        <p className="text-xs text-gray-500 truncate">{item.dominio}</p>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, background: 'linear-gradient(90deg, #8B0000, #CC0000)' }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{item.qtdExperimentos}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">experimentos</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#8B0000] min-h-[320px]">
            <p className="text-xs text-gray-400 uppercase mb-3">Diretorias por experimentos</p>
            <MapaDiretorias epics={data.allEpics} />
          </div>
        </div>

        {/* Quadrantes compactos — visão executiva */}
        {/* preparar listas resumidas */}
        {/* listagens compactas para apresentar em pequenos quadrantes */}
        {
          // listas detalhadas para quadrantes
        }
        {/* compute arrays for display */}
        {/* Sem Sponsor list (names) */}
        {/* Sem Benefício list (names) */}
        {
          /* eslint-disable react/jsx-no-useless-fragment */
        }
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase mb-2">Priorizados</p>
            <div className="flex flex-col gap-1.5">
              {(() => {
                const items = topFivePrioritized
                const max = Math.max(...items.map(i => i.beneficioQuantitativo ?? 0), 1)
                return items.map((e, i) => {
                  const barPct = Math.round(((e.beneficioQuantitativo ?? 0) / max) * 100)
                  return (
                    <div key={e.key} className="flex items-start gap-2 rounded-lg px-2 py-1.5 -mx-2" title={e.nome}>
                      <span className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: 18, height: 18, fontSize: 9, background: '#CC0000', marginTop: 1 }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-800 truncate" style={{ fontSize: 11.5 }}>{e.nome}</span>
                          <span className="font-bold flex-shrink-0" style={{ fontSize: 11.5, color: '#CC0000' }}>{e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : 'Não mapeado'}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }} />
                        </div>
                        <p className="text-gray-400 truncate mt-1" style={{ fontSize: 10 }}>{e.sponsor ?? '—'}</p>
                      </div>
                    </div>
                  )
                })
              })()}

              <div className="pt-2">
                <EpicsListModal
                  title="Experimentos em Andamento"
                  items={remainingInProgress as any}
                  trigger={<button className="text-xs text-gray-500">Ver demais experimentos em andamento ({remainingInProgress.length})</button>}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-[#8B0000]">
            <p className="text-xs text-gray-400 uppercase mb-2">Realizados (top)</p>
            <div className="flex flex-col gap-1.5">
              {(() => {
                const items = concluidosTop.slice(0, 6)
                const max = Math.max(...items.map(i => i.beneficioQuantitativo ?? 0), 1)
                return items.map((e, i) => {
                  const barPct = Math.round(((e.beneficioQuantitativo ?? 0) / max) * 100)
                  return (
                    <div key={e.key} className="flex items-start gap-2 rounded-lg px-2 py-1.5 -mx-2" title={e.nome}>
                      <span className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0" style={{ width: 18, height: 18, fontSize: 9, background: '#CC0000', marginTop: 1 }}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-800 truncate" style={{ fontSize: 11.5 }}>{e.nome}</span>
                                <span className="font-bold flex-shrink-0" style={{ fontSize: 11.5, color: '#CC0000' }}>{e.beneficioQuantitativo ? formatBRL(e.beneficioQuantitativo) : '—'}</span>
                              </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(barPct, 3)}%`, background: 'linear-gradient(90deg, #CC0000, #EF4444)' }} />
                        </div>
                        <p className="text-gray-400 truncate mt-1" style={{ fontSize: 10 }}>{e.sponsor ?? '—'} · {parentStatusMap.get(e.key)?.name ?? '—'}</p>
                      </div>
                    </div>
                  )
                })
              })()}
              {concluidosTop.length > 6 && (
                <div className="text-xs text-gray-400">+{concluidosTop.length - 6} adicionais</div>
              )}
            </div>
          </div>

          {/* Sem Sponsor e Sem Benefício agora acessíveis via modal nos cards acima */}
        </div>

      </main>
    </div>
  )
}
