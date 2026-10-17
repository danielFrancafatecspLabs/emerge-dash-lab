import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// Persistência simples em arquivos JSON dentro de data/ (mesmo padrão dos stores existentes).
// O caminho pode ser sobrescrito por variável de ambiente, o que também permite isolar os testes.

export function jsonStorePath(envVar: string, fileName: string): string {
  return process.env[envVar] ?? join(process.cwd(), 'data', fileName)
}

export function readJsonStore<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function writeJsonStore<T>(path: string, value: T): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2))
}
