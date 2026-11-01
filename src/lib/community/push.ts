import webpush from 'web-push'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import type { Edicao, Noticia } from '@/lib/newsletter/edicao'
import { SECOES } from '@/lib/newsletter/edicao'
import type { CommunityPost } from './model'
import { idDaDiscussao } from './noticias-radar'

// Push do beOn Radar. A regra é uma só: no máximo UM push por entrada. "Entrada" é quando a pessoa faz login ou abre a
// Comunidade depois de pelo menos 6 horas sem receber nada; nesse momento vai a notícia mais relevante da edição que
// ela ainda não recebeu (com foto, fonte e a provocação da discussão). Nunca há rajadas: entre um push e outro passam
// 6 horas, e uma notícia nunca é enviada duas vezes para a mesma pessoa.
//
// Sem inscrição de push (navegador sem suporte, permissão negada ou site sem HTTPS), a mesma notícia aparece uma vez
// num cartão dentro do app, com a mesma regra.

export const INTERVALO_ENTRE_PUSHES_MS = 6 * 3600_000

export interface Inscricao { endpoint: string; keys: { p256dh: string; auth: string }; criadaEm: string }

interface Estado {
  inscricoes: Record<string, Inscricao[]>
  enviados: Record<string, { em: string; noticias: string[] }>
}

const caminho = () => jsonStorePath('PUSH_FILE_PATH', 'push.json')
const ler = (): Estado => {
  const e = readJsonStore<Estado | null>(caminho(), null)
  return { inscricoes: e?.inscricoes ?? {}, enviados: e?.enviados ?? {} }
}
const gravar = (e: Estado) => writeJsonStore(caminho(), e)

// ── Chaves VAPID: das variáveis de ambiente ou, sem elas, geradas uma vez e guardadas junto dos dados ────────────

interface Chaves { publicKey: string; privateKey: string }

export function chavesVapid(): Chaves {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }
  }
  const arquivo = jsonStorePath('VAPID_KEYS_PATH', 'vapid.json')
  const salvas = readJsonStore<Chaves | null>(arquivo, null)
  if (salvas?.publicKey && salvas.privateKey) return salvas
  const novas = webpush.generateVAPIDKeys()
  writeJsonStore(arquivo, novas)
  return novas
}

// ── Inscrições ───────────────────────────────────────────────────────────────────────────────────────────────

