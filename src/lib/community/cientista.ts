// Integração com o Cientista (cientista-lab / METAEXP): contrato da API, regras do proxy
// e o estado da conversa a partir dos eventos SSE. Tudo aqui é puro (roda no servidor e no navegador).
// Mantenha os tipos em sincronia com web/src/api/types.ts do cientista-lab.

export type PapelConversa = 'solicitante' | 'desenvolvedor'
export const PAPEIS_CONVERSA: PapelConversa[] = ['solicitante', 'desenvolvedor']

export type StatusCientista =
  | 'conversa' | 'em_revisao' | 'devolvido' | 'aprovado' | 'em_execucao' | 'parecer' | 'decidido' | 'encerrado'

export const STATUS_CIENTISTA: Record<StatusCientista, string> = {
  conversa: 'Em conversa',
  em_revisao: 'Revisão do Lab',
  devolvido: 'Ajustes pedidos',
  aprovado: 'Aprovado (G0)',
  em_execucao: 'Na bancada',
  parecer: 'Parecer pronto',
  decidido: 'Decidido',
  encerrado: 'Encerrado',
}

export interface Preferencia { id: string; pergunta: string; opcoes: [string, string][]; padrao: string }
export interface Jornada {
  papel: string; nome: string; chamada: string; descricao: string; promessa: string
  tipo: 'conversa' | 'painel'; etapas: string[]; preferencias: Preferencia[]
}
export interface Papeis { jornadas: Jornada[] }

export interface Metrica { nome: string; descricao: string; criterio_aceite: string; obrigatoria: boolean }
export interface MetricaTecnica { nome: string; alvo: string; baseline?: string | null; liga_a?: string | null }
export interface Protocolo { conjunto: string; tamanho?: number | null; divisao?: string | null; metricas: MetricaTecnica[]; gate_regressao?: string | null }
export interface Abordagem {
  nome: string; descricao: string; pros: string[]; contras: string[]; custo: string; latencia: string
  complexidade: 'baixa' | 'media' | 'alta'; recomendada: boolean
}
export interface Desenho {
  stack?: string; fontes_dados?: string; restricoes?: string[]; baseline?: string; abordagens?: Abordagem[]
  abordagem_escolhida?: string; avaliacao?: Protocolo | null; arquitetura?: string[]; riscos_tecnicos?: string[]
}
export interface Ficha {
  id?: string; titulo?: string; dominio?: string; problema?: string; publico_afetado?: string; objetivo?: string
  hipotese?: string; metodologia?: string; tecnica?: string; golden_path?: string; metricas?: Metrica[]
  dados?: string; amostra?: string; bo?: string; sponsor?: string; detalhes_tecnicos?: Desenho
}
export interface DimensaoEstado { id: string; nome: string; busca: string; minimo: number; entendimento: string | null; profundidade: number; evidencia: string | null }
export interface Porque { dimensao: string; tecnica: string; por_que: string; tecnica_nome?: string; dimensao_nome?: string }
export interface Mapa {
  cobertura: number; pronto: boolean; sintese: string | null; sintese_confirmada: boolean
  pergunta_atual: Porque | null; dimensoes: DimensaoEstado[]
}
export interface Revisao { decisao: 'aprovar' | 'devolver'; comentario: string; revisor: string }

export interface EstadoCientista {
  id: string; nome: string; papel: PapelConversa; status: StatusCientista
  ficha: Ficha; pendencias: string[]; ficha_gerada: boolean; ficha_versao: number
  mapa: Mapa; desenho_pendencias: string[] | null; encaminhamento: string | null
  feedback_lab: Revisao | null
  transcricao?: { de: 'pessoa' | 'cientista'; texto: string }[]
}
export interface Kit { pasta: string; arquivos: Record<string, string> }

export type CardKind =
  | 'sintese' | 'similares' | 'amostra' | 'abordagens' | 'avaliacao' | 'desenho' | 'tecnologia' | 'skills'
  | 'ficha_gerada' | 'recurso'

