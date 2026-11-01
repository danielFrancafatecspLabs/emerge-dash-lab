import { describe, expect, it } from 'vitest'
import type { JiraIssue } from '@/lib/types'
import { experimentosAtivos, faseDoExperimento } from './experimentos-ativos'
import { resumoDoOsint } from './sinais-osint'

const epic = (key: string, status: { id: string; name: string }, extra: Record<string, unknown> = {}) =>
  ({ key, fields: { summary: `Epic ${key}`, status, issuetype: { name: 'Epic' }, ...extra } }) as unknown as JiraIssue
const ANDAMENTO = { id: '3', name: 'Em andamento' }
const VALIDACAO = { id: '10204', name: 'EM VALIDAÇÃO' }
const BACKLOG = { id: '10004', name: 'BACKLOG' }
const pai = (key: string, summary: string) => ({ parent: { key, fields: { summary, issuetype: { name: 'Iniciativa' } } } })

describe('Experimentos em andamento na Comunidade', () => {
  it('reconhece as fases pelo id ou pelo nome', () => {
    expect(faseDoExperimento(ANDAMENTO)).toBe('Em andamento')
    expect(faseDoExperimento({ name: 'Em validação' })).toBe('Em validação')
    expect(faseDoExperimento(VALIDACAO)).toBe('Em validação')
    expect(faseDoExperimento(BACKLOG)).toBeNull()
    expect(faseDoExperimento(undefined)).toBeNull()
  })

  it('uma linha por Iniciativa, só com nome e diretoria, a mais atualizada primeiro', () => {
    const iniciativas = [{ key: 'GL-400', fields: { summary: 'Evolução da Clarinha', customfield_21499: 'Diretoria Digital' } }] as unknown as JiraIssue[]
    const itens = experimentosAtivos([
      epic('GL-510', VALIDACAO, { ...pai('GL-400', 'Evolução da Clarinha'), updated: '2026-10-20T10:00:00Z' }),
      epic('GL-511', ANDAMENTO, { ...pai('GL-400', 'Evolução da Clarinha'), updated: '2026-10-25T10:00:00Z' }),
      epic('GL-275', ANDAMENTO, { ...pai('GL-366', 'Livia'), customfield_21499: { value: 'DTI' }, updated: '2026-10-22T10:00:00Z', customfield_30402: 999 }),
      epic('GL-900', ANDAMENTO, { updated: '2026-10-01T10:00:00Z' }),
      epic('GL-901', BACKLOG, pai('GL-1', 'Fora')),
    ], iniciativas)
    expect(itens).toEqual([
      { chave: 'GL-400', iniciativa: 'Evolução da Clarinha', diretoria: 'Diretoria Digital', fase: 'Em andamento', ciclos: 2, atualizadoEm: '2026-10-25T10:00:00Z', experimentos: ['GL-511', 'GL-510'] },
      { chave: 'GL-366', iniciativa: 'Livia', diretoria: 'DTI', fase: 'Em andamento', ciclos: 1, atualizadoEm: '2026-10-22T10:00:00Z', experimentos: ['GL-275'] },
      { chave: 'GL-900', iniciativa: 'Epic GL-900', diretoria: null, fase: 'Em andamento', ciclos: 1, atualizadoEm: '2026-10-01T10:00:00Z', experimentos: ['GL-900'] },
    ])
  })
})

describe('Prévia do Radar OSINT', () => {
  it('conta sinais e módulos, traz os pontos válidos e os mais recentes pela data da varredura', () => {
    const f = (id: string, coords: unknown, module = 'HAPS') => ({ id, geometry: { type: 'Point', coordinates: coords }, properties: { id, title: `T ${id}`, module, location: 'Brasil' } })
    const r = resumoDoOsint([
      f('a:2026-10-01:S1', [-46.6, -23.5]), f('a:2026-10-30:S2', [200, 10], 'Quântica'), f('a:2026-10-15:S3', null), f('a:2026-10-15:S3', null),
      { properties: { id: 'sem-titulo' } },
    ])
    expect(r.total).toBe(3)
    expect(r.modulos).toBe(2)
    expect(r.pontos).toEqual([[-46.6, -23.5]])
    expect(r.recentes.map(x => x.postId)).toEqual(['osint:a:2026-10-30:S2', 'osint:a:2026-10-15:S3', 'osint:a:2026-10-01:S1'])
  })
})

