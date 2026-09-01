import { describe, expect, it } from 'vitest'
import { createAuthSession, verifyAuthSession } from './auth-session'

const secret = 'a-test-secret-that-is-long-enough-for-hmac'
const now = new Date('2026-08-31T18:00:00.000Z').getTime()

describe('signed auth session', () => {
  it('round-trips an integrity-protected user and role', async () => {
    const token = await createAuthSession(
      { username: 'admin@example.com', role: 'admin' },
      secret,
      now,
    )

    await expect(verifyAuthSession(token, secret, now + 1_000)).resolves.toMatchObject({
      username: 'admin@example.com',
      role: 'admin',
    })
  })

  it('rejects tampering, the wrong secret and expired sessions', async () => {
    const token = await createAuthSession(
      { username: 'viewer@example.com', role: 'viewer' },
      secret,
      now,
    )
    const [payload, signature] = token.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    const forgedPayload = Buffer.from(JSON.stringify({ ...decoded, role: 'admin' })).toString('base64url')

    await expect(verifyAuthSession(`${forgedPayload}.${signature}`, secret, now)).resolves.toBeNull()
    await expect(verifyAuthSession(token, 'wrong-secret', now)).resolves.toBeNull()
    await expect(verifyAuthSession(token, secret, now + 8 * 24 * 60 * 60 * 1_000)).resolves.toBeNull()
  })
})
