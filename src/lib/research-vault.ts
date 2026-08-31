import { readFile, readdir, realpath } from 'node:fs/promises'
import path from 'node:path'

export type ResearchDocumentType = 'category' | 'topic' | 'concept' | 'paper'

export interface ResearchDocument {
  id: string
  path: string
  name: string
  title: string
  type: ResearchDocumentType
  category: string
  topic: string | null
  tags: string[]
  created: string | null
  updated: string | null
  links: string[]
}

export interface ResearchDocumentContent {
  document: ResearchDocument
  content: string
}

export interface ResearchEdge {
  source: string
  target: string
  kind: 'hierarchy' | 'wikilink'
}

export interface ResearchVault {
  revision: string
  generatedAt: string
  completedResearchCount: number
  documents: ResearchDocument[]
  edges: ResearchEdge[]
}

interface ParsedFrontmatter {
  title: string
  tags: string[]
  created: string | null
  updated: string | null
  body: string
}

interface CacheEntry {
  revision: string
  vault: ResearchVault
}

export class ResearchVaultUnavailableError extends Error {
  constructor(message = 'Research vault is unavailable') {
    super(message)
    this.name = 'ResearchVaultUnavailableError'
  }
}

export class ResearchDocumentNotFoundError extends Error {
  constructor(message = 'Research document was not found') {
    super(message)
    this.name = 'ResearchDocumentNotFoundError'
  }
}

const cache = new Map<string, CacheEntry>()
const ISO_DATE = /^20\d{2}-\d{2}-\d{2}$/
const TYPE_ORDER: Record<ResearchDocumentType, number> = {
  category: 0,
  topic: 1,
  concept: 2,
  paper: 3,
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseTags(lines: string[], startIndex: number, inlineValue: string) {
  if (inlineValue.startsWith('[') && inlineValue.endsWith(']')) {
    return inlineValue
      .slice(1, -1)
      .split(',')
      .map(stripWrappingQuotes)
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  const tags: string[] = []
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s+-\s+(.+)$/)
    if (!match) break
    const tag = stripWrappingQuotes(match[1])
    if (tag) tags.push(tag)
  }
  return tags
}

function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) {
    return { title: '', tags: [], created: null, updated: null, body: content }
  }

  const lines = match[1].split(/\r?\n/)
  let title = ''
  let tags: string[] = []
  let created: string | null = null
  let updated: string | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!field) continue
    const [, key, rawValue] = field
    const value = stripWrappingQuotes(rawValue)
    if (key === 'title') title = value
    if (key === 'tags') tags = parseTags(lines, index, rawValue.trim())
    if (key === 'created') created = ISO_DATE.test(value) ? value : null
    if (key === 'updated') updated = ISO_DATE.test(value) ? value : null
  }

  return {
    title,
    tags,
    created,
    updated,
    body: content.slice(match[0].length),
  }
}

function extractWikilinks(content: string) {
  const targets: string[] = []
  const seen = new Set<string>()
  const pattern = /\[\[([^\]]+)\]\]/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const target = match[1].split('|', 1)[0].split('#', 1)[0].trim()
    if (target && !seen.has(target)) {
      seen.add(target)
      targets.push(target)
    }
  }

  return targets
}

function classifyDocument(relativePath: string): Pick<ResearchDocument, 'type' | 'category' | 'topic'> {
  const parts = relativePath.split('/')
  const category = parts[1] ?? ''

  if (parts.length === 3) return { type: 'category', category, topic: null }

  const topic = parts[2] ?? null
  if (parts.length === 4) return { type: 'topic', category, topic }
  if (parts.includes('Papers')) return { type: 'paper', category, topic }
  return { type: 'concept', category, topic }
}

async function listMarkdownFiles(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(absolutePath, relativePath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(relativePath)
    }
  }

  return files
}

function compareDocuments(left: ResearchDocument, right: ResearchDocument) {
  const typeDifference = TYPE_ORDER[left.type] - TYPE_ORDER[right.type]
  if (typeDifference !== 0) return typeDifference
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0
}

function lookupKey(value: string) {
  return value.normalize('NFKD').toLocaleLowerCase('pt-BR').trim()
}

