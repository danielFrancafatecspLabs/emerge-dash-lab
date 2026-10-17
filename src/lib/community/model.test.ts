import { describe, expect, it } from 'vitest'
import {
  deriveNotifications, filterFeed, normalizePost, trendingTopics, validatePostInput,
  type CommunityPost, type FeedContext,
} from '@/lib/community/model'
import { isKnownTopic } from '@/lib/community/topics'

const NOW = Date.parse('2026-10-17T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

function post(id: string, over: Partial<CommunityPost> = {}): CommunityPost {
  return normalizePost({ id, content: `conteúdo ${id}`, createdAt: daysAgo(1), authorUsername: 'ana', authorName: 'Ana', ...over })
}

const ctx: FeedContext = { username: 'eu', interesses: ['ia'], topicosSeguidos: [], pessoasSeguidas: ['bia'], now: NOW }

describe('normalizePost', () => {
  it('completa publicações antigas e identifica a autoria pelo id do usuário', () => {
    const p = normalizePost(
      { id: 'x', authorId: 'local-6', authorName: 'Daniel França', content: 'oi', createdAt: daysAgo(0), likes: [] },
      [{ id: 'local-6', username: 'daniel_franca', nome: 'Daniel França' }],
    )
    expect(p).toMatchObject({ kind: 'discussao', authorUsername: 'daniel_franca', tags: [], comments: [], title: '' })
  })
})

describe('filterFeed', () => {
  const posts = [
    post('ia', { tags: ['ia'], createdAt: daysAgo(3) }),
    post('bia', { authorUsername: 'bia', createdAt: daysAgo(2) }),
    post('pergunta', { kind: 'pergunta', title: 'Como medir?', createdAt: daysAgo(1) }),
    post('respondida', {
      kind: 'pergunta', title: 'Já respondida', createdAt: daysAgo(4),
      comments: [{ id: 'c1', authorUsername: 'carla', authorName: 'Carla', content: 'assim', createdAt: daysAgo(3), parentId: null }],
    }),
    post('antiga', { likes: ['a', 'b', 'c'], createdAt: daysAgo(30) }),
  ]

  it('"Para você" traz primeiro interesses e pessoas seguidas, sem esconder o resto', () => {
    const { posts: out, fallback } = filterFeed(posts, 'para-voce', ctx)
    expect(fallback).toBe(false)
    expect(out.slice(0, 2).map(p => p.id)).toEqual(['bia', 'ia'])
    expect(out).toHaveLength(posts.length)
  })

  it('"Para você" avisa quando cai nas mais recentes por falta de interesses', () => {
    const r = filterFeed(posts, 'para-voce', { ...ctx, interesses: [], pessoasSeguidas: [] })
    expect(r.fallback).toBe(true)
    expect(r.posts[0].id).toBe('pergunta')
  })

  it('"Sem resposta" só mostra perguntas sem resposta de outras pessoas', () => {
    expect(filterFeed(posts, 'sem-resposta', ctx).posts.map(p => p.id)).toEqual(['pergunta'])
  })

  it('"Em alta" considera só os últimos 14 dias e publicações com engajamento', () => {
    expect(filterFeed(posts, 'em-alta', ctx).posts.map(p => p.id)).toEqual(['respondida'])
  })
})

describe('trendingTopics', () => {
  it('conta publicações e comentários recentes por tópico', () => {
    const posts = [
      post('a', { tags: ['ia', 'web3'], comments: [{ id: 'c', authorUsername: 'x', authorName: 'X', content: '.', createdAt: daysAgo(1), parentId: null }] }),
      post('b', { tags: ['ia'] }),
      post('velho', { tags: ['quantica'], createdAt: daysAgo(60) }),
    ]
    expect(trendingTopics(posts, NOW)).toEqual([{ topic: 'ia', count: 3 }, { topic: 'web3', count: 2 }])
  })
})

describe('deriveNotifications', () => {
  const minha = post('minha', {
    authorUsername: 'eu', title: 'Minha pergunta',
    comments: [
      { id: 'c1', authorUsername: 'ana', authorName: 'Ana', content: 'oi', createdAt: daysAgo(2), parentId: null },
      { id: 'c2', authorUsername: 'eu', authorName: 'Eu', content: 'valeu', createdAt: daysAgo(1.5), parentId: 'c1' },
    ],
  })
  const outra = post('outra', {
    comments: [
      { id: 'd1', authorUsername: 'eu', authorName: 'Eu', content: 'ideia', createdAt: daysAgo(2), parentId: null },
      { id: 'd2', authorUsername: 'bia', authorName: 'Bia', content: 'boa', createdAt: daysAgo(1), parentId: 'd1' },
      { id: 'd3', authorUsername: 'bia', authorName: 'Bia', content: 'solto', createdAt: daysAgo(1), parentId: null },
    ],
  })

  it('avisa sobre comentários nas minhas publicações e respostas aos meus comentários', () => {
    const itens = deriveNotifications([minha, outra], 'eu', daysAgo(1.8))
    expect(itens.map(i => [i.tipo, i.ator, i.lida])).toEqual([['resposta', 'bia', false], ['comentario', 'ana', true]])
  })

  it('respeita as preferências de notificação', () => {
    expect(deriveNotifications([minha, outra], 'eu', null, { comentarios: false, respostas: true, mensagens: true })
      .map(i => i.tipo)).toEqual(['resposta'])
  })
})

describe('validatePostInput', () => {
  it('exige título para perguntas e limpa tópicos desconhecidos', () => {
    expect(validatePostInput({ kind: 'pergunta', content: 'texto' }, isKnownTopic)).toEqual({ error: 'Dê um título para a publicação' })
    const ok = validatePostInput({ kind: 'discussao', content: ' texto ', tags: ['ia', 'inventado', 'ia'] }, isKnownTopic)
    expect(ok).toEqual({ value: { kind: 'discussao', title: '', content: 'texto', linkUrl: '', tags: ['ia'], meta: {} } })
  })

  it('recusa links que não são http(s) e guarda os campos de um sinal', () => {
    expect(validatePostInput({ content: 'x', linkUrl: 'javascript:alert(1)' }, isKnownTopic)).toEqual({ error: 'O link precisa começar com http:// ou https://' })
    const r = validatePostInput({ kind: 'sinal', title: 'Sinal', content: 'x', meta: { dimensao: 'regulatoria', horizonte: 'medio', evidencias: ' fonte ', materialTipo: 'artigo' } }, isKnownTopic)
    expect('value' in r && r.value.meta).toEqual({ dimensao: 'regulatoria', horizonte: 'medio', evidencias: 'fonte', implicacoes: '' })
  })
})

describe('parseStoryChanges', () => {
  it('valida título, imagem e link do story', async () => {
    const { parseStoryChanges } = await import('./stories')
    expect(parseStoryChanges({ title: 'Novo', imageUrl: 'javascript:alert(1)' }, true)).toHaveProperty('error')
    expect(parseStoryChanges({ title: 'Novo', imageUrl: '/img.png', linkUrl: '//evil.com' }, true)).toHaveProperty('error')
    expect(parseStoryChanges({ title: ' Novo ', imageUrl: 'https://x.com/a.png', categoria: 'evento', order: '3' }, true))
      .toEqual({ value: { title: 'Novo', imageUrl: 'https://x.com/a.png', categoria: 'evento', order: 3 } })
  })
})
