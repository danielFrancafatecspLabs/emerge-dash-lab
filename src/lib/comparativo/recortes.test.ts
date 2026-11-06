import { describe, expect, it } from 'vitest'
import { comparacaoDoRecorte, opcoesDoRecorte } from './recortes'

const HOJE = '2026-11-05' // quinta-feira

describe('recortes do report executivo: sempre contra o período anterior equivalente', () => {
  it('últimos 12 meses contra os 12 meses antes deles, com o mesmo número de dias', () => {
    const c = comparacaoDoRecorte('ultimos12', 'ultimos12', HOJE)
    expect([c.atual.inicio, c.atual.fim, c.atual.rotulo]).toEqual(['2025-12-01', HOJE, 'dez/25 a nov/26'])
    expect([c.base.inicio, c.base.rotulo]).toEqual(['2024-12-01', 'dez/24 a nov/25'])
    expect(c.base.fim).toBe('2025-11-05')
    expect(c.atual.partes).toHaveLength(12)
  })

  it('ano até agora contra o mesmo trecho do ano anterior', () => {
    const c = comparacaoDoRecorte('ano', '2026', HOJE)
    expect([c.atual.rotulo, c.atual.inicio, c.atual.fim]).toEqual(['2026 até agora', '2026-01-01', HOJE])
    expect([c.base.inicio, c.base.fim]).toEqual(['2025-01-01', '2025-11-05'])
  })

  it('semestre contra o semestre anterior', () => {
    expect(opcoesDoRecorte('semestre', HOJE).map(o => o.id)).toEqual(['2026-S2', '2026-S1', '2025-S2', '2025-S1'])
    const c = comparacaoDoRecorte('semestre', '2026-S1', HOJE)
    expect([c.atual.inicio, c.atual.fim, c.base.inicio, c.base.fim]).toEqual(['2026-01-01', '2026-06-30', '2025-07-01', '2025-12-31'])
    expect(c.parcial).toBe(false)
  })

  it('mês: o padrão é o último mês fechado, contra o mês anterior', () => {
    const [primeiro] = opcoesDoRecorte('mes', HOJE)
    expect(primeiro.id).toBe('2026-10')
    const c = comparacaoDoRecorte('mes', primeiro.id, HOJE)
    expect([c.atual.inicio, c.atual.fim, c.base.inicio, c.base.fim]).toEqual(['2026-10-01', '2026-10-31', '2026-09-01', '2026-09-30'])
  })

  it('semana: a semana passada (seg a dom) contra a anterior', () => {
    const [primeira] = opcoesDoRecorte('semana', HOJE)
    expect(primeira.id).toBe('2026-10-26')
    const c = comparacaoDoRecorte('semana', primeira.id, HOJE)
    expect([c.atual.inicio, c.atual.fim, c.base.inicio, c.base.fim]).toEqual(['2026-10-26', '2026-11-01', '2026-10-19', '2026-10-25'])
    expect(c.atual.partes.map(p => p.rotulo)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'])
  })

  it('trimestre corrente vai até hoje e corta a base no mesmo ponto', () => {
    const c = comparacaoDoRecorte('trimestre', '2026-T4', HOJE)
    expect([c.atual.inicio, c.atual.fim, c.base.inicio, c.base.fim]).toEqual(['2026-10-01', HOJE, '2026-07-01', '2026-08-05'])
  })
})
