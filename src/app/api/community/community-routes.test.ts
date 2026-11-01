import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { createAuthSession } from '@/lib/auth/session'
import * as posts from './posts/route'
import * as post from './posts/[id]/route'
import * as comments from './posts/[id]/comments/route'
import * as notifications from './notifications/route'
import * as messages from './messages/route'
import * as thread from './messages/[username]/route'
import * as me from './me/route'
import * as linksDoExperimento from './experimentos-ativos/[chave]/links/route'

let dir = ''
const ENV = ['USERS_FILE_PATH', 'POSTS_FILE_PATH', 'COMMUNITY_PROFILES_PATH', 'COMMUNITY_MESSAGES_PATH', 'CHAT_PRESENCE_PATH']

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'comunidade-'))
  process.env.AUTH_SECRET = 'test-secret'
  process.env.USERS_FILE_PATH = join(dir, 'users.json')
  process.env.POSTS_FILE_PATH = join(dir, 'posts.json')
  process.env.COMMUNITY_PROFILES_PATH = join(dir, 'profiles.json')
  process.env.COMMUNITY_MESSAGES_PATH = join(dir, 'messages.json')
  process.env.CHAT_PRESENCE_PATH = join(dir, 'presence.json')
  const user = (id: string, username: string, nome: string, role = 'community') =>
    ({ id, username, nome, role, passwordHash: 'x:y', laboratorio: 'CoE Digital', avatar: '', createdAt: '2026-01-01', active: true })
  writeFileSync(process.env.USERS_FILE_PATH, JSON.stringify([user('1', 'ana', 'Ana'), user('2', 'bia', 'Bia'), user('3', 'admin', 'Admin', 'admin')]))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  for (const k of [...ENV, 'AUTH_SECRET']) delete process.env[k]
})

async function req(username: string, url: string, method = 'GET', body?: unknown) {
  const role = username === 'admin' ? 'admin' : 'community'
  const session = await createAuthSession({ username, role }, 'test-secret')
  return new NextRequest(`http://localhost/jira/api/community${url}`, {
    method,
    headers: { cookie: `auth_session=${session}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('rotas da Comunidade', () => {
  it('recusa acesso sem sessão', async () => {
    const res = await posts.GET(new NextRequest('http://localhost/jira/api/community/posts'))
    expect(res.status).toBe(401)
  })

  it('publica, comenta, notifica e controla quem pode excluir', async () => {
    const created = await posts.POST(await req('ana', '/posts', 'POST', { kind: 'pergunta', title: 'Como medir RAG?', content: 'Quais métricas?', tags: ['ia-generativa'] }))
    expect(created.status).toBe(201)
    const { id } = await created.json()

    const comentario = await comments.POST(await req('bia', `/posts/${id}/comments`, 'POST', { content: 'Use avaliação humana cega.' }), { params: { id } })
    expect(comentario.status).toBe(201)

    const notif = await (await notifications.GET(await req('ana', '/notifications'))).json()
    expect(notif).toMatchObject({ naoLidas: 1, itens: [{ tipo: 'comentario', ator: 'bia', postTitulo: 'Como medir RAG?' }] })

    await me.PATCH(await req('ana', '/me', 'PATCH', { marcarNotificacoesVistas: true }))
    expect((await (await notifications.GET(await req('ana', '/notifications'))).json()).naoLidas).toBe(0)

    expect((await post.DELETE(await req('bia', `/posts/${id}`, 'DELETE'), { params: { id } })).status).toBe(403)
    expect((await post.DELETE(await req('admin', `/posts/${id}`, 'DELETE'), { params: { id } })).status).toBe(200)
    expect(await (await posts.GET(await req('ana', '/posts'))).json()).toEqual([])
  })

  it('troca mensagens diretas e conta as não lidas até a conversa ser aberta', async () => {
    const enviada = await thread.POST(await req('ana', '/messages/bia', 'POST', { text: 'Oi, Bia!' }), { params: { username: 'bia' } })
    expect(enviada.status).toBe(201)
    expect((await thread.POST(await req('ana', '/messages/ana', 'POST', { text: 'eu' }), { params: { username: 'ana' } })).status).toBe(404)

    expect(await (await messages.GET(await req('bia', '/messages'))).json()).toMatchObject({ naoLidas: 1, conversas: [{ com: 'ana', naoLidas: 1 }] })
    const conversa = await (await thread.GET(await req('bia', '/messages/ana'), { params: { username: 'ana' } })).json()
    expect(conversa.mensagens.map((m: { text: string }) => m.text)).toEqual(['Oi, Bia!'])
    expect((await (await messages.GET(await req('bia', '/messages'))).json()).naoLidas).toBe(0)
  })
})

describe('links da ficha e do relatório dos experimentos', () => {
  it('só admins editam; a comunidade recebe 403', async () => {
    process.env.EXPERIMENTOS_LINKS_PATH = join(dir, 'links.json')
    try {
      const params = { params: { chave: 'GL-510' } }
      expect((await linksDoExperimento.PUT(await req('ana', '/experimentos-ativos/GL-510/links', 'PUT', { ficha: 'https://a.com/f' }), params)).status).toBe(403)
      const ok = await linksDoExperimento.PUT(await req('admin', '/experimentos-ativos/GL-510/links', 'PUT', { ficha: 'https://a.com/f' }), params)
      expect(ok.status).toBe(200)
      expect(await ok.json()).toMatchObject({ ficha: 'https://a.com/f', atualizadoPor: 'Admin' })
      expect((await linksDoExperimento.PUT(await req('admin', '/x', 'PUT', { ficha: 'ftp://a' }), params)).status).toBe(400)
      expect((await linksDoExperimento.PUT(await req('admin', '/x', 'PUT', {}), { params: { chave: '../x' } })).status).toBe(400)
    } finally {
      delete process.env.EXPERIMENTOS_LINKS_PATH
    }
  })
})
