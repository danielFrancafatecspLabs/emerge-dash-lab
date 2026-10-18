import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/users', () => ({
  checkLogin: vi.fn(() => ({
    user: { username: 'admin@example.com', role: 'admin' },
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

describe('POST /api/auth/login — limite de tentativas', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'server-only-test-secret'
  })

  it('responde 429 depois de muitas senhas erradas para o mesmo usuário e IP', async () => {
    const users = await import('@/lib/auth/users')
    vi.mocked(users.checkLogin).mockReturnValue(null)
    const tentar = () => POST(new Request('http://localhost/jira/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.7' },
      body: JSON.stringify({ username: 'alvo@example.com', password: 'errada' }),
    }))
    const status: number[] = []
    for (let i = 0; i < 9; i++) status.push((await tentar()).status)
    expect(status.slice(0, 8).every(s => s === 401)).toBe(true)
    expect(status[8]).toBe(429)
  })
})

describe('POST /api/auth/login — cadastro pendente', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'server-only-test-secret'
  })

  it('não cria sessão e avisa que o cadastro aguarda aprovação', async () => {
    const users = await import('@/lib/auth/users')
    vi.mocked(users.checkLogin).mockReturnValue({ pendente: true })
    const response = await POST(new Request('http://localhost/jira/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.4' },
      body: JSON.stringify({ username: 'nova@example.com', password: 'senha-certa-123' }),
    }))
    expect(response.status).toBe(403)
    expect((await response.json()).pendente).toBe(true)
    expect(response.headers.getSetCookie().join('\n')).not.toContain('auth_session=')
  })
})
