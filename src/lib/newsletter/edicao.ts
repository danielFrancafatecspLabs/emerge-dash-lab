import { imagemDaPagina, lerFeed, type ItemDeFeed } from './rss'

// Newsletter diária: varre feeds públicos de tecnologia e mercado (dos grandes jornais às consultorias), fica só com
// tecnologias emergentes, Vale do Silício, mercado e bolsa, bolhas e impactos, e monta a edição (manchete, resumo e
// seções). Também conta quantas fontes deram a mesma história (repercussão) e marca as que podem ser sinais de futuro.
// Sem chaves de API.

export type Secao = 'emergentes' | 'vale' | 'mercado' | 'bolhas' | 'impactos'

export const SECOES: { id: Secao; nome: string; descricao: string }[] = [
  { id: 'emergentes', nome: 'Tecnologias emergentes', descricao: 'IA, quântica, chips, robótica, espaço, biotecnologia' },
  { id: 'vale', nome: 'Vale do Silício', descricao: 'Big techs, startups, lançamentos e rodadas de investimento' },
  { id: 'mercado', nome: 'Mercado e bolsa', descricao: 'Ações, investimentos, resultados e IPOs de tecnologia' },
  { id: 'bolhas', nome: 'Bolhas e riscos', descricao: 'Euforia, valuations esticados e correções' },
  { id: 'impactos', nome: 'Impactos', descricao: 'Trabalho, regulação, energia e sociedade' },
]

export interface Fonte { nome: string; url: string }

