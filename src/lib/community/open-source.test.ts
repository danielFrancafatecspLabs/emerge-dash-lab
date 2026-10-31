import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { familiaDaLicenca, parseRepoInput, REPOS_INICIAIS, slugDoRepo } from './open-source'
import { editarRepo, loadRepos, publicarRepo, removerRepo } from './open-source-store'

const ANA = { username: 'ana', nome: 'Ana' }
const BRUNO = { username: 'bruno', nome: 'Bruno' }
const entrada = { url: 'https://github.com/ollama/ollama', resumo: 'Roda modelos de linguagem localmente.', usos: 'Rodar LLMs offline\n- Testar modelos', categoria: 'IA e agentes', licenca: 'MIT', tags: 'llm, local' }

describe('World Open Source', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'oss-'))
    process.env.OPEN_SOURCE_FILE_PATH = path.join(dir, 'open-source.json')
  })
  afterEach(() => {
    delete process.env.OPEN_SOURCE_FILE_PATH
    rmSync(dir, { recursive: true, force: true })
  })

  it('aceita só links https de forjas conhecidas e lê owner/repo', () => {
    expect(slugDoRepo('https://github.com/debpalash/VoiceStudio')).toBe('debpalash/VoiceStudio')
    expect(slugDoRepo('https://gitlab.com/a/b.git')).toBe('a/b')
    expect(slugDoRepo('http://github.com/a/b')).toBeNull()
    expect(slugDoRepo('https://evil.com/a/b')).toBeNull()
    expect(slugDoRepo('javascript:alert(1)')).toBeNull()
  })

  it('valida a publicação e normaliza listas e tags', () => {
    expect(parseRepoInput({ ...entrada, url: 'x' })).toHaveProperty('error')
    expect(parseRepoInput({ ...entrada, resumo: 'curto' })).toHaveProperty('error')
    expect(parseRepoInput({ ...entrada, usos: '' })).toHaveProperty('error')
    const ok = parseRepoInput({ ...entrada, categoria: 'inventada', licenca: 'WTFPL' })
    expect(ok).toEqual({ value: expect.objectContaining({ nome: 'ollama', usos: ['Rodar LLMs offline', 'Testar modelos'], tags: ['llm', 'local'], categoria: 'Outros', licenca: 'Outra / não informada' }) })
  })

  it('começa com VoiceStudio e Animate; publica, bloqueia duplicado, qualquer um edita, só o autor ou admin remove', () => {
    expect(loadRepos().map(r => r.nome)).toEqual(['VoiceStudio', 'Animate'])
    expect(REPOS_INICIAIS.map(r => familiaDaLicenca(r.licenca))).toEqual(['copyleft', 'permissiva'])
    const v = (parseRepoInput(entrada) as { value: Parameters<typeof publicarRepo>[0] }).value
    const repo = publicarRepo(v, ANA)
    if (typeof repo === 'string') throw new Error(repo)
    expect(publicarRepo(v, BRUNO)).toBe('duplicado')
    expect(editarRepo(repo.id, { ...v, nome: 'Ollama' }, BRUNO)).toMatchObject({ nome: 'Ollama', editadoPor: BRUNO, publicadoPor: ANA })
    expect(removerRepo(repo.id, { username: 'bruno', admin: false })).toBe('proibido')
    expect(removerRepo(repo.id, { username: 'ana', admin: false })).toBe('ok')
    expect(loadRepos()).toHaveLength(2)
  })
})
