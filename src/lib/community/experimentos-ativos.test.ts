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
      { chave: 'GL-400', iniciativa: 'Evolução da Clarinha', diretoria: 'Diretoria Digital', fase: 'Em andamento', ciclos: 2, atualizadoEm: '2026-10-25T10:00:00Z' },
      { chave: 'GL-366', iniciativa: 'Livia', diretoria: 'DTI', fase: 'Em andamento', ciclos: 1, atualizadoEm: '2026-10-22T10:00:00Z' },
      { chave: 'GL-900', iniciativa: 'Epic GL-900', diretoria: null, fase: 'Em andamento', ciclos: 1, atualizadoEm: '2026-10-01T10:00:00Z' },
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
