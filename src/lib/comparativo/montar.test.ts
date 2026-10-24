import { describe, expect, it } from 'vitest'
import type { ChangelogEntry } from '../jira'
import type { JiraIssue } from '../types'
import { montarComparativo } from './montar'
import { anoDeCriacao, porDimensao, principal, resumirAno, serie, variacao, type Experimento, type Indicador } from './resumo'

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
const exp = (key: string, situacao: Experimento['situacao'], beneficio: number | null, criadoEm: string | null) =>
  ({ key, nome: `Experimento ${key}`, situacao, status: '', beneficio, criadoEm, area: 'RH', lab: 'beOn Labs', diretoria: null })

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
    'GL-15': [st(T('2025-08-10'), BACKLOG, ['10015', 'Cancelado'])],
  },
  // Os Epics com a situação do Semanal (GL-12 concluiu, mas a iniciativa está no backlog: refutada).
  experimentos: [
    exp('GL-10', 'validada', 5_000_000, T('2026-01-20')),
    exp('GL-11', 'validada', 2_000_000, T('2025-02-01')),
    exp('GL-12', 'refutada', 9_000_000, T('2026-03-01')),
    { ...exp('GL-13', 'validada', 1_000_000, T('2024-06-01')), concluidoEm: T('2024-11-03') }, // sem histórico: data do mapeamento
    exp('GL-14', 'validada', null, T('2025-05-01')),       // sem histórico nem data: fora da conta
    exp('GL-15', 'cancelada', null, T('2025-07-01')),
    exp('GL-16', 'exploracao', null, null),
  ],
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

  it('benefício: os Epics de "Hipóteses validadas" do Semanal, no ano da conclusão', () => {
    const b = ind('beneficio')
    expect(b.amostras.map(a => [a.key, a.valor, a.data])).toEqual([
      ['GL-10', 5_000_000, '2026-03-20'],
      ['GL-11', 2_000_000, '2025-04-15'],
      ['GL-13', 1_000_000, '2024-11-03'], // sem histórico: usa a data de conclusão do Epic
    ])
    // Fecha com o total do Semanal: R$ 8 mi em 4 hipóteses, 1 antes de 2025 e 1 sem data.
    expect(b.conciliacao).toEqual({ total: 8_000_000, n: 4, foraDosAnos: 1, semData: 1 })
    expect(b.foraDaConta!.map(f => f.key)).toEqual(['GL-14'])
  })

  it('resultados por ano: concluídos, validadas, refutadas e cancelados pela data do evento', () => {
    const anos = (id: Indicador['id']) => ind(id).amostras.map(a => [a.key, a.data.slice(0, 4)])
    expect(anos('concluidos')).toEqual([['GL-10', '2026'], ['GL-11', '2025'], ['GL-12', '2026'], ['GL-13', '2024']])
    expect(anos('validadas')).toEqual([['GL-10', '2026'], ['GL-11', '2025'], ['GL-13', '2024']])
    expect(anos('refutadas')).toEqual([['GL-12', '2026']])
    expect(anos('cancelados')).toEqual([['GL-15', '2025']])
    expect(ind('validadas').relativoA).toBe('concluidos')
  })

  it('panorama: todos os Epics, com o ano de criação', () => {
    expect(dados.experimentos).toHaveLength(7)
    expect(dados.experimentos.map(anoDeCriacao)).toEqual([2026, 2025, 2026, 'antes', 2025, 2025, 'sem-data'])
  })

  it('lead time da Experimentação explica quem ficou fora', () => {
    const fora = ind('leadExperimentacao').foraDaConta!
    expect(fora.map(f => [f.key, f.motivo])).toEqual([['GL-12', 'Concluído sem passar por Em andamento ou Em validação no histórico']])
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

describe('etapas pelas colunas reais dos boards', () => {
  const EM_VALIDACAO_NOVO: [string, string] = ['11201', 'Em validação']
  const config = (cols: [string, string[]][]) => ({ columnConfig: { columns: cols.map(([name, ids]) => ({ name, statuses: ids.map(id => ({ id })) })) } })

  it('"Em validação" (11201) conta como experimentação até a conclusão', () => {
    const d = montarComparativo({
      iniciativas: [],
      epics: [epic('GL-20', 'GL-1', CONCLUIDO, 0)],
      iniciativaChangelogs: {},
      epicChangelogs: { 'GL-20': [st(T('2026-01-01'), BACKLOG, ANDAMENTO), st(T('2026-01-11'), ANDAMENTO, EM_VALIDACAO_NOVO), st(T('2026-01-31'), EM_VALIDACAO_NOVO, CONCLUIDO)] },
      experimentos: [],
    }, new Date('2026-10-21T15:00:00Z'))
    expect(d.indicadores.find(i => i.id === 'leadExperimentacao')!.amostras.map(a => [a.valor, a.data])).toEqual([[30, '2026-01-31']])
  })

  it('status na coluna CANCELADO do board não conta como concluído nem em andamento', () => {
    const d = montarComparativo({
      iniciativas: [],
      epics: [epic('GL-60', 'GL-1', ['10004', 'BACKLOG'], 0)],
      iniciativaChangelogs: {},
      epicChangelogs: { 'GL-60': [st(T('2026-01-01'), ['10057', 'Backlog'], ANDAMENTO)] },
      board2735Config: config([['BACKLOG', ['10057']], ['CANCELADO', ['10004']]]),
      experimentos: [],
    }, new Date('2026-10-21T15:00:00Z'))
    const exp = d.indicadores.find(i => i.id === 'leadExperimentacao')!
    expect(exp.amostras).toEqual([])
    expect(exp.emAberto).toEqual([])
  })

  it('iniciativa que já nasceu depois da Exploração (troca de status da migração) não vira lead time', () => {
    const LEGADO: [string, string] = ['12848', 'EM EXPERIMENTAÇÃO']
    const d = montarComparativo({
      iniciativas: [ini('GL-7', EXPERIMENTACAO, T('2024-03-01'))],
      epics: [],
      iniciativaChangelogs: { 'GL-7': [st(T('2026-01-15'), LEGADO, EXPERIMENTACAO)] },
      epicChangelogs: {}, experimentos: [],
    }, new Date('2026-10-21T15:00:00Z'))
    expect(d.indicadores.find(i => i.id === 'leadExploracao')!.amostras).toEqual([])
  })

  it('conta os itens sem histórico de status', () => {
    const d = montarComparativo({
      iniciativas: [ini('GL-8', BACKLOG, T('2026-01-01')), ini('GL-9', BACKLOG, T('2026-01-01'))],
      epics: [], iniciativaChangelogs: { 'GL-8': [] }, epicChangelogs: {}, experimentos: [],
    }, new Date('2026-10-21T15:00:00Z'))
    expect(d.cobertura).toEqual({ iniciativas: { total: 2, semHistorico: 1 }, epics: { total: 0, semHistorico: 0 } })
  })
})

describe('número principal dos tempos', () => {
  it('é a mediana: poucos itens muito longos não puxam o ano', () => {
    const ind: Indicador = {
      id: 'piloto', titulo: '', regra: '', unidade: 'dias', melhor: 'menor', board: 'Ideação', grupo: 'tempos', emAberto: [],
      amostras: [10, 12, 14, 400].map((valor, k) => ({ key: `GL-${k}`, nome: '', valor, data: `2026-0${k + 1}-10` })),
    }
    const r = resumirAno(ind, 2026, null)
    expect(principal(ind, r)).toBe(13)
    expect(r.media).toBe(109)
  })
})

describe('granularidade', () => {
  it('série por trimestre e por mês: quantidade, soma ou mediana de cada período', () => {
    const conc = ind('concluidos')
    const r26 = resumirAno(conc, 2026, null)
    expect(serie(conc, r26, 'trimestre').map(p => p.valor)).toEqual([1, 1, null, null]) // GL-10 em 20/03, GL-12 em 01/04
    expect(serie(ind('beneficio'), resumirAno(ind('beneficio'), 2026, null), 'mes')[2]).toEqual({ valor: 5_000_000, n: 1 })
    const exp = ind('leadExperimentacao')
    expect(serie(exp, resumirAno(exp, 2025, null), 'trimestre').map(p => p.valor)).toEqual([null, 41, null, null])
  })

  it('por área: métricas de cada ano, taxa de validação e linha "não informada" por último', () => {
    const lista: Experimento[] = [
      { ...base('A1', 'validada', 'RH'), concluidoEm: '2025-03-01', beneficio: 1_000_000 },
      { ...base('A2', 'refutada', 'RH'), concluidoEm: '2026-05-01' },
      { ...base('A3', 'validada', 'RH'), concluidoEm: '2026-06-01', beneficio: 2_000_000 },
      { ...base('A4', 'cancelada', 'Jurídico'), canceladoEm: '2026-02-01' },
      { ...base('A5', 'validada', null), concluidoEm: '2026-11-20' },   // depois do corte de 24/10
      { ...base('A6', 'andamento', 'RH') },                              // sem evento: não entra
    ]
    const { linhas, total } = porDimensao(lista, 'area', '10-24')
    expect(linhas.map(l => l.nome)).toEqual(['RH', 'Jurídico'])
    expect(linhas[0].porAno).toEqual([
      { concluidos: 1, validadas: 1, refutadas: 0, cancelados: 0, beneficio: 1_000_000, taxaValidacao: 100 },
      { concluidos: 2, validadas: 1, refutadas: 1, cancelados: 0, beneficio: 2_000_000, taxaValidacao: 50 },
    ])
    expect(total[1]).toMatchObject({ concluidos: 2, cancelados: 1 })
    expect(porDimensao(lista, 'area', null).linhas.map(l => l.nome)).toEqual(['RH', 'Jurídico', 'Área não informada'])
  })
})

function base(key: string, situacao: Experimento['situacao'], area: string | null): Experimento {
  return { key, nome: key, situacao, status: '', beneficio: null, area, lab: null, diretoria: null, criadoEm: null, concluidoEm: null, canceladoEm: null }
}
