import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { createAuthSession } from '@/lib/auth/session'
import { GET, POST } from './cientista/[...path]/route'

let dir = ''
const fetchMock = vi.fn()

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cientista-'))
  process.env.AUTH_SECRET = 'test-secret'
  process.env.CIENTISTA_API_URL = 'http://cientista.test/'
  process.env.USERS_FILE_PATH = join(dir, 'users.json')
  process.env.COMMUNITY_PROFILES_PATH = join(dir, 'profiles.json')
  const user = (id: string, username: string, nome: string) =>
    ({ id, username, nome, role: 'community', passwordHash: 'x:y', laboratorio: 'CoE', avatar: '', createdAt: '2026-01-01', active: true })
  writeFileSync(process.env.USERS_FILE_PATH, JSON.stringify([user('1', 'ana', 'Ana Lima'), user('2', 'bia', 'Bia')]))
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  rmSync(dir, { recursive: true, force: true })
  for (const k of ['AUTH_SECRET', 'CIENTISTA_API_URL', 'USERS_FILE_PATH', 'COMMUNITY_PROFILES_PATH']) delete process.env[k]
})

async function req(username: string, path: string[], method = 'GET', body?: unknown) {
  const session = await createAuthSession({ username, role: 'community' }, 'test-secret')
  const request = new NextRequest(`http://localhost/jira/api/community/cientista/${path.join('/')}`, {
    method, headers: { cookie: `auth_session=${session}` }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  return (method === 'GET' ? GET : POST)(request, { params: { path } })
}

describe('proxy do Cientista', () => {
  it('cria a conversa com o nome da pessoa e só deixa a dona acessá-la', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'sess1', papel: 'solicitante' }))
    const criada = await req('ana', ['sessoes'], 'POST', { papel: 'solicitante', preferencias: { tom: 'direto', x: 1 }, nome: 'Outro' })
    expect(criada.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://cientista.test/api/sessoes')
    expect(JSON.parse(init.body)).toEqual({ nome: 'Ana Lima', papel: 'solicitante', preferencias: { tom: 'direto' } })

    expect((await req('bia', ['sessoes', 'sess1'])).status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValueOnce(new Response('data: {"type":"done"}\n\n', { headers: { 'content-type': 'text/event-stream' } }))
    const fluxo = await req('ana', ['sessoes', 'sess1', 'mensagens'], 'POST', { texto: 'oi' })
    expect(fluxo.headers.get('content-type')).toBe('text/event-stream')
    expect(await fluxo.text()).toBe('data: {"type":"done"}\n\n')
  })

  it('recusa rotas do Lab e jornadas sem conversa', async () => {
    expect((await req('ana', ['experimentos'])).status).toBe(404)
    expect((await req('ana', ['sessoes'], 'POST', { papel: 'lab' })).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('explica quando o backend não está configurado ou não responde', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const fora = await req('ana', ['papeis'])
    expect(fora.status).toBe(502)

    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'a conversa está fechada' }, { status: 409 }))
    expect(await (await req('ana', ['papeis'])).json()).toEqual({ error: 'a conversa está fechada' })

    delete process.env.CIENTISTA_API_URL
    const semConfig = await req('ana', ['papeis'])
    expect(semConfig.status).toBe(503)
  })
})
