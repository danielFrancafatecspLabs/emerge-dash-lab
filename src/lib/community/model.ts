import { isHttpUrl } from '@/lib/validation/url'

// Modelo de dados e regras puras da Comunidade beOn Labs (feed, fórum, pesquisas e Future Thinking).
// Tudo o que é publicado na Comunidade é um CommunityPost; o `kind` diferencia discussões,
// perguntas, pesquisas, experimentos e sinais de Future Thinking.

export type PostKind = 'discussao' | 'pergunta' | 'pesquisa' | 'experimento' | 'sinal'

export const POST_KINDS: PostKind[] = ['discussao', 'pergunta', 'pesquisa', 'experimento', 'sinal']

export const POST_KIND_LABEL: Record<PostKind, string> = {
  discussao: 'Discussão',
  pergunta: 'Pergunta',
  pesquisa: 'Pesquisa',
  experimento: 'Experimento',
  sinal: 'Sinal de futuro',
}

export type MaterialTipo = 'artigo' | 'relatorio' | 'benchmark' | 'estudo-de-caso' | 'publicacao-tecnica' | 'documento-experimento' | 'referencia-externa'
export type MaterialStatus = 'publicado' | 'em-elaboracao' | 'referencia-externa'
export type SinalDimensao = 'tecnologica' | 'social' | 'economica' | 'ambiental' | 'regulatoria' | 'cultural'
export type Horizonte = 'curto' | 'medio' | 'longo'

export const MATERIAL_TIPO_LABEL: Record<MaterialTipo, string> = {
  artigo: 'Artigo científico',
  relatorio: 'Relatório de mercado',
  benchmark: 'Benchmark tecnológico',
  'estudo-de-caso': 'Estudo de caso',
  'publicacao-tecnica': 'Publicação técnica',
  'documento-experimento': 'Documento de experimento',
  'referencia-externa': 'Referência externa',
}

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  publicado: 'Publicado',
  'em-elaboracao': 'Em elaboração',
  'referencia-externa': 'Referência externa',
}

export const SINAL_DIMENSAO_LABEL: Record<SinalDimensao, string> = {
  tecnologica: 'Tecnológica',
  social: 'Social e comportamental',
  economica: 'Econômica e modelos de negócio',
  ambiental: 'Ambiental',
  regulatoria: 'Regulatória',
  cultural: 'Cultural',
}

export const HORIZONTE_LABEL: Record<Horizonte, string> = {
  curto: 'Até 2 anos',
  medio: '2 a 5 anos',
  longo: 'Mais de 5 anos',
}

export interface PostMeta {
  materialTipo?: MaterialTipo
  materialStatus?: MaterialStatus
  dimensao?: SinalDimensao
  horizonte?: Horizonte
  evidencias?: string
  implicacoes?: string
}

export interface CommunityComment {
  id: string
  authorUsername: string
  authorName: string
  content: string
  createdAt: string
  parentId: string | null
}

export interface CommunityPost {
  id: string
  authorId: string
  authorUsername: string
  authorName: string
  authorLab: string
  authorAvatar: string
  kind: PostKind
  title: string
  content: string
  linkUrl: string
  tags: string[]
  meta: PostMeta
  createdAt: string
  likes: string[] // usernames que marcaram a publicação como útil
  comments: CommunityComment[]
}

/** Publicações antigas (antes dos tipos) não têm kind, título, tags nem comentários. */
export type StoredPost = Partial<CommunityPost> & Pick<CommunityPost, 'id' | 'content' | 'createdAt'>

interface UserRef {
  id: string
  username: string
  nome: string
}

export function normalizePost(raw: StoredPost, users: UserRef[] = []): CommunityPost {
  const author = users.find(u => u.username === raw.authorUsername)
    ?? users.find(u => u.id === raw.authorId)
    ?? users.find(u => u.nome && u.nome === raw.authorName)
  return {
    id: raw.id,
    authorId: raw.authorId ?? author?.id ?? '',
    authorUsername: raw.authorUsername ?? author?.username ?? raw.authorId ?? '',
    authorName: raw.authorName ?? author?.nome ?? '',
    authorLab: raw.authorLab ?? '',
    authorAvatar: raw.authorAvatar ?? '',
    kind: raw.kind && POST_KINDS.includes(raw.kind) ? raw.kind : 'discussao',
    title: raw.title ?? '',
    content: raw.content,
    linkUrl: raw.linkUrl ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    meta: raw.meta ?? {},
    createdAt: raw.createdAt,
    likes: Array.isArray(raw.likes) ? raw.likes : [],
    comments: Array.isArray(raw.comments) ? raw.comments : [],
  }
}

