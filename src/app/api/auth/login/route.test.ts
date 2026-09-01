import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/users', () => ({
  verifyCredentials: vi.fn(() => ({
    username: 'admin@example.com',
    role: 'admin',
  })),
}))

import { POST } from './route'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'server-only-test-secret'
  })

  afterEach(() => {
    delete process.env.AUTH_SECRET
  })

  it('sets only an integrity-protected session and never sends the signing key', async () => {
    const response = await POST(new Request('http://localhost/jira/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin@example.com', password: 'password' }),
    }))
    const cookies = response.headers.getSetCookie().join('\n')

    expect(response.status).toBe(200)
    expect(cookies).toContain('auth_session=')
    expect(cookies).not.toContain('auth_token=')
    expect(cookies).not.toContain('server-only-test-secret')
  })
})
