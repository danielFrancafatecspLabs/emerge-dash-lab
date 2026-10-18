import { describe, expect, it } from 'vitest'
import { SAMPLE_SEMANAL_DATA } from './semanal'
import { ateLabel, doisDigitos, fimDoArco, milhoes, montarComiteResumo, reais } from './comite-resumo'

describe('formatação do slide do Comitê', () => {
  it('escreve valores como no deck', () => {
    expect(reais(416_000_000)).toBe('R$ 416 milhões')
    expect(reais(5_600_000)).toBe('R$ 5,6 milhões')
    expect(reais(12_000_000)).toBe('R$ 12 milhões')
    expect(reais(0)).toBe('R$ 0')
    expect(milhoes(1_500_000)).toBe('1,5 milhão')
    expect(milhoes(254_000_000)).toBe('254 milhões')
    expect(doisDigitos(8)).toBe('08')
    expect(doisDigitos(210)).toBe('210')
    expect(ateLabel('2026-09-30T12:00:00.000Z')).toBe('até set/26')
  })

  it('calcula o fim do arco a partir do topo, no sentido horário', () => {
    expect(fimDoArco(9)).toBe(18_144_000)   // valores do deck original
    expect(fimDoArco(21)).toBe(20_736_000)
    expect(fimDoArco(74)).toBe(10_584_000)
    expect(fimDoArco(100)).toBe(16_199_999)
  })

  it('monta a visão a partir do resumo da Semanal', () => {
    const v = montarComiteResumo(SAMPLE_SEMANAL_DATA.resumo, '2026-10-18T10:00:00.000Z')
    const r = SAMPLE_SEMANAL_DATA.resumo
    expect(v.total).toBe(String(r.totalExperimentos))
    expect(v.fatias.map(f => f.id)).toEqual(['exploracao', 'andamento', 'validadas', 'refutadas', 'cancelados'])
    expect(v.fatias.reduce((s, f) => s + Number(f.pct.replace('%', '')), 0)).toBe(100)
    expect(v.beneficioTotal).toBe('R$ 416 milhões')
    expect(v.beneficioTotalNota).toBe(`Concedido pelas áreas de negócio para os ${r.totalExperimentos} experimentos`)
    expect(v.piloto.aguardando).toBe(`${String(r.piloto.aguardando.quantidade).padStart(2, '0')} aguardando piloto`)
    // O piloto que concentra o benefício aparece à parte e sai da soma dos demais.
    expect(v.piloto.outlier).toBe('Integridade do Produto 254 milhões')
    expect(v.piloto.execucaoBeneficio).toBe(reais(r.piloto.execucao.demais!.beneficio))
    expect(v.metricas).toHaveLength(4)
  })
})