export type EventoCientista =
  | { type: 'text'; delta: string }
  | { type: 'mapa'; mapa: Mapa }
  | ({ type: 'porque' } & Porque)
  | { type: 'ficha'; ficha: Ficha; changed: string[]; pendencias: string[]; gerada: boolean }
  | { type: 'card'; kind: CardKind; data: any }
  | { type: 'chips'; options: string[] }
  | { type: 'upload'; descricao: string; formatos: string[] }
  | { type: 'handoff'; destino: string; resumo: string; status: StatusCientista; kit?: string[] }
  | { type: 'auto_ingestao' }
  | { type: 'retry' }
  | { type: 'error'; message: string }
  | { type: 'done'; state: EstadoCientista }

// ── Proxy ──────────────────────────────────────────────────────────────────────────────────

export type RotaCientista =
  | { tipo: 'publica' }
  | { tipo: 'criar_sessao' }
  | { tipo: 'sessao'; sid: string }

const SID = /^[A-Za-z0-9_-]{1,64}$/
const POST_SESSAO = new Set(['iniciar', 'mensagens', 'arquivos', 'retomar'])
const GET_SESSAO = new Set(['ficha.md', 'kit', 'kit.zip'])

/**
 * Quais rotas do backend a Comunidade pode usar. Só a conversa (jornadas Solicitante e Desenvolvedor):
 * filas do Lab, decisões do Sponsor, bancada e pedidos de recursos ficam no próprio cientista-lab.
 */
export function rotaCientista(method: string, path: string[]): RotaCientista | null {
  const [a, sid, acao, ...resto] = path
  if (resto.length) return null
  if (method === 'GET' && path.length === 1 && (a === 'health' || a === 'papeis')) return { tipo: 'publica' }
  if (a !== 'sessoes') return null
  if (method === 'POST' && path.length === 1) return { tipo: 'criar_sessao' }
  if (!sid || !SID.test(sid)) return null
  if (method === 'GET' && (acao === undefined || GET_SESSAO.has(acao))) return { tipo: 'sessao', sid }
  if (method === 'POST' && acao && POST_SESSAO.has(acao)) return { tipo: 'sessao', sid }
  return null
}

// ── SSE ────────────────────────────────────────────────────────────────────────────────────

/** Separa blocos SSE completos do buffer e devolve os eventos e o que sobrou para o próximo pedaço. */
export function lerBlocosSse(buffer: string): { eventos: EventoCientista[]; resto: string } {
  const eventos: EventoCientista[] = []
  let resto = buffer.replace(/\r\n/g, '\n')
  let i: number
  while ((i = resto.indexOf('\n\n')) >= 0) {
    const bloco = resto.slice(0, i)
    resto = resto.slice(i + 2)
    const data = bloco.split('\n').filter(l => l.startsWith('data:')).map(l => l.replace(/^data: ?/, '')).join('\n')
    if (!data) continue
    try {
      eventos.push(JSON.parse(data))
    } catch {
      // bloco malformado: ignora e segue com o fluxo
    }
  }
  return { eventos, resto }
}

// ── Estado da conversa ─────────────────────────────────────────────────────────────────────

export interface CardItem { kind: CardKind | 'handoff'; data: any }
export interface ItemConversa {
  id: string; de: 'cientista' | 'pessoa' | 'sistema'; texto: string; cards: CardItem[]
  porque?: Porque; aberto?: boolean; quebra?: boolean; erro?: boolean
}
export interface Conversa {
  estado: EstadoCientista | null; itens: ItemConversa[]; chips: string[]
  upload: { descricao: string; formatos: string[] } | null
  ocupado: boolean; lendoDocumento: boolean; mudou: string[]; carregando: boolean; erroCarga: string | null
}

export const CONVERSA_INICIAL: Conversa = {
  estado: null, itens: [], chips: [], upload: null, ocupado: false, lendoDocumento: false, mudou: [], carregando: true, erroCarga: null,
}

export type AcaoConversa =
  | { t: 'carregado'; estado: EstadoCientista }
  | { t: 'erro_carga'; msg: string }
  | { t: 'pessoa'; texto: string }
  | { t: 'pensando' }
  | { t: 'evento'; e: EventoCientista }

let seq = 0
const novoId = () => `i${++seq}`

function emAberto(itens: ItemConversa[]): [ItemConversa[], ItemConversa] {
  const ult = itens[itens.length - 1]
  if (ult && ult.de === 'cientista' && ult.aberto) return [itens.slice(0, -1), ult]
  return [itens, { id: novoId(), de: 'cientista', texto: '', cards: [], aberto: true }]
}

