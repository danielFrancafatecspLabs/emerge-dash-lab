import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardData, EpicDetail, Iniciativa } from '@/lib/types'
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
const EXPERIMENTACAO = { id: '12848', name: 'EM EXPERIMENTAÇÃO' }

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

describe('hipóteses por iniciativa', () => {
  const epics = [
    epic('GL-10', 'GL-1', { status: CONCLUIDO }), // aguardando piloto
    epic('GL-11', 'GL-1', { status: CONCLUIDO }), // mesmo pai: conta uma vez
    epic('GL-12', 'GL-2', { status: CONCLUIDO }), // em piloto
    epic('GL-13', 'GL-3', { status: CONCLUIDO }), // pai concluído → refutada
    epic('GL-14', 'GL-4', { status: CONCLUIDO }), // pai em experimentação → sem decisão
    epic('GL-15', 'GL-5', { status: CONCLUIDO }), // pai cancelado → sem decisão
    epic('GL-16', 'GL-6'), // não concluído → fora
    epic('GL-17', null, { status: CONCLUIDO }), // sem pai → sem decisão
  ]
  const filhos = (k: string) => epics.filter(e => e.parentKey === k)
  const iniciativas = [
    ini('GL-1', AGUARDANDO, filhos('GL-1')), ini('GL-2', PILOTO, filhos('GL-2')), ini('GL-3', FINALIZADO, filhos('GL-3')),
    ini('GL-4', EXPERIMENTACAO, filhos('GL-4')), ini('GL-5', CANCELADO, filhos('GL-5')), ini('GL-6', PILOTO, filhos('GL-6')),
  ]
  it('validada: aguardando piloto, piloto ou escala; refutada: concluída; sem repetir a iniciativa', () => {
    const h = hipoteses(iniciativas, epics)
    expect(h.validadas.map(i => i.key)).toEqual(['GL-1', 'GL-2'])
    expect(h.porEtapa['AGUARDANDO PILOTO'].map(i => i.key)).toEqual(['GL-1'])
    expect(h.refutadas.map(i => i.key)).toEqual(['GL-3'])
    expect(h.semDecisao.map(e => e.key)).toEqual(['GL-14', 'GL-15', 'GL-17'])
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
