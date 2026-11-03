import type { Noticia, Secao } from '@/lib/newsletter/edicao'
import type { CommunityPost } from './model'
import { AUTOMACAO_RADAR } from './automacao'
import { loadPosts, savePosts } from './posts-store'

export { AUTOMACAO_RADAR, ehAutomacaoDoRadar } from './automacao'

// Automação "beOn Radar - Newsletter": as notícias da edição do dia viram discussões públicas no fórum, cada uma com uma
// provocação no tom da matéria (o que você acha? concorda? que implicação ou cenário você enxerga?). O id é
// determinístico (radar:<id da notícia>), então cada notícia abre uma discussão só, por mais que a sincronização rode.
// A provocação sai de modelos por tema; com o LLM configurado (LLM_API_KEY/LLM_API_BASE), ele escreve a pergunta
// específica da matéria e, se falhar, fica o modelo.

const sem = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `.replace(/[“”"‘’'(),.:;!?]/g, ' ')

interface Tema {
  id: string
  termos: string[]
  pergunta: string
  /** Tópico da Comunidade da discussão (para o "Para você" de quem segue o tema). */
  topico?: string
}

// Ordem importa: o primeiro tema que casar dá o tom da provocação.
const TEMAS: Tema[] = [
  {
    id: 'bolha', termos: ['bubble', 'bolha', 'overvalued', 'sobrevalorizad', ' hype ', 'frenzy', 'euforia', 'market crash', 'stock crash', 'market correction', 'stock correction', 'correcao no mercado', 'correcao na bolsa', 'dot-com', 'pontocom', 'speculat', 'especulac', 'selloff', 'sell-off', 'plunge', 'despenc'],
    pergunta: 'Bolha ou fundamento? Se a correção vier, que apostas de tecnologia sobrevivem e quais ficam pelo caminho?',
  },
  {
    id: 'regulacao', termos: ['regulation', 'regulac', 'regulator', 'antitrust', 'lawsuit', 'processo judicial', ' ban ', 'proibe', ' lei ', ' law ', 'copyright', 'direitos autorais', 'anatel', 'congress', 'senado'],
    pergunta: 'Se uma regra assim chegasse ao Brasil, o que mudaria para uma operadora como a Claro? Ela protege as pessoas ou freia a inovação?',
  },
  {
    id: 'trabalho', termos: ['jobs', 'empregos', 'layoff', 'demiss', 'workers', 'trabalhadores', 'workforce', 'hiring', 'contratac'],
    pergunta: 'Que tarefas do nosso dia a dia mudam primeiro com isso? É substituição de gente ou um cenário de requalificação?',
  },
  {
    id: 'seguranca', termos: ['privacy', 'privacidade', 'security', 'seguranca', 'fraud', 'fraude', 'hack', 'deepfake', 'breach', 'vazamento', 'golpe', 'scam', 'cyber'],
    pergunta: 'Quem fica exposto se isso der errado? Que salvaguardas a gente precisaria antes de adotar algo parecido com nossos clientes?',
    topico: 'ciberseguranca',
  },
  {
    id: 'energia', termos: ['energy', 'energia', 'power grid', 'data center', 'datacenter', 'emissions', 'emissoes', 'nuclear', 'water', 'climate', 'clima'],
    pergunta: 'A conta de energia e de infraestrutura fecha? Que implicação isso traz para redes e data centers por aqui?',
    topico: 'sustentabilidade',
  },
  {
    id: 'quantica', termos: ['quantum', 'quantica'],
    pergunta: 'Estamos a quantos anos de isso importar de verdade? Que cenário você enxerga para criptografia e otimização de redes?',
    topico: 'quantica',
  },
  {
    id: 'telecom', termos: [' 5g ', ' 6g ', 'satellite', 'satelite', 'starlink', 'telecom', 'operadora', 'carrier', 'spectrum', 'espectro', 'open ran', 'fibra', 'fiber'],
    pergunta: 'Ameaça ou oportunidade para as operadoras? Como isso mexe com a nossa rede e com o que oferecemos aos clientes?',
    topico: 'future-network',
  },
  {
    id: 'robotica', termos: ['robot', ' robo', 'humanoid', 'humanoide', 'drone', 'autonomous', 'autonomo', 'self-driving'],
    pergunta: 'Onde isso entraria primeiro em campo: rede, loja ou logística? Você confiaria nessa autonomia sem alguém supervisionando?',
  },
  {
    id: 'chips', termos: ['nvidia', ' chip', 'semiconductor', 'semicondutor', ' gpu', ' tsmc', ' amd ', ' intel '],
    pergunta: 'Quem controla o hardware controla a IA? Que implicação isso tem para o custo e o acesso à computação que a gente usa?',
  },
  {
    id: 'agentes', termos: ['agentic', 'ai agent', 'agentes de ia', 'agente de ia', ' agents ', ' agentes '],
    pergunta: 'Agentes assim já dariam conta de um processo real nosso? Qual você entregaria primeiro, e com que limites?',
    topico: 'agentes',
  },
  {
    id: 'investimento', termos: [' ipo', 'funding', 'rodada', 'venture capital', 'valuation', 'investor', 'investidor', 'raises', 'capta', 'acquisition', 'aquisicao', 'compra da', 'acquire'],
    pergunta: 'Esse dinheiro está apostando no lugar certo? Que sinal isso dá sobre para onde o setor está indo?',
  },
  {
    id: 'ia', termos: [' ai ', 'artificial intelligence', 'inteligencia artificial', ' ia ', 'genai', 'llm', 'openai', 'anthropic', 'chatgpt', 'gemini', 'claude', 'copilot', 'machine learning'],
    pergunta: 'Isso muda o jogo ou é mais um anúncio? Onde você colocaria essa capacidade num experimento nosso amanhã?',
    topico: 'ia-generativa',
  },
]

const PERGUNTA_DA_SECAO: Record<Secao, string> = {
  emergentes: 'Isso é sinal de algo grande ou ainda é cedo demais? Em quanto tempo você vê essa tecnologia chegando ao nosso dia a dia?',
  vale: 'O Vale está apostando no lugar certo? Se isso pegar, o que muda para uma operadora como a Claro e para os nossos clientes?',
  mercado: 'O mercado está precificando certo? Se esse movimento se confirmar, quem ganha e quem perde no nosso setor?',
  bolhas: 'Bolha ou fundamento? Se a correção vier, que apostas de tecnologia sobrevivem?',
  impactos: 'Quem paga a conta desse impacto? Que implicação isso traz para clientes, times e regulação no Brasil?',
}

const ABERTURA_DA_SECAO: Record<Secao, string> = {
  emergentes: 'Tecnologia emergente no Radar de hoje:',
  vale: 'Direto do Vale do Silício no Radar de hoje:',
  mercado: 'Movimento de mercado no Radar de hoje:',
  bolhas: 'Alerta de bolha no Radar de hoje:',
  impactos: 'Impacto na sociedade no Radar de hoje:',
}

export function temaDaNoticia(n: Pick<Noticia, 'titulo' | 'resumo'>): Tema | null {
  const t = sem(`${n.titulo} ${n.resumo}`)
  return TEMAS.find(tema => tema.termos.some(k => t.includes(k))) ?? null
}

/** A provocação da notícia pelo tema (ou, sem tema, pela seção). */
export function provocacaoPorModelo(n: Pick<Noticia, 'titulo' | 'resumo' | 'secao'>): string {
  // Na seção de bolhas, o tom é sempre o da bolha, mesmo que a matéria cite IA ou chips.
  if (n.secao === 'bolhas') return PERGUNTA_DA_SECAO.bolhas
  return temaDaNoticia(n)?.pergunta ?? PERGUNTA_DA_SECAO[n.secao]
}

/** Texto da discussão: o resumo da matéria, a provocação (logo no começo, para aparecer no feed) e as perguntas. */
export function conteudoDaDiscussao(n: Noticia, provocacao: string): string {
  const resumo = n.resumo.length > 600 ? `${n.resumo.slice(0, 597)}…` : n.resumo
  return [
    resumo ? `${ABERTURA_DA_SECAO[n.secao]} ${resumo}` : ABERTURA_DA_SECAO[n.secao].replace(/:$/, '.'),
    `Provocação: ${provocacao}`,
    'E você? O que acha disso? Concorda com essa leitura? Que implicação ou cenário você enxerga para a Claro e para o nosso trabalho no Lab?',
    `Fonte: ${n.fonte}. Discussão aberta automaticamente pelo beOn Radar; a matéria completa está no link.`,
  ].filter(Boolean).join('\n\n')
}

export const idDaDiscussao = (noticiaId: string) => `radar:${noticiaId}`

/** Só endereços web de imagem (http ou https, como os que a newsletter já mostra) vão para a publicação. */
export const imagemValida = (url: string | null | undefined): url is string => !!url && /^https?:\/\/[^\s"'<>]+$/.test(url) && url.length <= 2000

/** Publicação do fórum para uma notícia do Radar. */
export function discussaoDaNoticia(n: Noticia, provocacao = provocacaoPorModelo(n), criadoEm = new Date()): CommunityPost {
  const topico = n.secao === 'bolhas' ? undefined : temaDaNoticia(n)?.topico
  return {
    id: idDaDiscussao(n.id),
    authorId: AUTOMACAO_RADAR.id,
    authorUsername: AUTOMACAO_RADAR.username,
    authorName: AUTOMACAO_RADAR.nome,
    authorLab: AUTOMACAO_RADAR.lab,
    authorAvatar: AUTOMACAO_RADAR.avatar,
    kind: 'discussao',
    title: n.titulo.slice(0, 200),
    content: conteudoDaDiscussao(n, provocacao).slice(0, 5000),
    linkUrl: /^https?:\/\//.test(n.link) ? n.link : '',
    tags: topico ? [topico] : [],
    meta: imagemValida(n.imagem) ? { imagem: n.imagem } : {},
    createdAt: criadoEm.toISOString(),
    likes: [],
    comments: [],
  }
}

/**
 * Quais notícias da edição viram discussão: as primeiras de cada seção (a edição já vem ordenada por relevância),
 * para o fórum ter conversa sem ser soterrado. RADAR_DISCUSSOES_POR_SECAO muda o limite (padrão 3; 0 desliga).
 */
export function noticiasParaDiscutir(noticias: Noticia[], porSecao = Number(process.env.RADAR_DISCUSSOES_POR_SECAO ?? 3)): Noticia[] {
  const limite = Number.isFinite(porSecao) ? Math.max(0, porSecao) : 3
  const contagem = new Map<Secao, number>()
  return noticias.filter(n => {
    const k = contagem.get(n.secao) ?? 0
    if (k >= limite) return false
    contagem.set(n.secao, k + 1)
    return true
  })
}

/** Pergunta específica da matéria, escrita pelo LLM (null se não houver LLM ou se ele falhar). */
async function provocacaoPorLLM(n: Noticia): Promise<string | null> {
  if (!process.env.LLM_API_KEY || !process.env.LLM_API_BASE || process.env.RADAR_PROVOCACAO_LLM === '0') return null
  try {
    const { getLiteLLMClient, DEPLOYMENT_LLM } = await import('@/lib/llm')
    const resposta = await getLiteLLMClient().chat.completions.create({
      model: DEPLOYMENT_LLM,
      temperature: 0.7,
      max_tokens: 160,
      messages: [
        {
          role: 'system',
          content: 'Você modera o fórum de inovação da beOn Labs (P&D da Claro Brasil). Escreva UMA provocação curta em português do Brasil '
            + '(no máximo 2 frases, até 240 caracteres) para abrir a discussão da notícia: uma pergunta que convide a concordar ou discordar e a '
            + 'pensar em implicações ou cenários para uma operadora de telecom. Use só o que está na notícia: não invente números, nomes ou fatos. '
            + 'Responda apenas com a provocação, sem aspas.',
        },
        { role: 'user', content: `Seção: ${n.secao}\nTítulo: ${n.titulo}\nResumo: ${n.resumo.slice(0, 800)}` },
      ],
    }, { timeout: 12_000 })
    const texto = resposta.choices[0]?.message?.content?.trim().replace(/^["“]|["”]$/g, '') ?? ''
    return texto.length >= 20 && texto.length <= 400 ? texto : null
  } catch (err) {
    console.warn('[noticias-radar] LLM indisponível, usando a provocação do modelo:', String(err))
    return null
  }
}

/**
 * Abre no fórum as discussões das notícias que ainda não estão lá. Devolve quantas entraram. As da mesma rodada ficam
 * com horários escalonados de 1 s (a mais relevante com o mais recente, para aparecer primeiro no feed).
 */
export async function sincronizarNoticiasRadar(noticias: Noticia[], agora = new Date(), escrever = provocacaoPorLLM): Promise<number> {
  const candidatas = noticiasParaDiscutir(noticias)
  if (!candidatas.length) return 0
  const jaExistem = new Set(loadPosts().map(p => p.id))
  const novas = candidatas.filter(n => !jaExistem.has(idDaDiscussao(n.id)))
  if (!novas.length) return 0

  const provocacoes = await Promise.all(novas.map(async n => (await escrever(n)) ?? provocacaoPorModelo(n)))

  // Relê depois da espera: outra publicação pode ter entrado nesse meio-tempo.
  const posts = loadPosts()
  const existentes = new Set(posts.map(p => p.id))
  const discussoes = novas
    .map((n, i) => discussaoDaNoticia(n, provocacoes[i], new Date(agora.getTime() - i * 1000)))
    .filter(p => !existentes.has(p.id))
  if (!discussoes.length) return 0
  savePosts([...posts, ...discussoes])
  return discussoes.length
}

/**
 * Completa a imagem das discussões do Radar que ainda não têm: primeiro com a imagem que a notícia tem na edição,
 * depois com a do Histórico do mês (que guarda as notícias de edições passadas). Devolve quantas ganharam imagem.
 */
export function completarImagensDasDiscussoes(noticias: Pick<Noticia, 'id' | 'imagem'>[], arquivadas: Record<string, { imagem: string | null }> = {}): number {
  const daEdicao = new Map(noticias.map(n => [idDaDiscussao(n.id), n.imagem]))
  const posts = loadPosts()
  let completadas = 0
  for (const p of posts) {
    if (!p.id.startsWith('radar:') || (p.meta && imagemValida(p.meta.imagem))) continue
    const imagem = daEdicao.get(p.id) ?? arquivadas[p.id.slice('radar:'.length)]?.imagem
    if (!imagemValida(imagem)) continue
    p.meta = { ...(p.meta ?? {}), imagem }
    completadas++
  }
  if (completadas) savePosts(posts)
  return completadas
}

/** Links cuja página já foi consultada atrás da imagem (para não repetir a cada sincronização). */
const G_IMAGENS = globalThis as typeof globalThis & { __beonImagensTentadas?: Set<string> }

/**
 * As notícias que vão (ou já foram) para o fórum e chegaram sem imagem no feed: busca a og:image da página da matéria,
 * uma vez por link. Quem não tiver imagem nem na página fica com a capa ilustrada na tela.
 */
export async function buscarImagensQueFaltam(noticias: Noticia[], buscar: (link: string) => Promise<string | null>, limite = 15): Promise<number> {
  const tentadas = (G_IMAGENS.__beonImagensTentadas ??= new Set())
  const faltando = noticiasParaDiscutir(noticias).filter(n => !imagemValida(n.imagem) && !tentadas.has(n.link)).slice(0, limite)
  let achadas = 0
  await Promise.all(faltando.map(async n => {
    tentadas.add(n.link)
    const imagem = await buscar(n.link).catch(() => null)
    if (imagemValida(imagem)) { n.imagem = imagem; achadas++ }
  }))
  return achadas
}

const INTERVALO_MS = 5 * 60 * 1000
const G = globalThis as typeof globalThis & { __beonNoticiasRadarEm?: number; __beonNoticiasRadarRodando?: boolean }

/**
 * Roda a sincronização no máximo a cada 5 minutos, sem segurar quem chamou (o feed não espera as fontes de notícias).
 * Falhas não afetam o feed.
 */
export function talvezSincronizarNoticiasRadar(agora = Date.now()) {
  if (G.__beonNoticiasRadarRodando || agora - (G.__beonNoticiasRadarEm ?? 0) < INTERVALO_MS) return
  G.__beonNoticiasRadarEm = agora
  G.__beonNoticiasRadarRodando = true
  import('@/lib/newsletter/cache')
    .then(({ edicaoDoDia }) => edicaoDoDia())
    .then(async edicao => {
      // A edição servida do cache (ex.: depois de reiniciar o servidor) também entra no Histórico, uma vez só.
      // Toda discussão de notícia com a imagem da matéria: a do feed, a da página da matéria ou a do Histórico.
      const { imagemDaMateria } = await import('@/lib/newsletter/edicao')
      await buscarImagensQueFaltam(edicao.noticias, imagemDaMateria)
      const { registrarEdicao, lerArquivo } = await import('@/lib/newsletter/historico')
      try { registrarEdicao(edicao) } catch (err) { console.warn('[noticias-radar] histórico não gravado:', String(err)) }
      const n = await sincronizarNoticiasRadar(edicao.noticias)
      try { completarImagensDasDiscussoes(edicao.noticias, lerArquivo().noticias) } catch (err) { console.warn('[noticias-radar] imagens não completadas:', String(err)) }
      return n
    })
    .then(n => { if (n) console.log(`[noticias-radar] ${n} notícias viraram discussões no fórum`) })
    .catch(err => console.warn('[noticias-radar] sem edição para levar ao fórum agora:', String(err)))
    .finally(() => { G.__beonNoticiasRadarRodando = false })
}
