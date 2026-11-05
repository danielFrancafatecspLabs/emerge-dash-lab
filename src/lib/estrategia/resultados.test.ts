import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardData, EpicDetail, Iniciativa } from '@/lib/types'
import { buildWeeklyData } from '@/lib/weekly'
import { buildSemanalData } from '@/lib/semanal'
import { epicNoPeriodo, filtrarDashboardData, hipoteses, resultadosDaEstrategia } from './resultados'

const CONCLUIDO = { id: '10019', name: 'Concluído' }
const CANCELADO = { id: '10015', name: 'CANCELADO' }
const ANDAMENTO = { id: '3', name: 'Em andamento' }

const epic = (key: string, parentKey: string | null, over: Partial<EpicDetail> = {}): EpicDetail => ({
  key, nome: key, status: ANDAMENTO, parentKey, tecnologia: null, sponsor: null, bo: null, complexidade: null, timeResponsavel: null,
  beneficioQuantitativo: null, beneficioQualitativo: null, dominio: null, custoEstimado: null, custoRealizado: null, segmento: null,
  portfolio: null, diretoria: null, metaCategoria: null, tipo: 'Epic', mercado: 'Consumo', descricao: null, motivoBloqueio: null,
  criadoEm: '2025-03-01T10:00:00.000-0300', ...over,
})

const ini = (key: string, status: { id: string; name: string }, epics: EpicDetail[], criadoEm = '2025-01-10T10:00:00.000-0300'): Iniciativa => ({
  key, nome: key, status, metaCategoria: null, epics, beneficioQuantitativo: null, beneficioQuantitativoTotal: 0, dominios: [], sponsors: [],
  segmentos: [], timeResponsavel: null, sponsor: null, criadoEm, descricao: null, bo: null, dominio: null,
})

const AGUARDANDO = { id: '13045', name: 'Aguardando Piloto' }
const PILOTO = { id: '12847', name: 'EM PILOTO' }
const FINALIZADO = { id: '10003', name: 'FINALIZADO' }
const EXPERIMENTACAO = { id: '14460', name: 'Em experimentação' }

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00')) })
afterEach(() => { vi.useRealTimers() })

describe('período pela conclusão do experimento', () => {
  const s1_26 = { tipo: 'semestre', ano: 2026, semestre: 1 } as const
  it('concluído conta no período em que foi concluído, não no da criação', () => {
    const e = epic('GL-1', null, { status: CONCLUIDO, criadoEm: '2025-05-01T10:00:00Z', concluidoEm: '2026-03-15T10:00:00Z' })
    expect(epicNoPeriodo(e, s1_26)).toBe(true)
    expect(epicNoPeriodo(e, { tipo: 'semestre', ano: 2025, semestre: 1 })).toBe(false)
  })
  it('cancelado conta no período do cancelamento', () => {
    const e = epic('GL-2', null, { status: CANCELADO, criadoEm: '2025-05-01T10:00:00Z', canceladoEm: '2026-02-01T10:00:00Z' })
    expect(epicNoPeriodo(e, s1_26)).toBe(true)
    expect(epicNoPeriodo(e, { tipo: 'ano', ano: 2025 })).toBe(false)
  })
  it('em aberto conta se já existia no fim do período (estava em curso)', () => {
    const e = epic('GL-3', null, { criadoEm: '2026-08-01T10:00:00Z' })
    expect(epicNoPeriodo(e, s1_26)).toBe(false)
    expect(epicNoPeriodo(e, { tipo: 'semestre', ano: 2026, semestre: 2 })).toBe(true)
    expect(epicNoPeriodo(e, { tipo: 'ultimos12' })).toBe(true)
  })
})

