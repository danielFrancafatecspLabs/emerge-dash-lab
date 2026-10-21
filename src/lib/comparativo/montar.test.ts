import { describe, expect, it } from 'vitest'
import type { ChangelogEntry } from '../jira'
import type { JiraIssue } from '../types'
import { montarComparativo } from './montar'
import { principal, resumirAno, variacao, type Indicador } from './resumo'

const ini = (key: string, status: [string, string], created: string): JiraIssue =>
  ({ key, fields: { summary: `Iniciativa ${key}`, status: { id: status[0], name: status[1] }, issuetype: { name: 'Iniciativa' }, created } }) as JiraIssue
const epic = (key: string, parent: string, status: [string, string], beneficio: number): JiraIssue =>
  ({ key, fields: { summary: `Experimento ${key}`, status: { id: status[0], name: status[1] }, issuetype: { name: 'Epic' }, parent: { key: parent }, customfield_30216: beneficio } }) as unknown as JiraIssue

/** Transição de status como a API devolve (com os ids em from/to). */
const st = (created: string, from: [string, string] | null, to: [string, string]): ChangelogEntry => ({
  created,
  items: [{ field: 'status', fieldId: 'status', fromString: from?.[1] ?? null, toString: to[1], from: from?.[0], to: to[0] } as ChangelogEntry['items'][number]],
})
const bloqueio = (created: string, de: string | null, para: string | null): ChangelogEntry => ({
  created, items: [{ field: 'Motivo de Bloqueio', fieldId: 'customfield_13406', fromString: de, toString: para }],
})

const BACKLOG: [string, string] = ['10004', 'BACKLOG']
const REFINAMENTO: [string, string] = ['10139', 'EM REFINAMENTO']
const EXPERIMENTACAO: [string, string] = ['14460', 'Em experimentação']
const AGUARDANDO: [string, string] = ['14468', 'Aguardando Piloto']
const PILOTO: [string, string] = ['14459', 'EM PILOTO']
const ESCALA: [string, string] = ['13562', 'Finalizado'] // coluna EM ESCALA
const ANDAMENTO: [string, string] = ['3', 'Em andamento']
const VALIDACAO: [string, string] = ['10204', 'EM VALIDAÇÃO']
const CONCLUIDO: [string, string] = ['10019', 'Concluído']

const T = (d: string) => `${d}T12:00:00.000-0300`

const dados = montarComparativo({
  iniciativas: [
    ini('GL-1', PILOTO, T('2025-01-10')),
    ini('GL-2', ESCALA, T('2026-01-05')),
    ini('GL-3', BACKLOG, T('2026-09-01')),
  ],
  epics: [
    epic('GL-10', 'GL-2', CONCLUIDO, 5_000_000),
    epic('GL-11', 'GL-1', CONCLUIDO, 2_000_000),
    epic('GL-12', 'GL-3', CONCLUIDO, 9_000_000), // iniciativa no backlog: hipótese refutada
  ],
  iniciativaChangelogs: {
    'GL-1': [
      st(T('2025-02-01'), BACKLOG, REFINAMENTO),
      st(T('2025-03-02'), REFINAMENTO, EXPERIMENTACAO),
      st(T('2025-05-01'), EXPERIMENTACAO, AGUARDANDO),
      st(T('2025-06-01'), AGUARDANDO, PILOTO),
    ],
    'GL-2': [
      st(T('2026-02-04'), BACKLOG, EXPERIMENTACAO),
      st(T('2026-03-01'), EXPERIMENTACAO, AGUARDANDO),
      st(T('2026-03-11'), AGUARDANDO, PILOTO),
      st(T('2026-05-10'), PILOTO, ESCALA),
    ],
  },
  epicChangelogs: {
    'GL-10': [
      st(T('2026-02-10'), BACKLOG, ANDAMENTO),
      bloqueio(T('2026-02-15'), null, 'Aguardando dados'),
      bloqueio(T('2026-02-20'), 'Aguardando dados', null),
      st(T('2026-03-01'), ANDAMENTO, VALIDACAO),
      st(T('2026-03-20'), VALIDACAO, CONCLUIDO),
    ],
    'GL-11': [
      st(T('2025-03-05'), BACKLOG, ANDAMENTO),
      st(T('2025-04-15'), ANDAMENTO, CONCLUIDO),
    ],
    'GL-12': [st(T('2026-04-01'), ANDAMENTO, CONCLUIDO)],
  },
}, new Date('2026-10-21T15:00:00Z'), 'https://jira.exemplo/')

const ind = (id: Indicador['id']) => dados.indicadores.find(i => i.id === id)!

describe('montarComparativo', () => {
  it('lead time da Exploração: da criação na Ideação até entrar em Experimentação', () => {
    const i = ind('leadExploracao')
    expect(i.amostras.map(a => [a.key, a.valor, a.data])).toEqual([['GL-1', 51, '2025-03-02'], ['GL-2', 30, '2026-02-04']])
    expect(i.emAberto.map(e => e.key)).toEqual(['GL-3'])
  })

  it('lead time da Experimentação: Em andamento + Em validação, sem os dias bloqueados', () => {
    expect(ind('leadExperimentacao').amostras.map(a => [a.key, a.valor, a.data])).toEqual([
      ['GL-10', 33, '2026-03-20'], // 38 dias − 5 bloqueados
      ['GL-11', 41, '2025-04-15'],
    ])
  })

  it('benefício: só hipóteses validadas, no ano da validação', () => {
    expect(ind('beneficio').amostras.map(a => [a.key, a.valor, a.data])).toEqual([
      ['GL-10', 5_000_000, '2026-03-20'], // concluiu depois de a iniciativa entrar em Aguardando piloto
      ['GL-11', 2_000_000, '2025-05-01'], // a iniciativa entrou em Aguardando piloto depois da conclusão
    ])
  })

  it('cycle time de Aguardando piloto e de Piloto, com o que ainda está na etapa à parte', () => {
    expect(ind('aguardandoPiloto').amostras.map(a => [a.key, a.valor, a.data])).toEqual([['GL-1', 31, '2025-06-01'], ['GL-2', 10, '2026-03-11']])
    const piloto = ind('piloto')
    expect(piloto.amostras.map(a => [a.key, a.valor, a.data])).toEqual([['GL-2', 60, '2026-05-10']])
    expect(piloto.emAberto.map(e => e.key)).toEqual(['GL-1'])
    expect(dados.hoje).toBe('2026-10-21')
    expect(dados.jiraUrl).toBe('https://jira.exemplo')
  })
})

describe('resumirAno e variacao', () => {
  it('agrega por ano e mês, com corte no mesmo dia do ano', () => {
    const exp = ind('leadExperimentacao')
    expect(resumirAno(exp, 2026, null)).toMatchObject({ n: 1, media: 33, mediana: 33 })
    expect(resumirAno(exp, 2026, '03-15').n).toBe(0)
    const b = ind('beneficio')
    const r25 = resumirAno(b, 2025, null), r26 = resumirAno(b, 2026, null)
    expect(r26.porMes[2]).toBe(5_000_000)
    expect(principal(b, r25)).toBe(2_000_000)
    expect(variacao(b, principal(b, r25), principal(b, r26))).toEqual({ pct: 150, diferenca: 3_000_000, melhorou: true })
    expect(variacao(exp, 41, 33)).toEqual({ pct: -20, diferenca: -8, melhorou: true })
    expect(variacao(exp, null, 33)).toBeNull()
  })
})
