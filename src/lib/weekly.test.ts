import { describe, expect, it } from 'vitest'
import type { DashboardData, EpicDetail } from './types'
import { buildWeeklyData, resolveMotivoBloqueio } from './weekly'

describe('resolveMotivoBloqueio', () => {
  it('prefers the mapped CSV reason for cancelled epics by title match', () => {
    expect(resolveMotivoBloqueio('Agente para Treinamento Comercial', null)).toContain('Dados & IA')
    expect(resolveMotivoBloqueio('Leads PME - 2º Ciclo', null)).toContain('Neoway')
  })

  it('falls back to the Jira reason when there is no CSV match', () => {
    expect(resolveMotivoBloqueio('Experimento sem csv', 'Falta de engajamento do BO')).toBe('Falta de engajamento do BO')
  })
})

describe('buildWeeklyData · indicadores de cadastro', () => {
  const epic = (key: string, status: [string, string], extra: Partial<EpicDetail> = {}) =>
    ({ key, nome: key, status: { id: status[0], name: status[1] }, sponsor: null, beneficioQuantitativo: null, beneficioQualitativo: null, ...extra }) as EpicDetail

  it('sem benefício e sem sponsor consideram só os Epics ativos', () => {
    const data = {
      iniciativas: [], beneficioTotal: 0, metasAgregadas: [], pilotoStatusIds: [], escalaStatusIds: [],
      allEpics: [
        epic('GL-1', ['10004', 'BACKLOG']), // ativo, sem nada
        epic('GL-2', ['3', 'Em andamento'], { sponsor: 'Ana', beneficioQuantitativo: 1_000_000 }), // ativo, completo
        epic('GL-3', ['10204', 'EM VALIDAÇÃO'], { beneficioQualitativo: 'Menos retrabalho' }), // ativo, sem sponsor
        epic('GL-4', ['10019', 'Concluído']), // encerrado: fora
        epic('GL-5', ['10015', 'CANCELADO']), // encerrado: fora
      ],
    } as unknown as DashboardData
    const w = buildWeeklyData(data)
    expect(w.semBeneficio).toEqual({ count: 1, pct: 33, base: 3 })
    expect(w.semSponsor).toEqual({ count: 2, pct: 67, base: 3 })
  })
})
