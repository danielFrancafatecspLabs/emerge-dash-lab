import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { createAuthSession } from '@/lib/auth/session'

function request(cookie = '') {
  return new NextRequest('http://localhost/jira/api/pesquisas', {
    headers: cookie ? { cookie } : undefined,
  })
}

describe('research API access', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.AUTH_SECRET
  })

  it('returns 401 when the research API has no authenticated session', async () => {
    const response = await middleware(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Não autorizado' })
  })

  it('returns 403 when an authenticated non-admin requests the research API', async () => {
    const session = await createAuthSession(
      { username: 'executive@example.com', role: 'executivo' },
      'test-secret',
    )
    const response = await middleware(request(`auth_token=test-secret; auth_session=${session}; user_role=executivo`))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Acesso restrito a admin' })
  })

  it('rejects a forged admin role cookie without a signed admin session', async () => {
    const response = await middleware(request('auth_token=test-secret; user_role=admin'))

    expect(response.status).toBe(401)
  })

  it('allows an authenticated admin to request the research API', async () => {
    const session = await createAuthSession(
      { username: 'admin@example.com', role: 'admin' },
      'test-secret',
    )
    const response = await middleware(request(`auth_token=test-secret; auth_session=${session}; user_role=viewer`))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})

describe('community role access', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.AUTH_SECRET
  })

  async function communityCookie() {
    const session = await createAuthSession({ username: 'membro@example.com', role: 'community' }, 'test-secret')
    return `auth_session=${session}`
  }

  function at(path: string, cookie: string, method = 'GET') {
    return new NextRequest(`http://localhost/jira${path}`, { method, headers: { cookie } })
  }

  it('lets a community member open the community area and its APIs', async () => {
    const cookie = await communityCookie()
    for (const path of ['/comunidade', '/comunidade/trilha', '/api/community/posts', '/api/stories', '/api/auth/me', '/logobeonlabs.png']) {
      const response = await middleware(at(path, cookie))
      expect(response.headers.get('x-middleware-next'), path).toBe('1')
    }
  })

  it('redirects a community member away from executive pages', async () => {
    const response = await middleware(at('/estrategia', await communityCookie()))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/jira/comunidade')
  })

  it('does not treat lookalike prefixes as community routes', async () => {
    const response = await middleware(at('/comunidade-admin', await communityCookie()))

    expect(response.headers.get('location')).toBe('http://localhost/jira/comunidade')
  })

  it('returns 403 for non-community APIs and allows only reading the research vault', async () => {
    const cookie = await communityCookie()

    expect((await middleware(at('/api/admin/users', cookie))).status).toBe(403)
    expect((await middleware(at('/api/pesquisas', cookie))).headers.get('x-middleware-next')).toBe('1')
    expect((await middleware(at('/api/pesquisas', cookie, 'POST'))).status).toBe(403)
  })
})
