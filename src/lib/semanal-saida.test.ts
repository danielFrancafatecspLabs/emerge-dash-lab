import { describe, expect, it } from 'vitest'
import { campoSaida } from './jira'
import { juntarConectadas, montarCancelamento, separarSituacao, type SemanalRow } from './semanal'
import type { EpicDetail } from './types'
import { contarMotivosCancelamento } from './weekly'

describe('situação atual e pendência a partir do comentário do Jira', () => {
  it('separa "Sit Atual:" e "Pendência:" em qualquer ordem e grafia', () => {
    expect(separarSituacao('Sit Atual: Alinhamento com Delivery TI. Pendência: Aguardando Alocação de Delivery'))
      .toEqual({ situacao: 'Alinhamento com Delivery TI.', pendencia: 'Aguardando Alocação de Delivery' })
    expect(separarSituacao('Pendências: TBD – Priorização Diretor')).toEqual({ situacao: null, pendencia: 'TBD – Priorização Diretor' })
    expect(separarSituacao('Situação atual: Em produção\nPendência: -')).toEqual({ situacao: 'Em produção', pendencia: null })
  })
  it('sem rótulos, o comentário inteiro é a situação; vazio é nada', () => {
    expect(separarSituacao('  Sem acompanhamento   Pós-Produção ')).toEqual({ situacao: 'Sem acompanhamento Pós-Produção', pendencia: null })
    expect(separarSituacao(null)).toEqual({ situacao: null, pendencia: null })
  })
})

describe('iniciativas conectadas', () => {
  const row = (key: string, vinculos: string[] = []) => ({ key, nome: key, vinculos } as unknown as SemanalRow & { vinculos: string[] })
  it('junta as vinculadas logo depois da primeira e marca os dois lados', () => {
    const out = juntarConectadas([row('A', ['C']), row('B'), row('C'), row('D', ['X-fora-da-lista'])])
    expect(out.map(r => r.key)).toEqual(['A', 'C', 'B', 'D'])
    expect(out[0].conectadas).toEqual(['C'])
    expect(out[1].conectadas).toEqual(['A'])
    expect(out[2].conectadas).toBeUndefined()
    expect(out[3].conectadas).toBeUndefined()
    expect('vinculos' in out[0]).toBe(false)
  })
})

describe('motivos de cancelamento pelo campo Saída', () => {
  const ep = (saida: string | null, motivoBloqueio: string | null = null) => ({ key: 'GL-1', saida, motivoBloqueio } as unknown as EpicDetail)
  it('usa a Saída; cancelado sem Saída vira "Saída não preenchida"', () => {
    const r = contarMotivosCancelamento([ep('Inatividade do Ponto Focal'), ep('Inatividade do Ponto Focal'), ep(null, 'Outro'), ep('Direcionado para Outra Área')], {})
    expect(r.fonte).toBe('saida')
    expect(r.motivos).toEqual([
      { motivo: 'Inatividade do Ponto Focal', count: 2 }, { motivo: 'Direcionado para Outra Área', count: 1 }, { motivo: 'Saída não preenchida', count: 1 },
    ])
    // A linha sem Saída fica por último e fora do destaque.
    const c = montarCancelamento(r.motivos, { fonte: r.fonte, totalExperimentos: 20 })
    expect(c.motivos.at(-1)?.motivo).toBe('Saída não preenchida')
    expect(c.destaque?.motivos).toEqual(['Inatividade do Ponto Focal', 'Direcionado para Outra Área'])
    expect(c).toMatchObject({ fonte: 'saida', totalExperimentos: 20, total: 4 })
  })
  it('sem nenhuma Saída preenchida, continua no Motivo de Bloqueio', () => {
    const r = contarMotivosCancelamento([ep(null, 'Dados insuficientes'), ep(null)], {})
    expect(r.fonte).toBe('bloqueio')
    expect(r.motivos.map(m => m.motivo)).toEqual(['Dados insuficientes', 'Motivo não registrado'])
  })
  it('acha o campo "Saída" pelo nome', () => {
    expect(campoSaida([{ id: 'customfield_1', name: 'Sponsor' }, { id: 'customfield_9', name: 'Saída' }])).toBe('customfield_9')
    expect(campoSaida([{ id: 'customfield_7', name: 'Saida do Experimento' }])).toBe('customfield_7')
    expect(campoSaida([{ id: 'customfield_1', name: 'Data de saída' }])).toBeNull()
  })
})