export function conversaReducer(s: Conversa, a: AcaoConversa): Conversa {
  switch (a.t) {
    case 'carregado':
      return { ...s, carregando: false, estado: a.estado, itens: (a.estado.transcricao ?? []).map(x => ({ id: novoId(), de: x.de, texto: x.texto, cards: [] })) }
    case 'erro_carga':
      return { ...s, carregando: false, erroCarga: a.msg }
    case 'pensando':
      return { ...s, ocupado: true, itens: [...s.itens, { id: novoId(), de: 'cientista', texto: '', cards: [], aberto: true }] }
    case 'pessoa':
      return { ...s, ocupado: true, chips: [], upload: null, itens: [...s.itens, { id: novoId(), de: 'pessoa', texto: a.texto, cards: [] }] }
    case 'evento': {
      const e = a.e
      switch (e.type) {
        case 'text': {
          const [resto, it] = emAberto(s.itens)
          const texto = it.quebra && it.texto ? `${it.texto.trimEnd()}\n\n${e.delta.trimStart()}` : it.texto + e.delta
          return { ...s, itens: [...resto, { ...it, texto, quebra: false }] }
        }
        case 'retry': {
          const [resto, it] = emAberto(s.itens)
          return { ...s, itens: [...resto, { ...it, texto: '', cards: [] }] }
        }
        case 'card': {
          const [resto, it] = emAberto(s.itens)
          return { ...s, itens: [...resto, { ...it, cards: [...it.cards, { kind: e.kind, data: e.data }], quebra: true }] }
        }
        case 'handoff': {
          const [resto, it] = emAberto(s.itens)
          return {
            ...s,
            estado: s.estado && { ...s.estado, status: e.status, encaminhamento: e.destino },
            itens: [...resto, { ...it, cards: [...it.cards, { kind: 'handoff', data: e }], quebra: true }],
          }
        }
        case 'porque': {
          const [resto, it] = emAberto(s.itens)
          const { type: _type, ...porque } = e
          return { ...s, itens: [...resto, { ...it, porque, quebra: true }] }
        }
        case 'mapa':
          return { ...s, estado: s.estado && { ...s.estado, mapa: e.mapa } }
        case 'ficha':
          return { ...s, mudou: e.changed, estado: s.estado && { ...s.estado, ficha: e.ficha, pendencias: e.pendencias, ficha_gerada: e.gerada } }
        case 'chips':
          return { ...s, chips: e.options }
        case 'upload':
          return { ...s, upload: { descricao: e.descricao, formatos: e.formatos } }
        case 'auto_ingestao':
          return { ...s, lendoDocumento: true }
        case 'error':
          return {
            ...s, ocupado: false,
            itens: [...s.itens.map(i => ({ ...i, aberto: false })), { id: novoId(), de: 'sistema', texto: e.message, cards: [], erro: true }],
          }
        case 'done':
          return {
            ...s, ocupado: false, lendoDocumento: false, estado: e.state,
            itens: s.itens.filter(i => !(i.de === 'cientista' && !i.texto && !i.cards.length)).map(i => ({ ...i, aberto: false })),
          }
        default:
          return s
      }
    }
  }
}

/** Quais etapas da jornada já foram cumpridas (mesma regra do cientista-lab). */
export function etapasFeitas(e: EstadoCientista): boolean[] {
  const f = e.ficha, d = f.detalhes_tecnicos, m = e.mapa
  const prof = (id: string) => m.dimensoes.find(x => x.id === id)?.profundidade ?? 0
  const depois = ['aprovado', 'em_execucao', 'parecer', 'decidido'].includes(e.status)
  const encaminhada = e.status !== 'conversa'
  if (e.papel === 'desenvolvedor') {
    return [prof('sintoma') >= 1, !!d?.stack, !!d?.baseline, !!f.hipotese, !!d?.abordagens?.length || !!d?.abordagem_escolhida,
      !!d?.avaliacao?.metricas?.length, !!f.amostra, e.ficha_gerada || encaminhada, encaminhada]
  }
  return [prof('sintoma') >= 1, m.pronto || m.sintese_confirmada, !!f.hipotese, !!f.metricas?.length, !!f.amostra, !!(f.bo && f.sponsor),
    e.ficha_gerada || encaminhada, depois, ['em_execucao', 'parecer', 'decidido'].includes(e.status)]
}
