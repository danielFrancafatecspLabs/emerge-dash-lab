import { decodificar, textoPuro } from './rss'
import type { Edicao } from './edicao'

// Fronteira da tecnologia no beOn Radar: as pessoas que movem a IA e as demais tecnologias emergentes dos tópicos
// especiais (computação quântica, carros autônomos, robótica, espaço, chips, 6G, energia, biotecnologia, interfaces e
// futuros), com nome e foto, e os papers de cada área.
//
// - Papers de cada pessoa: uma única consulta à API do arXiv com todos os nomes, do mais novo ao mais antigo.
// - Papers da área: em IA, o Daily Papers do Hugging Face (votado pela comunidade de IA; na falta dele, os mais recentes
//   do arXiv); nas demais áreas, os mais recentes do arXiv na área, lidos só quando alguém abre a área.
// - Fotos: a imagem do artigo da pessoa na Wikipedia (Wikimedia Commons); sem foto, as iniciais.
// - Novidade de uma pessoa: paper novo no arXiv (últimos DIAS_DE_NOVIDADE dias), paper dela entre os destaques do dia,
//   paper compartilhado na Comunidade ou o nome dela nas notícias da edição.
//
// Este módulo é puro (serve ao navegador e ao servidor). A leitura das fontes, com cache no servidor, está em
// pesquisa-ia-fontes.ts.

/** Áreas: IA e os tópicos especiais da newsletter (mesmos ids de topicos.ts). */
export const AREAS = [
  { id: 'ia', curto: 'IA', nome: 'Inteligência artificial', arxiv: null },
  { id: 'quantica', curto: 'Quântica', nome: 'Computação quântica', arxiv: 'cat:quant-ph AND (abs:"quantum computing" OR abs:"quantum computer" OR abs:"error correction")' },
  { id: 'carros-autonomos', curto: 'Carros autônomos', nome: 'Carros autônomos', arxiv: 'abs:"autonomous driving" OR abs:"self-driving" OR abs:"autonomous vehicles"' },
  { id: 'robotica', curto: 'Robótica', nome: 'Robótica e humanoides', arxiv: 'cat:cs.RO' },
  { id: 'espaco', curto: 'Espaço', nome: 'Espaço e satélites', arxiv: 'abs:"LEO satellite" OR abs:"satellite communication" OR abs:"non-terrestrial network"' },
  { id: 'chips', curto: 'Chips', nome: 'Chips e semicondutores', arxiv: 'cat:cs.AR' },
  { id: 'redes-futuro', curto: '6G e redes', nome: '6G e redes do futuro', arxiv: '(cat:cs.NI OR cat:eess.SP) AND abs:6G' },
  { id: 'energia', curto: 'Energia', nome: 'Energia e clima', arxiv: '(cat:physics.plasm-ph AND abs:fusion) OR abs:"solid-state battery" OR abs:"lithium-ion battery"' },
  { id: 'biotech', curto: 'Biotech', nome: 'Biotecnologia', arxiv: 'cat:q-bio.BM OR abs:CRISPR OR abs:"protein design"' },
  { id: 'interfaces', curto: 'Interfaces e XR', nome: 'Interfaces cérebro-máquina e XR', arxiv: 'abs:"brain-computer interface" OR abs:"augmented reality" OR abs:"mixed reality"' },
  { id: 'futuros', curto: 'Futuros', nome: 'Futuros e tendências', arxiv: null },
] as const

export type AreaId = (typeof AREAS)[number]['id']
export const ehArea = (v: string): v is AreaId => AREAS.some(a => a.id === v)
export const nomeDaArea = (id: AreaId) => AREAS.find(a => a.id === id)!.nome
export const nomeCurtoDaArea = (id: AreaId) => AREAS.find(a => a.id === id)!.curto

export interface Pesquisador {
  id: string
  nome: string
  area: AreaId
  /** Por que acompanhar: fatos conhecidos da trajetória. */
  conhecidoPor: string
  /** Título do artigo na Wikipedia em inglês (de onde vem a foto). */
  wikipedia: string
  /** Como o nome aparece como autor no arXiv (vazio para quem não publica lá). */
  nomesNoArxiv: string[]
  /** Como o nome aparece nas notícias (o completo e, quando inconfundível, só o sobrenome). */
  citadoComo: string[]
  /** Nome comum: a notícia só conta se trouxer também uma destas palavras (minúsculas, sem acento). */
  contexto?: string[]
}

