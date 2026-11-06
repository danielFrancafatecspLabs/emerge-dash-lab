import { describe, expect, it } from 'vitest'
import { MENSAGEM_SENHA_DESATIVADA, senhaDesativada } from './senhas-desativadas'
import { parseUserChanges } from './users'

const SENHA_DE_EXEMPLO = 'Vale-Ponte-Lago-8812'

describe('senhas desativadas', () => {
  it('uma senha comum continua valendo', () => {
    expect(senhaDesativada(SENHA_DE_EXEMPLO)).toBe(false)
    expect(senhaDesativada('')).toBe(false)
    expect(senhaDesativada(undefined)).toBe(false)
  })
  it('o cadastro aceita uma senha forte que não está desativada', () => {
    expect(MENSAGEM_SENHA_DESATIVADA).toMatch(/não pode mais ser usada/)
    expect(parseUserChanges({ username: ' ana ', role: 'community', password: SENHA_DE_EXEMPLO }, true)).toHaveProperty('value')
  })
})
