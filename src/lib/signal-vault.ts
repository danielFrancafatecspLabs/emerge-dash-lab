import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import path from 'node:path'

export type SignalDocumentType = 'module' | 'subtheme' | 'signal' | 'watch' | 'note'

export interface SignalDocument {
  id: string
  path: string
  title: string
  type: SignalDocumentType
  module: string | null
  moduleTitle: string | null
  subtheme: string | null
  parent: string | null
  domain: string | null
  date: string | null
  horizon: string | null
  confidence: string | null
  relevance: string | null
  location: string | null
  sourceOrg: string | null
  sourceUrl: string | null
  tags: string[]
}

export interface SignalEdge {
  source: string
  target: string
  kind: 'hierarchy' | 'wikilink'
}

export interface SignalVault {
  revision: string
  generatedAt: string
  signalCount: number
  watchCount: number
  documents: SignalDocument[]
  edges: SignalEdge[]
}

export interface SignalDocumentContent {
  document: SignalDocument
  content: string
}

export class SignalVaultUnavailableError extends Error {
  constructor(message = 'Signal vault is unavailable') {
    super(message)
    this.name = 'SignalVaultUnavailableError'
  }
}

export class SignalDocumentNotFoundError extends Error {
  constructor(message = 'Signal document was not found') {
    super(message)
    this.name = 'SignalDocumentNotFoundError'
  }
}

type Frontmatter = Record<string, string | string[]>

const SOURCES: Array<{ directory: string; type: SignalDocumentType }> = [
  { directory: 'modules', type: 'module' },
  { directory: 'subthemes', type: 'subtheme' },
  { directory: 'signals', type: 'signal' },
  { directory: 'watchlist', type: 'watch' },
  { directory: 'notes', type: 'note' },
]
const TYPE_ORDER: Record<SignalDocumentType, number> = {
  module: 0,
  subtheme: 1,
  signal: 2,
  watch: 3,
  note: 4,
}
const ISO_DATE = /^20\d{2}-\d{2}-\d{2}$/

const cache = new Map<string, { revision: string; vault: SignalVault }>()
const vaultRoots = new WeakMap<SignalVault, string>()

function unquote(value: string) {
  const trimmed = value.trim()
  if (
    trimmed.length >= 2
    && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseFrontmatter(content: string): { data: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { data: {}, body: content }

  const data: Frontmatter = {}
  const lines = match[1].split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!field) continue
    const [, key, rawValue] = field
    if (rawValue.trim() === '') {
      const items: string[] = []
      while (index + 1 < lines.length) {
        const item = lines[index + 1].match(/^\s+-\s+(.+)$/)
        if (!item) break
        items.push(unquote(item[1]))
        index += 1
      }
      data[key] = items
    } else if (rawValue.trim().startsWith('[') && rawValue.trim().endsWith(']')) {
      data[key] = rawValue.trim().slice(1, -1).split(',').map(unquote).filter(Boolean)
    } else {
      data[key] = unquote(rawValue)
    }
  }

  return { data, body: content.slice(match[0].length) }
}

function text(data: Frontmatter, key: string) {
  const value = data[key]
  return typeof value === 'string' && value ? value : null
}

function cleanBody(body: string) {
  return body.replace(/^%%generated-(?:start|end)%%\r?\n?/gm, '').trim()
}

function extractWikilinks(body: string) {
  const targets = new Set<string>()
  for (const match of Array.from(body.matchAll(/\[\[([^\]]+)\]\]/g))) {
    const target = match[1].split('|', 1)[0].split('#', 1)[0].trim()
    if (target) targets.add(target)
  }
  return Array.from(targets)
}

