import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CATEGORIAS_OSS, LICENCAS, familiaDaLicenca, parseRepoInput, REPOS_INICIAIS, slugDoRepo } from './open-source'
import { CATALOGO_BEON } from './open-source-catalogo'
import { editarRepo, loadRepos, publicarRepo, removerRepo } from './open-source-store'

const ANA = { username: 'ana', nome: 'Ana' }
const BRUNO = { username: 'bruno', nome: 'Bruno' }
const entrada = { url: 'https://github.com/ollama/ollama', resumo: 'Roda modelos de linguagem localmente.', usos: 'Rodar LLMs offline\n- Testar modelos', categoria: 'IA e agentes', licenca: 'MIT', tags: 'llm, local' }

describe('Open Source World', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'oss-'))
    process.env.OPEN_SOURCE_FILE_PATH = path.join(dir, 'open-source.json')
    process.env.OPEN_SOURCE_REMOVED_PATH = path.join(dir, 'removidos.json')
  })
  afterEach(() => {
    delete process.env.OPEN_SOURCE_FILE_PATH
    delete process.env.OPEN_SOURCE_REMOVED_PATH
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
    expect(loadRepos().slice(0, 2).map(r => r.nome)).toEqual(['VoiceStudio', 'Animate'])
    expect(loadRepos()).toHaveLength(REPOS_INICIAIS.length)
    expect(REPOS_INICIAIS.slice(0, 2).map(r => familiaDaLicenca(r.licenca))).toEqual(['copyleft', 'permissiva'])
    const v = (parseRepoInput(entrada) as { value: Parameters<typeof publicarRepo>[0] }).value
    const repo = publicarRepo(v, ANA)
    if (typeof repo === 'string') throw new Error(repo)
    expect(publicarRepo(v, BRUNO)).toBe('duplicado')
    expect(editarRepo(repo.id, { ...v, nome: 'Ollama' }, BRUNO)).toMatchObject({ nome: 'Ollama', editadoPor: BRUNO, publicadoPor: ANA })
    expect(removerRepo(repo.id, { username: 'bruno', admin: false })).toBe('proibido')
    expect(removerRepo(repo.id, { username: 'ana', admin: false })).toBe('ok')
    expect(loadRepos()).toHaveLength(REPOS_INICIAIS.length)
  })

  it('o catálogo da beOn Labs é consistente: links, licenças, categorias, datas e ids únicos', () => {
    expect(CATALOGO_BEON.length).toBeGreaterThanOrEqual(60)
    for (const r of REPOS_INICIAIS) {
      expect(slugDoRepo(r.url), r.slug).toBe(r.slug)
      expect(LICENCAS.some(l => l.id === r.licenca), `${r.slug}: ${r.licenca}`).toBe(true)
      expect((CATEGORIAS_OSS as readonly string[]).includes(r.categoria), r.slug).toBe(true)
      expect(r.resumo.length, r.slug).toBeGreaterThanOrEqual(10)
      expect(r.usos.length, r.slug).toBeGreaterThan(0)
      expect(r.comoComecar.length, r.slug).toBeGreaterThan(0)
      if (r.ultimoCommit) expect(r.ultimoCommit).toMatch(/^20\d\d-\d\d-\d\d$/)
      // A ficha precisa passar pela mesma validação de quem publica pela tela.
      expect(parseRepoInput({ ...r, usos: r.usos.join('\n'), comoComecar: r.comoComecar.join('\n'), tags: r.tags.join(',') }), r.slug).toHaveProperty('value')
    }
    expect(new Set(REPOS_INICIAIS.map(r => r.id)).size).toBe(REPOS_INICIAIS.length)
    expect(new Set(REPOS_INICIAIS.map(r => r.slug.toLowerCase())).size).toBe(REPOS_INICIAIS.length)
    expect(familiaDaLicenca('CC-BY-NC-4.0')).toBe('restrita')
    expect(familiaDaLicenca('Proprietária')).toBe('restrita')
  })

  it('com publicações já salvas, o catálogo entra no fim sem duplicar nem apagar edições; o que um admin remove não volta', () => {
    const voice = { ...REPOS_INICIAIS[0], resumo: 'Editado pela comunidade, não pode ser sobrescrito.' }
    const daComunidade = { ...REPOS_INICIAIS[1], id: 'x1', slug: 'ollama/ollama', url: 'https://github.com/ollama/ollama', nome: 'Ollama', publicadoPor: ANA }
    writeFileSync(process.env.OPEN_SOURCE_FILE_PATH!, JSON.stringify([daComunidade, voice]))
    const repos = loadRepos()
    expect(repos.slice(0, 2).map(r => r.nome)).toEqual(['Ollama', 'VoiceStudio'])
    expect(repos[1].resumo).toBe(voice.resumo)
    expect(repos).toHaveLength(REPOS_INICIAIS.length + 1)
    const alvo = repos.find(r => r.slug === CATALOGO_BEON[0].slug)!
    expect(removerRepo(alvo.id, { username: 'admin', admin: true })).toBe('ok')
    expect(loadRepos().some(r => r.slug === alvo.slug)).toBe(false)
    expect(loadRepos()).toHaveLength(REPOS_INICIAIS.length)
  })

  it('o campo de atenção é opcional, limitado e pode ser apagado na edição', () => {
    const ok = parseRepoInput({ ...entrada, atencao: '  Pesos com licença não comercial  ' }) as { value: { atencao?: string } }
    expect(ok.value.atencao).toBe('Pesos com licença não comercial')
    expect((parseRepoInput(entrada) as { value: object }).value).not.toHaveProperty('atencao')
    expect((parseRepoInput({ ...entrada, atencao: '' }) as { value: { atencao?: string } }).value.atencao).toBe('')
  })
})
