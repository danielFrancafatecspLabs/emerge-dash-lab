import type { AuthSessionRole } from './session'

// Política de acesso de todas as rotas, num único lugar. O middleware só aplica a decisão.
// Regra geral: tudo exige sessão; algumas áreas exigem papéis específicos; a role `community`
// só enxerga a experiência da Comunidade.

export type AccessDecision =
  | { type: 'allow' }
  | { type: 'unauthenticated' }
  | { type: 'forbidden'; redirectTo: string; message: string }

/** Rotas abertas sem sessão. */
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/register']

/** Imagens da pasta public/ (logo etc.), usadas também na tela de login. */
const PUBLIC_IMAGE = /^\/[\w.-]+\.(png|jpe?g|svg|webp|gif|ico)$/i

/** Únicas rotas da role community. */
const COMMUNITY_PATHS = [
  '/comunidade', '/api/community', '/api/stories', '/api/auth',
  // Future Thinking: Catálogo de Sinais e Radar OSINT são de toda a Comunidade.
  '/ft', '/api/ft', '/osint', '/osint-app', '/api/osint',
]

interface RoleRule {
  prefix: string
  roles: readonly AuthSessionRole[]
  /** Restringe a regra a alguns métodos HTTP; sem isso, vale para todos. */
  methods?: readonly string[]
}

const ADMIN: readonly AuthSessionRole[] = ['admin']
const EXECUTIVOS: readonly AuthSessionRole[] = ['admin', 'executivo']
const FINANCEIRO: readonly AuthSessionRole[] = ['admin', 'financeiro']

/** A primeira regra que casar com o caminho decide quem pode acessar. */
const ROLE_RULES: RoleRule[] = [
  { prefix: '/admin', roles: ADMIN },
  { prefix: '/api/admin', roles: ADMIN },
  { prefix: '/beneficios', roles: FINANCEIRO },
  { prefix: '/api/beneficios', roles: FINANCEIRO },
  { prefix: '/pesquisas', roles: ADMIN },
  { prefix: '/api/pesquisas', roles: ADMIN },
  { prefix: '/weekly', roles: ADMIN },
  { prefix: '/api/weekly', roles: ADMIN },
  { prefix: '/semanal', roles: ADMIN },
  // Exploração (Discovery Flow 2.0): prévia com dados ilustrativos, só admin.
  { prefix: '/exploracao', roles: ADMIN },
  { prefix: '/api/semanal', roles: ADMIN },
  // Chamadas a LLM e limpeza de cache têm custo: só para quem usa os painéis executivos.
  { prefix: '/cientista', roles: ADMIN },
  { prefix: '/api/cientista', roles: ADMIN },
  { prefix: '/api/estrategia/insights', roles: EXECUTIVOS },
  { prefix: '/api/clear-cache', roles: EXECUTIVOS },
]

export function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => matchesPath(pathname, p)) || PUBLIC_IMAGE.test(pathname)
}

/** Decide o acesso a `pathname` (já sem o basePath) para a sessão informada. */
export function decideAccess(pathname: string, method: string, session: { role: AuthSessionRole } | null): AccessDecision {
  if (isPublicPath(pathname)) return { type: 'allow' }
  if (!session) return { type: 'unauthenticated' }

  if (session.role === 'community') {
    const allowed = COMMUNITY_PATHS.some(p => matchesPath(pathname, p))
      || (matchesPath(pathname, '/api/pesquisas') && method === 'GET')
    return allowed ? { type: 'allow' } : { type: 'forbidden', redirectTo: '/comunidade', message: 'Acesso restrito à Comunidade' }
  }

  const rule = ROLE_RULES.find(r => matchesPath(pathname, r.prefix) && (!r.methods || r.methods.includes(method)))
  if (rule && !rule.roles.includes(session.role)) {
    return { type: 'forbidden', redirectTo: '/comunidade', message: rule.roles.length === 1 ? 'Acesso restrito a admin' : 'Acesso não permitido para o seu perfil' }
  }
  return { type: 'allow' }
}