export function validarInscricao(body: unknown): Omit<Inscricao, 'criadaEm'> | null {
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  if (!b || typeof b.endpoint !== 'string' || !/^https:\/\//.test(b.endpoint) || b.endpoint.length > 1000) return null
  if (typeof b.keys?.p256dh !== 'string' || typeof b.keys?.auth !== 'string' || b.keys.p256dh.length > 200 || b.keys.auth.length > 100) return null
  return { endpoint: b.endpoint, keys: { p256dh: b.keys.p256dh, auth: b.keys.auth } }
}

export function inscrever(username: string, inscricao: Omit<Inscricao, 'criadaEm'>, agora = new Date()) {
  const e = ler()
  const lista = (e.inscricoes[username] ?? []).filter(i => i.endpoint !== inscricao.endpoint)
  // Um mesmo endpoint pertence a um navegador: se outra pessoa entrar nele, a inscrição passa para ela.
  for (const outro of Object.keys(e.inscricoes)) e.inscricoes[outro] = e.inscricoes[outro].filter(i => i.endpoint !== inscricao.endpoint)
  e.inscricoes[username] = [...lista, { ...inscricao, criadaEm: agora.toISOString() }].slice(-5)
  gravar(e)
}

export function desinscrever(username: string, endpoint: string) {
  const e = ler()
  e.inscricoes[username] = (e.inscricoes[username] ?? []).filter(i => i.endpoint !== endpoint)
  gravar(e)
}

export const inscricoesDe = (username: string) => ler().inscricoes[username] ?? []

// ── A notícia da entrada ─────────────────────────────────────────────────────────────────────────────────────

/** A mais relevante da edição (com foto, de preferência) que a pessoa ainda não recebeu. */
export function noticiaDaEntrada(edicao: Edicao, jaRecebidas: string[]): Noticia | null {
  const novas = edicao.noticias.filter(n => !jaRecebidas.includes(n.id))
  return novas.slice(0, 5).find(n => n.imagem && /^https:\/\//.test(n.imagem)) ?? novas[0] ?? null
}

const NOME_DA_SECAO = Object.fromEntries(SECOES.map(s => [s.id, s.nome])) as Record<string, string>

function haQuanto(iso: string | null, agora: number) {
  if (!iso) return null
  const h = Math.round((agora - Date.parse(iso)) / 3600_000)
  return h < 1 ? 'agora há pouco' : h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`
}

export interface ConteudoDoPush {
  title: string
  body: string
  /** Foto da notícia (aparece grande no Chrome e no Android). */
  image?: string
  icon: string
  badge: string
  tag: string
  url: string
  fonte: string
  timestamp: number
}

/** O push: seção no título, a manchete e a fonte (com repercussão e há quanto tempo) e a provocação da discussão. */
export function conteudoDoPush(n: Noticia, discussao: CommunityPost | null, agora = Date.now()): ConteudoDoPush {
  const provocacao = discussao ? /^Provocação: (.+)$/m.exec(discussao.content)?.[1] : null
  const outras = n.outrasFontes?.length ? ` + ${n.outrasFontes.length} ${n.outrasFontes.length === 1 ? 'veículo' : 'veículos'}` : ''
  const quando = haQuanto(n.publicadoEm, agora)
  return {
    title: `beOn Radar · ${NOME_DA_SECAO[n.secao] ?? 'Notícia do dia'}`,
    body: [n.titulo, `${n.fonte}${outras}${quando ? ` · ${quando}` : ''}`, provocacao ? `💬 ${provocacao}` : ''].filter(Boolean).join('\n'),
    image: n.imagem && /^https:\/\//.test(n.imagem) ? n.imagem : undefined,
    icon: '/jira/radar-push-icone.png',
    badge: '/jira/radar-push-badge.png',
    tag: 'beon-radar',
    url: `/jira/comunidade/post/${encodeURIComponent(discussao?.id ?? idDaDiscussao(n.id))}`,
    fonte: n.link,
    timestamp: agora,
  }
}

export type ResultadoDaEntrada =
  | { canal: 'push' | 'app'; noticia: Noticia; conteudo: ConteudoDoPush }
  | { canal: 'nenhum'; motivo: 'recente' | 'sem-noticia' | 'desligado' }

/**
 * Aplica a regra na entrada da pessoa: se faz menos de 6 horas do último push, nada; senão, escolhe a notícia, manda
 * o push para os navegadores inscritos (ou devolve para o cartão do app) e registra. Inscrições que o serviço de push
 * recusa (expiradas) são apagadas.
 */
export async function entrada(
  username: string,
  edicao: Edicao,
  discussaoDe: (noticiaId: string) => CommunityPost | null,
  opcoes: { querNoticias: boolean; agora?: number; enviar?: (i: Inscricao, carga: string) => Promise<void> },
): Promise<ResultadoDaEntrada> {
  const agora = opcoes.agora ?? Date.now()
  if (!opcoes.querNoticias) return { canal: 'nenhum', motivo: 'desligado' }
  const estado = ler()
  const ultimo = estado.enviados[username]
  if (ultimo && agora - Date.parse(ultimo.em) < INTERVALO_ENTRE_PUSHES_MS) return { canal: 'nenhum', motivo: 'recente' }
  const noticia = noticiaDaEntrada(edicao, ultimo?.noticias ?? [])
  if (!noticia) return { canal: 'nenhum', motivo: 'sem-noticia' }

  const conteudo = conteudoDoPush(noticia, discussaoDe(noticia.id), agora)
  // Registra antes de enviar: duas abas abrindo juntas não mandam dois pushes.
  estado.enviados[username] = { em: new Date(agora).toISOString(), noticias: [...(ultimo?.noticias ?? []), noticia.id].slice(-300) }
  gravar(estado)

  const inscricoes = estado.inscricoes[username] ?? []
  let entregues = 0
  if (inscricoes.length) {
    const enviar = opcoes.enviar ?? enviarComWebPush
    const expiradas: string[] = []
    await Promise.all(inscricoes.map(async i => {
      try { await enviar(i, JSON.stringify(conteudo)); entregues++ } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) expiradas.push(i.endpoint)
        else console.warn('[push] falha ao enviar:', status ?? String(err))
      }
    }))
    if (expiradas.length) {
      const e = ler()
      e.inscricoes[username] = (e.inscricoes[username] ?? []).filter(i => !expiradas.includes(i.endpoint))
      gravar(e)
    }
  }
  return { canal: entregues ? 'push' : 'app', noticia, conteudo }
}

async function enviarComWebPush(i: Inscricao, carga: string) {
  const chaves = chavesVapid()
  await webpush.sendNotification({ endpoint: i.endpoint, keys: i.keys }, carga, {
    vapidDetails: { subject: process.env.VAPID_SUBJECT || 'mailto:beonlabs@localhost', publicKey: chaves.publicKey, privateKey: chaves.privateKey },
    TTL: 6 * 3600, urgency: 'normal', topic: 'beon-radar',
  })
}
