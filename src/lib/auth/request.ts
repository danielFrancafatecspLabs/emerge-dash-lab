import type { NextRequest } from 'next/server'
import { verifyAuthSession, type AuthSessionRole } from '@/lib/auth/session'
import { loadUsers, type User } from '@/lib/auth/users'

// Quem está fazendo a requisição, conferido no cookie assinado e no cadastro de usuários.

export interface SessionUser {
  username: string
  role: AuthSessionRole
  user: User | undefined
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const session = await verifyAuthSession(request.cookies.get('auth_session')?.value, process.env.AUTH_SECRET)
  if (!session) return null
  const user = loadUsers().find(u => u.username === session.username)
  // Quem foi desativado perde o acesso na hora, mesmo com um cookie ainda válido.
  if (user && !user.active) return null
  // O papel vale o que está no cadastro: uma mudança feita no Admin tem efeito imediato.
  return { username: session.username, role: user?.role ?? session.role, user }
}

/** Admin conferido no cadastro (não só no cookie). */
export async function getAdmin(request: NextRequest): Promise<SessionUser | null> {
  const me = await getSessionUser(request)
  return me && me.user && me.role === 'admin' ? me : null
}

/** IP de origem informado pelo proxy, usado como chave dos limites de tentativa. */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}
