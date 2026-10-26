import { describe, expect, it } from 'vitest'
import { oportunidadesDeExemplo } from './exemplo'
import { ETAPAS, resumirExploracao, situacao, type Oportunidade } from './modelo'

const HOJE = new Date('2026-10-26T12:00:00Z')
const dias = (n: number) => new Date(HOJE.getTime() - n * 86_400_000).toISOString()
const op = (key: string, o: Partial<Oportunidade>): Oportunidade => ({
  key, nome: key, area: 'Rede', origem: 'prospeccao', etapa: 'identificar', identificadaEm: dias(10), naEtapaDesde: dias(10), ...o,
})

describe('resumirExploracao', () => {
  it('conta a etapa de hoje, o funil cumulativo e as decisões da janela', () => {
    const lista = [
      op('A', {}),
      op('B', { etapa: 'explorar', naEtapaDesde: dias(40), beneficioEstimado: 1_000_000 }),
      // Pediram ajustes: voltou ao Refinar, mas já passou pelo Gate 1.
      op('C', { etapa: 'refinar', identificadaEm: dias(60), decisoes: [{ tipo: 'ajustar', em: dias(5) }] }),
      op('D', { etapa: 'handoff', identificadaEm: dias(50), decisoes: [{ tipo: 'aprovar', em: dias(20) }], aceitaPelaEsteira: true, origem: 'recebimento' }),
      op('E', { etapa: 'gate', identificadaEm: dias(80), decisoes: [{ tipo: 'pausar', em: dias(30) }] }),
      op('F', { etapa: 'handoff', identificadaEm: dias(150), decisoes: [{ tipo: 'aprovar', em: dias(120) }] }), // fora da janela
    ]
    const r = resumirExploracao(lista, HOJE)

    expect(r.porEtapa.identificar.quantidade).toBe(1)
    expect(r.porEtapa.explorar).toMatchObject({ quantidade: 1, paradas: 1 })
    expect(r.porEtapa.gate.quantidade).toBe(0)
    expect(r.pausadas).toBe(1)
    expect(situacao(lista[4])).toBe('pausada')

    expect(r.funil.map(f => f.quantidade)).toEqual([5, 4, 3, 1, 1])
    expect(r.decisoes).toEqual({ aprovar: 1, ajustar: 1, pausar: 1, encerrar: 0 })
    expect(r.indicadores.aprovacaoGate.atual).toBe(33)
    expect(r.indicadores.aceitasEsteira.atual).toBe(100)
    expect(r.indicadores.identificadas).toEqual({ atual: 5, anterior: 1 })
    expect(r.origem).toEqual({ prospeccao: 4, recebimento: 1 })
  })

  it('a base ilustrativa é estável e coerente: o funil só estreita e cada etapa soma as ativas', () => {
    const a = oportunidadesDeExemplo(HOJE)
    expect(oportunidadesDeExemplo(new Date('2026-10-26T20:00:00Z'))).toEqual(a)
    const r = resumirExploracao(a, HOJE)
    const q = r.funil.map(f => f.quantidade)
    expect(q.every((v, i) => i === 0 || v <= q[i - 1])).toBe(true)
    const ativas = a.filter(o => situacao(o) === 'ativa').length
    expect(ETAPAS.reduce((s, e) => s + r.porEtapa[e.id].quantidade, 0)).toBe(ativas)
  })
})
