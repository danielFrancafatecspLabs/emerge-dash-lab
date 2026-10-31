import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { decodificarFoto, emailDe, lerFoto, parseAccountChanges, removerFoto, salvarFoto, updateAccount } from './account'
import { checkLogin, hashPassword, loadUsers } from './users'

const SENHA = 'Rio-Gale-Tinta-42'
const NOVA = 'Vento-Serra-Lima-77'
const PNG = 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]).toString('base64')

describe('Meu perfil: conta', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'conta-'))
    process.env.USERS_FILE_PATH = join(dir, 'users.json')
    process.env.AVATARS_DIR = join(dir, 'avatars')
    const base = { role: 'community', laboratorio: '', avatar: '', createdAt: '2026-01-01T00:00:00.000Z', active: true }
    writeFileSync(process.env.USERS_FILE_PATH, JSON.stringify([
      { ...base, id: 'u1', username: 'ana.lima@claro.com.br', passwordHash: hashPassword(SENHA), nome: 'Ana Lima' },
      { ...base, id: 'u2', username: 'bruno', passwordHash: hashPassword(SENHA), nome: 'Bruno', email: 'bruno@claro.com.br' },
    ]))
  })
  afterEach(() => {
    delete process.env.USERS_FILE_PATH
    delete process.env.AVATARS_DIR
    rmSync(dir, { recursive: true, force: true })
  })

  it('valida os campos e restringe o laboratório às opções', () => {
    expect(parseAccountChanges({ nome: 'A' })).toHaveProperty('error')
    expect(parseAccountChanges({ email: 'x' })).toHaveProperty('error')
    expect(parseAccountChanges({ laboratorio: 'BeOn Lab' })).toHaveProperty('error')
    expect(parseAccountChanges({ laboratorio: 'Dados & IA', area: ' Rede ', email: ' Ana@Claro.com.br ' }))
      .toEqual({ value: { laboratorio: 'Dados & IA', area: 'Rede', email: 'ana@claro.com.br' } })
  })

  it('atualiza nome, e-mail, área e laboratório; o novo e-mail também serve para entrar', () => {
    const r = updateAccount('bruno', { nome: 'Bruno Costa', email: 'bruno.costa@claro.com.br', area: 'Rede', laboratorio: 'GE' })
    expect(r).toHaveProperty('user')
    expect(loadUsers().find(u => u.id === 'u2')).toMatchObject({ nome: 'Bruno Costa', email: 'bruno.costa@claro.com.br', area: 'Rede', laboratorio: 'GE', username: 'bruno' })
    expect(checkLogin('bruno.costa@claro.com.br', SENHA)).toHaveProperty('user')
    expect(checkLogin('bruno', SENHA)).toHaveProperty('user')
  })

  it('não deixa usar o e-mail de outra conta', () => {
    expect(updateAccount('bruno', { email: 'ana.lima@claro.com.br' })).toMatchObject({ status: 409 })
    expect(updateAccount('ana.lima@claro.com.br', { email: 'bruno@claro.com.br' })).toMatchObject({ status: 409 })
  })

  it('troca a senha só com a senha atual correta e uma nova senha forte', () => {
    expect(updateAccount('bruno', { senha: { atual: 'errada-errada', nova: NOVA } })).toMatchObject({ status: 403 })
    expect(updateAccount('bruno', { senha: { atual: SENHA, nova: '123' } })).toMatchObject({ status: 400 })
    expect(updateAccount('bruno', { senha: { atual: SENHA, nova: NOVA } })).toHaveProperty('user')
    expect(checkLogin('bruno', SENHA)).toBeNull()
    expect(checkLogin('bruno', NOVA)).toHaveProperty('user')
  })

  it('e-mail de contato: o informado ou o próprio usuário de acesso, quando é um e-mail', () => {
    const [ana, bruno] = loadUsers()
    expect(emailDe(ana)).toBe('ana.lima@claro.com.br')
    expect(emailDe(bruno)).toBe('bruno@claro.com.br')
    expect(emailDe({ username: 'carla' })).toBe('')
  })

  it('foto: aceita só imagens de verdade, grava, troca e remove', () => {
    expect(decodificarFoto('data:image/png;base64,PHN2Zz4=')).toHaveProperty('error') // "<svg>" disfarçado
    expect(decodificarFoto('javascript:alert(1)')).toHaveProperty('error')
    const foto = decodificarFoto(PNG)
    if ('error' in foto) throw new Error(foto.error)
    const url = salvarFoto({ id: 'u1' }, foto, 123)
    expect(url).toBe('/jira/api/community/avatar/u1?v=123')
    expect(lerFoto('u1')?.mime).toBe('image/png')
    removerFoto({ id: 'u1' })
    expect(lerFoto('u1')).toBeNull()
    expect(lerFoto('../users')).toBeNull()
  })
})