// ── Feed ────────────────────────────────────────────────────────────────────────────────────

export type FeedFilter = 'para-voce' | 'recentes' | 'em-alta' | 'sem-resposta' | 'pesquisas' | 'experimentos' | 'seguindo'

export const FEED_FILTER_LABEL: Record<FeedFilter, string> = {
  'para-voce': 'Para você',
  recentes: 'Mais recentes',
  'em-alta': 'Em alta',
  'sem-resposta': 'Sem resposta',
  pesquisas: 'Pesquisas e descobertas',
  experimentos: 'Experimentos',
  seguindo: 'Seguindo',
}

export interface FeedContext {
  username: string
  interesses: string[]
  topicosSeguidos: string[]
  pessoasSeguidas: string[]
  now?: number
}

const DAY = 24 * 60 * 60 * 1000
const byRecent = (a: CommunityPost, b: CommunityPost) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

export function engagement(post: CommunityPost): number {
  return post.likes.length + 2 * post.comments.length
}

export function isUnanswered(post: CommunityPost): boolean {
  return post.kind === 'pergunta' && !post.comments.some(c => c.authorUsername !== post.authorUsername)
}

function followsPost(post: CommunityPost, ctx: FeedContext): boolean {
  return ctx.pessoasSeguidas.includes(post.authorUsername) || post.tags.some(t => ctx.topicosSeguidos.includes(t))
}

export interface FeedResult {
  posts: CommunityPost[]
  /** true quando "Para você" não encontrou nada dos interesses e mostra as mais recentes */
  fallback: boolean
}

export function filterFeed(posts: CommunityPost[], filter: FeedFilter, ctx: FeedContext): FeedResult {
  const now = ctx.now ?? Date.now()
  const sorted = [...posts].sort(byRecent)
  switch (filter) {
    case 'recentes':
      return { posts: sorted, fallback: false }
    case 'em-alta': {
      const recentes = sorted.filter(p => now - Date.parse(p.createdAt) <= 14 * DAY && engagement(p) > 0)
      return { posts: recentes.sort((a, b) => engagement(b) - engagement(a) || byRecent(a, b)), fallback: false }
    }
    case 'sem-resposta':
      return { posts: sorted.filter(isUnanswered), fallback: false }
    case 'pesquisas':
      return { posts: sorted.filter(p => p.kind === 'pesquisa'), fallback: false }
    case 'experimentos':
      return { posts: sorted.filter(p => p.kind === 'experimento'), fallback: false }
    case 'seguindo':
      return { posts: sorted.filter(p => followsPost(p, ctx)), fallback: false }
    case 'para-voce': {
      const interesses = new Set([...ctx.interesses, ...ctx.topicosSeguidos])
      const relevantes = sorted.filter(p =>
        p.authorUsername !== ctx.username && (p.tags.some(t => interesses.has(t)) || ctx.pessoasSeguidas.includes(p.authorUsername)))
      if (relevantes.length === 0) return { posts: sorted, fallback: true }
      // As relevantes primeiro; o restante continua visível logo abaixo, por data.
      const ids = new Set(relevantes.map(p => p.id))
      return { posts: [...relevantes, ...sorted.filter(p => !ids.has(p.id))], fallback: false }
    }
  }
}

export function matchesSearch(post: CommunityPost, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [post.title, post.content, post.authorName, ...post.tags].some(v => v.toLowerCase().includes(q))
}

export interface TopicCount {
  topic: string
  count: number
}

/** Tópicos mais usados nas publicações e comentários dos últimos `dias` dias. */
export function trendingTopics(posts: CommunityPost[], now = Date.now(), dias = 30, limite = 6): TopicCount[] {
  const counts = new Map<string, number>()
  for (const p of posts) {
    const atividades = [p.createdAt, ...p.comments.map(c => c.createdAt)].filter(d => now - Date.parse(d) <= dias * DAY)
    if (atividades.length === 0) continue
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + atividades.length)
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
    .slice(0, limite)
}

// ── Notificações ────────────────────────────────────────────────────────────────────────────

export type NotificationType = 'comentario' | 'resposta'

export interface CommunityNotification {
  id: string
  tipo: NotificationType
  postId: string
  postTitulo: string
  ator: string
  atorNome: string
  createdAt: string
  lida: boolean
}

