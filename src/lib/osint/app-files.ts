import { existsSync, readFileSync, realpathSync, statSync } from 'fs'
import path from 'path'

// Arquivos do app OSINT (build do Colab-Claro/signals-osint). Em produção, ops/osint-app-deploy.sh publica cada commit
// novo em OSINT_APP_DIR (um link para a versão ativa), lido a cada requisição; sem ele, vale a cópia em osint/bundle.

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
}

export const pastaDoBundle = () => path.join(process.cwd(), 'osint', 'bundle')

/** A pasta publicada pelo deploy, se tiver um index.html; senão, a cópia que vem com o código. */
export function pastaDoApp(): string {
  const publicada = process.env.OSINT_APP_DIR
  if (publicada && existsSync(path.join(publicada, 'index.html'))) return realpathSync(publicada)
  return pastaDoBundle()
}

export interface ArquivoDoApp {
  corpo: Buffer
  tipo: string
  /** Arquivos com hash no nome (assets/) podem ficar em cache; o index.html nunca. */
  imutavel: boolean
}

/** Lê `partes` (o caminho depois de /osint-app/) de dentro da pasta do app, sem sair dela. */
export function lerArquivoDoApp(partes: string[], raiz = pastaDoApp()): ArquivoDoApp | null {
  const relativo = partes.length ? partes.join('/') : 'index.html'
  if (relativo.includes('\0')) return null
  const destino = path.resolve(raiz, relativo)
  if (destino !== raiz && !destino.startsWith(raiz + path.sep)) return null
  const tipo = TIPOS[path.extname(destino).toLowerCase()]
  if (!tipo || !existsSync(destino)) return null
  // Links simbólicos que apontem para fora da pasta também ficam de fora.
  const real = realpathSync(destino)
  if (!real.startsWith(raiz + path.sep) || !statSync(real).isFile()) return null
  return { corpo: readFileSync(real), tipo, imutavel: partes[0] === 'assets' }
}
