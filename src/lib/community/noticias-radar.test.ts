import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { communityStories, experimentosStory, montarStories, pesquisaStory, radarStories } from '@/components/comunidade/Stories'
import { provocacaoDoPost } from '@/components/comunidade/panorama/dados'
import type { Noticia } from '@/lib/newsletter/edicao'
import type { ResearchVault } from '@/lib/research-vault'
import { intercalarAutomacoes, normalizePost } from './model'
import { loadPosts } from './posts-store'
import {
  AUTOMACAO_RADAR, discussaoDaNoticia, noticiasParaDiscutir, provocacaoPorModelo, sincronizarNoticiasRadar, temaDaNoticia,
} from './noticias-radar'
import { postDeSinal } from './sinais-osint'

const AGORA = new Date('2026-10-31T15:00:00Z')
const noticia = (id: string, extra: Partial<Noticia> = {}): Noticia => ({
  id, titulo: `Notícia ${id}`, link: `https://exemplo.org/${id}`, fonte: 'Fonte X', publicadoEm: '2026-10-31T09:00:00Z',
  resumo: 'Resumo da matéria.', imagem: null, secao: 'emergentes', ...extra,
})
const semLLM = async () => null

describe('beOn Radar - Newsletter no fórum', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'noticias-radar-'))
    process.env.POSTS_FILE_PATH = path.join(dir, 'posts.json')
    writeFileSync(process.env.POSTS_FILE_PATH, JSON.stringify([{ id: 'p1', content: 'Post de pessoa', createdAt: '2026-10-30T10:00:00Z', authorUsername: 'ana' }]))
  })
  afterEach(() => {
    delete process.env.POSTS_FILE_PATH
    delete process.env.RADAR_DISCUSSOES_POR_SECAO
    rmSync(dir, { recursive: true, force: true })
  })

  it('a provocação segue o tom da matéria', () => {
    expect(temaDaNoticia({ titulo: 'EU passes new AI regulation', resumo: '' })?.id).toBe('regulacao')
    expect(temaDaNoticia({ titulo: 'Layoffs hit 10,000 workers at tech giant', resumo: '' })?.id).toBe('trabalho')
    expect(temaDaNoticia({ titulo: 'Google mostra chip quântico', resumo: 'Computação quântica com correção de erros' })?.id).toBe('quantica')
    expect(temaDaNoticia({ titulo: 'Starlink amplia satélites no Brasil', resumo: '' })?.id).toBe('telecom')
    expect(temaDaNoticia({ titulo: 'Artificial intelligence startup launches assistant', resumo: '' })?.id).toBe('ia')
    // "intelligence" não é a Intel; "error correction" não é correção de mercado.
    expect(temaDaNoticia({ titulo: 'Quantum error correction milestone', resumo: '' })?.id).toBe('quantica')
    expect(provocacaoPorModelo(noticia('b', { secao: 'bolhas', titulo: 'Is the Nvidia AI rally a bubble?' }))).toMatch(/^Bolha ou fundamento\?/)
    expect(provocacaoPorModelo(noticia('m', { secao: 'mercado', titulo: 'Ações sobem', resumo: '' }))).toMatch(/precificando/)
  })

  it('a discussão traz o resumo, a provocação e as três perguntas, com a fonte no link', () => {
    const post = discussaoDaNoticia(noticia('n1', { titulo: 'New AI agents automate support' }), undefined, AGORA)
    expect(post).toMatchObject({
      id: 'radar:n1', kind: 'discussao', authorUsername: AUTOMACAO_RADAR.username, authorName: 'beOn Radar - Newsletter',
      title: 'New AI agents automate support', linkUrl: 'https://exemplo.org/n1', tags: ['agentes'], createdAt: AGORA.toISOString(),
    })
    expect(post.content).toContain('Resumo da matéria.')
    expect(post.content).toContain('O que acha disso?')
    expect(post.content).toContain('Concorda com essa leitura?')
    expect(post.content).toContain('Que implicação ou cenário')
    expect(provocacaoDoPost(post.content)).toMatch(/^Agentes assim/)
    expect(discussaoDaNoticia(noticia('x', { link: 'javascript:alert(1)' })).linkUrl).toBe('')
  })

  it('abre uma discussão por notícia, uma vez só, limitada por seção', async () => {
    const noticias = [
      noticia('a1'), noticia('a2'), noticia('a3'), noticia('a4'),
      noticia('m1', { secao: 'mercado' }),
    ]
    expect(noticiasParaDiscutir(noticias).map(n => n.id)).toEqual(['a1', 'a2', 'a3', 'm1'])
    expect(await sincronizarNoticiasRadar(noticias, AGORA, semLLM)).toBe(4)
    expect(await sincronizarNoticiasRadar(noticias, AGORA, semLLM)).toBe(0)
    const posts = loadPosts()
    expect(posts.map(p => p.id)).toEqual(['p1', 'radar:a1', 'radar:a2', 'radar:a3', 'radar:m1'])
    // A mais relevante fica com o horário mais recente (aparece primeiro no feed).
    expect(Date.parse(posts[1].createdAt)).toBeGreaterThan(Date.parse(posts[2].createdAt))
    process.env.RADAR_DISCUSSOES_POR_SECAO = '0'
    expect(await sincronizarNoticiasRadar([noticia('z')], AGORA, semLLM)).toBe(0)
  })

  it('usa a provocação do LLM quando ele responde e o modelo quando não', async () => {
    await sincronizarNoticiasRadar([noticia('l1'), noticia('l2')], AGORA, async n => (n.id === 'l1' ? 'Você deixaria um agente decidir isso sozinho?' : null))
    const [, l1, l2] = loadPosts()
    expect(provocacaoDoPost(l1.content)).toBe('Você deixaria um agente decidir isso sozinho?')
    expect(provocacaoDoPost(l2.content)).toBe(provocacaoPorModelo(noticia('l2')))
  })
})

