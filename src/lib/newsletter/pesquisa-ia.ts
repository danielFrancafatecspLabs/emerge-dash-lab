import { decodificar, textoPuro } from './rss'
import type { Edicao } from './edicao'

// Pesquisa em IA no beOn Radar: os pesquisadores que movem a área (com nome e foto) e os papers em destaque.
//
// - Papers de cada pesquisador: uma única consulta à API do arXiv com todos os nomes, do mais novo ao mais antigo.
// - Papers em destaque: o Daily Papers do Hugging Face (os papers do dia, votados pela comunidade de IA); se ele não
//   responder, os mais recentes do arXiv em IA, aprendizado de máquina e linguagem.
// - Fotos: a imagem do artigo do pesquisador na Wikipedia (Wikimedia Commons); sem foto, as iniciais.
// - Novidade de um pesquisador: paper novo no arXiv (últimos DIAS_DE_NOVIDADE dias), paper dele entre os destaques do
//   dia ou o nome dele nas notícias da edição.
//
// Este módulo é puro (serve ao navegador e ao servidor). A leitura das fontes, com cache no servidor, está em
// pesquisa-ia-fontes.ts.

export interface Pesquisador {
  id: string
  nome: string
  /** Por que acompanhar: fatos conhecidos da trajetória. */
  conhecidoPor: string
  /** Título do artigo na Wikipedia em inglês (de onde vem a foto). */
  wikipedia: string
  /** Como o nome aparece como autor no arXiv. */
  nomesNoArxiv: string[]
  /** Como o nome aparece nas notícias (o completo e, quando inconfundível, só o sobrenome). */
  citadoComo: string[]
}

export const PESQUISADORES: Pesquisador[] = [
  { id: 'hinton', nome: 'Geoffrey Hinton', conhecidoPor: 'Um dos pais do deep learning. Prêmio Turing 2018 e Nobel de Física 2024.',
    wikipedia: 'Geoffrey_Hinton', nomesNoArxiv: ['Geoffrey Hinton', 'Geoffrey E. Hinton'], citadoComo: ['Geoffrey Hinton', 'Hinton'] },
  { id: 'lecun', nome: 'Yann LeCun', conhecidoPor: 'Criador das redes neurais convolucionais. Prêmio Turing 2018.',
    wikipedia: 'Yann_LeCun', nomesNoArxiv: ['Yann LeCun'], citadoComo: ['Yann LeCun', 'LeCun'] },
  { id: 'bengio', nome: 'Yoshua Bengio', conhecidoPor: 'Deep learning e segurança da IA. Prêmio Turing 2018.',
    wikipedia: 'Yoshua_Bengio', nomesNoArxiv: ['Yoshua Bengio'], citadoComo: ['Yoshua Bengio', 'Bengio'] },
  { id: 'hassabis', nome: 'Demis Hassabis', conhecidoPor: 'Cofundador do Google DeepMind e do AlphaFold. Nobel de Química 2024.',
    wikipedia: 'Demis_Hassabis', nomesNoArxiv: ['Demis Hassabis'], citadoComo: ['Demis Hassabis', 'Hassabis'] },
  { id: 'feifei', nome: 'Fei-Fei Li', conhecidoPor: 'Criadora do ImageNet e codiretora do Instituto de IA Centrada no Humano de Stanford.',
    wikipedia: 'Fei-Fei_Li', nomesNoArxiv: ['Fei-Fei Li', 'Li Fei-Fei'], citadoComo: ['Fei-Fei Li'] },
  { id: 'karpathy', nome: 'Andrej Karpathy', conhecidoPor: 'Membro fundador da OpenAI, ex-diretor de IA da Tesla e referência no ensino de IA.',
    wikipedia: 'Andrej_Karpathy', nomesNoArxiv: ['Andrej Karpathy'], citadoComo: ['Andrej Karpathy', 'Karpathy'] },
  { id: 'sutskever', nome: 'Ilya Sutskever', conhecidoPor: 'Coautor da AlexNet, cofundador da OpenAI e da Safe Superintelligence.',
    wikipedia: 'Ilya_Sutskever', nomesNoArxiv: ['Ilya Sutskever'], citadoComo: ['Ilya Sutskever', 'Sutskever'] },
  { id: 'ng', nome: 'Andrew Ng', conhecidoPor: 'Cofundador do Google Brain, do Coursera e da DeepLearning.AI.',
    wikipedia: 'Andrew_Ng', nomesNoArxiv: ['Andrew Ng', 'Andrew Y. Ng'], citadoComo: ['Andrew Ng'] },
  { id: 'vaswani', nome: 'Ashish Vaswani', conhecidoPor: 'Primeiro autor de “Attention Is All You Need”, o paper do Transformer.',
    wikipedia: 'Ashish_Vaswani', nomesNoArxiv: ['Ashish Vaswani'], citadoComo: ['Ashish Vaswani', 'Vaswani'] },
  { id: 'goodfellow', nome: 'Ian Goodfellow', conhecidoPor: 'Criador das redes adversárias generativas (GANs).',
    wikipedia: 'Ian_Goodfellow', nomesNoArxiv: ['Ian Goodfellow', 'Ian J. Goodfellow'], citadoComo: ['Ian Goodfellow', 'Goodfellow'] },
  { id: 'dean', nome: 'Jeff Dean', conhecidoPor: 'Cientista-chefe do Google; Google Brain, TensorFlow e Gemini.',
    wikipedia: 'Jeff_Dean', nomesNoArxiv: ['Jeff Dean', 'Jeffrey Dean'], citadoComo: ['Jeff Dean'] },
  { id: 'finn', nome: 'Chelsea Finn', conhecidoPor: 'Aprendizado de robôs e meta-learning em Stanford.',
    wikipedia: 'Chelsea_Finn', nomesNoArxiv: ['Chelsea Finn'], citadoComo: ['Chelsea Finn'] },
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