const p = (area: AreaId, id: string, nome: string, conhecidoPor: string, wikipedia: string, nomesNoArxiv: string[], citadoComo: string[] = [nome], contexto?: string[]): Pesquisador =>
  ({ id, nome, area, conhecidoPor, wikipedia, nomesNoArxiv, citadoComo, ...(contexto ? { contexto } : {}) })

export const PESQUISADORES: Pesquisador[] = [
  // Inteligência artificial
  p('ia', 'hinton', 'Geoffrey Hinton', 'Um dos pais do deep learning. Prêmio Turing 2018 e Nobel de Física 2024.', 'Geoffrey_Hinton', ['Geoffrey Hinton', 'Geoffrey E. Hinton'], ['Geoffrey Hinton', 'Hinton']),
  p('ia', 'lecun', 'Yann LeCun', 'Criador das redes neurais convolucionais. Prêmio Turing 2018.', 'Yann_LeCun', ['Yann LeCun'], ['Yann LeCun', 'LeCun']),
  p('ia', 'bengio', 'Yoshua Bengio', 'Deep learning e segurança da IA. Prêmio Turing 2018.', 'Yoshua_Bengio', ['Yoshua Bengio'], ['Yoshua Bengio', 'Bengio']),
  p('ia', 'hassabis', 'Demis Hassabis', 'Cofundador do Google DeepMind e do AlphaFold. Nobel de Química 2024.', 'Demis_Hassabis', ['Demis Hassabis'], ['Demis Hassabis', 'Hassabis']),
  p('ia', 'feifei', 'Fei-Fei Li', 'Criadora do ImageNet e codiretora do Instituto de IA Centrada no Humano de Stanford.', 'Fei-Fei_Li', ['Fei-Fei Li', 'Li Fei-Fei']),
  p('ia', 'karpathy', 'Andrej Karpathy', 'Membro fundador da OpenAI, ex-diretor de IA da Tesla e referência no ensino de IA.', 'Andrej_Karpathy', ['Andrej Karpathy'], ['Andrej Karpathy', 'Karpathy']),
  p('ia', 'sutskever', 'Ilya Sutskever', 'Coautor da AlexNet, cofundador da OpenAI e da Safe Superintelligence.', 'Ilya_Sutskever', ['Ilya Sutskever'], ['Ilya Sutskever', 'Sutskever']),
  p('ia', 'ng', 'Andrew Ng', 'Cofundador do Google Brain, do Coursera e da DeepLearning.AI.', 'Andrew_Ng', ['Andrew Ng', 'Andrew Y. Ng']),
  // Computação quântica
  p('quantica', 'preskill', 'John Preskill', 'Físico do Caltech que cunhou os termos “supremacia quântica” e “NISQ”.', 'John_Preskill', ['John Preskill'], ['John Preskill', 'Preskill']),
  p('quantica', 'shor', 'Peter Shor', 'Criador do algoritmo de Shor, que mostrou o poder do computador quântico contra a criptografia. Professor do MIT.', 'Peter_Shor', ['Peter W. Shor', 'Peter Shor']),
  p('quantica', 'aaronson', 'Scott Aaronson', 'Referência em complexidade computacional quântica na Universidade do Texas em Austin.', 'Scott_Aaronson', ['Scott Aaronson']),
  p('quantica', 'simmons', 'Michelle Simmons', 'Pioneira da computação quântica em silício (UNSW). Australiana do Ano em 2018.', 'Michelle_Simmons', ['Michelle Y. Simmons', 'Michelle Simmons']),
  // Carros autônomos
  p('carros-autonomos', 'thrun', 'Sebastian Thrun', 'Liderou o Stanley, vencedor do DARPA Grand Challenge 2005, e fundou o projeto de carro autônomo do Google.', 'Sebastian_Thrun', ['Sebastian Thrun'], ['Sebastian Thrun', 'Thrun']),
  p('carros-autonomos', 'urtasun', 'Raquel Urtasun', 'Fundadora da Waabi e ex-cientista-chefe da Uber ATG; professora da Universidade de Toronto.', 'Raquel_Urtasun', ['Raquel Urtasun'], ['Raquel Urtasun', 'Urtasun']),
  // Robótica e humanoides
  p('robotica', 'rus', 'Daniela Rus', 'Diretora do CSAIL, o laboratório de computação e IA do MIT.', 'Daniela_Rus', ['Daniela Rus']),
  p('robotica', 'abbeel', 'Pieter Abbeel', 'Aprendizado por reforço para robôs em Berkeley; cofundador da Covariant.', 'Pieter_Abbeel', ['Pieter Abbeel'], ['Pieter Abbeel', 'Abbeel']),
  p('robotica', 'finn', 'Chelsea Finn', 'Aprendizado de robôs e meta-learning em Stanford; cofundadora da Physical Intelligence.', 'Chelsea_Finn', ['Chelsea Finn']),
  p('robotica', 'raibert', 'Marc Raibert', 'Fundador da Boston Dynamics, dos robôs que andam, correm e dão saltos.', 'Marc_Raibert', ['Marc Raibert', 'Marc H. Raibert'], ['Marc Raibert', 'Raibert']),
  // Espaço e satélites
  p('espaco', 'seager', 'Sara Seager', 'Astrofísica do MIT que busca sinais de vida em exoplanetas.', 'Sara_Seager', ['Sara Seager']),
  // Chips e semicondutores
  p('chips', 'dally', 'Bill Dally', 'Cientista-chefe da Nvidia e referência em arquitetura de computadores.', 'Bill_Dally', ['William J. Dally', 'Bill Dally']),
  p('chips', 'lisasu', 'Lisa Su', 'CEO da AMD, engenheira de semicondutores com doutorado no MIT.', 'Lisa_Su', [], ['Lisa Su'], ['amd']),
  // 6G e redes do futuro
  p('redes-futuro', 'rappaport', 'Theodore Rappaport', 'Pioneiro das ondas milimétricas que viabilizaram o 5G; fundador do NYU Wireless.', 'Theodore_S._Rappaport', ['Theodore S. Rappaport', 'Theodore Rappaport'], ['Theodore Rappaport', 'Rappaport']),
  // Energia e clima
  p('energia', 'chiang', 'Yet-Ming Chiang', 'Professor do MIT, cofundador da A123 Systems e da Form Energy, de baterias.', 'Yet-Ming_Chiang', ['Yet-Ming Chiang']),
  // Biotecnologia
  p('biotech', 'doudna', 'Jennifer Doudna', 'Coinventora da edição genética CRISPR. Nobel de Química 2020.', 'Jennifer_Doudna', ['Jennifer A. Doudna', 'Jennifer Doudna'], ['Jennifer Doudna', 'Doudna']),
  p('biotech', 'baker', 'David Baker', 'Pioneiro do design de proteínas por computador. Nobel de Química 2024.', 'David_Baker_(biochemist)', [], ['David Baker'], ['protein', 'proteina', 'nobel', 'biochem', 'bioquim']),
  p('biotech', 'fzhang', 'Feng Zhang', 'Pioneiro do CRISPR em células humanas, no Broad Institute do MIT e de Harvard.', 'Feng_Zhang', [], ['Feng Zhang'], ['crispr', 'broad institute', 'gene', 'genetic', 'genetica']),
  // Interfaces cérebro-máquina e XR
  p('interfaces', 'rao', 'Rajesh Rao', 'Interfaces cérebro-computador na Universidade de Washington.', 'Rajesh_P._N._Rao', ['Rajesh P. N. Rao', 'Rajesh P.N. Rao']),
  // Futuros e tendências
  p('futuros', 'webb', 'Amy Webb', 'Futurista, fundadora do Future Today Institute e professora da NYU Stern.', 'Amy_Webb', []),
  p('futuros', 'kurzweil', 'Ray Kurzweil', 'Futurista e inventor, autor de “A Singularidade Está Próxima”.', 'Ray_Kurzweil', [], ['Ray Kurzweil', 'Kurzweil']),
]