export interface NotificationPrefs {
  comentarios: boolean
  respostas: boolean
  mensagens: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { comentarios: true, respostas: true, mensagens: true }

export function postTitle(post: Pick<CommunityPost, 'title' | 'content'>): string {
  if (post.title) return post.title
  const firstLine = post.content.split('\n')[0].trim()
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine
}

/** Comentários nas minhas publicações e respostas aos meus comentários, feitos por outras pessoas. */
export function deriveNotifications(
  posts: CommunityPost[],
  username: string,
  vistasEm: string | null,
  prefs: NotificationPrefs = DEFAULT_NOTIFICATION_PREFS,
): CommunityNotification[] {
  const visto = vistasEm ? Date.parse(vistasEm) : 0
  const out: CommunityNotification[] = []
  for (const post of posts) {
    const meusComentarios = new Set(post.comments.filter(c => c.authorUsername === username).map(c => c.id))
    for (const c of post.comments) {
      if (c.authorUsername === username) continue
      let tipo: NotificationType | null = null
      if (c.parentId && meusComentarios.has(c.parentId)) tipo = prefs.respostas ? 'resposta' : null
      else if (post.authorUsername === username) tipo = prefs.comentarios ? 'comentario' : null
      if (!tipo) continue
      out.push({
        id: `${post.id}:${c.id}`,
        tipo,
        postId: post.id,
        postTitulo: postTitle(post),
        ator: c.authorUsername,
        atorNome: c.authorName,
        createdAt: c.createdAt,
        lida: Date.parse(c.createdAt) <= visto,
      })
    }
  }
  return out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

// ── Validação de entrada ────────────────────────────────────────────────────────────────────

export const POST_LIMITS = { title: 160, content: 5000, comment: 2000, tags: 5, meta: 1200 } as const

export interface PostInput {
  kind: PostKind
  title: string
  content: string
  linkUrl: string
  tags: string[]
  meta: PostMeta
}

const KINDS_COM_TITULO: PostKind[] = ['pergunta', 'pesquisa', 'sinal']

const oneOf = <T extends string>(value: unknown, options: Record<T, string>): T | undefined =>
  typeof value === 'string' && value in options ? (value as T) : undefined

export function validatePostInput(body: unknown, isKnownTopic: (id: string) => boolean): { value: PostInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Requisição inválida' }
  const b = body as Record<string, unknown>
  const kind = (typeof b.kind === 'string' && POST_KINDS.includes(b.kind as PostKind) ? b.kind : 'discussao') as PostKind
  const title = typeof b.title === 'string' ? b.title.trim() : ''
  const content = typeof b.content === 'string' ? b.content.trim() : ''
  const linkUrl = typeof b.linkUrl === 'string' ? b.linkUrl.trim() : ''

  if (!content) return { error: 'Escreva o conteúdo da publicação' }
  if (content.length > POST_LIMITS.content) return { error: `O texto pode ter até ${POST_LIMITS.content} caracteres` }
  if (title.length > POST_LIMITS.title) return { error: `O título pode ter até ${POST_LIMITS.title} caracteres` }
  if (KINDS_COM_TITULO.includes(kind) && !title) return { error: 'Dê um título para a publicação' }
  if (linkUrl && !isHttpUrl(linkUrl)) return { error: 'O link precisa começar com http:// ou https://' }

  const tags = Array.isArray(b.tags)
    ? [...new Set(b.tags.filter((t): t is string => typeof t === 'string' && isKnownTopic(t)))].slice(0, POST_LIMITS.tags)
    : []

  const raw = (b.meta && typeof b.meta === 'object' ? b.meta : {}) as Record<string, unknown>
  const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, POST_LIMITS.meta) : '')
  const meta: PostMeta = {}
  if (kind === 'pesquisa') {
    meta.materialTipo = oneOf(raw.materialTipo, MATERIAL_TIPO_LABEL) ?? 'artigo'
    meta.materialStatus = oneOf(raw.materialStatus, MATERIAL_STATUS_LABEL) ?? 'publicado'
  }
  if (kind === 'sinal') {
    meta.dimensao = oneOf(raw.dimensao, SINAL_DIMENSAO_LABEL) ?? 'tecnologica'
    meta.horizonte = oneOf(raw.horizonte, HORIZONTE_LABEL)
    meta.evidencias = text(raw.evidencias)
    meta.implicacoes = text(raw.implicacoes)
  }
  return { value: { kind, title, content, linkUrl, tags, meta } }
}
