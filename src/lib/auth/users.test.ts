import { describe, expect, it } from 'vitest'
import { hashPassword, parseUserChanges, passwordProblem, verifyPassword } from './users'

// Senhas de exemplo só para os testes (não são credenciais de verdade).
const SENHA_FORTE = 'Rio-Gale-Tinta-42' // ggignore
const SENHA_COM_O_NOME = 'ana.lima-2026!x' // ggignore

describe('senhas', () => {
  it('recusa senhas curtas, repetitivas ou óbvias', () => {
    expect(passwordProblem('curta')).toMatch(/10 caracteres/)
    expect(passwordProblem('aaaaaaaaaaaa')).toMatch(/repetitiva/)
    expect(passwordProblem('Password2026!')).toMatch(/fácil/)
    expect(passwordProblem(SENHA_COM_O_NOME, 'ana.lima@claro.com.br')).toMatch(/nome de usuário/)
    expect(passwordProblem(SENHA_FORTE)).toBeNull()
  })

  it('confere o hash sem aceitar formato inválido', () => {
    const hash = hashPassword(SENHA_FORTE)
    expect(verifyPassword(SENHA_FORTE, hash)).toBe(true)
    expect(verifyPassword('outra-senha-123', hash)).toBe(false)
    expect(verifyPassword('x', 'sem-separador')).toBe(false)
  })
})

describe('parseUserChanges', () => {
  it('exige usuário, perfil e senha forte na criação', () => {
    expect(parseUserChanges({ username: 'ana', role: 'admin', password: '123' }, true)).toHaveProperty('error')
    expect(parseUserChanges({ username: 'ana lima', role: 'admin', password: SENHA_FORTE }, true)).toHaveProperty('error')
    expect(parseUserChanges({ username: 'ana', role: 'root', password: SENHA_FORTE }, true)).toEqual({ error: 'Perfil inválido' })
    expect(parseUserChanges({ username: ' ana ', role: 'community', password: SENHA_FORTE }, true))
      .toEqual({ value: { username: 'ana', role: 'community', password: SENHA_FORTE } })
  })

  it('na edição aceita só o que veio e recusa foto com esquema perigoso', () => {
    expect(parseUserChanges({ nome: ' Ana ', password: '' }, false)).toEqual({ value: { nome: 'Ana' } })
    expect(parseUserChanges({ avatar: 'javascript:alert(1)' }, false)).toHaveProperty('error')
  })
})