export const DIAS_DE_NOVIDADE = 14
const PAPERS_POR_PESQUISADOR = 4
export const DESTAQUES = 8

export interface Paper {
  /** Identificador do arXiv, sem a versão (ex.: 2410.01234). */
  id: string
  titulo: string
  resumo: string
  autores: string[]
  link: string
  pdf: string | null
  publicadoEm: string | null
  categoria: string | null
  /** Votos no Daily Papers do Hugging Face. */
  votos?: number
  comentarios?: number
  imagem?: string | null
}

export interface FotoDoPesquisador { url: string; pagina: string }

export interface Novidade {
  tipo: 'paper' | 'destaque' | 'noticia'
  titulo: string
  link: string
  em: string | null
  fonte: string
}

export interface CitacaoNaNoticia { titulo: string; link: string; fonte: string; publicadoEm: string | null }

export interface PesquisadorNoRadar extends Pesquisador {
  foto: FotoDoPesquisador | null
  /** Últimos papers no arXiv, do mais novo ao mais antigo. */
  papers: Paper[]
  noticias: CitacaoNaNoticia[]
  /** Novidades, da mais recente à mais antiga: paper novo, paper em destaque, citação nas notícias. */
  novidades: Novidade[]
}

export interface PainelDePesquisa {
  pesquisadores: PesquisadorNoRadar[]
  destaques: Paper[]
  /** De onde vêm os destaques: votos do Hugging Face ou, na falta dele, os mais recentes do arXiv. */
  destaquesFonte: 'huggingface' | 'arxiv' | null
  /** Data do paper mais antigo lido do arXiv: antes dela, não sabemos dizer se houve paper. */
  arxivDesde: string | null
  diasDeNovidade: number
  atualizadoEm: string
  fontes: { nome: string; ok: boolean }[]
}

