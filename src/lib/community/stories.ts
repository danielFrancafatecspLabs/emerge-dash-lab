import { isSafeLink } from '@/lib/validation/url'

export type StoryCategoria = 'novidade' | 'tendencia' | 'descoberta' | 'experimento' | 'pesquisa' | 'evento' | 'future-thinking' | 'destaque'

export const STORY_CATEGORIA_LABEL: Record<StoryCategoria, string> = {
  novidade: 'Novidade beOn Labs',
  tendencia: 'Tendência',
  descoberta: 'Descoberta científica',
  experimento: 'Novo experimento',
  pesquisa: 'Pesquisa',
  evento: 'Evento',
  'future-thinking': 'Future Thinking',
  destaque: 'Destaque da comunidade',
}

/** Story editorial, publicado pela equipe beOn Labs em Admin › Stories. */
export interface Story {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  active: boolean
  order: number
  createdAt: string
  createdBy: string
  categoria?: StoryCategoria
  texto?: string
}

export function parseStoryCategoria(value: unknown): StoryCategoria | undefined {
  return typeof value === 'string' && value in STORY_CATEGORIA_LABEL ? (value as StoryCategoria) : undefined
}

export interface StoryChanges {
  title?: string
  imageUrl?: string
  linkUrl?: string
  categoria?: StoryCategoria
  texto?: string
  order?: number
  active?: boolean
}

/** Valida o que o Admin enviou para um story. Na criação, título e imagem são obrigatórios. */
export function parseStoryChanges(body: unknown, criando: boolean): { value: StoryChanges } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Requisição inválida' }
  const b = body as Record<string, unknown>
  const out: StoryChanges = {}
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

  if (b.title !== undefined || criando) {
    out.title = str(b.title, 120)
    if (!out.title) return { error: 'Informe o título do story' }
  }
  if (b.imageUrl !== undefined || criando) {
    out.imageUrl = str(b.imageUrl, 1000)
    if (!out.imageUrl || !isSafeLink(out.imageUrl)) return { error: 'A imagem precisa ser um link http(s) ou um caminho interno' }
  }
  if (b.linkUrl !== undefined) {
    out.linkUrl = str(b.linkUrl, 1000)
    if (out.linkUrl && !isSafeLink(out.linkUrl)) return { error: 'O link precisa ser http(s) ou um caminho interno, como /comunidade/trilha' }
  }
  if (b.categoria !== undefined) out.categoria = parseStoryCategoria(b.categoria) ?? 'novidade'
  if (b.texto !== undefined) out.texto = str(b.texto, 500)
  if (b.order !== undefined) out.order = Number.isFinite(Number(b.order)) ? Math.trunc(Number(b.order)) : 0
  if (b.active !== undefined) out.active = Boolean(b.active)
  return { value: out }
}
