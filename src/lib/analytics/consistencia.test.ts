import { describe, expect, it } from 'vitest'
import { buildDashboardData } from '@/lib/mappers'
import { montarPortfolio } from '@/lib/portfolio/dados'
import { buildSemanalData } from '@/lib/semanal'
import type { JiraBoardConfiguration, JiraIssue } from '@/lib/types'
import { buildWeeklyData, statusIdsDeExploracao } from '@/lib/weekly'
import { experimentosDoSemanal, montarComparativo } from '@/lib/comparativo/montar'
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

function entrada(inis = iniciativas): EntradaConsistencia {
  const data = buildDashboardData(inis, epics, {}, {}, cfgIni, {}, {})
  const dataSemanal = buildDashboardData(inis, epics, {}, {}, cfgIni)
  const weekly = buildWeeklyData(dataSemanal, {}, cfgExp)
  return {
    data, dataSemanal, weekly, semanal: buildSemanalData(dataSemanal, weekly, {}),
    portfolio: montarPortfolio(data, { iniciativa: cfgIni, experimento: cfgExp }, null),
    exploracaoIds: statusIdsDeExploracao(cfgExp), board2734Config: cfgIni, board2735Config: cfgExp, agora: new Date('2026-11-04T12:00:00Z'),
  }
}

