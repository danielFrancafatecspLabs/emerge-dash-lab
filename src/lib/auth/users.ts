import { existsSync } from 'fs'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { AUTH_ROLES, type AuthSessionRole } from '@/lib/auth/session'
import { isSafeLink } from '@/lib/validation/url'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: AuthSessionRole
  nome: string
  laboratorio: string
  avatar: string
  createdAt: string
  active: boolean
}

export interface UserPublic {
  id: string
  username: string
  role: AuthSessionRole
  nome: string
  laboratorio: string
  avatar: string
  createdAt: string
  active: boolean
}

function getUsersFilePath(): string {
  return jsonStorePath('USERS_FILE_PATH', 'users.json')
}

export const MIN_PASSWORD_LENGTH = 10

/** Regra mínima para senhas definidas no Admin: tamanho e nada trivial. */
export function passwordProblem(password: unknown, username = ''): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
  const lower = password.toLowerCase()
  if (new Set(password).size < 4) return 'A senha é repetitiva demais'
  if (username && lower.includes(username.toLowerCase().split('@')[0])) return 'A senha não pode conter o nome de usuário'
  if (['password', 'senha', '123456', 'qwerty', 'admin', 'beonlabs', 'claro'].some(w => lower.includes(w))) return 'A senha é fácil de adivinhar'
  return null
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':')
  if (parts.length !== 2) return false
  const [salt, hash] = parts
  const expected = Buffer.from(hash, 'hex')
  const actual = pbkdf2Sync(password, salt, 100000, 64, 'sha512')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// Hash descartável: quem erra o usuário leva o mesmo tempo de quem erra a senha.
const DUMMY_HASH = `${'0'.repeat(32)}:${'0'.repeat(128)}`

// Usuários hardcoded como fallback para quando o data/users.json
// não está disponível (ex.: build da Vercel sem o arquivo físico).
const BUILTIN_USERS: User[] = [
  {
    id: "1",
    username: "gustavo.leite@claro.com.br",
    passwordHash: "54f6b9440bd72dce0cf85664daae48d9:3f4799537559ff22ddb9dc95c6b10b46c673375031ffeae9c070ce2d6788e16529497c11eee16a267b6095cf74abffb0ed92b92962cdeeb8e11be978ede6155d",
    role: "executivo",
    nome: "Gustavo Leite",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "2",
    username: "rodrigo.assad@claro.com.br",
    passwordHash: "6e2a4566772158c2cc2163a289ee6ed6:a0c54ba65a6ad1fe4f671cac6361ab07d3784a4ea1f6683ee45b3cfd1a7964dafabdacf40a20156111c9ddcc7bb4257d9c2bf82cc915e8c8abe22b449ae41a0c",
    role: "executivo",
    nome: "Rodrigo Assad",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "3",
    username: "marco_asterito",
    passwordHash: "3cc8ec237bb8f145abd60670fd3173c3:14afa870728b4fb99c243a66d1a18c3021aac2ae3940d56f1639b184b06e4afbfb6eaa4b3fa144819c314bbbe15b6044ee792e8d1e428ba22baf41d5b0ff8479",
    role: "admin",
    nome: "Marco Asterito",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "4",
    username: "daniel_frauches",
    passwordHash: "9e788b1591a42683f00217adf66d35c8:a19c6553af525aa1777a62c4d67d0c97fede8f980037edcbb2761db2938f1542af8108250c159a25cb9f0686ea1b95960baf742c7d10c509720a90c2723a45db",
    role: "admin",
    nome: "Daniel Frauches",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "5",
    username: "daniel_franca",
    passwordHash: "56d2a97954ec4cb9f3f74e8d636925f1:0bd826612bdeeb37d9abb32277f0ee71783524a67ad2fba1f325ec264a531a79f89e8b4df2513cc791593bbe296bff9ed623fe759f58bd8cf8c59c7e4143fe77",
    role: "admin",
    nome: "Daniel França",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "6",
    username: "alexandra.ferreira@claro.com.br",
    passwordHash: "57da5726881f64a34845e81da48817ed:97ae927f7b1a6b75ef89b5cf5590f8252c8200e3b7a94beb5befc4cb763d223b194f8699b04e7cbcaa40ff9c9350707c687aa850c2a85cdc1800ec2a5fe702d1",
    role: "admin",
    nome: "Alexandra Ferreira",
    laboratorio: "BeOn Lab",
    avatar: "",
    createdAt: "2026-09-18T00:00:00.000Z",
    active: true,
  },
]

export function loadUsers(): User[] {
  const path = getUsersFilePath()
  if (!existsSync(path)) return BUILTIN_USERS
  const parsed = readJsonStore<User[]>(path, [])
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : BUILTIN_USERS
}

export function saveUsers(users: User[]): void {
  writeJsonStore(getUsersFilePath(), users)
}

export function toPublic(user: User): UserPublic {
  const { passwordHash: _, ...pub } = user
  return pub
}

export function verifyCredentials(username: string, password: string): User | null {
  const users = loadUsers()

  const user = users.find(u => u.username === username && u.active)
  const ok = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) return null
  return user
}

/** Confirma no cadastro (não só no cookie) que a pessoa continua ativa e é admin. */
export function isAdmin(username: string): boolean {
  return loadUsers().some(u => u.username === username && u.role === 'admin' && u.active)
}

// ── Entrada do Admin ────────────────────────────────────────────────────────────────────────

export interface UserChanges {
  username?: string
  password?: string
  role?: AuthSessionRole
  nome?: string
  laboratorio?: string
  avatar?: string
  active?: boolean
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)

/** Valida o que o Admin enviou. Na criação, usuário, senha e papel são obrigatórios. */
export function parseUserChanges(body: unknown, criando: boolean): { value: UserChanges } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Requisição inválida' }
  const b = body as Record<string, unknown>
  const out: UserChanges = {}

  if (b.username !== undefined || criando) {
    const username = texto(b.username, 120) ?? ''
    if (username.length < 3 || /\s/.test(username)) return { error: 'Usuário inválido: use ao menos 3 caracteres, sem espaços' }
    out.username = username
  }
  if (b.role !== undefined || criando) {
    if (!(AUTH_ROLES as readonly unknown[]).includes(b.role)) return { error: 'Perfil inválido' }
    out.role = b.role as AuthSessionRole
  }
  if ((b.password !== undefined && b.password !== '') || criando) {
    const problema = passwordProblem(b.password, out.username ?? '')
    if (problema) return { error: problema }
    out.password = b.password as string
  }
  if (b.nome !== undefined) out.nome = texto(b.nome, 120) ?? ''
  if (b.laboratorio !== undefined) out.laboratorio = texto(b.laboratorio, 120) ?? ''
  if (b.avatar !== undefined) {
    const avatar = texto(b.avatar, 500) ?? ''
    if (avatar && !isSafeLink(avatar)) return { error: 'A foto precisa ser um link http(s)' }
    out.avatar = avatar
  }
  if (b.active !== undefined) out.active = Boolean(b.active)
  return { value: out }
}
