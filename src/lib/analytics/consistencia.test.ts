import { describe, expect, it } from 'vitest'
import { buildDashboardData } from '@/lib/mappers'
import { montarPortfolio } from '@/lib/portfolio/dados'
import { buildSemanalData } from '@/lib/semanal'
import type { JiraBoardConfiguration, JiraIssue } from '@/lib/types'
import { buildWeeklyData, statusIdsDeExploracao } from '@/lib/weekly'
import { verificarConsistencia, type EntradaConsistencia } from './consistencia'

const S = {
  BACKLOG: { id: '10004', name: 'BACKLOG' }, EXP: { id: '14460', name: 'Em experimentação' }, AG: { id: '14468', name: 'Aguardando Piloto' },
  PIL: { id: '14459', name: 'EM PILOTO' }, ESC: { id: '13562', name: 'Finalizado' }, CANC: { id: '10015', name: 'CANCELADO' },
  AND: { id: '3', name: 'Em andamento' }, VAL: { id: '10204', name: 'EM VALIDAÇÃO' }, CONC: { id: '10019', name: 'Concluído' },
}
const ini = (key: string, status: { id: string; name: string }) =>
  ({ key, fields: { summary: key, status, issuetype: { name: 'Iniciativa' }, created: '2025-03-01T10:00:00.000-0300' } }) as unknown as JiraIssue
const epic = (key: string, parent: string | null, status: { id: string; name: string }, beneficio: number | null = null) =>
  ({
    key,
    fields: {
      summary: key, status, issuetype: { name: 'Epic' }, created: '2025-04-01T10:00:00.000-0300', customfield_30216: beneficio,
      ...(parent ? { parent: { key: parent, fields: { summary: '', issuetype: { name: 'Iniciativa' } } } } : {}),
    },
  }) as unknown as JiraIssue
const config = (cols: [string, string[]][]) =>
  ({ id: 1, name: 'b', type: 'kanban', columnConfig: { columns: cols.map(([name, ids]) => ({ name, statuses: ids.map(id => ({ id })) })) } }) as unknown as JiraBoardConfiguration

const iniciativas = [ini('GL-1', S.AG), ini('GL-2', S.PIL), ini('GL-3', S.ESC), ini('GL-4', S.EXP), ini('GL-5', S.CANC), ini('GL-6', S.AG)]
const epics = [
  epic('GL-10', 'GL-1', S.CONC, 10_000_000), epic('GL-11', 'GL-1', S.CONC, 5_000_000), epic('GL-12', 'GL-2', S.CONC, 8_000_000),
  epic('GL-13', 'GL-3', S.CONC, 2_000_000), epic('GL-14', 'GL-4', S.AND, 3_000_000), epic('GL-15', 'GL-4', S.VAL, null),
  epic('GL-16', 'GL-5', S.CANC, 250_000_000), epic('GL-17', null, S.BACKLOG, 1_000_000), epic('GL-18', 'GL-4', S.CONC, 4_000_000),
]
const cfgIni = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CANCELADO', ['10015']]])
const cfgExp = config([['BACKLOG', ['10004']], ['Em andamento', ['3']], ['EM VALIDAÇÃO', ['10204']], ['Concluído', ['10019']], ['CANCELADO', ['10015']]])

function entrada(): EntradaConsistencia {
  const data = buildDashboardData(iniciativas, epics, {}, {}, cfgIni, {}, {})
  const dataSemanal = buildDashboardData(iniciativas, epics, {}, {}, cfgIni)
  const weekly = buildWeeklyData(dataSemanal, {}, cfgExp)
  return {
    data, dataSemanal, weekly, semanal: buildSemanalData(dataSemanal, weekly, {}),
    portfolio: montarPortfolio(data, { iniciativa: cfgIni, experimento: cfgExp }, null),
    exploracaoIds: statusIdsDeExploracao(cfgExp), agora: new Date('2026-11-04T12:00:00Z'),
  }
}

describe('agente de analytics', () => {
  it('confere as visões entre si: com os mesmos dados, tudo bate', () => {
    const r = verificarConsistencia(entrada())
    const falhas = r.verificacoes.filter(v => !v.ok).map(v => `${v.titulo}: ${JSON.stringify(v.valores)}`)
    expect(falhas).toEqual([])
    const v = (id: string) => r.verificacoes.find(x => x.id === id)!.valores
    expect(v('validadas')).toEqual({ Semanal: 4, 'Estratégia (Tudo)': 4, Portfólio: 4 })
    expect(v('beneficio')).toEqual({ 'Estratégia (Tudo)': 33_000_000, 'Portfólio (experimentos)': 33_000_000 })
  })

  it('aponta a divergência quando uma tela conta diferente', () => {
    const e = entrada()
    e.portfolio = { ...e.portfolio, experimentos: e.portfolio.experimentos.slice(1) }
    const r = verificarConsistencia(e)
    expect(r.divergencias).toBeGreaterThan(0)
    expect(r.verificacoes.find(x => x.id === 'total')).toMatchObject({ ok: false, diferenca: 1 })
  })

  it('traz os alertas de qualidade dos dados que explicam números estranhos', () => {
    const r = verificarConsistencia(entrada())
    const alerta = (id: string) => r.alertas.find(a => a.id === id)
    expect(alerta('sem-iniciativa')).toMatchObject({ quantidade: 1, exemplos: ['GL-17'] })
    expect(alerta('validadas-sem-concluido')).toMatchObject({ quantidade: 1, exemplos: ['GL-6'] })
    expect(alerta('cancelados-com-beneficio')).toMatchObject({ quantidade: 1, exemplos: ['GL-16'] })
  })
})