describe('agente de analytics', () => {
  it('confere as visões entre si: com os mesmos dados, tudo bate', () => {
    const r = verificarConsistencia(entrada())
    const falhas = r.verificacoes.filter(v => !v.ok).map(v => `${v.titulo}: ${JSON.stringify(v.valores)}`)
    expect(falhas).toEqual([])
    const v = (id: string) => r.verificacoes.find(x => x.id === id)!.valores
    // Validadas em épicos: GL-10 e GL-11 (aguardando), GL-12 (piloto), GL-13 (escala); GL-18 (iniciativa em experimentação) é refutada.
    expect(v('validadas')).toEqual({ Semanal: 4, 'Estratégia (Tudo)': 4, Portfólio: 4, 'Comparativo / benefício do Semanal': 4 })
    expect(v('refutadas')).toEqual({ Semanal: 1, 'Estratégia (Tudo)': 1, Portfólio: 1, 'Comparativo / benefício do Semanal': 1 })
    expect(v('beneficio')).toEqual({ 'Estratégia (Tudo)': 33_000_000, 'Portfólio (experimentos)': 33_000_000 })
  })

  it('aponta a divergência quando uma tela conta diferente', () => {
    const e = entrada()
    e.portfolio = { ...e.portfolio, experimentos: e.portfolio.experimentos.slice(1) }
    const r = verificarConsistencia(e)
    expect(r.divergencias).toBeGreaterThan(0)
    expect(r.verificacoes.find(x => x.id === 'total')).toMatchObject({ ok: false, diferenca: 1 })
  })

  it('confere a regra do app contra a coluna real no Jira e acha o status que a regra não reconhece', () => {
    // Um status novo, com nome diferente, colocado na coluna AGUARDANDO PILOTO do board de Ideação.
    const cfg = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468', '99999']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CANCELADO', ['10015']]])
    const variante = [...iniciativas, ini('GL-7', { id: '99999', name: 'Aguardando validação do piloto' })]
    const e = entrada(variante)
    const r = verificarConsistencia({ ...e, board2734Config: cfg })
    expect(r.verificacoes.find(v => v.id === 'coluna-aguardando')).toMatchObject({
      ok: false, valores: { 'Semanal (regra por status)': 2, 'Operacional (estágio)': 3, 'Coluna no Jira': 3 },
    })
    expect(r.alertas.map(a => a.titulo)).toContain(
      'Status Aguardando validação do piloto (id 99999), na coluna "AGUARDANDO PILOTO": a regra do app conta como não validada, a coluna indica aguardando')
  })

  it('confere o período: o funil e o Crescimento contam os mesmos concluídos', () => {
    const r = verificarConsistencia(entrada())
    expect(r.verificacoes.filter(v => v.id.startsWith('periodo-')).every(v => v.ok)).toBe(true)
  })

  it('traz os alertas de qualidade dos dados que explicam números estranhos', () => {
    const r = verificarConsistencia(entrada())
    const alerta = (id: string) => r.alertas.find(a => a.id === id)
    expect(alerta('sem-iniciativa')).toMatchObject({ quantidade: 1, exemplos: ['GL-17'] })
    expect(alerta('etapa-sem-concluido')).toMatchObject({ quantidade: 1, exemplos: ['GL-6'] })
    expect(alerta('cancelados-com-beneficio')).toMatchObject({ quantidade: 1, exemplos: ['GL-16'] })
  })

  it('não deixa cancelado entrar no benefício, mesmo com o id de outra etapa', () => {
    const extra = [...epics, epic('GL-19', 'GL-4', { id: '3', name: 'Cancelado' }, 90_000_000)]
    const data = buildDashboardData(iniciativas, extra, {}, {}, cfgIni, {}, {})
    const dataSemanal = buildDashboardData(iniciativas, extra, {}, {}, cfgIni)
    const weekly = buildWeeklyData(dataSemanal, {}, cfgExp)
    const r = verificarConsistencia({
      ...entrada(), data, dataSemanal, weekly, semanal: buildSemanalData(dataSemanal, weekly, {}),
      portfolio: montarPortfolio(data, { iniciativa: cfgIni, experimento: cfgExp }, null),
    })
    const v = (id: string) => r.verificacoes.find(x => x.id === id)!
    expect(v('beneficio-pelo-nome')).toMatchObject({ ok: true, valores: { 'Estratégia (Tudo)': 33_000_000 } })
    expect(v('lista-beneficio-sem-cancelado')).toMatchObject({ ok: true })
    expect(v('beneficio').ok).toBe(true)
    expect(v('cancelados').valores).toMatchObject({ Semanal: 2, 'Estratégia (Tudo)': 2, Portfólio: 2 })
  })

  it('o benefício potencial de cada ano bate entre o Comparativo e a Estratégia', () => {
    const e = entrada()
    const comparativo = montarComparativo({
      iniciativas, epics, iniciativaChangelogs: {}, epicChangelogs: {}, board2734Config: cfgIni, board2735Config: cfgExp,
      experimentos: experimentosDoSemanal(e.data, buildWeeklyData(e.data, {}, cfgExp)),
    }, new Date('2026-11-04T12:00:00Z'))
    const r = verificarConsistencia({ ...e, comparativo })
    const v = r.verificacoes.filter(x => x.id.startsWith('comparativo-beneficio-'))
    expect(v).toHaveLength(2)
    expect(v.every(x => x.ok)).toBe(true)
    // Todos os épicos do exemplo são de 2025: R$ 33 mi (sem o cancelado), o mesmo da Estratégia.
    expect(v.find(x => x.id === 'comparativo-beneficio-2025')!.valores).toEqual({ Comparativo: 33_000_000, 'Estratégia (Todo 2025)': 33_000_000 })
  })

  it('iniciativa concluída (coluna Concluído) não conta como Em escala; Finalizado conta', () => {
    const cfg = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CONCLUÍDO', ['10019']], ['CANCELADO', ['10015']]])
    const variante = [...iniciativas, ini('GL-8', { id: '10019', name: 'Concluído' }), ini('GL-9', { id: '10019', name: 'Concluído' })]
    const r = verificarConsistencia({ ...entrada(variante), board2734Config: cfg })
    expect(r.verificacoes.find(v => v.id === 'coluna-escala')).toMatchObject({ ok: true })
  })

  it('bloqueado em validação com um id fora do mapa conta no Portfólio e na regra', () => {
    const VALIDACAO_NOVA = { id: '77777', name: 'Em Validação' }
    const bloqueado = { ...epic('GL-30', 'GL-4', VALIDACAO_NOVA, 1_000_000), fields: { ...epic('GL-30', 'GL-4', VALIDACAO_NOVA, 1_000_000).fields, customfield_10021: [{ value: 'Impediment' }] } } as unknown as JiraIssue
    const todos = [...epics, bloqueado]
    const data = buildDashboardData(iniciativas, todos, {}, {}, cfgIni, {}, {})
    const portfolio = montarPortfolio(data, { iniciativa: cfgIni, experimento: cfgExp }, null)
    expect(portfolio.experimentos.find(x => x.key === 'GL-30')?.bloqueado).toBe(true)
    const r = verificarConsistencia({ ...entrada(), data, portfolio })
    expect(r.verificacoes.find(v => v.id === 'bloqueados')).toMatchObject({ ok: true, valores: { Portfólio: 1, 'Regra do app (lib/bloqueio)': 1 } })
  })

  it('diagnostica a divergência: diz qual item uma tela conta e a outra não', () => {
    const e = entrada()
    const fora = e.portfolio.experimentos[0]
    e.portfolio = { ...e.portfolio, experimentos: e.portfolio.experimentos.slice(1) }
    const total = verificarConsistencia(e).verificacoes.find(x => x.id === 'total')!
    expect(total.natureza).toBe('telas')
    expect(total.diagnostico!.diferencas).toContainEqual(expect.objectContaining({ conta: 'Semanal', naoConta: 'Portfólio', total: 1, itens: [expect.objectContaining({ key: fora.key })] }))
  })

  it('totais iguais com itens diferentes também é divergência', () => {
    const e = entrada()
    // O Portfólio troca um concluído por um cancelado: os dois totais continuam iguais.
    const trocar = (x: (typeof e.portfolio.experimentos)[number]) =>
      x.key === 'GL-16' ? { ...x, situacao: 'concluido' as const } : x.key === 'GL-18' ? { ...x, situacao: 'cancelado' as const } : x
    e.portfolio = { ...e.portfolio, experimentos: e.portfolio.experimentos.map(trocar) }
    const v = verificarConsistencia(e).verificacoes.find(x => x.id === 'concluidos')!
    expect(v).toMatchObject({ ok: false, diferenca: 0 })
    expect(v.diagnostico!.causa).toMatch(/^Os totais são iguais, mas os itens não são os mesmos/)
    expect(v.diagnostico!.diferencas.flatMap(d => d.itens.map(i => i.key)).sort()).toEqual(['GL-16', 'GL-18'])
  })

  it('aponta a causa provável pelo status em comum dos itens divergentes', () => {
    const cfg = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468', '99999']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CANCELADO', ['10015']]])
    const variante = [...iniciativas, ini('GL-7', { id: '99999', name: 'Aguardando validação do piloto' })]
    const r = verificarConsistencia({ ...entrada(variante), board2734Config: cfg })
    const v = r.verificacoes.find(x => x.id === 'coluna-aguardando')!
    expect(v.natureza).toBe('jira')
    expect(v.diagnostico!.diferencas).toEqual([expect.objectContaining({ conta: 'Coluna no Jira', naoConta: 'Semanal (regra por status)', itens: [expect.objectContaining({ key: 'GL-7' })] })])
    expect(v.diagnostico!.causa).toContain('Aguardando validação do piloto (id 99999)')
    expect(r.resumo[0]).toMatch(/divergem?\.$/)
    // O Operacional lê o nome do status e conta a iniciativa em aguardando; o Semanal não: diverge também entre telas.
    expect(r.verificacoes.filter(x => !x.ok).map(x => x.id)).toEqual(['aguardando', 'coluna-aguardando'])
    expect(r.resumo).toContain('1 divergência entre telas do app.')
    expect(r.resumo).toContain('1 divergência entre a regra do app e as colunas do Jira.')
  })

  it('quando tudo bate, a conclusão diz isso; e os alertas novos explicam os dados', () => {
    const r = verificarConsistencia(entrada())
    expect(r.resumo).toEqual([`${r.verificacoes.length} conferências, todas batem: as telas contam a mesma história, item por item.`])
    const alerta = (id: string) => r.alertas.find(a => a.id === id)
    // GL-10 tem R$ 10 mi dos R$ 33 mi (30%); GL-12, R$ 8 mi (24%).
    expect(alerta('beneficio-concentrado')).toMatchObject({ quantidade: 2, exemplos: ['GL-10 (30%)', 'GL-12 (24%)'] })
    // Sem histórico no exemplo, nenhum concluído tem a data de conclusão.
    expect(alerta('concluido-sem-data')!.quantidade).toBe(5)
  })

  it('avisa de experimentos com o mesmo nome', () => {
    const repetido = { ...epic('GL-40', 'GL-4', S.AND, 2_000_000), fields: { ...epic('GL-40', 'GL-4', S.AND, 2_000_000).fields, summary: 'gl-14' } } as unknown as JiraIssue
    const todos = [...epics, repetido]
    const data = buildDashboardData(iniciativas, todos, {}, {}, cfgIni, {}, {})
    const dataSemanal = buildDashboardData(iniciativas, todos, {}, {}, cfgIni)
    const weekly = buildWeeklyData(dataSemanal, {}, cfgExp)
    const r = verificarConsistencia({ ...entrada(), data, dataSemanal, weekly, semanal: buildSemanalData(dataSemanal, weekly, {}), portfolio: montarPortfolio(data, { iniciativa: cfgIni, experimento: cfgExp }, null) })
    expect(r.alertas.find(a => a.id === 'possiveis-duplicados')).toMatchObject({ quantidade: 2, exemplos: ['GL-14 = GL-40'] })
  })
})

