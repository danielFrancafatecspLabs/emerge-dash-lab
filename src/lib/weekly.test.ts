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

describe('buildWeeklyData · benefício potencial e indicadores de cadastro', () => {
  const epic = (key: string, status: [string, string], extra: Partial<EpicDetail> = {}) =>
    ({ key, nome: key, status: { id: status[0], name: status[1] }, parentKey: null, sponsor: null, beneficioQuantitativo: null, beneficioQualitativo: null, ...extra }) as EpicDetail
  const ini = (key: string, status: [string, string]) => ({
    key, nome: `Iniciativa ${key}`, status: { id: status[0], name: status[1] }, epics: [], sponsors: [], dominios: [], segmentos: [],
    beneficioQuantitativo: null, beneficioQuantitativoTotal: 0, timeResponsavel: null, sponsor: null, descricao: null, criadoEm: null,
  })

  it('considera exploração, andamento e concluídos com hipótese validada; cancelados e refutados ficam de fora', () => {
    const data = {
      beneficioTotal: 0, metasAgregadas: [], pilotoStatusIds: [], escalaStatusIds: [],
      iniciativas: [ini('GL-90', ['14468', 'Aguardando Piloto']), ini('GL-91', ['10004', 'BACKLOG'])],
      allEpics: [
        epic('GL-1', ['10004', 'BACKLOG'], { beneficioQuantitativo: 1_000_000 }), // exploração, sem sponsor
        epic('GL-2', ['3', 'Em andamento'], { sponsor: 'Ana', beneficioQuantitativo: 2_000_000 }),
        epic('GL-3', ['10204', 'EM VALIDAÇÃO'], { sponsor: 'Bia', beneficioQualitativo: 'Menos retrabalho' }), // só qualitativo
        epic('GL-4', ['10019', 'Concluído'], { parentKey: 'GL-90', sponsor: 'Caio', beneficioQuantitativo: 5_000_000 }), // validada
        epic('GL-5', ['10019', 'Concluído'], { parentKey: 'GL-91', beneficioQuantitativo: 9_000_000 }), // refutada: fora
        epic('GL-6', ['10015', 'CANCELADO'], { beneficioQuantitativo: 7_000_000 }), // cancelado: fora
        epic('GL-7', ['3', 'Em andamento']), // sem nada
      ],
    } as unknown as DashboardData
    const w = buildWeeklyData(data)
    expect(w.epicsConsiderados.map(e => [e.key, e.grupo])).toEqual([
      ['GL-1', 'exploracao'], ['GL-2', 'andamento'], ['GL-7', 'andamento'], ['GL-3', 'andamento'], ['GL-4', 'validada'],
    ])
    expect(w.beneficioConsiderado).toBe(8_000_000)
    expect(w.foraDaConta).toEqual({ cancelados: 1, refutados: 1 })
    expect(w.semBeneficio).toEqual({ count: 1, pct: 20, base: 5 })
    expect(w.semSponsor).toEqual({ count: 2, pct: 40, base: 5 })
    expect(w.epicsConsiderados.find(e => e.key === 'GL-4')?.iniciativa).toEqual({ key: 'GL-90', nome: 'Iniciativa GL-90', status: 'Aguardando Piloto' })
  })
})
