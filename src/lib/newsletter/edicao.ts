import { imagemDaPagina, lerFeed, type ItemDeFeed } from './rss'

// Newsletter diária: varre feeds públicos de tecnologia e mercado, fica só com tecnologias emergentes, mercado e bolsa,
// bolhas e impactos, e monta a edição (manchete, resumo e seções). Sem chaves de API.

export type Secao = 'emergentes' | 'mercado' | 'bolhas' | 'impactos'

export const SECOES: { id: Secao; nome: string; descricao: string }[] = [
  { id: 'emergentes', nome: 'Tecnologias emergentes', descricao: 'IA, quântica, chips, robótica, espaço, biotecnologia' },
  { id: 'mercado', nome: 'Mercado e bolsa', descricao: 'Ações, investimentos, resultados e IPOs de tecnologia' },
  { id: 'bolhas', nome: 'Bolhas e riscos', descricao: 'Euforia, valuations esticados e correções' },
  { id: 'impactos', nome: 'Impactos', descricao: 'Trabalho, regulação, energia e sociedade' },
]

export interface Fonte { nome: string; url: string }

/** Feeds padrão (podem ser trocados por NEWSLETTER_FEEDS="Nome|https://…,Outro|https://…"). */
export const FONTES_PADRAO: Fonte[] = [
  { nome: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { nome: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { nome: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { nome: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
  { nome: 'Wired', url: 'https://www.wired.com/feed/rss' },
  { nome: 'CNBC Tecnologia', url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html' },
  { nome: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  { nome: 'Google Notícias: bolha de IA', url: 'https://news.google.com/rss/search?q=%22AI+bubble%22+OR+%22tech+stocks%22&hl=en-US&gl=US&ceid=US:en' },
  { nome: 'Google Notícias: tecnologias emergentes', url: 'https://news.google.com/rss/search?q=intelig%C3%AAncia+artificial+OR+computa%C3%A7%C3%A3o+qu%C3%A2ntica+OR+big+techs+a%C3%A7%C3%B5es&hl=pt-BR&gl=BR&ceid=BR:pt-419' },
  { nome: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
  { nome: 'g1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
  { nome: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
]

export function fontesConfiguradas(env = process.env.NEWSLETTER_FEEDS): Fonte[] {
  if (!env?.trim()) return FONTES_PADRAO
  return env.split(',').map(par => {
    const [nome, url] = par.includes('|') ? par.split('|') : [par, par]
    return { nome: nome.trim(), url: url.trim() }
  }).filter(f => /^https?:\/\//.test(f.url))
}

// Palavras-chave (minúsculas, sem acento) em português e inglês.
const TERMOS: Record<Secao, string[]> = {
  emergentes: [
    ' ai ', 'a.i.', 'artificial intelligence', 'inteligencia artificial', ' ia ', 'genai', 'llm', 'openai', 'anthropic', 'chatgpt', 'gemini', 'nvidia',
    'agentic', 'ai agent', 'agentes de ia', 'quantum', 'quantica', 'robot', 'robo', 'humanoid', 'humanoide', 'semiconductor', 'semicondutor', ' chip',
    '6g', '5g', 'satellite', 'satelite', 'starlink', 'spacex', 'fusion', 'fusao nuclear', 'biotech', 'biotecnologia', 'crispr', 'genetic', 'genetica',
    'augmented reality', 'realidade aumentada', 'virtual reality', 'mixed reality', 'xr ', 'blockchain', 'drone', 'autonomous', 'autonomo',
    'self-driving', 'brain-computer', 'neural', 'data center', 'datacenter', 'edge computing', 'machine learning', 'aprendizado de maquina',
  ],
  mercado: [
    'stock', 'shares', 'acoes', 'nasdaq', 's&p', 'dow jones', 'ibovespa', 'b3 ', 'ipo', 'valuation', 'earnings', 'resultado trimestral',
    'investor', 'investidor', 'market cap', 'valor de mercado', 'funding', 'rodada', 'venture capital', 'wall street', 'bolsa', 'trillion', 'trilhao',
    'billion', 'bilhoes', 'revenue', 'receita', 'guidance', 'rally', 'sell-off', 'capex',
  ],
  bolhas: [
    'bubble', 'bolha', 'overvalued', 'sobrevalorizad', 'frenzy', 'euforia', ' hype ', ' hyped ', 'crash', 'market correction', 'stock correction',
    'correcao no mercado', 'correcao na bolsa', 'correcao na nasdaq', 'dot-com', 'pontocom', 'froth', 'speculat', 'especulac', 'selloff',
    'sell-off', 'plunge', 'despenc', 'circular deal',
  ],
  impactos: [
    'jobs', 'empregos', 'layoff', 'demiss', 'workers', 'trabalhadores', 'regulation', 'regulac', 'regulator', 'lawsuit', 'processo judicial', 'antitrust',
    'energy', 'energia', 'power grid', 'emissions', 'emissoes', 'water', 'privacy', 'privacidade', 'copyright', 'direitos autorais', ' ban ', 'proibe',
    'safety', 'seguranca', 'misinformation', 'desinformac', 'election', 'eleic', 'impact', 'impacto', 'society', 'sociedade',
  ],
}

const normalizar = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `.replace(/[“”"‘’'(),:;!?]/g, ' ')

export function pontuar(texto: string): Record<Secao, number> {
  const t = normalizar(texto)
  return Object.fromEntries((Object.keys(TERMOS) as Secao[]).map(s => [s, TERMOS[s].filter(k => t.includes(k)).length])) as Record<Secao, number>
}

/**
 * Seção da notícia, ou null se ela não for do tema. Só entra o que fala de tecnologia emergente; mercado, bolhas e
 * impactos precisam vir junto de tecnologia (ou de termos fortes de bolha), para a newsletter não virar economia geral.
 */
export function classificar(titulo: string, resumo: string): Secao | null {
  const p = pontuar(`${titulo} ${titulo} ${resumo}`)
  const tech = p.emergentes > 0
  if (p.bolhas >= 2 || (p.bolhas >= 1 && (tech || p.mercado > 0))) return 'bolhas'
  if (!tech) return null
  if (p.mercado >= 2 && p.mercado >= p.impactos) return 'mercado'
  if (p.impactos >= 2) return 'impactos'
  if (p.mercado >= 1 && p.mercado > p.impactos) return 'mercado'
  if (p.impactos >= 1 && p.impactos > p.mercado) return 'impactos'
  return 'emergentes'
}

/** Idioma provável da notícia (para avisar quando a fonte é em inglês). */
export function idiomaDe(texto: string): 'pt' | 'en' {
  const t = ` ${texto.toLowerCase()} `
  const pt = [' de ', ' da ', ' do ', ' em ', ' para ', ' com ', ' que ', ' os ', ' as ', ' não ', 'ção', 'ções', 'ões', 'ã', 'õ', 'ç']
  const en = [' the ', ' of ', ' and ', ' to ', ' in ', ' for ', ' with ', ' is ', ' as ', ' on ', ' its ', ' by ']
  const n = (lista: string[]) => lista.filter(k => t.includes(k)).length
  return n(pt) >= n(en) ? 'pt' : 'en'
}

export interface Noticia {
  id: string
  titulo: string
  link: string
  fonte: string
  publicadoEm: string | null
  resumo: string
  imagem: string | null
  secao: Secao
}

export interface Edicao {
  numero: number
  data: string
  geradoEm: string
  noticias: Noticia[]
  fontes: { nome: string; ok: boolean; itens: number }[]
}

const chaveTitulo = (t: string) => normalizar(t).replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3).slice(0, 8).join(' ')

/** Seleciona e ordena: recentes (até 3 dias), sem duplicatas, com imagem primeiro nos destaques, seções equilibradas. */
export function montarNoticias(porFonte: { fonte: Fonte; itens: ItemDeFeed[] }[], agora = new Date(), limite = 36): Noticia[] {
  const vistos = new Set<string>()
  const candidatas: (Noticia & { peso: number })[] = []
  for (const { fonte, itens } of porFonte) {
    for (const it of itens) {
      const secao = classificar(it.titulo, it.resumo)
      if (!secao) continue
      const quando = it.publicadoEm ? Date.parse(it.publicadoEm) : agora.getTime() - 12 * 3600_000
      const horas = (agora.getTime() - quando) / 3600_000
      if (horas > 72 || horas < -6) continue
      const chave = chaveTitulo(it.titulo)
      if (!chave || vistos.has(chave)) continue
      vistos.add(chave)
      const p = pontuar(`${it.titulo} ${it.resumo}`)
      const relevancia = p.emergentes + p.mercado + p.bolhas * 1.5 + p.impactos
      candidatas.push({
        id: chave.replace(/ /g, '-').slice(0, 80), titulo: it.titulo, link: it.link, fonte: fonte.nome,
        publicadoEm: it.publicadoEm, resumo: it.resumo, imagem: it.imagem, secao,
        peso: relevancia * 2 + (it.imagem ? 3 : 0) - horas / 8,
      })
    }
  }
  candidatas.sort((a, b) => b.peso - a.peso)
  // No máximo 12 por seção, para nenhuma tomar a edição inteira.
  const porSecao = new Map<Secao, number>()
  const out: Noticia[] = []
  for (const { peso: _peso, ...n } of candidatas) {
    const k = porSecao.get(n.secao) ?? 0
    if (k >= 12) continue
    porSecao.set(n.secao, k + 1)
    out.push(n)
    if (out.length >= limite) break
  }
  return out
}

/** Nº da edição: dias desde o lançamento da newsletter. */
export const numeroDaEdicao = (agora: Date) => Math.max(1, Math.floor((agora.getTime() - Date.UTC(2026, 9, 31)) / 86_400_000) + 1)

async function buscarTexto(url: string, timeoutMs: number, limiteBytes = 2_000_000): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal, cache: 'no-store', redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; beOnLabs-Newsletter/1.0)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const texto = await res.text()
    return texto.slice(0, limiteBytes)
  } finally {
    clearTimeout(timer)
  }
}

/** Varre as fontes e monta a edição do dia. Uma fonte que falha não derruba as demais. */
export async function gerarEdicao(fontes = fontesConfiguradas(), agora = new Date()): Promise<Edicao> {
  const resultados = await Promise.all(fontes.map(async fonte => {
    try {
      return { fonte, itens: lerFeed(await buscarTexto(fonte.url, 12_000)), ok: true }
    } catch (err) {
      console.warn(`[newsletter] fonte indisponível: ${fonte.nome} (${String(err)})`)
      return { fonte, itens: [] as ItemDeFeed[], ok: false }
    }
  }))
  const noticias = montarNoticias(resultados, agora)

  // Destaques sem imagem: tenta a og:image da própria matéria (só as primeiras, para não pesar).
  await Promise.all(noticias.slice(0, 14).filter(n => !n.imagem).map(async n => {
    try { n.imagem = imagemDaPagina(await buscarTexto(n.link, 6_000, 400_000)) } catch { /* fica com a capa ilustrada */ }
  }))

  return {
    numero: numeroDaEdicao(agora),
    data: agora.toISOString().slice(0, 10),
    geradoEm: agora.toISOString(),
    noticias,
    fontes: resultados.map(r => ({ nome: r.fonte.nome, ok: r.ok, itens: r.itens.length })),
  }
}