// ── Nomes ───────────────────────────────────────────────────────────────────────────────────

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** "Geoffrey E. Hinton" e "Geoffrey Hinton" viram "geoffrey hinton" (iniciais do meio caem). */
export function normalizarNome(nome: string): string {
  const partes = semAcento(nome).toLowerCase().replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean)
  return partes.filter((p, i) => i === 0 || i === partes.length - 1 || p.length > 1).join(' ')
}

/** O autor do arXiv é este pesquisador? */
export const ehAutor = (p: Pesquisador, autor: string) => p.nomesNoArxiv.some(n => normalizarNome(n) === normalizarNome(autor))

const textoComparavel = (s: string) => ` ${semAcento(s).toLowerCase().replace(/[^a-z0-9-]+/g, ' ')} `

/** A notícia cita o pesquisador pelo nome? */
export function citaPesquisador(p: Pesquisador, texto: string): boolean {
  const t = textoComparavel(texto)
  if (p.contexto && !p.contexto.some(c => t.includes(` ${c}`))) return false
  return p.citadoComo.some(c => t.includes(textoComparavel(c)))
}

// ── arXiv ───────────────────────────────────────────────────────────────────────────────────

const httpsDe = (u: string | null | undefined) => {
  const v = u ? decodificar(u).trim().replace(/^http:\/\//i, 'https://') : ''
  return /^https:\/\//i.test(v) ? v : null
}

const idDoArxiv = (u: string) => /arxiv\.org\/(?:abs|pdf)\/([^\s?#]+?)(?:v\d+)?(?:\.pdf)?$/i.exec(u.trim())?.[1] ?? null

function tag(bloco: string, nome: string): string | null {
  const m = new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i').exec(bloco)
  return m ? m[1] : null
}

/** Lê o Atom da API do arXiv. */
export function lerArxiv(xml: string): Paper[] {
  const papers: Paper[] = []
  for (const [bloco] of xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)) {
    const abs = httpsDe(tag(bloco, 'id'))
    const id = abs && idDoArxiv(abs)
    const titulo = textoPuro(tag(bloco, 'title') ?? '')
    if (!id || !titulo) continue
    const autores = [...bloco.matchAll(/<author\b[\s\S]*?<\/author>/gi)].map(a => textoPuro(tag(a[0], 'name') ?? '')).filter(Boolean)
    const pdf = /<link\b[^>]*title\s*=\s*["']pdf["'][^>]*>/i.exec(bloco)?.[0]
    const publicado = Date.parse(textoPuro(tag(bloco, 'published') ?? ''))
    papers.push({
      id, titulo, autores,
      resumo: textoPuro(tag(bloco, 'summary') ?? '').slice(0, 600),
      link: `https://arxiv.org/abs/${id}`,
      pdf: httpsDe(pdf && /href\s*=\s*["']([^"']+)["']/i.exec(pdf)?.[1]),
      publicadoEm: Number.isFinite(publicado) ? new Date(publicado).toISOString() : null,
      categoria: /<arxiv:primary_category\b[^>]*term\s*=\s*["']([^"']+)["']/i.exec(bloco)?.[1] ?? null,
    })
  }
  return papers
}

/** Os papers de cada pesquisador (do mais novo ao mais antigo), a partir de uma lista de papers do arXiv. */
export function papersPorPesquisador(papers: Paper[], pesquisadores = PESQUISADORES): Record<string, Paper[]> {
  const ordenados = [...papers].sort((a, b) => (b.publicadoEm ?? '').localeCompare(a.publicadoEm ?? ''))
  return Object.fromEntries(pesquisadores.map(p => [p.id,
    ordenados.filter(x => x.autores.some(a => ehAutor(p, a))).slice(0, PAPERS_POR_PESQUISADOR)]))
}

export function consultaDosPesquisadores(pesquisadores = PESQUISADORES): string {
  return pesquisadores.flatMap(p => p.nomesNoArxiv).map(n => `au:"${n}"`).join(' OR ')
}

// ── Hugging Face Daily Papers ───────────────────────────────────────────────────────────────

interface ItemDoDailyPapers {
  paper?: { id?: string; title?: string; summary?: string; authors?: { name?: string }[]; publishedAt?: string; upvotes?: number }
  title?: string
  summary?: string
  publishedAt?: string
  thumbnail?: string
  numComments?: number
}

/** Os papers do Daily Papers, do mais votado ao menos votado. */
export function papersDoHuggingFace(json: unknown, limite = DESTAQUES): Paper[] {
  if (!Array.isArray(json)) return []
  const papers: Paper[] = []
  for (const item of json as ItemDoDailyPapers[]) {
    const p = item?.paper
    const id = typeof p?.id === 'string' && /^[\w./-]{4,40}$/.test(p.id) ? p.id : null
    const titulo = textoPuro(String(p?.title ?? item?.title ?? ''))
    if (!id || !titulo) continue
    const publicado = Date.parse(String(p?.publishedAt ?? item?.publishedAt ?? ''))
    papers.push({
      id, titulo,
      resumo: textoPuro(String(p?.summary ?? item?.summary ?? '')).slice(0, 600),
      autores: (p?.authors ?? []).map(a => textoPuro(String(a?.name ?? ''))).filter(Boolean),
      link: `https://arxiv.org/abs/${id}`,
      pdf: `https://arxiv.org/pdf/${id}`,
      publicadoEm: Number.isFinite(publicado) ? new Date(publicado).toISOString() : null,
      categoria: null,
      votos: typeof p?.upvotes === 'number' ? p.upvotes : 0,
      comentarios: typeof item?.numComments === 'number' ? item.numComments : 0,
      imagem: httpsDe(item?.thumbnail),
    })
  }
  return papers.sort((a, b) => (b.votos ?? 0) - (a.votos ?? 0)).slice(0, limite)
}

// ── Wikipedia ───────────────────────────────────────────────────────────────────────────────

/** A foto do resumo da página na Wikipedia (null se a página não tem imagem). */
export function fotoDaWikipedia(json: unknown): FotoDoPesquisador | null {
  const j = json as { thumbnail?: { source?: string }; content_urls?: { desktop?: { page?: string } } } | null
  const url = httpsDe(j?.thumbnail?.source)
  const pagina = httpsDe(j?.content_urls?.desktop?.page)
  return url ? { url, pagina: pagina ?? '' } : null
}

// ── Montagem ────────────────────────────────────────────────────────────────────────────────

/** O que vem das fontes (guardado em cache); as novidades são calculadas a cada pedido. */
export interface DadosDePesquisa {
  papers: Record<string, Paper[]>
  arxivDesde: string | null
  destaques: Paper[]
  destaquesFonte: PainelDePesquisa['destaquesFonte']
  fotos: Record<string, FotoDoPesquisador | null>
  fotosEm: string | null
  atualizadoEm: string
  fontes: { nome: string; ok: boolean }[]
}

const diasAtras = (iso: string | null, agora: number) => (iso ? (agora - Date.parse(iso)) / 86_400_000 : Infinity)

/** Junta os dados das fontes com as notícias da edição e calcula a novidade de cada pesquisador. */
export function montarPainel(dados: DadosDePesquisa, edicao: Edicao | null, agora = Date.now(), pesquisadores = PESQUISADORES): PainelDePesquisa {
  const lista = pesquisadores.map((p, ordem) => {
    const papers = dados.papers[p.id] ?? []
    const noticias: CitacaoNaNoticia[] = (edicao?.noticias ?? [])
      .filter(n => citaPesquisador(p, `${n.titulo} ${n.resumo}`))
      .map(n => ({ titulo: n.titulo, link: n.link, fonte: n.fonte, publicadoEm: n.publicadoEm }))
    const novos = papers.filter(x => diasAtras(x.publicadoEm, agora) <= DIAS_DE_NOVIDADE)
    const emDestaque = dados.destaques.filter(x => x.autores.some(a => ehAutor(p, a)) && !novos.some(n => n.id === x.id))
    const novidades: Novidade[] = [
      ...novos.map(x => ({ tipo: 'paper' as const, titulo: x.titulo, link: x.link, em: x.publicadoEm, fonte: 'arXiv' })),
      ...emDestaque.map(x => ({ tipo: 'destaque' as const, titulo: x.titulo, link: x.link, em: x.publicadoEm, fonte: 'Hugging Face Daily Papers' })),
      ...noticias.map(n => ({ tipo: 'noticia' as const, titulo: n.titulo, link: n.link, em: n.publicadoEm, fonte: n.fonte })),
    ].sort((a, b) => (b.em ?? '').localeCompare(a.em ?? ''))
    return { ordem, p: { ...p, foto: dados.fotos[p.id] ?? null, papers, noticias, novidades } }
  })
  // Quem tem novidade sobe (a mais recente primeiro); os demais seguem a ordem da lista.
  lista.sort((a, b) => {
    const na = a.p.novidades[0]?.em ?? (a.p.novidades.length ? '0' : null)
    const nb = b.p.novidades[0]?.em ?? (b.p.novidades.length ? '0' : null)
    if (na && nb) return nb.localeCompare(na) || a.ordem - b.ordem
    if (na || nb) return na ? -1 : 1
    return a.ordem - b.ordem
  })
  return {
    pesquisadores: lista.map(x => x.p),
    destaques: dados.destaques,
    destaquesFonte: dados.destaquesFonte,
    arxivDesde: dados.arxivDesde,
    diasDeNovidade: DIAS_DE_NOVIDADE,
    atualizadoEm: dados.atualizadoEm,
    fontes: dados.fontes,
  }
}

// ── Papers compartilhados na Comunidade ─────────────────────────────────────────────────────

export interface Compartilhamento { paperId: string; titulo: string; postId: string; autor: string; em: string }

/**
 * Papers do pesquisador que alguém compartilhou na Comunidade nos últimos DIAS_DE_NOVIDADE dias (o post leva o link
 * ou o identificador do paper no arXiv).
 */
export function compartilhamentosDe(
  p: Pick<PesquisadorNoRadar, 'papers'> & Pesquisador,
  destaques: Paper[],
  posts: { id: string; authorName: string; title: string; content: string; linkUrl: string; createdAt: string }[],
  agora = Date.now(),
): Compartilhamento[] {
  const papers = [...p.papers, ...destaques.filter(d => d.autores.some(a => ehAutor(p, a)))]
  const achados: Compartilhamento[] = []
  for (const post of posts) {
    if (diasAtras(post.createdAt, agora) > DIAS_DE_NOVIDADE) continue
    const texto = `${post.linkUrl} ${post.title} ${post.content}`
    const paper = papers.find(x => new RegExp(`(^|[^\\d.])${x.id.replace(/\./g, '\\.')}(?![\\d])`).test(texto))
    if (paper) achados.push({ paperId: paper.id, titulo: paper.titulo, postId: post.id, autor: post.authorName, em: post.createdAt })
  }
  return achados.sort((a, b) => b.em.localeCompare(a.em))
}
