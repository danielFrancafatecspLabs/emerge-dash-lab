import { existsSync, readFileSync, realpathSync, statSync } from 'fs'
import path from 'path'

// Arquivos do app OSINT (build do Colab-Claro/signals-osint). Em produção, ops/osint-app-deploy.sh publica cada commit
// novo em OSINT_APP_DIR (um link para a versão ativa; sem a variável, o caminho padrão do deploy), lido a cada
// requisição; sem versão publicada, vale a cópia em osint/bundle.
//
// O index.html sai com um adaptador (__jira-embed.js) que leva as chamadas do app para /data/* e /api/* às rotas do
// Jira Viewer: assim qualquer build do signals-osint funciona embutido, mesmo sem as variáveis VITE_DATA_BASE e
// VITE_API_BASE.

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

/** Onde ops/osint-app-deploy.sh publica por padrão (usado quando OSINT_APP_DIR não está definido). */
export const PASTA_PADRAO_DO_DEPLOY = '/home/azureuser/osint-app-current'
export const STATUS_PADRAO_DO_DEPLOY = '/home/azureuser/osint-app-deploy/status.json'

const temApp = (pasta: string) => existsSync(path.join(pasta, 'index.html'))

/** A pasta publicada pelo deploy, se tiver um index.html; senão, a cópia que vem com o código. */
export function pastaDoApp(): string {
  const configurada = process.env.OSINT_APP_DIR
  if (configurada) return temApp(configurada) ? realpathSync(configurada) : pastaDoBundle()
  return temApp(PASTA_PADRAO_DO_DEPLOY) ? realpathSync(PASTA_PADRAO_DO_DEPLOY) : pastaDoBundle()
}

/** Adaptador carregado antes do app: /data/* e /api/* da própria origem vão para as rotas do Jira Viewer. */
export const ADAPTADOR = `(function () {
  var MAPA = [['/data/', '/jira/api/osint/data/'], ['/api/', '/jira/api/osint/']];
  function ajustar(u) {
    try {
      var url = new URL(String(u), location.href);
      if (url.origin !== location.origin) return u;
      for (var i = 0; i < MAPA.length; i++) {
        if (url.pathname.indexOf(MAPA[i][0]) === 0) return MAPA[i][1] + url.pathname.slice(MAPA[i][0].length) + url.search;
      }
    } catch (e) {}
    return u;
  }
  var original = window.fetch;
  if (original) {
    window.fetch = function (entrada, opcoes) {
      if (typeof entrada === 'string' || entrada instanceof URL) return original.call(this, ajustar(entrada), opcoes);
      if (typeof Request !== 'undefined' && entrada instanceof Request) {
        var novo = ajustar(entrada.url);
        if (novo !== entrada.url) entrada = new Request(novo, entrada);
      }
      return original.call(this, entrada, opcoes);
    };
  }
  var abrir = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    if (arguments.length > 1) arguments[1] = ajustar(arguments[1]);
    return abrir.apply(this, arguments);
  };
})();
`

const NOME_DO_ADAPTADOR = '__jira-embed.js'

/** Coloca o adaptador como primeiro script do index.html. */
export function comAdaptador(html: string): string {
  if (html.includes(NOME_DO_ADAPTADOR)) return html
  const tag = `<script src="./${NOME_DO_ADAPTADOR}"></script>`
  const head = /<head[^>]*>/i.exec(html)
  return head ? html.replace(head[0], `${head[0]}${tag}`) : `${tag}${html}`
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
  if (relativo === NOME_DO_ADAPTADOR) return { corpo: Buffer.from(ADAPTADOR), tipo: TIPOS['.js'], imutavel: false }
  if (relativo.includes('\0')) return null
  const destino = path.resolve(raiz, relativo)
  if (destino !== raiz && !destino.startsWith(raiz + path.sep)) return null
  const tipo = TIPOS[path.extname(destino).toLowerCase()]
  if (!tipo || !existsSync(destino)) return null
  // Links simbólicos que apontem para fora da pasta também ficam de fora.
  const real = realpathSync(destino)
  if (!real.startsWith(raiz + path.sep) || !statSync(real).isFile()) return null
  const corpo = readFileSync(real)
  if (relativo === 'index.html') return { corpo: Buffer.from(comAdaptador(corpo.toString('utf-8'))), tipo, imutavel: false }
  return { corpo, tipo, imutavel: partes[0] === 'assets' }
}

// ── Versão no ar ────────────────────────────────────────────────────────────────────────────

export interface StatusDoDeploy {
  checkedAt: string
  result: 'deployed' | 'unchanged' | 'error'
  step: string
  targetSha: string
  activeSha: string
  message: string
}

export interface VersaoDoApp {
  /** "publicada": a versão do deploy automático; "embutida": a cópia que vem com o código (o deploy não está ativo). */
  origem: 'publicada' | 'embutida'
  revisao: string | null
  publicadaEm: string | null
  deploy: StatusDoDeploy | null
}

function lerStatus(): StatusDoDeploy | null {
  const arquivo = process.env.OSINT_DEPLOY_STATUS || STATUS_PADRAO_DO_DEPLOY
  try {
    const s = JSON.parse(readFileSync(arquivo, 'utf-8')) as Partial<StatusDoDeploy>
    if (typeof s.checkedAt !== 'string' || !['deployed', 'unchanged', 'error'].includes(String(s.result))) return null
    return {
      checkedAt: s.checkedAt, result: s.result as StatusDoDeploy['result'], step: String(s.step ?? ''),
      targetSha: String(s.targetSha ?? ''), activeSha: String(s.activeSha ?? ''), message: String(s.message ?? ''),
    }
  } catch {
    return null
  }
}

/** Qual versão do app está no ar e o resultado da última verificação do deploy. */
export function versaoDoApp(): VersaoDoApp {
  const pasta = pastaDoApp()
  const origem = pasta === pastaDoBundle() ? 'embutida' : 'publicada'
  let revisao: string | null = null
  let publicadaEm: string | null = null
  try { revisao = readFileSync(path.join(pasta, '.osint-revision'), 'utf-8').trim() || null } catch { /* sem revisão */ }
  try { publicadaEm = statSync(path.join(pasta, 'index.html')).mtime.toISOString() } catch { /* sem data */ }
  return { origem, revisao, publicadaEm, deploy: lerStatus() }
}