async function listMarkdownFiles(directory: string, prefix: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const files: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const relativePath = `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(path.join(directory, entry.name), relativePath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(relativePath)
    }
  }
  return files
}

async function readRevision(root: string) {
  try {
    return (await readFile(path.join(root, '.signal-revision'), 'utf8')).trim() || null
  } catch {
    return null
  }
}

function compareDocuments(left: SignalDocument, right: SignalDocument) {
  const typeDifference = TYPE_ORDER[left.type] - TYPE_ORDER[right.type]
  if (typeDifference !== 0) return typeDifference
  if (left.type === 'signal' || left.type === 'note') {
    const leftDate = left.date ?? ''
    const rightDate = right.date ?? ''
    if (leftDate !== rightDate) return leftDate < rightDate ? 1 : -1
  }
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0
}

export function clearSignalVaultCache() {
  cache.clear()
}

export async function loadSignalVault(root: string): Promise<SignalVault> {
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(root)
  } catch (error) {
    throw new SignalVaultUnavailableError(error instanceof Error ? error.message : undefined)
  }

  const revisionFile = await readRevision(resolvedRoot)
  const cached = cache.get(resolvedRoot)
  if (revisionFile && cached?.revision === revisionFile) return cached.vault

  let files: Array<{ relativePath: string; type: SignalDocumentType }>
  try {
    files = (await Promise.all(SOURCES.map(async source => (
      (await listMarkdownFiles(path.join(resolvedRoot, source.directory), source.directory))
        .map(relativePath => ({ relativePath, type: source.type }))
    )))).flat()
  } catch (error) {
    throw new SignalVaultUnavailableError(error instanceof Error ? error.message : undefined)
  }
  if (files.length === 0) throw new SignalVaultUnavailableError('Signal vault has no documents')

  const moduleTitles = new Map<string, string>()
  const bodies = new Map<string, string>()
  const lidos = await Promise.all(files.map(async ({ relativePath, type }) => {
    const raw = await readFile(path.join(resolvedRoot, ...relativePath.split('/')), 'utf8')
    return { relativePath, type, ...parseFrontmatter(raw) }
  }))
  // Notas analíticas só entram publicadas (frontmatter `release: public`); as demais nem aparecem nem podem ser abertas.
  const publicados = lidos.filter(({ type, data }) => type !== 'note' || text(data, 'release')?.toLowerCase() === 'public')
  const parsed = publicados.map(({ relativePath, type, data, body }) => {
    bodies.set(relativePath, body)
    const name = path.posix.basename(relativePath, '.md')
    const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim()
    const slug = text(data, 'module') ?? text(data, 'slug')
    const title = type === 'subtheme'
      ? text(data, 'label') ?? heading ?? name
      : text(data, 'title') ?? heading ?? name
    if (type === 'module') moduleTitles.set(text(data, 'slug') ?? name, title)

    const date = text(data, 'date') ?? text(data, 'created') ?? text(data, 'scan_date')
    const document: SignalDocument = {
      id: relativePath,
      path: relativePath,
      title,
      type,
      module: type === 'module' ? text(data, 'slug') ?? name : slug,
      moduleTitle: null,
      subtheme: type === 'subtheme' ? title : text(data, 'subtheme'),
      parent: null,
      domain: text(data, 'domain'),
      date: date && ISO_DATE.test(date) ? date : null,
      horizon: text(data, 'horizon'),
      confidence: text(data, 'confidence'),
      relevance: text(data, 'stakeholder_relevance'),
      location: text(data, 'location'),
      sourceOrg: text(data, 'source_org'),
      sourceUrl: text(data, 'source_url'),
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
    return document
  })

  const byPath = new Map(parsed.map(document => [document.path.replace(/\.md$/i, ''), document]))
  const edges: SignalEdge[] = []
  const seen = new Set<string>()
  const addEdge = (edge: SignalEdge) => {
    const key = `${edge.kind}\u0000${edge.source}\u0000${edge.target}`
    if (edge.source === edge.target || seen.has(key)) return
    seen.add(key)
    edges.push(edge)
  }

  // Hierarquia: o módulo/subtema declara seus filhos nos wikilinks gerados.
  for (const document of parsed) {
    if (document.type !== 'module' && document.type !== 'subtheme') continue
    for (const target of extractWikilinks(bodies.get(document.path) ?? '')) {
      const child = byPath.get(target)
      if (!child || child.type === 'note') continue
      const isChild = document.type === 'module'
        ? child.type === 'subtheme'
        : child.type === 'signal' || child.type === 'watch'
      if (!isChild) continue
      child.parent = document.id
      addEdge({ source: document.id, target: child.id, kind: 'hierarchy' })
    }
  }
  // Itens sem subtema ficam diretamente sob o módulo.
  const moduleDocuments = new Map(parsed.filter(d => d.type === 'module').map(d => [d.module, d]))
  for (const document of parsed) {
    document.moduleTitle = document.module ? moduleTitles.get(document.module) ?? null : null
    if (document.parent || (document.type !== 'signal' && document.type !== 'watch')) continue
    const parent = moduleDocuments.get(document.module)
    if (parent) {
      document.parent = parent.id
      addEdge({ source: parent.id, target: document.id, kind: 'hierarchy' })
    }
  }

  for (const document of parsed) {
    for (const target of extractWikilinks(bodies.get(document.path) ?? '')) {
      const resolved = byPath.get(target)
      if (resolved && !seen.has(`hierarchy\u0000${document.id}\u0000${resolved.id}`)) {
        addEdge({ source: document.id, target: resolved.id, kind: 'wikilink' })
      }
    }
  }

  parsed.sort(compareDocuments)
  edges.sort((left, right) => {
    const leftKey = `${left.kind}:${left.source}:${left.target}`
    const rightKey = `${right.kind}:${right.source}:${right.target}`
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  })

  const vault: SignalVault = {
    revision: revisionFile ?? 'local',
    generatedAt: new Date().toISOString(),
    signalCount: parsed.filter(document => document.type === 'signal').length,
    watchCount: parsed.filter(document => document.type === 'watch').length,
    documents: parsed,
    edges,
  }

  vaultRoots.set(vault, resolvedRoot)
  if (revisionFile) {
    cache.clear()
    cache.set(resolvedRoot, { revision: revisionFile, vault })
  }
  return vault
}

export async function loadSignalDocument(
  vault: SignalVault,
  requestedPath: string,
): Promise<SignalDocumentContent> {
  const document = vault.documents.find(candidate => candidate.path === requestedPath)
  const resolvedRoot = vaultRoots.get(vault)
  if (!document || !resolvedRoot) throw new SignalDocumentNotFoundError()

  const absolutePath = path.resolve(resolvedRoot, ...document.path.split('/'))
  if (!absolutePath.startsWith(`${resolvedRoot}${path.sep}`)) throw new SignalDocumentNotFoundError()

  try {
    const stats = await lstat(absolutePath)
    if (stats.isSymbolicLink() || !stats.isFile()) throw new SignalDocumentNotFoundError()
    const resolvedDocument = await realpath(absolutePath)
    if (!resolvedDocument.startsWith(`${resolvedRoot}${path.sep}`)) throw new SignalDocumentNotFoundError()
    const raw = await readFile(resolvedDocument, 'utf8')
    return { document, content: cleanBody(parseFrontmatter(raw).body) }
  } catch (error) {
    if (error instanceof SignalDocumentNotFoundError) throw error
    throw new SignalDocumentNotFoundError()
  }
}
