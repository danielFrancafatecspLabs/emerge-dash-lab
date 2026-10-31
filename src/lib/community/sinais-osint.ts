import { readFileSync } from 'fs'
import path from 'path'
import type { CommunityPost, Horizonte, SinalDimensao } from './model'
import { AUTOMACAO_SINAIS } from './automacao'
import { loadPosts, savePosts } from './posts-store'

export { AUTOMACAO_SINAIS, ehAutomacaoDeSinais } from './automacao'

// Automação "Sinais FT - beOn Labs": todo sinal encontrado pelo OSINT (o _export/signals.geojson do vault de sinais)
// vira uma publicação pública do tipo "sinal" no fórum e, nos 7 dias seguintes, um story. A publicação tem id
// determinístico (osint:<id do sinal>), então cada sinal entra uma vez só, mesmo rodando a sincronização várias vezes.

export interface SinalOsint {
  id?: string | number
  properties?: Record<string, unknown>
}

const DIMENSAO: Record<string, SinalDimensao> = {
  technological: 'tecnologica', infrastructure: 'tecnologica', military: 'tecnologica',
  economic: 'economica',
  political: 'regulatoria', regulatory: 'regulatoria',
  social: 'social',
  environmental: 'ambiental',
  cultural: 'cultural',
}

function horizonte(valor: string): Horizonte | undefined {
  const v = valor.toLowerCase()
  if (!v) return undefined
  if (v.includes('now') || v.includes('12') || v.includes('month')) return 'curto'
  if (v.includes('long')) return 'longo'
  if (/[2-5]/.test(v) || v.includes('year')) return 'medio'
  return undefined
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

/** Data em que o OSINT encontrou o sinal: a do id ("modulo:AAAA-MM-DD:S08") ou, sem ela, a do próprio sinal. */
function dataDaVarredura(id: string, p: Record<string, unknown>): string | null {
  const doId = /:(20\d{2}-\d{2}-\d{2}):/.exec(id)?.[1]
  const data = doId ?? texto(p.date)
  return /^20\d{2}-\d{2}-\d{2}$/.test(data) ? `${data}T12:00:00.000Z` : null
}

/** Publicação do fórum para um sinal do OSINT (null se o sinal não tem id ou título). */
export function postDeSinal(sinal: SinalOsint, agora = new Date()): CommunityPost | null {
  const p = sinal.properties ?? {}
  const id = texto(p.id) || texto(sinal.id)
  const titulo = texto(p.title)
  if (!id || !titulo) return null

  const detalhes = texto(p.Details) || texto(p.details)
  const implicacao = texto(p.Implication) || texto(p.implication)
  const fonte = texto(p.source_url)
  const contexto = [texto(p.module), texto(p.subtheme), texto(p.location)].filter(Boolean).join(' · ')
  const conteudo = [
    detalhes,
    implicacao && `Implicação: ${implicacao}`,
    contexto && `Contexto: ${contexto}`,
    'Publicado automaticamente pelo Radar OSINT do Future Thinking.',
  ].filter(Boolean).join('\n\n')

  const varredura = dataDaVarredura(id, p)
  const criado = varredura && Date.parse(varredura) < agora.getTime() ? varredura : agora.toISOString()

  return {
    id: `osint:${id}`,
    authorId: AUTOMACAO_SINAIS.id,
    authorUsername: AUTOMACAO_SINAIS.username,
    authorName: AUTOMACAO_SINAIS.nome,
    authorLab: AUTOMACAO_SINAIS.lab,
    authorAvatar: AUTOMACAO_SINAIS.avatar,
    kind: 'sinal',
    title: titulo.slice(0, 200),
    content: conteudo.slice(0, 5000),
    linkUrl: /^https?:\/\//.test(fonte) ? fonte : '',
    tags: [],
    meta: {
      dimensao: DIMENSAO[texto(p.domain).toLowerCase()] ?? 'tecnologica',
      ...(horizonte(texto(p.horizon)) ? { horizonte: horizonte(texto(p.horizon)) } : {}),
      ...(fonte ? { evidencias: fonte } : {}),
      ...(implicacao ? { implicacoes: implicacao } : {}),
    },
    createdAt: criado,
    likes: [],
    comments: [],
  }
}

/** Lê os sinais exportados pelo vault. Sem vault ou sem export, não há nada a publicar. */
export function lerSinaisOsint(raiz = process.env.SIGNAL_VAULT_PATH): SinalOsint[] {
  if (!raiz) return []
  try {
    const fc = JSON.parse(readFileSync(path.join(raiz, '_export', 'signals.geojson'), 'utf8'))
    return Array.isArray(fc?.features) ? fc.features : []
  } catch {
    return []
  }
}

/** Publica os sinais que ainda não estão no fórum. Devolve quantos entraram. */
export function sincronizarSinaisOsint(sinais = lerSinaisOsint(), agora = new Date()): number {
  if (!sinais.length) return 0
  const posts = loadPosts()
  const existentes = new Set(posts.map(p => p.id))
  const novos = sinais.map(s => postDeSinal(s, agora)).filter((p): p is CommunityPost => !!p && !existentes.has(p.id))
  // Um mesmo sinal repetido no export entra uma vez.
  const unicos = [...new Map(novos.map(p => [p.id, p])).values()]
  if (!unicos.length) return 0
  savePosts([...posts, ...unicos])
  return unicos.length
}

const INTERVALO_MS = 5 * 60 * 1000
const G = globalThis as typeof globalThis & { __beonSinaisOsintEm?: number }

/** Roda a sincronização no máximo a cada 5 minutos (chamada ao carregar o feed). Falhas não afetam o feed. */
export function talvezSincronizarSinaisOsint(agora = Date.now()) {
  if (agora - (G.__beonSinaisOsintEm ?? 0) < INTERVALO_MS) return
  G.__beonSinaisOsintEm = agora
  try {
    const n = sincronizarSinaisOsint()
    if (n) console.log(`[sinais-osint] ${n} sinais publicados no fórum`)
  } catch (err) {
    console.error('[sinais-osint] falha ao publicar sinais:', err)
  }
}
