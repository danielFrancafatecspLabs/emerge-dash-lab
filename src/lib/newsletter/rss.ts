// Leitor de RSS 2.0 e Atom sem dependências: título, link, data, resumo em texto e imagem (media:content,
// media:thumbnail, enclosure de imagem ou a primeira <img> do conteúdo). Só aceita links http(s).

export interface ItemDeFeed {
  titulo: string
  link: string
  publicadoEm: string | null
  resumo: string
  imagem: string | null
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }

export function decodificar(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m)
}

/** Texto sem HTML, espaços normalizados. */
export function textoPuro(html: string): string {
  return decodificar(decodificar(html).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const https = (u: string | null | undefined) => {
  const v = u ? decodificar(u).trim() : ''
  return /^https?:\/\//i.test(v) ? v : null
}

function tag(bloco: string, nome: string): string | null {
  const m = new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i').exec(bloco)
  return m ? m[1] : null
}

function atributo(bloco: string, nome: string, attr: string, filtro?: RegExp): string | null {
  for (const m of bloco.matchAll(new RegExp(`<${nome}\\b([^>]*)/?>`, 'gi'))) {
    if (filtro && !filtro.test(m[1])) continue
    const v = new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`, 'i').exec(m[1])
    if (v) return v[1]
  }
  return null
}

function imagemDo(bloco: string): string | null {
  return https(atributo(bloco, 'media:content', 'url', /medium\s*=\s*["']image|type\s*=\s*["']image|\.(jpe?g|png|webp)/i))
    ?? https(atributo(bloco, 'media:thumbnail', 'url'))
    ?? https(atributo(bloco, 'enclosure', 'url', /type\s*=\s*["']image/i))
    ?? https(/<img[^>]+src\s*=\s*["']([^"']+)["']/i.exec(decodificar(tag(bloco, 'content:encoded') ?? tag(bloco, 'content') ?? tag(bloco, 'description') ?? tag(bloco, 'summary') ?? ''))?.[1])
}

function data(v: string | null): string | null {
  if (!v) return null
  const t = Date.parse(decodificar(v).trim())
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export function lerFeed(xml: string): ItemDeFeed[] {
  const itens: ItemDeFeed[] = []
  const rss = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(m => m[0])
  const atom = rss.length ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(m => m[0])
  for (const bloco of rss) {
    const titulo = textoPuro(tag(bloco, 'title') ?? '')
    const link = https(tag(bloco, 'link')) ?? https(tag(bloco, 'guid'))
    if (!titulo || !link) continue
    itens.push({
      titulo, link,
      publicadoEm: data(tag(bloco, 'pubDate') ?? tag(bloco, 'dc:date')),
      resumo: textoPuro(tag(bloco, 'description') ?? tag(bloco, 'content:encoded') ?? '').slice(0, 400),
      imagem: imagemDo(bloco),
    })
  }
  for (const bloco of atom) {
    const titulo = textoPuro(tag(bloco, 'title') ?? '')
    const link = https(atributo(bloco, 'link', 'href', /rel\s*=\s*["']alternate|^(?![\s\S]*rel=)/i)) ?? https(atributo(bloco, 'link', 'href'))
    if (!titulo || !link) continue
    itens.push({
      titulo, link,
      publicadoEm: data(tag(bloco, 'published') ?? tag(bloco, 'updated')),
      resumo: textoPuro(tag(bloco, 'summary') ?? tag(bloco, 'content') ?? '').slice(0, 400),
      imagem: imagemDo(bloco),
    })
  }
  return itens
}

/** og:image (ou twitter:image) de uma página de notícia. */
export function imagemDaPagina(html: string): string | null {
  const meta = (prop: string) => new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${prop}["'][^>]*>`, 'i').exec(html)?.[0]
  const tagMeta = meta('og:image') ?? meta('twitter:image')
  return tagMeta ? https(/content\s*=\s*["']([^"']+)["']/i.exec(tagMeta)?.[1]) : null
}
