import { describe, expect, it } from 'vitest'
import { metaDaResposta } from './portfolio-classifier'

describe('classificação de metas', () => {
  it('aceita só as três metas; o resto fica sem classificação (nunca vira Receita por engano)', () => {
    expect(metaDaResposta('EBITDA')).toBe('EBITDA')
    expect(metaDaResposta(' nps ')).toBe('NPS')
    expect(metaDaResposta('Receita')).toBe('Receita')
    expect(metaDaResposta('')).toBeNull()
    expect(metaDaResposta(undefined)).toBeNull()
    expect(metaDaResposta('não sei')).toBeNull()
  })
})
