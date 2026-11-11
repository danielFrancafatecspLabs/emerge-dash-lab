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

  describe('Auditor: explica cada resultado', () => {
    it('toda conferência tem pergunta, motivo, veredito e a explicação de como cada visão conta', () => {
      const r = verificarConsistencia(entrada())
      for (const v of r.verificacoes) {
        expect(v.pergunta, v.id).not.toBe('')
        expect(v.pergunta, v.id).not.toBe(v.titulo)
        expect(v.porQueImporta, v.id).not.toBe('')
        expect(v.veredito, v.id).not.toBe('')
        expect(Object.keys(v.comoConta).sort(), v.id).toEqual(Object.keys(v.valores).sort())
      }
      expect(r.verificacoes.find(v => v.id === 'total')!.veredito).toBe('Semanal, Estratégia (Tudo) e Portfólio mostram 9 experimentos, e são exatamente os mesmos.')
      expect(r.parecer).toMatchObject({ nivel: 'ok', titulo: 'As telas contam a mesma história, item por item.' })
      expect(r.telas.map(t => t.situacao)).toEqual(r.telas.map(() => 'bate'))
    })

    it('todo alerta diz por que importa e o que fazer', () => {
      const r = verificarConsistencia(entrada())
      for (const a of r.alertas) {
        expect(a.porQueImporta, a.id).not.toBe('')
        expect(a.oQueFazer.texto, a.id).not.toBe('')
        expect(a.itens.length, a.id).toBeGreaterThan(0)
      }
      // O cancelado com benefício é informativo e traz o peso: R$ 250 mi fora da conta.
      expect(r.alertas.find(a => a.id === 'cancelados-com-beneficio')).toMatchObject({ gravidade: 'informativo', impacto: 'Tem R$ 250 mi de benefício cadastrado.' })
      expect(r.alertas.find(a => a.id === 'sem-iniciativa')).toMatchObject({ gravidade: 'corrigir', oQueFazer: { onde: 'Jira' } })
    })

    it('numa divergência entre telas, diz quem destoa, quais itens, o impacto e o que fazer', () => {
      const e = entrada()
      const fora = e.portfolio.experimentos[0]
      e.portfolio = { ...e.portfolio, experimentos: e.portfolio.experimentos.slice(1) }
      const r = verificarConsistencia(e)
      const total = r.verificacoes.find(x => x.id === 'total')!
      expect(total.veredito).toBe('Portfólio destoa: mostra 8, enquanto Semanal e Estratégia (Tudo) mostram 9.')
      expect(total.destoam).toEqual(['Portfólio'])
      expect(total.explicacao![0]).toContain(`Semanal conta 1 experimento que Portfólio não conta: ${fora.key}`)
      expect(total.impacto).toContain('Afeta todos os números de experimentos')
      expect(total.acoes!.length).toBeGreaterThan(0)
      expect(r.parecer.nivel).toBe('critico')
      expect(r.telas.find(t => t.tela === 'Portfólio')).toMatchObject({ situacao: 'destoa' })
      expect(r.telas.find(t => t.tela === 'Semanal')!.situacao).not.toBe('destoa')
    })

    it('a pista da causa compara os itens divergentes com o resto e sugere a ação', () => {
      const cfg = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468', '99999']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CANCELADO', ['10015']]])
      const variante = [...iniciativas, ini('GL-7', { id: '99999', name: 'Aguardando validação do piloto' })]
      const v = verificarConsistencia({ ...entrada(variante), board2734Config: cfg }).verificacoes.find(x => x.id === 'coluna-aguardando')!
      expect(v.diagnostico!.pistas[0].texto).toBe('O item divergente está com o status Aguardando validação do piloto (id 99999). Nenhuma das outras 6 iniciativas está assim: é nesse ponto que as visões discordam.')
      expect(v.acoes).toContainEqual({ onde: 'App', texto: 'Decidir como o status Aguardando validação do piloto (id 99999) deve contar e tratá-lo do mesmo jeito em todas as telas (src/lib/hipoteses.ts).' })
      expect(v.acoes!.some(a => a.onde === 'Jira')).toBe(true)
    })

    it('quando só a coluna do Jira difere, as telas não são culpadas: "diferem do Jira"', () => {
      const cfg = config([['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468']], ['EM PILOTO', ['14459']], ['EM ESCALA', ['13562']], ['CONCLUÍDO', ['10003']], ['CANCELADO', ['10015']]])
      // "FINALIZADO" (o status antigo de Em escala) numa coluna Concluído: a regra conta como escala, a coluna não.
      const variante = [...iniciativas, ini('GL-8', { id: '10003', name: 'FINALIZADO' })]
      const r = verificarConsistencia({ ...entrada(variante), board2734Config: cfg })
      const v = r.verificacoes.find(x => x.id === 'coluna-escala')!
      expect(v.veredito).toBe('As telas mostram 2 (Semanal (regra por status) e Operacional (estágio)), mas pela coluna do board no Jira são 1.')
      expect(r.parecer).toMatchObject({ nivel: 'atencao', titulo: 'As telas batem entre si, mas a regra do app discorda do board do Jira em 1 ponto.' })
      expect(r.telas.find(t => t.tela === 'Semanal')).toMatchObject({ situacao: 'difere do Jira', destoa: 0 })
      expect(r.telas.find(t => t.tela === 'Portfólio')!.situacao).toBe('bate')
    })

    it('conta que não fecha: explica pela ficha e dá a diferença', () => {
      const e = entrada()
      // A lista do benefício ganha um cancelado: a conferência da lista deixa de fechar.
      const r = verificarConsistencia({ ...e, semanal: { ...e.semanal, resumo: { ...e.semanal.resumo, fatias: e.semanal.resumo.fatias.map(f => (f.id === 'exploracao' ? { ...f, quantidade: f.quantidade + 2 } : f)) } } })
      const v = r.verificacoes.find(x => x.id === 'fatias-semanal')!
      expect(v).toMatchObject({ ok: false, natureza: 'soma' })
      expect(v.veredito).toMatch(/diferença de 2\.$/)
      expect(v.explicacao![0]).toContain('algum experimento está em duas fatias ou em nenhuma')
      expect(v.acoes![0].onde).toBe('App')
    })
  })
})

