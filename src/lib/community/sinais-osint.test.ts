import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { communityStories } from '@/components/comunidade/Stories'
import { normalizePost } from './model'
import { loadPosts } from './posts-store'
import { AUTOMACAO_SINAIS, lerSinaisOsint, postDeSinal, sincronizarSinaisOsint } from './sinais-osint'

const AGORA = new Date('2026-10-31T15:00:00Z')
const sinal = (id: string, extra: Record<string, unknown> = {}) => ({
  type: 'Feature', id,
  properties: {
    id, title: `Sinal ${id}`, date: '2026-05-26', module: 'HAPS / drones', subtheme: 'UAV backhaul', location: 'Finlândia',
    domain: 'Technological', horizon: '12 months', source_url: 'https://exemplo.org/noticia',
    Details: 'Drone com célula 5G.', Implication: 'Novo gargalo regulatório.', ...extra,
  },
})

describe('Sinais FT - beOn Labs', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'sinais-osint-'))
    process.env.POSTS_FILE_PATH = path.join(dir, 'posts.json')
    writeFileSync(process.env.POSTS_FILE_PATH, JSON.stringify([{ id: 'p1', content: 'Post de pessoa', createdAt: '2026-10-30T10:00:00Z', authorUsername: 'ana' }]))
  })
  afterEach(() => {
    delete process.env.POSTS_FILE_PATH
    rmSync(dir, { recursive: true, force: true })
  })

  it('transforma o sinal numa publicação da automação, com data da varredura, dimensão, horizonte e fonte', () => {
    const post = postDeSinal(sinal('haps:2026-10-29:S08'), AGORA)!
    expect(post).toMatchObject({
      id: 'osint:haps:2026-10-29:S08', kind: 'sinal', authorName: 'Sinais FT - beOn Labs', authorUsername: AUTOMACAO_SINAIS.username,
      title: 'Sinal haps:2026-10-29:S08', linkUrl: 'https://exemplo.org/noticia', createdAt: '2026-10-29T12:00:00.000Z',
      meta: { dimensao: 'tecnologica', horizonte: 'curto', implicacoes: 'Novo gargalo regulatório.' },
    })
    expect(post.content).toContain('Implicação: Novo gargalo regulatório.')
    expect(postDeSinal({ properties: { id: 'x' } }, AGORA)).toBeNull()
    expect(postDeSinal(sinal('m:2027-01-01:S1'), AGORA)!.createdAt).toBe(AGORA.toISOString()) // data futura vira "agora"
    expect(postDeSinal(sinal('a', { source_url: 'javascript:alert(1)', domain: 'Regulatory', horizon: 'Long-term' }), AGORA))
      .toMatchObject({ linkUrl: '', meta: { dimensao: 'regulatoria', horizonte: 'longo' } })
  })

  it('publica cada sinal uma vez só, sem mexer nas publicações das pessoas', () => {
    const sinais = [sinal('m:2026-10-29:S1'), sinal('m:2026-10-29:S2'), sinal('m:2026-10-29:S2')]
    expect(sincronizarSinaisOsint(sinais, AGORA)).toBe(2)
    expect(sincronizarSinaisOsint(sinais, AGORA)).toBe(0)
    expect(sincronizarSinaisOsint([...sinais, sinal('m:2026-10-30:S3')], AGORA)).toBe(1)
    const posts = loadPosts()
    expect(posts.map(p => p.id)).toEqual(['p1', 'osint:m:2026-10-29:S1', 'osint:m:2026-10-29:S2', 'osint:m:2026-10-30:S3'])
  })

  it('lê o export do vault e não falha sem ele', () => {
    expect(lerSinaisOsint(undefined)).toEqual([])
    expect(lerSinaisOsint(dir)).toEqual([])
    mkdirSync(path.join(dir, '_export'))
    writeFileSync(path.join(dir, '_export', 'signals.geojson'), JSON.stringify({ type: 'FeatureCollection', features: [sinal('m:2026-10-29:S1')] }))
    expect(lerSinaisOsint(dir)).toHaveLength(1)
  })

  it('cada sinal recente vira um story (até 8); pessoas continuam com um story cada', () => {
    const sinais = Array.from({ length: 10 }, (_, i) => normalizePost(postDeSinal(sinal(`m:2026-10-30:S${i}`), AGORA)!))
    const pessoas = [
      normalizePost({ id: 'a1', content: 'x', createdAt: '2026-10-30T10:00:00Z', authorUsername: 'ana', authorName: 'Ana' }),
      normalizePost({ id: 'a2', content: 'y', createdAt: '2026-10-29T10:00:00Z', authorUsername: 'ana', authorName: 'Ana' }),
    ]
    const stories = communityStories([...sinais, ...pessoas], AGORA.getTime())
    const deSinais = stories.filter(s => s.categoria === 'Sinal OSINT')
    expect(deSinais).toHaveLength(8)
    expect(deSinais.every(s => s.autor?.nome === 'Sinais FT - beOn Labs')).toBe(true)
    expect(stories.filter(s => s.autor?.username === 'ana')).toHaveLength(1)
  })
})
