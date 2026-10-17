import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

// Persistência simples em arquivos JSON dentro de data/. O caminho de cada arquivo pode ser
// sobrescrito por variável de ambiente (útil em produção e para isolar os testes).

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

/** Grava em um arquivo temporário e renomeia: uma falha no meio nunca deixa o JSON pela metade. */
export function writeJsonStore<T>(path: string, value: T): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`)
  renameSync(tmp, path)
}