const gnews = (q: string, lingua: 'en' | 'pt' = 'en') => lingua === 'pt'
  ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
  : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`

/**
 * Feeds padrão (podem ser trocados por NEWSLETTER_FEEDS="Nome|https://…,Outro|https://…"). Só fontes de reputação
 * editorial reconhecida: agências públicas, grandes jornais, imprensa científica e universitária, imprensa
 * especializada em tecnologia e telecom, e consultorias. Quem não publica RSS aberto (Gartner, Reuters, AP, Estadão,
 * O Globo, Valor…) entra pela busca do Google Notícias restrita ao site, e o nome diz isso. Uma fonte que falha não
 * derruba as demais; o rodapé da edição mostra quais responderam.
 */
export const FONTES_PADRAO: Fonte[] = [
  // ── Internacionais: agências, jornais e redes de referência ──
  { nome: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml' },
  { nome: 'BBC Tecnologia', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { nome: 'The Guardian', url: 'https://www.theguardian.com/technology/rss' },
  { nome: 'Financial Times', url: 'https://www.ft.com/technology?format=rss' },
  { nome: 'The Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml' },
  { nome: 'Bloomberg Tecnologia', url: 'https://feeds.bloomberg.com/technology/news.rss' },
  { nome: 'The Economist', url: 'https://www.economist.com/science-and-technology/rss.xml' },
  { nome: 'Reuters (via Google Notícias)', url: gnews('site:reuters.com technology') },
  { nome: 'Associated Press (via Google Notícias)', url: gnews('site:apnews.com technology') },
  // ── Consultorias e análise ──
  { nome: 'Gartner (via Google Notícias)', url: gnews('Gartner (forecast OR survey OR predicts OR "hype cycle")') },
  { nome: 'Consultorias (via Google Notícias)', url: gnews('(McKinsey OR Forrester OR IDC OR Deloitte) technology report') },
  // ── Ciência e tecnologia (internacional) ──
  { nome: 'Nature', url: 'https://www.nature.com/nature.rss' },
  { nome: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { nome: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss' },
  { nome: 'Wired', url: 'https://www.wired.com/feed/rss' },
  { nome: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { nome: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
  { nome: 'Rest of World', url: 'https://restofworld.org/feed/latest' },
  // ── Vale do Silício e startups ──
  { nome: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { nome: 'VentureBeat', url: 'https://venturebeat.com/feed/' },
  { nome: 'Google Notícias: Vale do Silício', url: gnews('"Silicon Valley" OR "Y Combinator" OR startup funding round') },
  // ── Mercado e bolsa ──
  { nome: 'CNBC Tecnologia', url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html' },
  { nome: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  { nome: 'Google Notícias: bolha de IA', url: gnews('"AI bubble" OR "tech stocks"') },

  // ── Brasil: agências públicas e imprensa pública ──
  { nome: 'Agência Brasil (via Google Notícias)', url: gnews('site:agenciabrasil.ebc.com.br (tecnologia OR "inteligência artificial" OR ciência OR telecomunicações)', 'pt') },
  { nome: 'Agência FAPESP (via Google Notícias)', url: gnews('site:agencia.fapesp.br', 'pt') },
  { nome: 'BBC News Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml' },
  { nome: 'DW Brasil (via Google Notícias)', url: gnews('site:dw.com/pt-br (tecnologia OR ciência OR "inteligência artificial")', 'pt') },
  // ── Brasil: grandes jornais ──
  { nome: 'Folha Tec', url: 'https://feeds.folha.uol.com.br/tec/rss091.xml' },
  { nome: 'g1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
  { nome: 'Estadão (via Google Notícias)', url: gnews('site:estadao.com.br (tecnologia OR "inteligência artificial" OR startups OR "big techs")', 'pt') },
  { nome: 'O Globo (via Google Notícias)', url: gnews('site:oglobo.globo.com (tecnologia OR "inteligência artificial" OR startups)', 'pt') },
  { nome: 'Valor Econômico (via Google Notícias)', url: gnews('site:valor.globo.com (tecnologia OR "inteligência artificial" OR startups OR "big techs" OR telecom)', 'pt') },
  { nome: 'CNN Brasil Tecnologia', url: 'https://www.cnnbrasil.com.br/tecnologia/feed/' },
  // ── Brasil: negócios, mercado e startups ──
  { nome: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { nome: 'Exame', url: 'https://exame.com/feed/' },
  { nome: 'NeoFeed', url: 'https://neofeed.com.br/feed/' },
  { nome: 'Brazil Journal', url: 'https://braziljournal.com/feed/' },
  { nome: 'Startups.com.br', url: 'https://startups.com.br/feed/' },
  // ── Brasil: ciência e universidades ──
  { nome: 'Revista Pesquisa FAPESP', url: 'https://revistapesquisa.fapesp.br/feed/' },
  { nome: 'Jornal da USP', url: 'https://jornal.usp.br/feed/' },
  { nome: 'MIT Technology Review Brasil', url: 'https://mittechreview.com.br/feed/' },
  // ── Brasil: telecom (o setor da Claro) ──
  { nome: 'Teletime', url: 'https://teletime.com.br/feed/' },
  { nome: 'TeleSíntese', url: 'https://telesintese.com.br/feed/' },
  { nome: 'Mobile Time', url: 'https://www.mobiletime.com.br/feed/' },
  { nome: 'Anatel (via Google Notícias)', url: gnews('site:gov.br/anatel', 'pt') },
  // ── Brasil: tecnologia ──
  { nome: 'Google Notícias: tecnologias emergentes', url: gnews('inteligência artificial OR computação quântica OR big techs ações', 'pt') },
  { nome: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
  { nome: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/' },
  { nome: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
  { nome: 'TecMundo', url: 'https://rss.tecmundo.com.br/feed' },
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
    // Telecom (o setor da Claro)
    'open ran', 'espectro', 'spectrum', 'conectividade', 'telecomunica', 'internet das coisas', ' iot ', 'rede movel', 'redes moveis',
    'fibra optica', 'ftth', 'direct-to-device', 'direct to cell',
  ],
  // Quem lança e quem investe no Vale. Os verbos de lançamento só pesam junto de um ator do Vale (a seção pede 2 termos).
  vale: [
    'silicon valley', 'vale do silicio', 'y combinator', 'sequoia', 'andreessen', 'a16z', 'startup', 'unicorn', 'unicornio', 'founder',
    'fundador', 'big tech', 'apple', 'google', 'alphabet', ' meta ', 'microsoft', 'amazon', 'openai', 'anthropic', 'tesla', ' xai',
    'san francisco', 'cupertino', 'mountain view', 'launches', 'launch', 'unveils', 'lanca', 'lancamento', 'keynote', 'seed round', 'series a',
    'series b', 'series c',
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
  if (p.vale >= 2 && p.vale >= p.impactos) return 'vale'
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
  /** Outras fontes que deram a mesma história (repercussão). Ausente nas edições antigas. */
  outrasFontes?: string[]
  /** A matéria tem cara de sinal de futuro (primeira vez, protótipo, piloto, pesquisa nova…). */
  possivelSinal?: boolean
}

export interface Edicao {
  numero: number
  data: string
  geradoEm: string
  noticias: Noticia[]
  fontes: { nome: string; ok: boolean; itens: number }[]
}

const chaveTitulo = (t: string) => normalizar(t).replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3).slice(0, 8).join(' ')

const VAZIAS = new Set(['that', 'this', 'with', 'from', 'what', 'will', 'have', 'into', 'about', 'after', 'over', 'says', 'said', 'como', 'para',
  'pelo', 'pela', 'mais', 'sobre', 'apos', 'entre', 'their', 'they', 'than', 'your', 'when', 'just', 'more', 'new', 'nova', 'novo'])
/** Palavras que identificam a história (para achar a mesma notícia em fontes diferentes). */
export const palavrasDaHistoria = (titulo: string) =>
  new Set(normalizar(titulo).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 3 && !VAZIAS.has(w)))

export function mesmaHistoria(a: Set<string>, b: Set<string>, limiar = 0.45): boolean {
  if (!a.size || !b.size) return false
  let comuns = 0
  a.forEach(w => { if (b.has(w)) comuns++ })
  return comuns >= 2 && comuns / (a.size + b.size - comuns) >= limiar
}

const TERMOS_DE_SINAL = [
  'first-ever', 'world first', 'for the first time', 'breakthrough', 'prototype', 'pilot program', 'pilot project', 'clinical trial', 'field trial',
  'researchers', 'scientists', 'study finds', 'new study', 'experimental', 'early-stage', 'proof of concept', 'pela primeira vez', 'inedit',
  'prototipo', 'projeto piloto', 'pesquisadores', 'cientistas', 'novo estudo', 'experimental', 'descoberta', 'prova de conceito',
]

/** A matéria tem cara de sinal de futuro: algo que acontece pela primeira vez, um protótipo, piloto ou pesquisa nova. */
export function ehPossivelSinal(titulo: string, resumo: string): boolean {
  const t = normalizar(`${titulo} ${resumo}`)
  return TERMOS_DE_SINAL.some(k => t.includes(k))
}

/**
 * Seleciona e ordena: recentes (até 3 dias), sem duplicatas, seções equilibradas. A mesma história em fontes
 * diferentes vira uma notícia só, que guarda as outras fontes (repercussão) e sobe na ordem; com imagem também sobe.
 */
export function montarNoticias(porFonte: { fonte: Fonte; itens: ItemDeFeed[] }[], agora = new Date(), limite = 48): Noticia[] {
  const vistos = new Set<string>()
  const candidatas: (Noticia & { peso: number; palavras: Set<string> })[] = []
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
      const relevancia = p.emergentes + p.vale + p.mercado + p.bolhas * 1.5 + p.impactos
      candidatas.push({
        id: chave.replace(/ /g, '-').slice(0, 80), titulo: it.titulo, link: it.link, fonte: fonte.nome,
        publicadoEm: it.publicadoEm, resumo: it.resumo, imagem: it.imagem, secao, outrasFontes: [],
        possivelSinal: ehPossivelSinal(it.titulo, it.resumo),
        peso: relevancia * 2 + (it.imagem ? 3 : 0) - horas / 8, palavras: palavrasDaHistoria(it.titulo),
      })
    }
  }
  // Repercussão: quantas outras fontes deram a mesma história. Cada uma soma peso.
  for (const c of candidatas) {
    const outras = new Set(candidatas.filter(o => o !== c && o.fonte !== c.fonte && mesmaHistoria(c.palavras, o.palavras)).map(o => o.fonte))
    c.peso += outras.size * 3
  }
  candidatas.sort((a, b) => b.peso - a.peso)
  // Agrupa a mesma história (fica a versão de maior peso) e limita a 12 por seção, para nenhuma tomar a edição.
  const porSecao = new Map<Secao, number>()
  const aceitas: (typeof candidatas)[number][] = []
  for (const c of candidatas) {
    const igual = aceitas.find(a => mesmaHistoria(a.palavras, c.palavras))
    if (igual) {
      if (c.fonte !== igual.fonte && !igual.outrasFontes!.includes(c.fonte)) igual.outrasFontes!.push(c.fonte)
      igual.possivelSinal ||= c.possivelSinal
      continue
    }
    const k = porSecao.get(c.secao) ?? 0
    if (k >= 12 || aceitas.length >= limite) continue
    porSecao.set(c.secao, k + 1)
    aceitas.push(c)
  }
  return aceitas.map(({ peso: _peso, palavras: _palavras, ...n }) => n)
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
