import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

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
    const response = middleware(request())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Não autorizado' })
  })

  it('returns 403 when an authenticated non-admin requests the research API', async () => {
    const response = middleware(request('auth_token=test-secret; user_role=executivo'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Acesso restrito a admin' })
  })

  it('allows an authenticated admin to request the research API', () => {
    const response = middleware(request('auth_token=test-secret; user_role=admin'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
