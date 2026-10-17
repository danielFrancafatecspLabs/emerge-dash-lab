import { describe, expect, it } from 'vitest'
import { hashPassword, parseUserChanges, passwordProblem, verifyPassword } from './users'

describe('senhas', () => {
  it('recusa senhas curtas, repetitivas ou óbvias', () => {
    expect(passwordProblem('curta')).toMatch(/10 caracteres/)
    expect(passwordProblem('aaaaaaaaaaaa')).toMatch(/repetitiva/)
    expect(passwordProblem('Password2026!')).toMatch(/fácil/)
    expect(passwordProblem('ana.lima-2026!x', 'ana.lima@claro.com.br')).toMatch(/nome de usuário/)
    expect(passwordProblem('Rio-Gale-Tinta-42')).toBeNull()
  })

  it('confere o hash sem aceitar formato inválido', () => {
    const hash = hashPassword('Rio-Gale-Tinta-42')
    expect(verifyPassword('Rio-Gale-Tinta-42', hash)).toBe(true)
    expect(verifyPassword('outra-senha-123', hash)).toBe(false)
    expect(verifyPassword('x', 'sem-separador')).toBe(false)
  })
})

describe('parseUserChanges', () => {
  it('exige usuário, perfil e senha forte na criação', () => {
    expect(parseUserChanges({ username: 'ana', role: 'admin', password: '123' }, true)).toHaveProperty('error')
    expect(parseUserChanges({ username: 'ana lima', role: 'admin', password: 'Rio-Gale-Tinta-42' }, true)).toHaveProperty('error')
    expect(parseUserChanges({ username: 'ana', role: 'root', password: 'Rio-Gale-Tinta-42' }, true)).toEqual({ error: 'Perfil inválido' })
    expect(parseUserChanges({ username: ' ana ', role: 'community', password: 'Rio-Gale-Tinta-42' }, true))
      .toEqual({ value: { username: 'ana', role: 'community', password: 'Rio-Gale-Tinta-42' } })
  })

  it('na edição aceita só o que veio e recusa foto com esquema perigoso', () => {
    expect(parseUserChanges({ nome: ' Ana ', password: '' }, false)).toEqual({ value: { nome: 'Ana' } })
    expect(parseUserChanges({ avatar: 'javascript:alert(1)' }, false)).toHaveProperty('error')
  })
})
