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

describe('POST /api/auth/login — cookie Secure', () => {
  beforeEach(async () => {
    process.env.AUTH_SECRET = 'server-only-test-secret'
    const users = await import('@/lib/auth/users')
    vi.mocked(users.checkLogin).mockReturnValue({ user: { username: 'admin@example.com', role: 'admin' } } as never)
  })

  const entrar = (url: string, headers: Record<string, string> = {}) => POST(new Request(url, {
    method: 'POST',
    headers: { 'x-forwarded-for': '192.0.2.10', ...headers },
    body: JSON.stringify({ username: 'admin@example.com', password: 'senha-certa-123' }),
  }))

  it('não marca Secure num servidor acessado por HTTP (o navegador descartaria o cookie)', async () => {
    const cookies = (await entrar('http://servidor:3003/jira/api/auth/login')).headers.getSetCookie().join('\n')
    expect(cookies).toContain('auth_session=')
    expect(cookies).not.toMatch(/;\s*Secure/i)
  })

  it('marca Secure quando o acesso chega por HTTPS, direto ou via proxy', async () => {
    expect((await entrar('https://servidor/jira/api/auth/login')).headers.getSetCookie().join('\n')).toMatch(/;\s*Secure/i)
    expect((await entrar('http://servidor:3003/jira/api/auth/login', { 'x-forwarded-proto': 'https' })).headers.getSetCookie().join('\n')).toMatch(/;\s*Secure/i)
  })
})
