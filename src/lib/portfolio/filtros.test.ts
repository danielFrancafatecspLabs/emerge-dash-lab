import { describe, expect, it } from 'vitest'
import type { DashboardData, EpicDetail, Iniciativa, JiraBoardConfiguration } from '../types'
import { colunasDoBoard, montarPortfolio, situacaoDo } from './dados'
import {
  agrupar, alternarValor, aplicarVisao, criarContexto, ESTADO_PADRAO, estadoDaQuery, estadoParaQuery, facetas, faixaPrazo, filtrar,
  formatarValor, ordenar, paraCsv, resumir, SEM_EXPERIMENTO, SEM_INICIATIVA, VISOES_PRONTAS, type EstadoPortfolio,
} from './filtros'

function epic(key: string, parentKey: string | null, extra: Partial<EpicDetail> = {}): EpicDetail {
  return {
    key, nome: `Experimento ${key}`, status: { id: '3', name: 'Em andamento' }, parentKey, tecnologia: null, sponsor: null, bo: null,
    complexidade: null, timeResponsavel: null, beneficioQuantitativo: null, beneficioQualitativo: null, dominio: null, custoEstimado: null,
    custoRealizado: null, segmento: null, portfolio: null, diretoria: null, metaCategoria: null, tipo: 'Epic', mercado: 'B2C', descricao: null,
    motivoBloqueio: null, ...extra,
  }
}

function ini(key: string, epics: EpicDetail[], extra: Partial<Iniciativa> = {}): Iniciativa {
  return {
    key, nome: `Iniciativa ${key}`, status: { id: '10004', name: 'BACKLOG' }, metaCategoria: null, epics, beneficioQuantitativo: null,
    beneficioQuantitativoTotal: 0, dominios: [], sponsors: [], segmentos: [], timeResponsavel: null, sponsor: null, criadoEm: '2025-03-01',
    descricao: null, bo: null, dominio: null, ...extra,
  }
}

const config = (nome: string, colunas: [string, string[]][]): JiraBoardConfiguration => ({
  id: 1, name: nome, type: 'kanban',
  columnConfig: { columns: colunas.map(([name, ids]) => ({ name, statuses: ids.map(id => ({ id, name })) })) },
})

const E1 = epic('GL-10', 'GL-1', { sponsor: 'Ana', timeResponsavel: 'Lab Dados', dominio: 'Varejo', beneficioQuantitativo: 12_000_000, diretoria: 'Marketing', duedate: '2026-09-01', metaCategoria: 'Receita' })
const E2 = epic('GL-11', 'GL-1', { sponsor: 'Bruno', timeResponsavel: 'Lab Dados', beneficioQuantitativo: 3_000_000, motivoBloqueio: 'Inatividade do Ponto Focal', diretoria: 'Rede' })
const E3 = epic('GL-12', 'GL-2', { status: { id: '10015', name: 'CANCELADO' }, motivoBloqueio: 'Despriorizado pelo Solicitante', timeResponsavel: 'HITSS' })
const E4 = epic('GL-13', null, { status: { id: '10004', name: 'BACKLOG' }, sponsor: 'Ana', timeResponsavel: 'HITSS', dominio: 'B2B', beneficioQuantitativo: 60_000_000 })

