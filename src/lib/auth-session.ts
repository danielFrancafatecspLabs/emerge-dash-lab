export type AuthSessionRole = 'admin' | 'executivo' | 'viewer' | 'financeiro'

export interface AuthSession {
  username: string
  role: AuthSessionRole
  expiresAt: number
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const validRoles = new Set<AuthSessionRole>(['admin', 'executivo', 'viewer', 'financeiro'])

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage,
  )
}

export async function createAuthSession(
  user: Pick<AuthSession, 'username' | 'role'>,
  secret: string,
  now = Date.now(),
) {
  if (!secret) throw new Error('AUTH_SECRET is required')
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({
    version: 1,
    username: user.username,
    role: user.role,
    expiresAt: now + SESSION_TTL_MS,
  })))
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret, ['sign']),
    encoder.encode(payload),
  )
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyAuthSession(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<AuthSession | null> {
  if (!token || !secret) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payload, encodedSignature] = parts
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, ['verify']),
      decodeBase64Url(encodedSignature),
      encoder.encode(payload),
    )
    if (!valid) return null

    const parsed = JSON.parse(decoder.decode(decodeBase64Url(payload))) as Record<string, unknown>
    if (
      parsed.version !== 1
      || typeof parsed.username !== 'string'
      || !validRoles.has(parsed.role as AuthSessionRole)
      || typeof parsed.expiresAt !== 'number'
      || !Number.isFinite(parsed.expiresAt)
      || parsed.expiresAt <= now
    ) {
      return null
    }

    return {
      username: parsed.username,
      role: parsed.role as AuthSessionRole,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}
