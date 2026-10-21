import { describe, expect, it } from 'vitest'
import type { EpicDetail, Iniciativa } from './types'
import {
  COLUNAS_GOV, entradaDeEpic, entradaDeIniciativa, GOV_LAYOUT, layoutGovernanca, montarGovernanca, OUTRAS_FRENTES,
  quebrarNome, tecnologiaGov, type ColunaGovId, type EntradaGov,
} from './semanal-governanca'

const epic = (key: string, o: Partial<EpicDetail> = {}): EpicDetail =>
  ({ key, nome: `Experimento ${key}`, status: { id: '3', name: 'Em andamento' }, dominio: 'RH', tecnologia: null, prioridade: null, ...o }) as EpicDetail
const ini = (key: string, epics: EpicDetail[], dominio: string | null = null): Iniciativa =>
  ({ key, nome: `Iniciativa ${key}`, status: { id: '12847', name: 'EM PILOTO' }, dominio, epics }) as Iniciativa

const vazio = (): Record<ColunaGovId, EntradaGov[]> => Object.fromEntries(COLUNAS_GOV.map(c => [c, []])) as unknown as Record<ColunaGovId, EntradaGov[]>

describe('tecnologiaGov', () => {
  it('sem valor conta como IA; os demais tipos pelo nome', () => {
    expect(tecnologiaGov(null)).toBe('ia')
    expect(tecnologiaGov('A.I e Analytics')).toBe('ia')
    expect(tecnologiaGov('Web 3')).toBe('web3')
    expect(tecnologiaGov('Future Network')).toBe('future')
    expect(tecnologiaGov('Outras Tecnologias')).toBe('outras')
    expect(tecnologiaGov('RPA')).toBe('outras')
  })
})

describe('entradas', () => {
  it('prioridade só com Highest e só onde a coluna pede; bloqueio pelos sinais do Epic', () => {
    expect(entradaDeEpic(epic('GL-1', { prioridade: 'Highest' }), true).item.prioridade).toBe(true)
    expect(entradaDeEpic(epic('GL-1', { prioridade: 'High' }), true).item.prioridade).toBe(false)
    expect(entradaDeEpic(epic('GL-1', { prioridade: 'Highest' }), false).item.prioridade).toBe(false)
    expect(entradaDeEpic(epic('GL-2', { flagged: true }), false).item.bloqueio).toBe(true)
  })

  it('iniciativa herda área e tecnologia dos Epics quando não tem', () => {
    const e = entradaDeIniciativa(ini('GL-9', [epic('GL-3', { dominio: 'Jurídico', tecnologia: 'Web 3' }), epic('GL-4', { dominio: 'Jurídico', tecnologia: 'Web 3' })]))
    expect(e.area).toBe('Jurídico')
    expect(e.item.tecnologia).toBe('web3')
    expect(entradaDeIniciativa(ini('GL-8', [], 'DAC')).item.tecnologia).toBe('ia')
  })
})

describe('montarGovernanca', () => {
  it('uma linha por área que mais experimenta, o resto em Outras frentes, e os totais por fase', () => {
    const c = vazio()
    const areas = ['RH', 'RH', 'RH', 'Jurídico', 'Jurídico', 'DAC', 'Técnica', 'HITSS', 'Digital', 'Canais Remotos', 'Varejo', 'Atacado', null]
    c.desenvolvimento = areas.map((a, k) => entradaDeEpic(epic(`GL-${k}`, { dominio: a, prioridade: k === 12 ? 'Highest' : null }), true))
    c.escala = [entradaDeIniciativa(ini('GL-99', [], 'RH'))]
    const g = montarGovernanca(210, c)
    expect(g.totalExperimentos).toBe(210)
    expect(g.linhas.map(l => l.area)).toEqual(['RH', 'Jurídico', 'Atacado', 'Canais Remotos', 'DAC', 'Digital', 'HITSS', OUTRAS_FRENTES])
    expect(g.linhas[0].total).toBe(4)
    // Técnica, Varejo e o item sem área vão para Outras frentes; a prioridade vem primeiro.
    expect(g.linhas[7].celulas.desenvolvimento.map(i => i.key)).toEqual(['GL-12', 'GL-10', 'GL-6'])
    expect(g.grupos.find(x => x.id === 'andamento')!.total).toBe(13)
    expect(g.grupos.find(x => x.id === 'escala')!.total).toBe(1)
  })
})

describe('layoutGovernanca', () => {
  it('nunca passa da grade: o excedente de uma célula vira "+N"', () => {
    const c = vazio()
    c.concluidos = Array.from({ length: 80 }, (_, k) => entradaDeEpic(epic(`GL-${k}`, { dominio: 'RH' }), false))
    c.exploracao = [entradaDeEpic(epic('GL-500', { dominio: 'DAC' }), false)]
    const l = layoutGovernanca(montarGovernanca(81, c))
    const ultima = l.linhas[l.linhas.length - 1]
    expect(ultima.y + ultima.h).toBeCloseTo(GOV_LAYOUT.gradeFim)
    const cel = l.linhas[0].celulas.find(x => x.coluna === 'concluidos')!
    expect(cel.itens.length + cel.mais!.n).toBe(80)
    for (const it of cel.itens) expect(it.y + GOV_LAYOUT.linhaH).toBeLessThanOrEqual(l.linhas[0].y + l.linhas[0].h + 0.01)
    expect(l.linhas[1].celulas.find(x => x.coluna === 'exploracao')!.mais).toBeNull()
  })
})

describe('quebrarNome', () => {
  it('quebra por palavra em até 2 linhas, com reticências quando não cabe', () => {
    expect(quebrarNome('Voice AI')).toEqual(['Voice AI'])
    expect(quebrarNome('Validação Inteligente de Endereços')).toEqual(['Validação', 'Inteligente…'])
    expect(quebrarNome('Desenvolvimento')).toEqual(['Desenvolvim…'])
  })
})
