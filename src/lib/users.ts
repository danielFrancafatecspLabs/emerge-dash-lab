import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { join, dirname } from 'path'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'executivo' | 'viewer' | 'financeiro'
  createdAt: string
  active: boolean
}

export interface UserPublic {
  id: string
  username: string
  role: 'admin' | 'executivo' | 'viewer' | 'financeiro'
  createdAt: string
  active: boolean
}

function getUsersFilePath(): string {
  return process.env.USERS_FILE_PATH ?? join(process.cwd(), 'data', 'users.json')
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
  const testHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return testHash === hash
}

// Usuários hardcoded como fallback para quando o data/users.json
// não está disponível (ex.: build da Vercel sem o arquivo físico).
const BUILTIN_USERS: User[] = [
  {
    id: "1",
    username: "gustavo.leite@claro.com.br",
    passwordHash: "54f6b9440bd72dce0cf85664daae48d9:3f4799537559ff22ddb9dc95c6b10b46c673375031ffeae9c070ce2d6788e16529497c11eee16a267b6095cf74abffb0ed92b92962cdeeb8e11be978ede6155d",
    role: "executivo",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "2",
    username: "rodrigo.assad@claro.com.br",
    passwordHash: "6e2a4566772158c2cc2163a289ee6ed6:a0c54ba65a6ad1fe4f671cac6361ab07d3784a4ea1f6683ee45b3cfd1a7964dafabdacf40a20156111c9ddcc7bb4257d9c2bf82cc915e8c8abe22b449ae41a0c",
    role: "executivo",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "3",
    username: "marco_asterito",
    passwordHash: "8fb46fb90b6b7760b5d917bfa1edb006:407da17f8dd72480420cf64665de6102f04b760c980b9147b931c6b58d51231806765701c9da29fbdf65d7d90592950d68a7e8621b797fca83d51f22b7d7de48",
    role: "admin",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "4",
    username: "daniel_frauches",
    passwordHash: "9e788b1591a42683f00217adf66d35c8:a19c6553af525aa1777a62c4d67d0c97fede8f980037edcbb2761db2938f1542af8108250c159a25cb9f0686ea1b95960baf742c7d10c509720a90c2723a45db",
    role: "admin",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
  {
    id: "5",
    username: "daniel_franca",
    passwordHash: "56d2a97954ec4cb9f3f74e8d636925f1:0bd826612bdeeb37d9abb32277f0ee71783524a67ad2fba1f325ec264a531a79f89e8b4df2513cc791593bbe296bff9ed623fe759f58bd8cf8c59c7e4143fe77",
    role: "admin",
    createdAt: "2026-07-23T00:00:00.000Z",
    active: true,
  },
]

export function loadUsers(): User[] {
  const path = getUsersFilePath()
  if (!existsSync(path)) return BUILTIN_USERS
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as User[]
    if (parsed.length === 0) return BUILTIN_USERS
    return parsed
  } catch {
    return BUILTIN_USERS
  }
}

export function saveUsers(users: User[]): void {
  const path = getUsersFilePath()
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(users, null, 2))
}

export function toPublic(user: User): UserPublic {
  const { passwordHash: _, ...pub } = user
  return pub
}

export function verifyCredentials(username: string, password: string): User | null {
  const users = loadUsers()

  const user = users.find(u => u.username === username && u.active)
  if (!user) return null
  if (!verifyPassword(password, user.passwordHash)) return null
  return user
}

export function isAdmin(username: string): boolean {
  const users = loadUsers()
  if (users.length === 0) return username === process.env.ADMIN_USER
  const user = users.find(u => u.username === username)
  return user?.role === 'admin' ?? false
}
