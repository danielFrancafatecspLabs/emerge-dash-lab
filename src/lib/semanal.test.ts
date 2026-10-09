import { describe, expect, it } from 'vitest'
import type { DashboardData, EpicDetail, Iniciativa } from './types'
import type { WeeklyData, WeeklyExperimentoRow, WeeklyStage } from './weekly'
import { buildSemanalData, ordenarRows, percentuaisInteiros, SAMPLE_SEMANAL_DATA, type SemanalRow } from './semanal'

function epic(key: string, over: Partial<EpicDetail> = {}): EpicDetail {
  return {
    key, nome: `Epic ${key}`, status: { id: '3', name: 'Em andamento' }, parentKey: null, tecnologia: null, sponsor: 'Diretor',
    bo: 'BO', complexidade: null, timeResponsavel: 'Beon Labs', beneficioQuantitativo: null, beneficioQualitativo: null,
    dominio: 'Digital', custoEstimado: null, custoRealizado: null, segmento: null, portfolio: null, diretoria: null,
    metaCategoria: null, tipo: 'Epic', mercado: '', descricao: 'Objetivo: testar', motivoBloqueio: null, ...over,
  }
}

function iniciativa(key: string, over: Partial<Iniciativa> = {}): Iniciativa {
  return {
    key, nome: `Ini ${key}`, status: { id: '13045', name: 'Aguardando Piloto' }, metaCategoria: null, epics: [],
    beneficioQuantitativo: null, beneficioQuantitativoTotal: 0, dominios: [], sponsors: [], segmentos: [],
    timeResponsavel: 'Beon Labs', sponsor: 'Sponsor', criadoEm: null, descricao: null, bo: null, dominio: 'TI', ...over,
  }
}

const row = (key: string) => ({ key } as WeeklyExperimentoRow)
const stage = (id: string, keys: string[], quantidade = keys.length): WeeklyStage =>
  ({ id, label: id, descricao: '', quantidade, experimentos: keys.map(row) })

describe('percentuaisInteiros', () => {
  it('soma exatamente 100 usando o maior resto', () => {
    const p = percentuaisInteiros([4, 19, 39, 60, 88])
    expect(p).toEqual([2, 9, 19, 28, 42])
    expect(p.reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('retorna zeros quando não há valores', () => {
    expect(percentuaisInteiros([0, 0])).toEqual([0, 0])
  })
})

describe('ordenarRows', () => {
  it('coloca estratégicos primeiro e depois ordena por benefício potencial', () => {
    const base = { descricao: '', situacao: null, pendencia: null, lab: null, diretor: null, pontoFocal: null, area: null, previsao: null, fase: '' }
    const rows: SemanalRow[] = [
      { ...base, key: 'a', nome: 'A', beneficio: 5, estrategico: false },
      { ...base, key: 'b', nome: 'B', beneficio: null, estrategico: true },
      { ...base, key: 'c', nome: 'C', beneficio: 26, estrategico: false },
      { ...base, key: 'd', nome: 'D', beneficio: null, estrategico: false },
    ]
    expect(ordenarRows(rows).map(r => r.key)).toEqual(['b', 'c', 'a', 'd'])
  })
})

describe('buildSemanalData', () => {
  it('monta as 5 fatias somando o total e usa os campos ricos das issues', () => {
    const epics = [
      epic('GL-1', { status: { id: '10004', name: 'Backlog' }, beneficioQuantitativo: 3_600_000 }),
      epic('GL-2', { beneficioQuantitativo: 16_000_000, prioridade: 'Highest', motivoBloqueio: 'Pendente Status', duedate: '2026-10-30' }),
      epic('GL-3', { status: { id: '10015', name: 'Cancelado' } }),
      epic('GL-4', { status: { id: '10019', name: 'Concluído' } }),
      epic('GL-5', { status: { id: '10019', name: 'Concluído' } }),
    ]
    const inis = [
      iniciativa('GL-10', { beneficioQuantitativo: 2_000_000 }),
      iniciativa('GL-11', { status: { id: '14459', name: 'EM PILOTO' }, beneficioQuantitativoTotal: 254_000_000 }),
    ]
    const data = { iniciativas: inis, allEpics: epics, beneficioTotal: 300_000_000 } as unknown as DashboardData
    const weekly = {
      geradoEm: '2026-10-09T12:00:00Z', isSample: false, experimentosAprovados: epics.length,
      pendenteAnalise: stage('pendente-analise', [], 45),
      semBeneficio: { count: 3, pct: 60 }, semSponsor: { count: 1, pct: 20 },
      stages: [
        stage('backlog', ['GL-1']), stage('andamento', ['GL-2']), stage('cancelados', ['GL-3']), stage('concluidos', ['GL-4', 'GL-5']),
        stage('aguardando', ['GL-10']), stage('piloto', ['GL-11']), stage('escala', []),
      ],
    } as unknown as WeeklyData

    const out = buildSemanalData(data, weekly)
    const q = Object.fromEntries(out.resumo.fatias.map(f => [f.id, f.quantidade]))
    expect(q).toEqual({ exploracao: 1, andamento: 1, validadas: 2, refutadas: 0, cancelados: 1 })
    expect(out.resumo.totalExperimentos).toBe(5)
    expect(out.resumo.exploracao).toEqual({ oportunidades: 1, ideiasNaoAvaliadas: 45, beneficio: 3_600_000 })
    expect(out.resumo.piloto.aguardando.beneficio).toBe(2_000_000)
    expect(out.resumo.piloto.execucao.beneficio).toBe(254_000_000)

    const andamento = out.secoes.find(s => s.id === 'andamento')!.rows[0]
    expect(andamento).toMatchObject({ estrategico: true, pendencia: 'Pendente Status', previsao: '2026-10-30', descricao: 'testar' })
  })

  it('os dados de exemplo reproduzem os números do Comitê V7', () => {
    const r = SAMPLE_SEMANAL_DATA.resumo
    expect(r.totalExperimentos).toBe(210)
    expect(r.fatias.map(f => f.pct)).toEqual([2, 9, 19, 28, 42])
    expect(Math.round(r.piloto.execucao.beneficio / 1e5) / 10).toBe(266.6)
    expect(r.piloto.execucao.destaque?.nome).toBe('Integridade do Produto')
    expect(r.metricas.map(m => m.pct)).toEqual([10, 8, 75, 21])
  })
})