function buildEdges(documents: ResearchDocument[]) {
  const categoryDocuments = new Map<string, ResearchDocument>()
  const topicDocuments = new Map<string, ResearchDocument>()
  const lookup = new Map<string, ResearchDocument>()

  for (const document of documents) {
    if (document.type === 'category' && !categoryDocuments.has(document.category)) {
      categoryDocuments.set(document.category, document)
    }
    if (document.type === 'topic' && document.topic) {
      const key = `${document.category}\u0000${document.topic}`
      if (!topicDocuments.has(key)) topicDocuments.set(key, document)
    }

    const pathWithoutExtension = document.path.replace(/\.md$/i, '')
    for (const candidate of [document.name, document.title, pathWithoutExtension]) {
      const key = lookupKey(candidate)
      if (key && !lookup.has(key)) lookup.set(key, document)
    }
  }

  const edges: ResearchEdge[] = []
  const seen = new Set<string>()
  const addEdge = (edge: ResearchEdge) => {
    if (edge.source === edge.target) return
    const key = `${edge.kind}\u0000${edge.source}\u0000${edge.target}`
    if (!seen.has(key)) {
      seen.add(key)
      edges.push(edge)
    }
  }

  for (const document of documents) {
    if (document.type === 'topic') {
      const parent = categoryDocuments.get(document.category)
      if (parent) addEdge({ source: parent.id, target: document.id, kind: 'hierarchy' })
    }

    if ((document.type === 'concept' || document.type === 'paper') && document.topic) {
      const parent = topicDocuments.get(`${document.category}\u0000${document.topic}`)
      if (parent) addEdge({ source: parent.id, target: document.id, kind: 'hierarchy' })
    }

    for (const target of document.links) {
      const resolved = lookup.get(lookupKey(target))
      if (resolved) addEdge({ source: document.id, target: resolved.id, kind: 'wikilink' })
    }
  }

  return edges.sort((left, right) => {
    const leftKey = `${left.kind}:${left.source}:${left.target}`
    const rightKey = `${right.kind}:${right.source}:${right.target}`
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  })
}

async function readRevision(root: string) {
  try {
    const revision = (await readFile(path.join(root, '.research-revision'), 'utf8')).trim()
    return revision || null
  } catch {
    return null
  }
}

export function clearResearchVaultCache() {
  cache.clear()
}

export async function loadResearchVault(root: string): Promise<ResearchVault> {
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(root)
  } catch (error) {
    throw new ResearchVaultUnavailableError(error instanceof Error ? error.message : undefined)
  }

  const revisionFile = await readRevision(resolvedRoot)
  const cached = cache.get(resolvedRoot)
  if (revisionFile && cached?.revision === revisionFile) return cached.vault

  const researchDirectory = path.join(resolvedRoot, 'Researchs')
  let relativeFiles: string[]
  try {
    relativeFiles = await listMarkdownFiles(researchDirectory)
  } catch (error) {
    throw new ResearchVaultUnavailableError(error instanceof Error ? error.message : undefined)
  }

  const documents = await Promise.all(relativeFiles.map(async relativeToResearchs => {
    const relativePath = `Researchs/${relativeToResearchs}`
    const absolutePath = path.join(resolvedRoot, ...relativePath.split('/'))
    const content = await readFile(absolutePath, 'utf8')
    const frontmatter = parseFrontmatter(content)
    const classification = classifyDocument(relativePath)
    const name = path.posix.basename(relativePath, path.posix.extname(relativePath))

    return {
      id: relativePath,
      path: relativePath,
      name,
      title: frontmatter.title || name,
      ...classification,
      tags: frontmatter.tags,
      created: frontmatter.created,
      updated: frontmatter.updated,
      links: extractWikilinks(frontmatter.body),
    } satisfies ResearchDocument
  }))

  documents.sort(compareDocuments)
  const vault: ResearchVault = {
    revision: revisionFile ?? 'local',
    generatedAt: new Date().toISOString(),
    completedResearchCount: documents.filter(document => document.type === 'topic').length,
    documents,
    edges: buildEdges(documents),
  }

  if (revisionFile) cache.set(resolvedRoot, { revision: revisionFile, vault })
  return vault
}

export async function loadResearchDocument(
  root: string,
  vault: ResearchVault,
  requestedPath: string,
): Promise<ResearchDocumentContent> {
  const document = vault.documents.find(candidate => candidate.path === requestedPath)
  if (!document) throw new ResearchDocumentNotFoundError()

  const resolvedRoot = await realpath(root)
  const absolutePath = path.resolve(resolvedRoot, ...document.path.split('/'))
  if (!absolutePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new ResearchDocumentNotFoundError()
  }

  try {
    const content = await readFile(absolutePath, 'utf8')
    return { document, content: parseFrontmatter(content).body }
  } catch (error) {
    if (error instanceof ResearchDocumentNotFoundError) throw error
    throw new ResearchDocumentNotFoundError()
  }
}
