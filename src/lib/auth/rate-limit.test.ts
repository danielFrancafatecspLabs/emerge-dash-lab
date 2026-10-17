import { describe, expect, it } from 'vitest'
import { FailureLimiter } from './rate-limit'

describe('FailureLimiter', () => {
  it('bloqueia depois do limite de falhas e libera ao fim da janela', () => {
    const l = new FailureLimiter(3, 60_000)
    for (let i = 0; i < 3; i++) l.registrarFalha('ip|ana', 1_000)
    expect(l.bloqueadoPor('ip|ana', 2_000)).toBe(59)
    expect(l.bloqueadoPor('ip|bia', 2_000)).toBe(0)
    expect(l.bloqueadoPor('ip|ana', 61_000)).toBe(0)
  })

  it('zera a contagem depois de um acerto', () => {
    const l = new FailureLimiter(2, 60_000)
    l.registrarFalha('k', 0)
    l.limparChave('k')
    l.registrarFalha('k', 1)
    expect(l.bloqueadoPor('k', 2)).toBe(0)
  })
})
