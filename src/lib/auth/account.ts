import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LABORATORIOS, type Laboratorio } from './laboratorios'
import { hashPassword, loadUsers, passwordProblem, saveUsers, verifyPassword, type User } from './users'

export { LABORATORIOS, type Laboratorio } from './laboratorios'

// "Meu perfil": o que a própria pessoa muda na sua conta (nome, e-mail, área, laboratório, senha e foto).
// O usuário de acesso (username) não muda, porque publicações, mensagens e conversas apontam para ele; o e-mail
// é editável e também serve para entrar.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface AccountChanges {
  nome?: string
  email?: string
  area?: string
  laboratorio?: Laboratorio
  senha?: { atual: string; nova: string }
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)

/** E-mail de contato: o informado ou, se o usuário de acesso já é um e-mail, ele mesmo. */
export const emailDe = (u: Pick<User, 'username' | 'email'>) => u.email || (EMAIL.test(u.username) ? u.username : '')

export function parseAccountChanges(body: unknown): { value: AccountChanges } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Requisição inválida' }
  const b = body as Record<string, unknown>
  const out: AccountChanges = {}
  if (b.nome !== undefined) {
    const nome = texto(b.nome, 120) ?? ''
    if (nome.length < 3) return { error: 'Informe seu nome completo' }
    out.nome = nome
  }
  if (b.email !== undefined) {
    const email = (texto(b.email, 120) ?? '').toLowerCase()
    if (!EMAIL.test(email)) return { error: 'Informe um e-mail válido' }
    out.email = email
  }
  if (b.area !== undefined) out.area = texto(b.area, 120) ?? ''
  if (b.laboratorio !== undefined) {
    if (!(LABORATORIOS as readonly unknown[]).includes(b.laboratorio)) return { error: `Escolha o laboratório: ${LABORATORIOS.join(', ')}` }
    out.laboratorio = b.laboratorio as Laboratorio
  }
  if (b.senha !== undefined) {
    const s = b.senha as Record<string, unknown> | null
    if (!s || typeof s.atual !== 'string' || typeof s.nova !== 'string') return { error: 'Informe a senha atual e a nova' }
    out.senha = { atual: s.atual, nova: s.nova }
  }
  return { value: out }
}

export type AccountResult = { user: User } | { error: string; status: number }

/** Aplica as mudanças na conta de `username`. A troca de senha exige a senha atual. */
export function updateAccount(username: string, changes: AccountChanges): AccountResult {
  const users = loadUsers()
  const user = users.find(u => u.username === username)
  if (!user) return { error: 'Conta não encontrada', status: 404 }

  if (changes.email !== undefined) {
    const usado = users.some(u => u !== user && (u.username.toLowerCase() === changes.email || u.email?.toLowerCase() === changes.email))
    if (usado) return { error: 'Este e-mail já está em uso por outra conta', status: 409 }
  }
  if (changes.senha) {
    if (!verifyPassword(changes.senha.atual, user.passwordHash)) return { error: 'A senha atual não confere', status: 403 }
    const problema = passwordProblem(changes.senha.nova, user.username)
    if (problema) return { error: problema, status: 400 }
    if (changes.senha.nova === changes.senha.atual) return { error: 'A nova senha precisa ser diferente da atual', status: 400 }
  }

  if (changes.nome !== undefined) user.nome = changes.nome
  if (changes.email !== undefined) user.email = changes.email
  if (changes.area !== undefined) user.area = changes.area
  if (changes.laboratorio !== undefined) user.laboratorio = changes.laboratorio
  if (changes.senha) user.passwordHash = hashPassword(changes.senha.nova)
  saveUsers(users)
  return { user }
}

// ── Foto de perfil ─────────────────────────────────────────────────────────────────────────────

export const MAX_FOTO_BYTES = 1_000_000
const TIPOS: { mime: string; ext: string; assinatura: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', assinatura: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', assinatura: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', ext: 'webp', assinatura: b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
]

export const pastaDeFotos = () => process.env.AVATARS_DIR || join(process.cwd(), 'data', 'avatars')
const arquivoDaFoto = (id: string, ext: string) => join(pastaDeFotos(), `${id.replace(/[^\w-]/g, '_')}.${ext}`)

/** Lê uma foto enviada como data URL; confere o tipo pelo conteúdo (não pelo cabeçalho) e o tamanho. */
export function decodificarFoto(dataUrl: unknown): { bytes: Buffer; mime: string; ext: string } | { error: string } {
  if (typeof dataUrl !== 'string') return { error: 'Envie uma imagem' }
  const m = /^data:image\/[\w+.-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return { error: 'Envie uma imagem JPG, PNG ou WEBP' }
  const bytes = Buffer.from(m[1], 'base64')
  if (bytes.length > MAX_FOTO_BYTES) return { error: 'A foto passa de 1 MB' }
  const tipo = TIPOS.find(t => t.assinatura(bytes))
  if (!tipo) return { error: 'Envie uma imagem JPG, PNG ou WEBP' }
  return { bytes, mime: tipo.mime, ext: tipo.ext }
}

/** Grava a foto de `user` (substituindo a anterior) e devolve o endereço servido pela API. */
export function salvarFoto(user: Pick<User, 'id'>, foto: { bytes: Buffer; ext: string }, agora = Date.now()): string {
  removerFoto(user)
  mkdirSync(pastaDeFotos(), { recursive: true })
  const destino = arquivoDaFoto(user.id, foto.ext)
  const tmp = `${destino}.${process.pid}.tmp`
  writeFileSync(tmp, foto.bytes)
  renameSync(tmp, destino)
  return `/jira/api/community/avatar/${encodeURIComponent(user.id)}?v=${agora}`
}

export function removerFoto(user: Pick<User, 'id'>) {
  for (const t of TIPOS) {
    const f = arquivoDaFoto(user.id, t.ext)
    if (existsSync(f)) unlinkSync(f)
  }
}

export function lerFoto(id: string): { bytes: Buffer; mime: string } | null {
  for (const t of TIPOS) {
    const f = arquivoDaFoto(id, t.ext)
    if (existsSync(f)) return { bytes: readFileSync(f), mime: t.mime }
  }
  return null
}

/** Atualiza o endereço da foto na conta. */
export function definirAvatar(username: string, avatar: string): User | null {
  const users = loadUsers()
  const user = users.find(u => u.username === username)
  if (!user) return null
  user.avatar = avatar
  saveUsers(users)
  return user
}
