import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkLogin, decideSignup, hashPassword, loadUsers, parseSignup, requestSignup } from './users'

const SENHA = 'Rio-Gale-Tinta-42'
const pedido = { nome: 'Ana Lima', email: 'ana.lima@claro.com.br', area: 'Diretoria de Rede', motivo: '', password: SENHA }

describe('cadastro pela tela de login', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'users-'))
    process.env.USERS_FILE_PATH = join(dir, 'users.json')
    writeFileSync(process.env.USERS_FILE_PATH, JSON.stringify([{
      id: 'adm', username: 'admin.teste', passwordHash: hashPassword(SENHA), role: 'admin',
      nome: 'Admin', laboratorio: '', avatar: '', createdAt: '2026-01-01T00:00:00.000Z', active: true,
    }]))
  })

  afterEach(() => {
    delete process.env.USERS_FILE_PATH
    rmSync(dir, { recursive: true, force: true })
  })

  it('valida nome, e-mail, área e senha', () => {
    expect(parseSignup({ ...pedido, nome: 'A' })).toHaveProperty('error')
    expect(parseSignup({ ...pedido, email: 'sem-arroba' })).toHaveProperty('error')
    expect(parseSignup({ ...pedido, area: ' ' })).toHaveProperty('error')
    expect(parseSignup({ ...pedido, password: '123' })).toHaveProperty('error')
    expect(parseSignup({ ...pedido, email: ' Ana.Lima@Claro.com.br ' })).toEqual({ value: pedido })
  })

  it('cria o pedido inativo e pendente, sem acesso até a aprovação', () => {
    expect(requestSignup(pedido, 'novo')).toBe('criado')
    const user = loadUsers().find(u => u.id === 'novo')!
    expect(user).toMatchObject({ username: pedido.email, role: 'community', active: false, status: 'pendente' })
    expect(user.passwordHash).not.toContain(SENHA)
    expect(checkLogin(pedido.email, SENHA)).toEqual({ pendente: true })
    expect(checkLogin(pedido.email, 'senha-errada-99')).toBeNull()
  })

  it('não duplica nem altera um e-mail já cadastrado', () => {
    requestSignup(pedido, 'novo')
    expect(requestSignup({ ...pedido, password: 'Outra-Senha-Forte-7' }, 'outro')).toBe('existente')
    expect(loadUsers().filter(u => u.username === pedido.email)).toHaveLength(1)
    expect(checkLogin(pedido.email, SENHA)).toEqual({ pendente: true })
  })

  it('aprovação libera o login com o perfil escolhido; recusa remove o pedido', () => {
    requestSignup(pedido, 'novo')
    const aprovado = decideSignup('novo', 'aprovar', 'viewer')
    expect(aprovado).toMatchObject({ active: true, role: 'viewer' })
    expect(aprovado).not.toHaveProperty('status')
    const login = checkLogin(pedido.email, SENHA)
    expect(login && 'user' in login && login.user.role).toBe('viewer')
    expect(decideSignup('novo', 'recusar')).toBe('nao-encontrado')

    requestSignup({ ...pedido, email: 'beto@claro.com.br' }, 'b')
    expect(decideSignup('b', 'recusar')).toBe('removido')
    expect(loadUsers().some(u => u.id === 'b')).toBe(false)
  })

  it('não trata usuário desativado pelo admin como pendente', () => {
    expect(decideSignup('adm', 'aprovar')).toBe('nao-encontrado')
  })
})