describe('Stories sempre no ar e feed', () => {
  const pessoa = (id: string, createdAt: string, authorUsername = id) =>
    normalizePost({ id, content: `Post ${id}`, createdAt, authorUsername, authorName: authorUsername })
  const vault: ResearchVault = {
    revision: 'r', generatedAt: '2026-10-31', completedResearchCount: 2, edges: [],
    documents: [
      { id: '1', path: 'Pesquisas/IA/Agentes/Agentes.md', name: 'Agentes', title: 'Agentes autônomos', type: 'topic', category: 'IA', topic: 'Agentes', tags: ['llm'], created: '2026-09-01', updated: '2026-10-20', links: [] },
      { id: '2', path: 'Pesquisas/Redes/6G/6G.md', name: '6G', title: '6G', type: 'topic', category: 'Redes', topic: '6G', tags: [], created: '2026-08-01', updated: null, links: [] },
    ],
  }

  it('o sinal mais recente fica no ar mesmo com mais de 7 dias; discussões do Radar não viram story da comunidade', () => {
    const sinalAntigo = normalizePost(postDeSinal({ properties: { id: 'm:2026-10-01:S1', title: 'Sinal antigo' } }, AGORA)!)
    const radar = normalizePost(discussaoDaNoticia(noticia('r1'), undefined, AGORA))
    const stories = communityStories([sinalAntigo, radar, pessoa('velho', '2026-10-01T10:00:00Z')], AGORA.getTime())
    expect(stories.map(s => s.id)).toEqual(['post:osint:m:2026-10-01:S1'])
  })

  it('monta um story de cada frente: notícia (com a provocação), pesquisa, experimentos e sinal', () => {
    const radar = normalizePost(discussaoDaNoticia(noticia('r1', { titulo: 'EU passes AI regulation' }), undefined, AGORA))
    const sinal = normalizePost(postDeSinal({ properties: { id: 'm:2026-10-30:S1', title: 'Sinal novo' } }, AGORA)!)
    const stories = montarStories({
      editoriais: [], posts: [radar, sinal, pessoa('ana', '2026-10-31T10:00:00Z')],
      edicao: { numero: 1, data: '2026-10-31', geradoEm: AGORA.toISOString(), fontes: [], noticias: [noticia('r1', { titulo: 'EU passes AI regulation' }), noticia('r2')] },
      vault, experimentos: [{ chave: 'GL-1', iniciativa: 'Livia', diretoria: 'Diretoria Digital', fase: 'Em andamento', ciclos: 1, atualizadoEm: null }],
      now: AGORA.getTime(),
    })
    expect(stories.map(s => s.id)).toEqual([
      'radar:r1', 'acervo:Pesquisas/IA/Agentes/Agentes.md', 'experimentos:GL-1', 'post:osint:m:2026-10-30:S1', 'radar:r2', 'post:ana',
    ])
    expect(stories[0]).toMatchObject({ selo: 'beOn Radar', href: '/comunidade/post/radar:r1', acao: 'Entrar na discussão' })
    expect(stories[0].texto).toMatch(/^Provocação: Se uma regra assim/)
    expect(stories[4]).toMatchObject({ href: '/comunidade/newsletter', acao: 'Ler no beOn Radar' }) // sem discussão ainda
  })

  it('sem edição, fica no ar a última discussão do Radar; pesquisa e experimentos vêm dos dados', () => {
    const radar = normalizePost(discussaoDaNoticia(noticia('r1'), undefined, new Date('2026-09-01T10:00:00Z')))
    expect(radarStories(null, [radar]).map(s => s.href)).toEqual(['/comunidade/post/radar:r1'])
    expect(radarStories(null, [])).toEqual([])
    expect(pesquisaStory(vault)).toMatchObject({ titulo: 'Agentes autônomos', href: '/comunidade/pesquisas?doc=Pesquisas%2FIA%2FAgentes%2FAgentes.md' })
    expect(pesquisaStory(null)).toBeNull()
    const varios = Array.from({ length: 7 }, (_, i) => ({ chave: `GL-${i}`, iniciativa: `Ini ${i}`, diretoria: i % 2 ? 'DTI' : null, fase: 'Em andamento' as const, ciclos: 1, atualizadoEm: null }))
    const exp = experimentosStory(varios)!
    expect(exp.titulo).toBe('7 iniciativas em experimentação agora')
    expect(exp.texto.split('\n')).toEqual(['• Ini 0', '• Ini 1 (DTI)', '• Ini 2', '• Ini 3 (DTI)', '• Ini 4', '…e mais 2.'])
    expect(experimentosStory([])).toBeNull()
  })

  it('no feed, as automações entram intercaladas com as pessoas', () => {
    const r = (id: string) => ({ id, authorUsername: AUTOMACAO_RADAR.username })
    const p = (id: string) => ({ id, authorUsername: 'ana' })
    const ids = intercalarAutomacoes([r('r1'), r('r2'), p('p1'), r('r3'), p('p2'), p('p3'), p('p4')], 2).map(x => x.id)
    expect(ids).toEqual(['p1', 'p2', 'r1', 'p3', 'p4', 'r2', 'r3'])
  })
})
