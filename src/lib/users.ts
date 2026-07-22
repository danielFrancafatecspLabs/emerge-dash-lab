import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { join, dirname } from 'path'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'viewer'
  createdAt: string
  active: boolean
}

export interface UserPublic {
  id: string
  username: string
  role: 'admin' | 'viewer'
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

export function loadUsers(): User[] {
  const path = getUsersFilePath()
  if (!existsSync(path)) return []
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as User[]
  } catch {
    return []
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

  if (users.length === 0) {
    // Bootstrap: cai no usuário único do .env
    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return {
        id: 'env-admin',
        username,
        passwordHash: '',
        role: 'admin',
        createdAt: new Date().toISOString(),
        active: true,
      }
    }
    return null
  }

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