describe('hipóteses: sempre em épicos, a mesma conta do Semanal', () => {
  const BACKLOG = { id: '10004', name: 'BACKLOG' }
  const epics = [
    epic('GL-10', 'GL-1', { status: CONCLUIDO }),
    epic('GL-11', 'GL-1', { status: CONCLUIDO }),
    epic('GL-12', 'GL-2', { status: CONCLUIDO }),
    epic('GL-13', 'GL-3', { status: CONCLUIDO }),
    epic('GL-14', 'GL-4', { status: CONCLUIDO }),
    epic('GL-15', 'GL-5', { status: CANCELADO }),
    epic('GL-16', 'GL-6'),
    epic('GL-17', null, { status: BACKLOG }),
  ]
  const filhos = (k: string) => epics.filter(e => e.parentKey === k)
  const iniciativas = [
    ini('GL-1', AGUARDANDO, filhos('GL-1')), ini('GL-2', PILOTO, filhos('GL-2')), ini('GL-3', FINALIZADO, filhos('GL-3')),
    ini('GL-4', EXPERIMENTACAO, filhos('GL-4')), ini('GL-5', CANCELADO, filhos('GL-5')), ini('GL-6', PILOTO, filhos('GL-6')),
    ini('GL-7', AGUARDANDO, []), // aguardando piloto sem experimento concluído: conta, como no Semanal
  ]
  const data = { iniciativas, allEpics: epics, pipeline: {}, mercadosSegmento: [], pilotoStatusIds: ['12847'], escalaStatusIds: [] } as unknown as DashboardData

  it('hipóteses em épicos: concluído com a iniciativa em aguardando piloto, piloto ou escala (Finalizado incluso)', () => {
    const h = hipoteses(iniciativas, epics)
    expect(h.validadas.map(e => e.key)).toEqual(['GL-10', 'GL-11', 'GL-12', 'GL-13'])
    expect(h.refutadas.map(e => e.key)).toEqual(['GL-14'])
    // As etapas contam iniciativas, como as seções do Semanal.
    expect(h.porEtapa['AGUARDANDO PILOTO'].map(i => i.key)).toEqual(['GL-1', 'GL-7'])
    expect(h.porEtapa['EM PILOTO'].map(i => i.key)).toEqual(['GL-2', 'GL-6'])
    expect(h.porEtapa['EM ESCALA'].map(i => i.key)).toEqual(['GL-3'])

    const semanal = buildSemanalData(data, buildWeeklyData(data))
    const fatia = (id: string) => semanal.resumo.fatias.find(f => f.id === id)?.quantidade
    expect(fatia('validadas')).toBe(4)
    expect(fatia('refutadas')).toBe(1)
    expect(semanal.resumo.fatias.reduce((s, f) => s + f.quantidade, 0)).toBe(epics.length)
  })
})

describe('benefício potencial', () => {
  const epics = [
    epic('GL-20', 'GL-7', { beneficioQuantitativo: 10_000_000, metaCategoria: 'Receita' }),
    epic('GL-21', 'GL-7', { status: CONCLUIDO, beneficioQuantitativo: 5_000_000, metaCategoria: 'EBITDA', concluidoEm: '2026-04-01T10:00:00Z' }),
    epic('GL-22', 'GL-8', { status: CANCELADO, beneficioQuantitativo: 250_000_000, metaCategoria: 'Receita', canceladoEm: '2026-05-01T10:00:00Z' }),
    epic('GL-23', 'GL-8', { beneficioQuantitativo: 1_000_000 }),
  ]
  const data = {
    iniciativas: [ini('GL-7', PILOTO, epics.slice(0, 2)), ini('GL-8', EXPERIMENTACAO, epics.slice(2))],
    allEpics: epics, mercadosSegmento: [],
  } as unknown as DashboardData

  it('nunca soma os cancelados, que ficam à parte; top 5 e metas também sem eles', () => {
    const d = filtrarDashboardData(data, { tipo: 'tudo' })
    const r = resultadosDaEstrategia(d)
    expect(r.beneficio).toBe(16_000_000)
    expect(d.beneficioTotal).toBe(16_000_000)
    expect(r.cancelados).toEqual({ valor: 250_000_000, epics: [epics[2]] })
    expect(d.top5Epics.map(e => e.key)).toEqual(['GL-20', 'GL-21', 'GL-23'])
    expect(d.metasAgregadas.Receita).toEqual({ count: 1, valor: 10_000_000 })
    expect(d.metasAgregadas.EBITDA).toEqual({ count: 1, valor: 5_000_000 })
    expect(r.semMeta.map(e => e.key)).toEqual(['GL-23'])
    expect(d.iniciativas.find(i => i.key === 'GL-8')?.beneficioQuantitativoTotal).toBe(1_000_000)
  })

  it('no período, cancelado e concluído contam pela data do evento', () => {
    const d = filtrarDashboardData(data, { tipo: 'semestre', ano: 2025, semestre: 2 })
    // Em 2025/2: só os abertos já existentes (criados em mar/2025); o concluído e o cancelado são de 2026.
    expect(d.allEpics.map(e => e.key)).toEqual(['GL-20', 'GL-23'])
    expect(resultadosDaEstrategia(d).cancelados.valor).toBe(0)
  })
})
