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