const DADOS = montarPortfolio(
  {
    iniciativas: [
      ini('GL-1', [E1, E2], { status: { id: '12848', name: 'EM EXPERIMENTAÇÃO' }, timeResponsavel: 'Lab Dados', metaCategoria: 'Receita' }),
      ini('GL-2', [E3], { status: { id: '10015', name: 'CANCELADO' } }),
      ini('GL-3', [], { beneficioQuantitativo: 500_000, sponsor: 'Carla', criadoEm: '2026-02-10' }),
    ],
    allEpics: [E1, E2, E3, E4],
  } as unknown as DashboardData,
  {
    iniciativa: config('P&D - Ideação', [['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['12848']], ['CANCELADO', ['10015']], ['Vazia', []]]),
    experimento: config('P&D - Experimentação', [['BACKLOG', ['10004']], ['Em andamento', ['3']]]),
  },
  'https://jira.exemplo/',
)
// Prazos relativos a um dia fixo.
DADOS.geradoEm = '2026-10-18T12:00:00.000Z'
const ctx = criarContexto(DADOS)
const estado = (e: Partial<EstadoPortfolio>): EstadoPortfolio => ({ ...ESTADO_PADRAO, ...e })

describe('montarPortfolio', () => {
  it('usa as colunas do board do Jira e põe o status sem coluna em "Fora do board"', () => {
    expect(DADOS.boards.iniciativa.colunas.map(c => c.nome)).toEqual(['BACKLOG', 'EM EXPERIMENTAÇÃO', 'CANCELADO'])
    expect(DADOS.boards.experimento.colunas.map(c => c.nome)).toEqual(['BACKLOG', 'Em andamento', 'Fora do board'])
    const cancelado = DADOS.experimentos.find(e => e.key === 'GL-12')!
    expect(ctx.colunas.get(cancelado.coluna)?.nome).toBe('Fora do board')
    expect(DADOS.jiraUrl).toBe('https://jira.exemplo')
  })

  it('soma o benefício dos experimentos na iniciativa e marca bloqueio só em item aberto', () => {
    const [gl1, gl2, gl3] = DADOS.iniciativas
    expect(gl1.beneficio).toBe(15_000_000)
    expect(gl1.experimentos).toEqual(['GL-10', 'GL-11'])
    expect(gl1.bloqueado).toBe(true)
    expect(gl1.prazo).toBe('2026-09-01')
    expect(gl2.bloqueado).toBe(false) // o motivo do experimento cancelado não é bloqueio
    expect(gl3.beneficio).toBe(500_000)
  })

  it('classifica a situação pelo status', () => {
    expect(situacaoDo({ id: '3', name: 'Em andamento' })).toBe('em-execucao')
    expect(situacaoDo({ id: '10015', name: 'CANCELADO' })).toBe('cancelado')
    expect(situacaoDo({ id: '10004', name: 'BACKLOG' })).toBe('nao-iniciado')
    expect(situacaoDo({ id: '14468', name: 'AGUARDANDO PILOTO' })).toBe('em-execucao')
    expect(situacaoDo({ id: '13562', name: 'Finalizado' })).toBe('concluido') // coluna EM ESCALA
  })

  it('sem a configuração do board, as colunas são os status', () => {
    const { colunas } = colunasDoBoard('experimento', undefined, [{ id: '10003', name: 'Concluído' }, { id: '3', name: 'Em andamento' }])
    expect(colunas.map(c => c.nome)).toEqual(['Em andamento', 'Concluído'])
  })
})

describe('filtros do Portfólio', () => {
  it('filtra iniciativas por campos dos experimentos vinculados', () => {
    const r = filtrar(DADOS.iniciativas, 'iniciativa', estado({ filtros: { diretoria: ['Rede'] } }), ctx)
    expect(r.map(i => i.key)).toEqual(['GL-1'])
    const sem = filtrar(DADOS.iniciativas, 'iniciativa', estado({ filtros: { diretoria: [SEM_EXPERIMENTO] } }), ctx)
    expect(sem.map(i => i.key)).toEqual(['GL-3'])
  })

  it('filtra experimentos pela iniciativa-mãe', () => {
    const r = filtrar(DADOS.experimentos, 'experimento', estado({ filtros: { colunaIni: ['EM EXPERIMENTAÇÃO'] } }), ctx)
    expect(r.map(e => e.key)).toEqual(['GL-10', 'GL-11'])
    const orfaos = filtrar(DADOS.experimentos, 'experimento', estado({ filtros: { colunaIni: [SEM_INICIATIVA] } }), ctx)
    expect(orfaos.map(e => e.key)).toEqual(['GL-13'])
  })

  it('combina OU dentro do campo e E entre campos, com busca sem acento', () => {
    const e = estado({ filtros: { lab: ['Lab Dados', 'HITSS'], sponsor: ['Ana'] } })
    expect(filtrar(DADOS.experimentos, 'experimento', e, ctx).map(x => x.key)).toEqual(['GL-10', 'GL-13'])
    expect(filtrar(DADOS.experimentos, 'experimento', estado({ busca: 'iniciativa gl-2' }), ctx).map(x => x.key)).toEqual(['GL-12'])
    // A busca da iniciativa encontra também os nomes dos experimentos dela.
    expect(filtrar(DADOS.iniciativas, 'iniciativa', estado({ busca: 'GL-12' }), ctx).map(x => x.key)).toEqual(['GL-2'])
  })

  it('conta as facetas considerando os outros filtros e mantém a opção marcada', () => {
    const e = estado({ filtros: { sponsor: ['Ana'], lab: ['Inexistente'] } })
    const labs = facetas(DADOS.experimentos, 'experimento', e, ctx, 'lab')
    expect(labs).toEqual([{ valor: 'HITSS', n: 1 }, { valor: 'Lab Dados', n: 1 }, { valor: 'Inexistente', n: 0 }])
    const beneficio = facetas(DADOS.experimentos, 'experimento', ESTADO_PADRAO, ctx, 'beneficio').map(f => f.valor)
    expect(beneficio).toEqual(['Acima de R$ 50 mi', 'R$ 10 a 50 mi', 'R$ 1 a 10 mi', 'Sem benefício mapeado'])
  })

  it('classifica prazos em faixas', () => {
    expect(faixaPrazo('2026-09-01', 'em-execucao', ctx.hoje)).toBe('Vencido')
    expect(faixaPrazo('2026-11-01', 'em-execucao', ctx.hoje)).toBe('Nos próximos 30 dias')
    expect(faixaPrazo('2026-09-01', 'concluido', ctx.hoje)).toBe('Encerrado')
    expect(faixaPrazo(null, 'nao-iniciado', ctx.hoje)).toBe('Sem data limite')
  })

  it('ordena, agrupa e resume', () => {
    expect(ordenar(DADOS.experimentos, 'beneficio').map(e => e.key)).toEqual(['GL-13', 'GL-10', 'GL-11', 'GL-12'])
    expect(ordenar(DADOS.experimentos, 'prazo')[0].key).toBe('GL-10')
    expect(agrupar(DADOS.experimentos, 'lab', ctx).map(g => [g.valor, g.itens.length])).toEqual([['HITSS', 2], ['Lab Dados', 2]])
    expect(resumir(DADOS.experimentos, ctx)).toEqual({
      total: 4, ativos: 3, emExecucao: 2, bloqueados: 1, beneficio: 75_000_000, relacionados: 2, concluidos: 0, validadas: 0, refutadas: 0,
    })
  })
})

describe('hipóteses validadas e refutadas', () => {
  const CONCLUIDO = { status: { id: '10019', name: 'Concluído' } }
  const EPICS = [
    epic('GL-10', 'GL-1', CONCLUIDO), // mãe aguardando piloto → validada
    epic('GL-11', 'GL-1'), // em andamento → fora da conta
    epic('GL-12', 'GL-2', CONCLUIDO), // mãe em piloto → validada
    epic('GL-13', 'GL-3', CONCLUIDO), // mãe em escala → validada
    epic('GL-14', 'GL-4', CONCLUIDO), // mãe em experimentação → refutada
    epic('GL-15', 'GL-5', { status: { id: '10015', name: 'CANCELADO' } }), // cancelado → fora da conta
    epic('GL-16', null, CONCLUIDO), // sem iniciativa-mãe → refutada
  ]
  const filhos = (k: string) => EPICS.filter(e => e.parentKey === k)
  const dados = montarPortfolio(
    {
      iniciativas: [
        ini('GL-1', filhos('GL-1'), { status: { id: '14468', name: 'AGUARDANDO PILOTO' } }),
        ini('GL-2', filhos('GL-2'), { status: { id: '14459', name: 'EM PILOTO' } }),
        ini('GL-3', filhos('GL-3'), { status: { id: '13562', name: 'Finalizado' } }),
        ini('GL-4', filhos('GL-4'), { status: { id: '14460', name: 'EM EXPERIMENTAÇÃO' } }),
        ini('GL-5', filhos('GL-5'), { status: { id: '10015', name: 'CANCELADO' } }),
        ini('GL-6', []),
      ],
      allEpics: EPICS,
    } as unknown as DashboardData,
    {
      iniciativa: config('P&D - Ideação', [
        ['BACKLOG', ['10004']], ['EM EXPERIMENTAÇÃO', ['14460']], ['AGUARDANDO PILOTO', ['14468']], ['EM PILOTO', ['14459']],
        ['EM ESCALA', ['13562']], ['CANCELADO', ['10015']],
      ]),
      experimento: config('P&D - Experimentação', [['Em andamento', ['3']]]),
    },
    null,
  )
  const c = criarContexto(dados)

  it('só conta experimentos concluídos: validada com a mãe em aguardando piloto, piloto ou escala; refutada nos demais', () => {
    const r = resumir(dados.experimentos, c)
    expect([r.concluidos, r.validadas, r.refutadas]).toEqual([5, 3, 2])
    expect(filtrar(dados.experimentos, 'experimento', estado({ filtros: { hipotese: ['Validada'] } }), c).map(e => e.key))
      .toEqual(['GL-10', 'GL-12', 'GL-13'])
    expect(facetas(dados.experimentos, 'experimento', estado({}), c, 'hipotese')).toEqual([
      { valor: 'Validada', n: 3 }, { valor: 'Refutada', n: 2 }, { valor: 'Experimento não concluído', n: 2 },
    ])
  })

  it('na visão de iniciativas, conta os experimentos concluídos das iniciativas mostradas', () => {
    const r = resumir(dados.iniciativas, c)
    expect([r.concluidos, r.validadas, r.refutadas]).toEqual([4, 3, 1])
    expect(facetas(dados.iniciativas, 'iniciativa', estado({}), c, 'hipotese')).toEqual([
      { valor: 'Validada', n: 3 }, { valor: 'Refutada', n: 1 }, { valor: 'Sem experimento concluído', n: 2 },
    ])
  })

  it('em execução não inclui escala, e o percentual ignora os cancelados', () => {
    const r = resumir(dados.iniciativas, c)
    expect([r.total, r.ativos, r.emExecucao]).toEqual([6, 5, 3])
  })
})

describe('bloqueio no portfólio', () => {
  it('a flag de impedimento bloqueia o experimento aberto e aparece na origem do bloqueio', () => {
    const flag = epic('GL-30', null, { flagged: true, sinaisBloqueio: ['Sinalizado com a flag de impedimento'] })
    const fechado = epic('GL-31', null, { status: { id: '10019', name: 'Concluído' }, flagged: true, sinaisBloqueio: ['Sinalizado com a flag de impedimento'] })
    const d = montarPortfolio({ iniciativas: [], allEpics: [flag, fechado] } as unknown as DashboardData, {}, null)
    const c = criarContexto(d)
    expect(d.experimentos.map(e => [e.key, e.bloqueado])).toEqual([['GL-30', true], ['GL-31', false]])
    expect(facetas(d.experimentos, 'experimento', estado({}), c, 'origemBloqueio')).toEqual([
      { valor: 'Flag de impedimento', n: 1 }, { valor: 'Sem bloqueio', n: 1 },
    ])
  })
})

describe('estado da visão', () => {
  it('vai e volta pela URL, ignorando o que não é válido', () => {
    let e = aplicarVisao(VISOES_PRONTAS.find(v => v.id === 'execucao')!.estado)
    e = alternarValor(e, 'sponsor', 'Ana; Bruno & Cia')
    e = { ...e, busca: 'clarinha', alternadas: ['experimento-2'], colunas: { iniciativa: null, experimento: ['nome', 'lab'] } }
    const q = estadoParaQuery(e)
    expect(estadoDaQuery(new URLSearchParams(q))).toEqual(e)
    expect(estadoDaQuery({ v: 'x', o: 'y', g: 'z', f: ['naoexiste:1', 'lab:HITSS'] })).toEqual({ ...ESTADO_PADRAO, filtros: { lab: ['HITSS'] } })
    expect(estadoParaQuery(ESTADO_PADRAO)).toBe('')
  })

  it('remove o campo ao desmarcar o último valor', () => {
    const e = alternarValor(alternarValor(ESTADO_PADRAO, 'lab', 'HITSS'), 'lab', 'HITSS')
    expect(e.filtros).toEqual({})
  })
})

describe('formatação e CSV', () => {
  it('formata valores em mi e mil', () => {
    expect(formatarValor(12_300_000)).toBe('R$ 12,3 mi')
    expect(formatarValor(850_000)).toBe('R$ 850 mil')
    expect(formatarValor(null)).toBe('—')
  })

  it('gera CSV com ponto e vírgula e aspas quando precisa', () => {
    const csv = paraCsv([DADOS.experimentos[1]], 'experimento', ctx).split('\n')
    expect(csv[0].startsWith('Nome;Iniciativa-mãe;Coluna')).toBe(true)
    expect(csv[1]).toContain('Experimento GL-11;Iniciativa GL-1;Em andamento')
    expect(csv[1]).toContain(';3000000;')
  })
})
