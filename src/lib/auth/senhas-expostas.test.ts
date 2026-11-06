import { describe, expect, it } from 'vitest'
import { MENSAGEM_SENHA_EXPOSTA, senhaExposta } from './senhas-expostas'
import { parseUserChanges } from './users'

const SENHA_DE_EXEMPLO = 'Vale-Ponte-Lago-8812' // ggignore

describe('senhas fora de uso', () => {
  it('uma senha comum continua valendo', () => {
    expect(senhaExposta(SENHA_DE_EXEMPLO)).toBe(false)
    expect(senhaExposta('')).toBe(false)
    expect(senhaExposta(undefined)).toBe(false)
  })
  it('o cadastro aceita uma senha forte que não está fora de uso', () => {
    expect(MENSAGEM_SENHA_EXPOSTA).toMatch(/não pode mais ser usada/)
    expect(parseUserChanges({ username: ' ana ', role: 'community', password: SENHA_DE_EXEMPLO }, true)).toHaveProperty('value')
  })
})