describe('Aba Experimentos ativos', () => {
  it('limpa a descrição do Jira (wiki markup e ADF)', async () => {
    const { textoDaDescricao } = await import('./experimentos-ativos')
    expect(textoDaDescricao('h2. Objetivo\nTestar *agentes* no [atendimento|https://x.com].\n* item um\n# item dois\n{code}segredo(){code}\n!print.png|thumbnail!'))
      .toBe('Objetivo\nTestar agentes no atendimento.\n• item um\n• item dois')
    expect(textoDaDescricao({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Olá' }] }, { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'um' }] }] }] }] }))
      .toBe('Olá\n\n• um')
    expect(textoDaDescricao('   ')).toBeNull()
    expect(textoDaDescricao('a'.repeat(50), 10)).toBe(`${'a'.repeat(9)}…`)
  })

  it('um card por Experimento ativo, só com os campos permitidos e os links dos admins', async () => {
    const { experimentosDetalhados } = await import('./experimentos-ativos')
    const iniciativas = [{ key: 'GL-400', fields: { summary: 'Evolução da Clarinha', customfield_21499: 'Diretoria Digital', customfield_30394: 'Assad' } }] as unknown as JiraIssue[]
    const itens = experimentosDetalhados([
      epic('GL-510', VALIDACAO, { ...pai('GL-400', 'Evolução da Clarinha'), description: 'Ciclo 2 com *voz*.', updated: '2026-10-20T10:00:00Z', created: '2026-08-01T10:00:00Z', customfield_30402: 999, customfield_30216: 123 }),
      epic('GL-900', ANDAMENTO, { customfield_30394: ' Sidney ', customfield_21499: 'DTI', updated: '2026-10-25T10:00:00Z' }),
      epic('GL-1', BACKLOG),
    ], iniciativas, { 'GL-510': { ficha: 'https://docs.ex.com/ficha' } }, s => (s.trim() === 'Assad' ? 'Rodrigo Assad' : s.trim()))
    expect(itens.map(e => e.chave)).toEqual(['GL-900', 'GL-510'])
    expect(itens[1]).toEqual({
      chave: 'GL-510', nome: 'Epic GL-510', iniciativa: 'Evolução da Clarinha', iniciativaChave: 'GL-400', descricao: 'Ciclo 2 com voz.',
      fase: 'Em validação', sponsor: 'Rodrigo Assad', diretoria: 'Diretoria Digital', criadoEm: '2026-08-01T10:00:00Z',
      atualizadoEm: '2026-10-20T10:00:00Z', links: { ficha: 'https://docs.ex.com/ficha' },
    })
    expect(itens[0]).toMatchObject({ sponsor: 'Sidney', diretoria: 'DTI', iniciativa: null, links: {} })
    expect(JSON.stringify(itens)).not.toMatch(/999|123/) // custos e benefícios não vazam
  })

  it('links: só http(s), vazio remove, e ficam guardados por chave', async () => {
    const { mkdtempSync, rmSync } = await import('fs')
    const { tmpdir } = await import('os')
    const path = await import('path')
    const dir = mkdtempSync(path.join(tmpdir(), 'exp-links-'))
    process.env.EXPERIMENTOS_LINKS_PATH = path.join(dir, 'l.json')
    try {
      const { ehChaveDeEpic, lerLinks, salvarLinks, validarLinks } = await import('./experimentos-links')
      expect(validarLinks({ ficha: 'javascript:alert(1)' })).toEqual({ erro: expect.stringContaining('ficha') })
      expect(validarLinks({ ficha: ' https://a.com/f ', relatorio: '' })).toEqual({ ficha: 'https://a.com/f', relatorio: null })
      expect(ehChaveDeEpic('GL-510')).toBe(true)
      expect(ehChaveDeEpic('../etc')).toBe(false)
      salvarLinks('GL-510', { ficha: 'https://a.com/f', relatorio: null }, 'Ana', new Date('2026-11-01T10:00:00Z'))
      expect(lerLinks()['GL-510']).toEqual({ ficha: 'https://a.com/f', atualizadoPor: 'Ana', atualizadoEm: '2026-11-01T10:00:00.000Z' })
      salvarLinks('GL-510', { ficha: null, relatorio: null }, 'Ana')
      expect(lerLinks()['GL-510']).toBeUndefined()
    } finally {
      delete process.env.EXPERIMENTOS_LINKS_PATH
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
