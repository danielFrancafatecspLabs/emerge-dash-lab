import { epicBloqueado } from '@/lib/bloqueio'
import { buildMonitoramentoData } from '@/lib/mappers'
import { janelaDe, resumir as resumirIndicador, type ComparativoDados } from '@/lib/comparativo/resumo'
import { contagensDoFunil, ehCancelado, filtrarDashboardData, gruposDoFunil, resultadosDaEstrategia } from '@/lib/estrategia/resultados'
import { ehExperimentoConcluido } from '@/lib/concluido'
import { criarContexto, hipoteseDe, HIPOTESES, resumir } from '@/lib/portfolio/filtros'
import type { PortfolioDados } from '@/lib/portfolio/tipos'
import type { SemanalData } from '@/lib/semanal'
import type { DashboardData, EpicDetail, JiraBoardConfiguration, JiraStatus } from '@/lib/types'
import { etapaValidada, type WeeklyData } from '@/lib/weekly'
import { fichaDe, fichaDoAlerta, type Acao, type Ficha, type Gravidade } from './fichas'
import type { Movimento } from './movimento'

export type { Acao, Gravidade } from './fichas'

/**
 * Auditor de Analytics: o "cientista analítico" que roda por baixo dos panos. Ele recalcula cada número com as mesmas
 * funções que cada tela usa (Semanal, Estratégia, Portfólio, Operacional, Comparativo, Crescimento) e confere se as
 * visões contam a mesma história. Não decide qual tela está certa: mostra onde divergem, por quanto, POR QUÊ, o que
 * isso muda nos painéis e o que fazer.
 *
 * Como ele explica uma divergência:
 * 1. Confere item por item, não só o total (o mesmo número com experimentos diferentes também é divergência).
 * 2. Lista os itens que uma visão conta e a outra não.
 * 3. Procura o que esses itens têm em comum e os outros não têm (status, coluna do board, iniciativa-mãe): é a pista
 *    da causa. Uma característica só vira pista se separa os divergentes do resto.
 * 4. Diz quem destoa quando a maioria das visões concorda.
 * 5. Calcula o impacto (o benefício dos itens) e sugere a ação, no Jira ou no app.
 *
 * As explicações escritas à mão (a pergunta de cada conferência, por que importa, como cada tela conta) ficam em
 * ./fichas.ts. Os alertas tratam do cadastro no Jira, que explica números estranhos mesmo quando as telas batem.
 */

export type Visao = 'Semanal' | 'Estratégia' | 'Portfólio' | 'Crescimento'

/** Um item do Jira citado numa explicação. */
export interface ItemRef {
  key: string
  nome: string
  /** "Nome do status (id N)". */
  status: string
  /** Experimentos: a iniciativa-mãe e o status dela. */
  mae?: string
  beneficio?: number
  /** Observação do alerta sobre o item (ex.: "30% do benefício potencial"). */
  detalhe?: string
}

/** Itens que uma visão conta e a outra não. */
export interface Diferenca { conta: string; naoConta: string; total: number; itens: ItemRef[] }

/** O que os itens divergentes têm em comum e os outros não têm. */
export interface Pista { texto: string; acoes: Acao[] }

export interface Diagnostico {
  diferencas: Diferenca[]
  pistas: Pista[]
  /** A pista principal em uma frase (ou o aviso de que os totais batem e os itens não). */
  causa?: string
}

/**
 * De onde vem a divergência: 'telas' (duas telas do app discordam), 'jira' (a regra do app discorda da coluna do
 * board) ou 'soma' (uma conta que deveria fechar não fecha).
 */
export type Natureza = 'telas' | 'jira' | 'soma'

export interface Verificacao {
  id: string
  titulo: string
  /** Como o número é contado (para quem for corrigir). */
  regra: string
  valores: Partial<Record<Visao | string, number>>
  ok: boolean
  /** Maior diferença entre as visões. */
  diferenca: number
  formato?: 'numero' | 'moeda'
  natureza: Natureza
  /** A pergunta que a conferência responde e por que ela importa. */
  pergunta: string
  porQueImporta: string
  /** Como cada visão chega ao número. */
  comoConta: Record<string, string>
  /** O resultado em uma frase, com os números. */
  veredito: string
  /** Só nas divergências: o que está acontecendo, em parágrafos. */
  explicacao?: string[]
  /** Só nas divergências: o que isso muda nos painéis. */
  impacto?: string
  /** Só nas divergências: o que fazer, no Jira ou no app. */
  acoes?: Acao[]
  /** Visões fora do consenso, quando a maioria concorda entre si. */
  destoam?: string[]
  /** Só nas divergências conferidas item por item. */
  diagnostico?: Diagnostico
}

export interface Alerta {
  id: string
  titulo: string
  quantidade: number
  /** Algumas chaves de exemplo, para ir direto ao Jira. */
  exemplos: string[]
  gravidade: Gravidade
  porQueImporta: string
  /** O peso do alerta, quando dá para medir (ex.: o benefício dos itens). */
  impacto?: string
  oQueFazer: Acao
  itens: ItemRef[]
}

/** O parecer do Auditor: dá para confiar nos painéis? */
export interface Parecer {
  nivel: 'ok' | 'atencao' | 'critico'
  titulo: string
  frases: string[]
}

/** Quanto cada tela concorda com as outras. */
export interface ConfiancaDaTela {
  tela: string
  conferencias: number
  divergencias: number
  /** Em quantas divergências a tela é a que destoa do consenso. */
  destoa: number
  /**
   * bate: concorda com as outras em tudo. difere do Jira: as telas concordam, mas a coluna do board diz outra coisa.
   * em disputa: discorda de outra visão sem maioria para dizer quem está fora. destoa: a maioria concorda e ela não.
   */
  situacao: 'bate' | 'difere do Jira' | 'em disputa' | 'destoa'
}

export interface RelatorioConsistencia {
  geradoEm: string
  verificacoes: Verificacao[]
  alertas: Alerta[]
  divergencias: number
  /** A conclusão em frases curtas: quantas conferências batem, onde estão as divergências e a causa mais comum. */
  resumo: string[]
  parecer: Parecer
  telas: ConfiancaDaTela[]
  /** O que mudou no Jira desde a leitura anterior (o runner preenche). */
  movimento?: Movimento
  /** Endereço do Jira, para abrir os itens (o runner preenche). */
  jiraUrl?: string | null
}

export interface EntradaConsistencia {
  /** O DashboardData como a Estratégia e o Portfólio montam (com histórico e classificação). */
  data: DashboardData
  /** O DashboardData como o Semanal monta. */
  dataSemanal: DashboardData
  weekly: WeeklyData
  semanal: SemanalData
  portfolio: PortfolioDados
  exploracaoIds?: string[]
  /**
   * Configuração dos boards no Jira: a fonte independente. Cada regra do app (por id ou nome de status) é conferida
   * contra a coluna em que o item realmente está no board.
   */
  board2734Config?: JiraBoardConfiguration
  board2735Config?: JiraBoardConfiguration
  /** Issues arquivadas no Jira que a leitura tirou de todas as contas. */
  arquivadas?: string[]
  /** Os dados do Comparativo, como a aba monta: o benefício potencial de cada ano tem de bater com a Estratégia. */
  comparativo?: ComparativoDados
  agora?: Date
}

const normal = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()

/** Coluna do board (nome normalizado) por id de status; vazio quando não há configuração. */
function colunas(config?: JiraBoardConfiguration): Map<string, string> {
  const m = new Map<string, string>()
  for (const c of config?.columnConfig?.columns ?? []) for (const st of c.statuses ?? []) if (st?.id) m.set(String(st.id), normal(c.name ?? ''))
  return m
}

/** Etapa da iniciativa pela coluna do board de Ideação (independente da regra por id/nome). */
function etapaPelaColuna(coluna: string | undefined): 'aguardando' | 'piloto' | 'escala' | null {
  if (!coluna) return null
  if (coluna.includes('AGUARDANDO')) return 'aguardando'
  // Finalizado é o status antigo de Em escala e conta como escala. "Concluído" NÃO: iniciativa concluída fora de
  // Em escala é hipótese que não seguiu (a regra oficial, lib/hipoteses.ts).
  if (coluna.includes('ESCALA') || coluna.includes('FINALIZ')) return 'escala'
  if (coluna.includes('PILOTO')) return 'piloto'
  return null
}

const rotuloDoStatus = (s: JiraStatus) => `${s.name} (id ${s.id})`

// ── Linguagem ─────────────────────────────────────────────────────────────────────────────────

const reais = (v: number) => (Math.abs(v) >= 1_000_000
  ? `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : `R$ ${Math.round(v).toLocaleString('pt-BR')}`)
const fmt = (v: number, formato: Verificacao['formato']) => (formato === 'moeda' ? reais(v) : v.toLocaleString('pt-BR'))
/** "A, B e C". */
const listar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`)
const UNIDADE_PADRAO: [string, string] = ['item', 'itens']

/** Como cada visão conta: o texto da ficha ou, para as visões com nome variável (o ano), o texto genérico. */
function comoCadaVisaoConta(ficha: Ficha, visoes: string[]): Record<string, string> {
  const generico = (v: string) => (v.startsWith('Estratégia (Todo') ? 'O número da Estratégia com o filtro no ano inteiro.'
    : v.startsWith('Todo ') ? 'O mesmo número com o filtro no ano inteiro.' : undefined)
  return Object.fromEntries(visoes.map(v => [v, ficha.como[v] ?? generico(v)]).filter((x): x is [string, string] => !!x[1]))
}

// ── Catálogo: os fatos de cada item, para explicar por que ele diverge ────────────────────────

interface Fato {
  key: string
  nome: string
  status: string
  tipo: 'experimento' | 'iniciativa'
  mae?: string
  beneficio: number
  /** Características comparáveis entre itens ("status|X", "sem-mae", "coluna|Y"…). */
  tracos: string[]
}
type Catalogo = Map<string, Fato>

const refDe = (f: Fato): ItemRef => ({ key: f.key, nome: f.nome, status: f.status, ...(f.mae ? { mae: f.mae } : {}), ...(f.beneficio ? { beneficio: f.beneficio } : {}) })
const refDoEpic = (x: EpicDetail, detalhe?: string): ItemRef => ({ key: x.key, nome: x.nome, status: rotuloDoStatus(x.status), ...(x.beneficioQuantitativo ? { beneficio: x.beneficioQuantitativo } : {}), ...(detalhe ? { detalhe } : {}) })

function montarCatalogo(e: EntradaConsistencia, colIni: Map<string, string>, colExp: Map<string, string>): Catalogo {
  const catalogo: Catalogo = new Map()
  const iniciativas = new Map([...e.dataSemanal.iniciativas, ...e.data.iniciativas].map(i => [i.key, i]))
  const daColuna = (col: Map<string, string>, id: string) => (!col.size ? [] : col.has(id) ? [`coluna|${col.get(id)}`] : ['sem-coluna'])
  for (const i of iniciativas.values()) {
    catalogo.set(i.key, { key: i.key, nome: i.nome, status: rotuloDoStatus(i.status), tipo: 'iniciativa', beneficio: 0, tracos: [`status|${rotuloDoStatus(i.status)}`, ...daColuna(colIni, i.status.id)] })
  }
  for (const x of [...e.dataSemanal.allEpics, ...e.data.allEpics]) {
    const mae = x.parentKey ? iniciativas.get(x.parentKey) : undefined
    const daMae = !x.parentKey ? ['sem-mae'] : !mae ? ['mae-fora'] : [`mae-status|${rotuloDoStatus(mae.status)}`]
    catalogo.set(x.key, {
      key: x.key, nome: x.nome, status: rotuloDoStatus(x.status), tipo: 'experimento', beneficio: x.beneficioQuantitativo ?? 0,
      mae: !x.parentKey ? 'sem iniciativa-mãe' : mae ? `${mae.key} (${mae.status.name})` : `${x.parentKey} (fora do board de Ideação)`,
      tracos: [`status|${rotuloDoStatus(x.status)}`, ...daColuna(colExp, x.status.id), ...daMae],
    })
  }
  return catalogo
}

/** Uma característica em palavras (para um item e para vários) e o que fazer quando ela é a causa. */
function descreverTraco(traco: string, ficha: Ficha): { um: string; varios: string; acoes: Acao[] } {
  const [tipo, valor] = traco.split('|')
  const regra = ficha.regraNoApp ? ` (${ficha.regraNoApp})` : ''
  switch (tipo) {
    case 'status': return {
      um: `está com o status ${valor}`, varios: `estão com o status ${valor}`,
      acoes: [
        { onde: 'App', texto: `Decidir como o status ${valor} deve contar e tratá-lo do mesmo jeito em todas as telas${regra}.` },
        { onde: 'Jira', texto: 'Conferir no board se esse status está na coluna certa.' },
      ],
    }
    case 'coluna': return {
      um: `está na coluna "${valor}" do board`, varios: `estão na coluna "${valor}" do board`,
      acoes: [{ onde: 'Jira', texto: `Conferir se a coluna "${valor}" é mesmo a etapa desses itens. Se for, a regra do app precisa reconhecer os status dela${regra}.` }],
    }
    case 'sem-coluna': return {
      um: 'está num status que nenhuma coluna do board mostra', varios: 'estão num status que nenhuma coluna do board mostra',
      acoes: [{ onde: 'Jira', texto: 'Nas configurações do board, colocar o status numa coluna.' }],
    }
    case 'sem-mae': return {
      um: 'não tem iniciativa-mãe', varios: 'não têm iniciativa-mãe',
      acoes: [{ onde: 'Jira', texto: 'Preencher o campo Pai (Parent) de cada experimento com a iniciativa dele.' }],
    }
    case 'mae-fora': return {
      um: 'tem a iniciativa-mãe fora do board de Ideação', varios: 'têm a iniciativa-mãe fora do board de Ideação',
      acoes: [{ onde: 'Jira', texto: 'Corrigir o campo Pai do experimento ou trazer a iniciativa para o board de Ideação.' }],
    }
    default: return {
      um: `tem a iniciativa-mãe com o status ${valor}`, varios: `têm a iniciativa-mãe com o status ${valor}`,
      acoes: [{ onde: 'App', texto: `A hipótese depende da etapa da iniciativa-mãe: conferir como o status ${valor} é tratado em cada tela${regra}.` }],
    }
  }
}

/**
 * As pistas da causa: características que a maioria dos itens divergentes tem (60% ou mais) e que os outros itens
 * quase não têm (40 pontos a menos). Uma característica comum a todo mundo não explica nada e fica de fora.
 */
function acharPistas(divergentes: Fato[], catalogo: Catalogo, ficha: Ficha): Pista[] {
  if (!divergentes.length) return []
  const chaves = new Set(divergentes.map(f => f.key))
  const tipos = new Set(divergentes.map(f => f.tipo))
  const resto = [...catalogo.values()].filter(f => tipos.has(f.tipo) && !chaves.has(f.key))
  const unidade = tipos.size === 1 ? (tipos.has('experimento') ? 'experimentos' : 'iniciativas') : 'itens'
  const candidatas = [...new Set(divergentes.flatMap(f => f.tracos))].map(traco => {
    const dentro = divergentes.filter(f => f.tracos.includes(traco)).length
    const fora = resto.filter(f => f.tracos.includes(traco)).length
    return { traco, dentro, fora, forca: dentro / divergentes.length - (resto.length ? fora / resto.length : 0) }
  }).filter(c => c.dentro / divergentes.length >= 0.6 && c.forca >= 0.4)
    .sort((a, b) => b.forca - a.forca || a.traco.localeCompare(b.traco))
  // Status e coluna costumam dizer a mesma coisa: fica o status. Depois, no máximo uma pista sobre a iniciativa-mãe.
  const familia = (t: string) => (t.startsWith('status|') || t.startsWith('coluna|') || t === 'sem-coluna' ? 'status' : 'mae')
  const escolhidas = (['status', 'mae'] as const).flatMap(f => {
    const daFamilia = candidatas.filter(c => familia(c.traco) === f)
    return daFamilia.find(c => c.traco.startsWith('status|')) ?? daFamilia[0] ?? []
  })
  const n = divergentes.length
  return escolhidas.map(c => {
    const d = descreverTraco(c.traco, ficha)
    const quem = c.dentro === n ? (n === 1 ? 'O item divergente' : `Os ${n} itens divergentes`) : `${c.dentro} dos ${n} itens divergentes`
    const [nenhum, entre] = unidade === 'iniciativas' ? ['Nenhuma das outras', 'Entre as outras'] : ['Nenhum dos outros', 'Entre os outros']
    const comparacao = !resto.length ? ''
      : c.fora === 0 ? ` ${nenhum} ${resto.length} ${unidade} está assim: é nesse ponto que as visões discordam.`
        : ` ${entre} ${resto.length} ${unidade}, só ${c.fora} ${c.fora === 1 ? 'está' : 'estão'} assim.`
    return { texto: `${quem} ${c.dentro === 1 ? d.um : d.varios}.${comparacao}`, acoes: d.acoes }
  })
}

// ── Motor das conferências ────────────────────────────────────────────────────────────────────

/** O que uma visão mostra: só o número, as chaves dos itens, ou o número da tela com as chaves que o formam. */
type Mostra = number | string[] | { n: number; chaves: string[] }

const LIMITE_DE_ITENS = 8

/** Ações sem repetição (a mesma ação pode vir de duas pistas). */
const semRepetir = (acoes: Acao[]) => [...new Map(acoes.map(a => [`${a.onde}|${a.texto}`, a])).values()]

/** Conferência de números (somas, contas que têm de fechar): quando não fecha, a explicação vem da ficha. */
function comparar(id: string, titulo: string, regra: string, valores: Record<string, number>, formato: Verificacao['formato'] = 'numero', tolerancia = 0, natureza: Natureza = 'soma'): Verificacao {
  const ficha = fichaDe(id)
  const nomes = Object.keys(valores)
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  const ok = diferenca <= tolerancia
  const base = { id, titulo, regra, valores, ok, diferenca, formato, natureza, pergunta: ficha.pergunta || titulo, porQueImporta: ficha.porQueImporta, comoConta: comoCadaVisaoConta(ficha, nomes) }
  if (ok) return { ...base, veredito: `${listar(nomes)} dão o mesmo resultado: ${fmt(nums[0] ?? 0, formato)}.` }
  return {
    ...base,
    veredito: `${listar(nomes.map(v => `${v} dá ${fmt(valores[v], formato)}`))}: diferença de ${fmt(diferenca, formato)}.`,
    explicacao: ficha.seDivergir ? [ficha.seDivergir.explicacao] : ['As duas contas deveriam dar o mesmo resultado e não dão.'],
    impacto: `A diferença é de ${fmt(diferenca, formato)}. ${ficha.afeta}`.trim(),
    acoes: ficha.seDivergir?.acoes ?? [{ onde: 'App', texto: 'Rever a regra das duas contas: elas precisam partir dos mesmos itens.' }],
  }
}

/** Duas visões concordam quando mostram o mesmo número e, se as duas têm itens, os mesmos itens. */
function consenso(nomes: string[], n: (v: string) => number, itens: (v: string) => Set<string> | null): { grupo: string[]; destoam: string[] } {
  const mesmos = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(k => b.has(k))
  const concordam = (a: string, b: string) => {
    const ia = itens(a), ib = itens(b)
    return n(a) === n(b) && (!ia || !ib || mesmos(ia, ib))
  }
  const grupo = nomes.map(v => nomes.filter(o => concordam(v, o))).sort((a, b) => b.length - a.length)[0] ?? []
  // Só há consenso com maioria de verdade: duas visões que discordam ficam "em disputa", sem culpado.
  return grupo.length >= 2 && grupo.length > nomes.length / 2 ? { grupo, destoam: nomes.filter(v => !grupo.includes(v)) } : { grupo: [], destoam: [] }
}

/**
 * Confere as visões item por item. Bate quando todos os números são iguais E os conjuntos de itens são os mesmos.
 * Quando diverge, explica: quem destoa, quais itens fazem a diferença, o que eles têm em comum, o impacto e a ação.
 */
function conferir(id: string, titulo: string, regra: string, natureza: Natureza, visoes: Record<string, Mostra>, catalogo: Catalogo): Verificacao {
  const ficha = fichaDe(id)
  const [um, varios] = ficha.unidade ?? UNIDADE_PADRAO
  const nomes = Object.keys(visoes)
  const n = (v: string) => { const m = visoes[v]; return typeof m === 'number' ? m : Array.isArray(m) ? m.length : m.n }
  const itens = (v: string) => { const m = visoes[v]; return typeof m === 'number' ? null : new Set(Array.isArray(m) ? m : m.chaves) }
  const valores = Object.fromEntries(nomes.map(v => [v, n(v)]))
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  const comItens = nomes.filter(v => itens(v) !== null)

  // O que cada visão conta e a de referência (a primeira com itens) não, e vice-versa.
  const fato = (k: string): Fato => catalogo.get(k) ?? { key: k, nome: '', status: 'fora da leitura do Jira', tipo: 'experimento', beneficio: 0, tracos: [] }
  const diferencas: Diferenca[] = []
  const chavesDivergentes = new Set<string>()
  if (comItens.length > 1) {
    const base = comItens[0], itensBase = itens(base)!
    for (const visao of comItens.slice(1)) {
      const daVisao = itens(visao)!
      for (const [conta, naoConta, so] of [[base, visao, [...itensBase].filter(k => !daVisao.has(k))], [visao, base, [...daVisao].filter(k => !itensBase.has(k))]] as const) {
        if (!so.length) continue
        so.forEach(k => chavesDivergentes.add(k))
        diferencas.push({ conta, naoConta, total: so.length, itens: so.slice(0, LIMITE_DE_ITENS).map(k => refDe(fato(k))) })
      }
    }
  }
  const ok = diferenca === 0 && diferencas.length === 0
  const base = { id, titulo, regra, valores, ok, diferenca, formato: 'numero' as const, natureza, pergunta: ficha.pergunta || titulo, porQueImporta: ficha.porQueImporta, comoConta: comoCadaVisaoConta(ficha, nomes) }
  const total = nums[0] ?? 0
  if (ok) {
    return {
      ...base,
      veredito: comItens.length === nomes.length
        ? `${listar(nomes)} mostram ${total} ${total === 1 ? um : varios}, e são exatamente os mesmos.`
        : `As ${nomes.length} visões mostram ${total}.${comItens.length > 1 ? ` Nas ${comItens.length} que expõem os itens, são exatamente os mesmos ${varios}.` : ''}`,
    }
  }

  const { grupo, destoam } = consenso(nomes, n, itens)
  // Contra o Jira: quando quem fica de fora é a coluna do board, as telas concordam entre si.
  const soOJira = natureza === 'jira' && destoam.length === 1 && destoam[0].includes('Jira')
  const veredito = diferenca === 0 ? `Todas as visões mostram ${total}, mas os ${varios} não são os mesmos.`
    : soOJira ? `As telas mostram ${n(grupo[0])} (${listar(grupo)}), mas pela coluna do board no Jira são ${n(destoam[0])}.`
    : destoam.length === 1 ? `${destoam[0]} destoa: mostra ${n(destoam[0])}, enquanto ${listar(grupo)} mostram ${n(grupo[0])}.`
      : destoam.length > 1 ? `${listar(destoam.map(v => `${v} (${n(v)})`))} destoam de ${listar(grupo)}, que mostram ${n(grupo[0])}.`
        : `As visões não concordam: ${listar(nomes.map(v => `${v} mostra ${n(v)}`))}.`

  const divergentes = [...chavesDivergentes].map(fato)
  const pistas = acharPistas(divergentes, catalogo, ficha)
  const citar = (i: ItemRef) => `${i.key}${i.nome ? ` "${i.nome}"` : ''} (${i.status})`
  const explicacao = diferencas.map(d =>
    `${d.conta} conta ${d.total} ${d.total === 1 ? um : varios} que ${d.naoConta} não conta: ${d.itens.map(citar).join('; ')}${d.total > d.itens.length ? `; e mais ${d.total - d.itens.length}` : ''}.`)
  // Visões que só expõem o total: dá para ver que o número difere, não quais itens.
  const soTotal = nomes.filter(v => itens(v) === null && comItens.length > 0 && n(v) !== n(comItens[0]))
  if (soTotal.length) explicacao.push(`${listar(soTotal)} só ${soTotal.length > 1 ? 'expõem' : 'expõe'} o total (${listar(soTotal.map(v => String(n(v))))}), então não dá para apontar os itens: a comparação é com ${comItens[0]} (${n(comItens[0])}).`)
  explicacao.push(...pistas.map(p => p.texto))
  if (divergentes.length > 1 && !pistas.length) explicacao.push('Esses itens não têm um status, uma coluna nem uma iniciativa-mãe em comum que explique a diferença sozinho: vale abrir cada um no Jira e comparar com um item que as duas visões contam.')

  const beneficio = divergentes.reduce((t, f) => t + f.beneficio, 0)
  const impacto = `${beneficio > 0 ? `${divergentes.length === 1 ? 'O item divergente tem' : `Os ${divergentes.length} itens divergentes somam`} ${reais(beneficio)} de benefício potencial cadastrado. ` : ''}${ficha.afeta}`.trim()
  const regraNoApp = ficha.regraNoApp ? ` (${ficha.regraNoApp})` : ''
  const acoesPadrao: Acao[] = natureza === 'jira'
    ? [{ onde: 'Jira', texto: 'Conferir no board se os itens acima estão na coluna certa.' }, { onde: 'App', texto: `Se o board estiver certo, ajustar a regra do app${regraNoApp}.` }]
    : [{ onde: 'App', texto: `As telas precisam usar a mesma regra${regraNoApp}. Os itens acima mostram onde cada uma decide diferente.` }]
  const mesmoTotal = diferenca === 0 ? 'Os totais são iguais, mas os itens não são os mesmos.' : ''
  const causa = [mesmoTotal, pistas[0]?.texto ?? ''].filter(Boolean).join(' ') || undefined
  return {
    ...base, veredito, explicacao, impacto,
    acoes: pistas.length ? semRepetir(pistas.flatMap(p => p.acoes)) : acoesPadrao,
    ...(destoam.length ? { destoam } : {}),
    ...(diferencas.length ? { diagnostico: { diferencas, pistas, causa } } : {}),
  }
}

const LIMITE_DE_ITENS_DO_ALERTA = 40

/** Um alerta de cadastro, com a explicação da ficha e o peso dos itens. */
function alerta(id: string, titulo: string, itens: ItemRef[], exemplos?: string[], quantidade = itens.length): Alerta {
  const ficha = fichaDoAlerta(id)
  const beneficio = itens.reduce((t, i) => t + (i.beneficio ?? 0), 0)
  return {
    id, titulo, quantidade,
    exemplos: exemplos ?? itens.slice(0, 5).map(i => i.key),
    gravidade: ficha.gravidade, porQueImporta: ficha.porQueImporta, oQueFazer: ficha.oQueFazer,
    ...(beneficio > 0 ? { impacto: `${itens.length === 1 ? 'Tem' : 'Somam'} ${reais(beneficio)} de benefício cadastrado.` } : {}),
    itens: itens.slice(0, LIMITE_DE_ITENS_DO_ALERTA),
  }
}

const refDaIniciativa = (i: { key: string; nome: string; status: JiraStatus }): ItemRef => ({ key: i.key, nome: i.nome, status: rotuloDoStatus(i.status) })

/**
 * Inventário dos status: onde a regra do app e a coluna do Jira discordam sobre um status, e status que nenhuma
 * coluna do board mostra. É aqui que costuma nascer a divergência entre telas.
 */
function inventarioDeStatus(e: EntradaConsistencia, colIni: Map<string, string>, colExp: Map<string, string>): Alerta[] {
  const alertas: Alerta[] = []
  const porStatus = <T extends { key: string; status: JiraStatus }>(itens: T[]) => {
    const m = new Map<string, { status: JiraStatus; itens: T[] }>()
    // Por id E nome: o mesmo id pode chegar com nomes diferentes (caixa, acento), e a regra do app olha o nome.
    for (const x of itens) {
      const chave = `${x.status.id}|${x.status.name}`
      const g = m.get(chave) ?? { status: x.status, itens: [] }
      g.itens.push(x)
      m.set(chave, g)
    }
    return [...m.values()]
  }
  if (colIni.size) {
    for (const g of porStatus(e.dataSemanal.iniciativas)) {
      const coluna = colIni.get(g.status.id)
      const regra = etapaValidada(g.status)
      const peloJira = etapaPelaColuna(coluna)
      if (!coluna) {
        alertas.push(alerta(`ini-sem-coluna-${g.status.id}-${g.status.name}`, `Iniciativas com status ${rotuloDoStatus(g.status)} fora das colunas do board de Ideação`, g.itens.map(refDaIniciativa)))
      } else if (regra !== peloJira) {
        alertas.push(alerta(`ini-regra-${g.status.id}-${g.status.name}`,
          `Status ${rotuloDoStatus(g.status)}, na coluna "${coluna}": a regra do app conta como ${regra ?? 'não validada'}, a coluna indica ${peloJira ?? 'não validada'}`,
          g.itens.map(refDaIniciativa)))
      }
    }
  }
  if (colExp.size) {
    for (const g of porStatus(e.data.allEpics)) {
      if (!colExp.has(g.status.id)) {
        alertas.push(alerta(`exp-sem-coluna-${g.status.id}-${g.status.name}`, `Experimentos com status ${rotuloDoStatus(g.status)} fora das colunas do board de Experimentação`, g.itens.map(x => refDoEpic(x))))
      }
    }
  }
  return alertas
}

export function verificarConsistencia(e: EntradaConsistencia): RelatorioConsistencia {
  // ── Cada visão, com as funções da própria tela ──
  const tudo = filtrarDashboardData(e.data, { tipo: 'tudo' })
  const est = resultadosDaEstrategia(tudo)
  const funil = contagensDoFunil(tudo.allEpics)
  const crescimento = buildMonitoramentoData(tudo, { tipo: 'tudo' }, e.data.allEpics)
  const ctx = criarContexto(e.portfolio)
  const portIni = resumir(e.portfolio.iniciativas, ctx, true)
  const portExp = resumir(e.portfolio.experimentos, ctx, true)
  const fatia = (id: string) => e.semanal.resumo.fatias.find(f => f.id === id)?.quantidade ?? 0
  const etapa = (id: string) => e.weekly.stages.find(s => s.id === id)?.quantidade ?? 0
  const expPorSituacao = (s: string) => e.portfolio.experimentos.filter(x => x.situacao === s).length

  // A fonte independente (as colunas dos boards) e o catálogo de fatos de cada item, para as explicações.
  const colIni = colunas(e.board2734Config)
  const colExp = colunas(e.board2735Config)
  const catalogo = montarCatalogo(e, colIni, colExp)
  const k = (xs: { key: string }[]) => xs.map(x => x.key)
  const grupos = gruposDoFunil(tudo.allEpics)
  const fase = (id: string) => k(e.weekly.stages.find(s => s.id === id)?.experimentos ?? [])
  const portExpDe = (teste: (x: PortfolioDados['experimentos'][number]) => boolean) => k(e.portfolio.experimentos.filter(teste))
  const portIniNa = (et: string) => k(e.portfolio.iniciativas.filter(i => etapaValidada({ id: i.statusId, name: i.status }) === et))

  const verificacoes: Verificacao[] = [
    conferir('total', 'Total de experimentos', 'Todos os Epics do board de Experimentação.', 'telas', {
      Semanal: { n: e.semanal.resumo.totalExperimentos, chaves: k(e.dataSemanal.allEpics) }, 'Estratégia (Tudo)': k(grupos.total), Portfólio: k(e.portfolio.experimentos),
    }, catalogo),
    conferir('validadas', 'Hipóteses validadas', 'Experimentos concluídos com a iniciativa em Aguardando piloto, Em piloto ou Em escala (lib/hipoteses.ts).', 'telas', {
      Semanal: fatia('validadas'), 'Estratégia (Tudo)': k(est.hipoteses.validadas), Portfólio: portExpDe(x => hipoteseDe(x, ctx) === HIPOTESES[0]),
      'Comparativo / benefício do Semanal': k(e.weekly.epicsConsiderados.filter(x => x.grupo === 'validada')),
    }, catalogo),
    conferir('refutadas', 'Hipóteses refutadas', 'Experimentos concluídos com a iniciativa fora dessas colunas.', 'telas', {
      Semanal: fatia('refutadas'), 'Estratégia (Tudo)': k(est.hipoteses.refutadas), Portfólio: portExpDe(x => hipoteseDe(x, ctx) === HIPOTESES[1]),
      'Comparativo / benefício do Semanal': e.weekly.foraDaConta.refutados,
    }, catalogo),
    conferir('aguardando', 'Aguardando piloto (iniciativas)', 'Iniciativas em Aguardando piloto.', 'telas', {
      Semanal: { n: etapa('aguardando'), chaves: fase('aguardando') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['AGUARDANDO PILOTO']),
      Portfólio: portIniNa('aguardando'), Operacional: e.data.pipeline['AGUARDANDO PILOTO'],
    }, catalogo),
    conferir('piloto', 'Em piloto (iniciativas)', 'Iniciativas em Em piloto.', 'telas', {
      Semanal: { n: etapa('piloto'), chaves: fase('piloto') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['EM PILOTO']),
      Portfólio: portIniNa('piloto'), Operacional: e.data.pipeline['EM PILOTO'],
    }, catalogo),
    conferir('escala', 'Em escala (iniciativas)', 'Iniciativas em Em escala (Finalizado conta como Em escala).', 'telas', {
      Semanal: { n: etapa('escala'), chaves: fase('escala') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['EM ESCALA']),
      Portfólio: portIniNa('escala'), Operacional: e.data.pipeline['EM ESCALA'],
    }, catalogo),
    conferir('andamento', 'Em andamento', 'Epics em Em andamento ou Em validação.', 'telas', {
      Semanal: { n: fatia('andamento'), chaves: fase('andamento') }, 'Estratégia (Tudo)': k([...grupos.emAndamento, ...grupos.emValidacao]),
    }, catalogo),
    conferir('cancelados', 'Cancelados', 'Epics cancelados (inclui Descontinuado).', 'telas', {
      Semanal: { n: fatia('cancelados'), chaves: fase('cancelados') }, 'Estratégia (Tudo)': k(grupos.cancelados), Portfólio: portExpDe(x => x.situacao === 'cancelado'),
    }, catalogo),
    conferir('concluidos', 'Experimentos concluídos', 'Epics em Concluído.', 'telas', {
      Semanal: { n: e.weekly.experimentosConcluidos, chaves: fase('concluidos') }, 'Estratégia (Tudo)': k(grupos.concluidos),
      Crescimento: { n: crescimento.burnup.realizado.at(-1)?.valor ?? 0, chaves: k(crescimento.burnup.realizado.at(-1)?.epics ?? []) },
      Portfólio: portExpDe(x => x.situacao === 'concluido'),
    }, catalogo),
    comparar('beneficio', 'Benefício potencial (sem cancelados)', 'Soma do benefício dos Epics, tirando os cancelados.', {
      'Estratégia (Tudo)': est.beneficio, 'Portfólio (experimentos)': portExp.beneficio,
    }, 'moeda', 1, 'telas'),
  ]

  // Conta independente da regra do app: lê só o NOME do status (o id é reaproveitado entre boards no Jira). Nenhum
  // experimento com status "Cancelado"/"Descontinuado" pode entrar no benefício potencial nem na lista dele.
  const pareceCancelado = (x: { status: { id: string; name: string } }) =>
    /CANCEL|DESCONTINU/.test((x.status?.name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  verificacoes.push(
    comparar('beneficio-pelo-nome', 'Benefício potencial sem nenhum status de nome cancelado',
      'Soma direta do benefício, tirando todo Epic cujo nome de status diz cancelado/descontinuado.', {
        'Estratégia (Tudo)': est.beneficio,
        'Conta direta pelo nome do status': e.data.allEpics.reduce((acc, x) => acc + (pareceCancelado(x) ? 0 : x.beneficioQuantitativo ?? 0), 0),
      }, 'moeda', 1),
    comparar('lista-beneficio-sem-cancelado', 'Cancelados na lista do benefício potencial',
      'Epics com status de nome cancelado na lista "contribuem para o benefício" (tem de ser zero).', {
        'Lista da Estratégia': est.comBeneficio.filter(pareceCancelado).length, Esperado: 0,
      }),
  )

  // Visão de iniciativas do Portfólio: fica de fora o Epic sem iniciativa e entra o benefício próprio da iniciativa sem
  // experimento. Descontadas essas duas diferenças conhecidas, tem de bater com a visão de experimentos.
  const orfaos = e.data.allEpics.filter(x => !x.parentKey || !e.data.iniciativas.some(i => i.key === x.parentKey))
  const beneficioOrfaos = orfaos.reduce((s, x) => s + (ehCancelado(x) ? 0 : x.beneficioQuantitativo ?? 0), 0)
  const proprioSemExp = e.portfolio.iniciativas
    .filter(i => !i.experimentos.length && i.situacao !== 'cancelado')
    .reduce((s, i) => s + (i.beneficio ?? 0), 0)
  verificacoes.push(comparar('beneficio-iniciativas', 'Benefício na visão de iniciativas do Portfólio',
    'Visão de experimentos − Epics sem iniciativa + benefício próprio das iniciativas sem experimento.', {
      'Portfólio (iniciativas)': portIni.beneficio, 'Esperado pelos experimentos': portExp.beneficio - beneficioOrfaos + proprioSemExp,
    }, 'moeda', 1, 'telas'))

  // Bloqueados: só experimentos em experimentação (andamento ou validação), com a regra de bloqueio do app.
  const emExperimentacao = (x: EpicDetail) => ['3', '10204'].includes(x.status?.id) || /andamento|valida/i.test(x.status?.name ?? '')
  verificacoes.push(conferir('bloqueados', 'Experimentos bloqueados', 'Em andamento ou em validação, com sinal de bloqueio.', 'telas', {
    Portfólio: portExpDe(x => x.bloqueado), 'Regra do app (lib/bloqueio)': k(e.data.allEpics.filter(x => emExperimentacao(x) && epicBloqueado(x))),
  }, catalogo))

  // As 5 fatias do Semanal precisam somar o total de experimentos.
  const somaFatias = ['exploracao', 'andamento', 'validadas', 'refutadas', 'cancelados'].reduce((s, id) => s + fatia(id), 0)
  verificacoes.push(comparar('fatias-semanal', 'As 5 fatias do Semanal somam o total', 'Exploração + andamento + validadas + refutadas + cancelados = total de Epics.', {
    'Soma das fatias': somaFatias, 'Total de Epics': e.dataSemanal.allEpics.length,
  }))

  // ── Contra a fonte independente: a coluna real de cada item nos boards do Jira ──
  if (colIni.size) {
    // O que o Operacional mostra: as contagens do pipeline do DashboardData.
    for (const [et, titulo, stage] of [['aguardando', 'Aguardando piloto', 'AGUARDANDO PILOTO'], ['piloto', 'Em piloto', 'EM PILOTO'], ['escala', 'Em escala', 'EM ESCALA']] as const) {
      verificacoes.push(conferir(`coluna-${et}`, `${titulo}: regra do app × coluna no Jira`,
        'A regra do Semanal (por id/nome de status) e a do Operacional (por estágio) contra a coluna em que a iniciativa está no board de Ideação.', 'jira', {
          'Semanal (regra por status)': k(e.dataSemanal.iniciativas.filter(i => etapaValidada(i.status) === et)),
          'Operacional (estágio)': e.data.pipeline[stage],
          'Coluna no Jira': k(e.dataSemanal.iniciativas.filter(i => etapaPelaColuna(colIni.get(i.status.id)) === et)),
        }, catalogo))
    }
  }
  if (colExp.size) {
    const naColuna = (teste: (c: string) => boolean) => k(e.data.allEpics.filter(x => teste(colExp.get(x.status.id) ?? '')))
    verificacoes.push(conferir('coluna-concluidos', 'Concluídos: regra do app × coluna no Jira', 'Status Concluído (id 10019) contra a coluna Concluído do board de Experimentação.', 'jira', {
      'Regra do app': k(e.data.allEpics.filter(ehExperimentoConcluido)), 'Coluna no Jira': naColuna(c => c.includes('CONCLU') || c === 'DONE'),
    }, catalogo))
    verificacoes.push(conferir('coluna-cancelados', 'Cancelados: regra do app × coluna no Jira', 'Regra de cancelado do app contra a coluna Cancelado do board de Experimentação.', 'jira', {
      'Regra do app': k(e.data.allEpics.filter(ehCancelado)), 'Coluna no Jira': naColuna(c => c.includes('CANCEL') || c.includes('DESCONTINU')),
    }, catalogo))
    verificacoes.push(conferir('coluna-andamento', 'Em andamento: regra do app × coluna no Jira', 'Em andamento + Em validação contra as colunas de andamento e validação do board.', 'jira', {
      'Regra do app': k([...grupos.emAndamento, ...grupos.emValidacao]), 'Coluna no Jira': naColuna(c => c.includes('ANDAMENTO') || c.includes('VALIDA')),
    }, catalogo))
  }

  // ── Período: o funil e o Crescimento precisam contar os mesmos concluídos ──
  for (const periodo of [{ tipo: 'ultimos12' } as const, { tipo: 'ano', ano: (e.agora ?? new Date()).getFullYear() } as const]) {
    const d = filtrarDashboardData(e.data, periodo)
    const m = buildMonitoramentoData(d, periodo, e.data.allEpics)
    verificacoes.push(comparar(`periodo-${periodo.tipo}`, `Concluídos em ${periodo.tipo === 'ultimos12' ? 'Últimos 12 meses' : `Todo ${periodo.ano}`}: funil × Crescimento`,
      'Experimentos concluídos no período: o funil da Estratégia e o "+N no período" do Crescimento da Experimentação.', {
        'Funil (Estratégia)': contagensDoFunil(d.allEpics).concluidos, 'Crescimento (+N no período)': m.experimentosConcluidos,
      }, 'numero', 0, 'telas'))
  }

  // ── Períodos somam: 1º semestre + 2º semestre = o ano todo (cada experimento cai em um período só) ──
  const anoAtual = (e.agora ?? new Date()).getFullYear()
  for (const ano of [anoAtual - 1, anoAtual]) {
    const doPeriodo = (p: Parameters<typeof filtrarDashboardData>[1]) => {
      const d = filtrarDashboardData(e.data, p)
      return { beneficio: resultadosDaEstrategia(d).beneficio, experimentos: d.allEpics.length, concluidos: contagensDoFunil(d.allEpics).concluidos }
    }
    const s1 = doPeriodo({ tipo: 'semestre', ano, semestre: 1 })
    const s2 = doPeriodo({ tipo: 'semestre', ano, semestre: 2 })
    const todo = doPeriodo({ tipo: 'ano', ano })
    verificacoes.push(
      comparar(`semestres-beneficio-${ano}`, `Benefício potencial: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Os semestres somados têm de dar o ano: nenhum experimento conta em dois períodos.', {
          'Soma dos semestres': s1.beneficio + s2.beneficio, [`Todo ${ano}`]: todo.beneficio,
        }, 'moeda', 1),
      comparar(`semestres-experimentos-${ano}`, `Experimentos: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Total de experimentos e concluídos dos semestres somados contra o ano.', {
          'Soma dos semestres': s1.experimentos + s2.experimentos, [`Todo ${ano}`]: todo.experimentos,
        }),
      comparar(`semestres-concluidos-${ano}`, `Concluídos: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Experimentos concluídos em cada semestre, somados, contra o ano.', {
          'Soma dos semestres': s1.concluidos + s2.concluidos, [`Todo ${ano}`]: todo.concluidos,
        }),
    )
  }

  // ── Comparativo × Estratégia: o benefício potencial de cada ano é a mesma conta nas duas abas ──
  const benComp = e.comparativo?.indicadores.find(i => i.id === 'beneficio')
  if (benComp) {
    for (const ano of [anoAtual - 1, anoAtual]) {
      verificacoes.push(comparar(`comparativo-beneficio-${ano}`, `Benefício potencial de ${ano}: Comparativo × Estratégia`,
        'O cartão de benefício do Comparativo e o Benefício Potencial da Estratégia em "Todo ano" somam os mesmos experimentos.', {
          'Comparativo': resumirIndicador(benComp, janelaDe(String(ano))).soma,
          [`Estratégia (Todo ${ano})`]: resultadosDaEstrategia(filtrarDashboardData(e.data, { tipo: 'ano', ano })).beneficio,
        }, 'moeda', 1, 'telas'))
    }
  }

  // ── Metas: as três metas mais os sem meta somam os experimentos não cancelados ──
  const metas = tudo.metasAgregadas
  verificacoes.push(comparar('metas', 'Metas: soma das metas + sem meta = experimentos não cancelados', 'Cada experimento não cancelado está em uma meta ou na lista de sem meta.', {
    'Metas + sem meta': metas.EBITDA.count + metas.NPS.count + metas.Receita.count + est.semMeta.length,
    'Experimentos não cancelados': tudo.allEpics.filter(x => !ehCancelado(x)).length,
  }))

  // ── Qualidade dos dados no Jira ──
  const chavesIni = new Set(e.data.iniciativas.map(i => i.key))
  const semMae = e.data.allEpics.filter(x => !x.parentKey)
  const maeInexistente = e.data.allEpics.filter(x => x.parentKey && !chavesIni.has(x.parentKey))
  const dominioDaMae = new Map(e.data.iniciativas.map(i => [i.key, i.dominio || i.dominios[0] || null]))
  const semDominio = e.data.allEpics.filter(x => !ehCancelado(x) && !x.dominio?.trim() && !(x.parentKey && dominioDaMae.get(x.parentKey)))
  const etapaSemConcluido = e.data.iniciativas.filter(i => etapaValidada(i.status) && !i.epics.some(x => x.status?.id === '10019'))
  const bloqueioForaDeExperimentacao = e.data.allEpics.filter(x => !emExperimentacao(x) && epicBloqueado(x))
  // Datas: concluído sem a data de conclusão cai, nos filtros de período, no período da criação.
  const concluidos = e.data.allEpics.filter(ehExperimentoConcluido)
  const concluidoSemData = concluidos.filter(x => !x.concluidoEm)
  const datasIncoerentes = concluidos.filter(x => x.concluidoEm && x.criadoEm && Date.parse(x.concluidoEm) < Date.parse(x.criadoEm))
  // Benefício: um experimento que sozinho passa de 20% do total merece conferência do valor cadastrado.
  const concentrados = est.beneficio > 0 ? est.comBeneficio.filter(x => (x.beneficioQuantitativo ?? 0) / est.beneficio >= 0.2) : []
  const validadasSemBeneficio = est.hipoteses.validadas.filter(x => !(x.beneficioQuantitativo && x.beneficioQuantitativo > 0))
  // Mesmo nome em mais de um experimento não cancelado: possível cadastro duplicado (o benefício entra duas vezes).
  const porNome = new Map<string, EpicDetail[]>()
  for (const x of e.data.allEpics) if (!ehCancelado(x)) porNome.set(normal(x.nome), [...(porNome.get(normal(x.nome)) ?? []), x])
  const duplicados = [...porNome.values()].filter(g => g.length > 1)
  const pctDoBeneficio = (x: EpicDetail) => `${Math.round(((x.beneficioQuantitativo ?? 0) / est.beneficio) * 100)}%`
  const epics = (xs: EpicDetail[]) => xs.map(x => refDoEpic(x))
  const alertas: Alerta[] = [
    alerta('sem-iniciativa', 'Experimentos sem iniciativa-mãe', epics(semMae)),
    alerta('mae-inexistente', 'Experimentos com iniciativa-mãe fora do board de Ideação', maeInexistente.map(x => refDoEpic(x, `mãe: ${x.parentKey}`))),
    alerta('sem-dominio', 'Experimentos sem domínio (nem no experimento nem na iniciativa)', epics(semDominio)),
    alerta('sem-meta', 'Experimentos sem meta estratégica (classificação da IA pendente)', epics(est.semMeta)),
    alerta('etapa-sem-concluido', 'Iniciativas em aguardando piloto, piloto ou escala sem experimento concluído (contam nas etapas, não nas hipóteses)', etapaSemConcluido.map(refDaIniciativa)),
    alerta('bloqueio-fora', 'Sinal de bloqueio fora de experimentação (não conta em Bloqueados)', epics(bloqueioForaDeExperimentacao)),
    ...inventarioDeStatus(e, colIni, colExp),
    alerta('concluido-sem-data', 'Concluídos sem data de conclusão no histórico (nos filtros de período, contam pela criação)', epics(concluidoSemData)),
    alerta('datas-incoerentes', 'Concluídos com data de conclusão anterior à criação', epics(datasIncoerentes)),
    alerta('beneficio-concentrado', 'Experimentos que sozinhos passam de 20% do benefício potencial (confira o valor cadastrado)',
      concentrados.map(x => refDoEpic(x, `${pctDoBeneficio(x)} do benefício potencial`)), concentrados.slice(0, 5).map(x => `${x.key} (${pctDoBeneficio(x)})`)),
    alerta('validadas-sem-beneficio', 'Hipóteses validadas sem benefício cadastrado', epics(validadasSemBeneficio)),
    alerta('possiveis-duplicados', 'Experimentos com o mesmo nome (possível cadastro duplicado)',
      duplicados.flatMap(g => g.map(x => refDoEpic(x, `mesmo nome de ${g.filter(o => o !== x).map(o => o.key).join(', ')}`))), duplicados.slice(0, 5).map(g => g.map(x => x.key).join(' = '))),
    alerta('cancelados-com-beneficio', 'Cancelados com benefício (fora do benefício potencial)', epics(est.cancelados.epics)),
    alerta('arquivadas', 'Arquivadas no Jira, fora de todas as contas', (e.arquivadas ?? []).map(key => ({ key, nome: '', status: 'arquivada' })), (e.arquivadas ?? []).slice(0, 8)),
  ].filter(a => a.quantidade > 0)

  return {
    geradoEm: (e.agora ?? new Date()).toISOString(),
    verificacoes,
    alertas,
    divergencias: verificacoes.filter(v => !v.ok).length,
    resumo: resumoDoRelatorio(verificacoes),
    parecer: parecerDoAuditor(verificacoes, alertas),
    telas: confiancaPorTela(verificacoes),
  }
}

/** O parecer: dá para confiar nos painéis? Crítico quando telas discordam ou uma conta não fecha. */
function parecerDoAuditor(verificacoes: Verificacao[], alertas: Alerta[]): Parecer {
  const falhas = verificacoes.filter(v => !v.ok)
  const graves = falhas.filter(v => v.natureza !== 'jira')
  const contraOJira = falhas.filter(v => v.natureza === 'jira')
  const aCorrigir = alertas.filter(a => a.gravidade === 'corrigir').length
  const aConferir = alertas.filter(a => a.gravidade === 'conferir').length
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
  const frases = resumoDoRelatorio(verificacoes)
  if (aCorrigir || aConferir) {
    frases.push(`No cadastro do Jira, ${[aCorrigir ? `${plural(aCorrigir, 'ponto distorce', 'pontos distorcem')} algum número e ${aCorrigir === 1 ? 'pede' : 'pedem'} correção` : '', aConferir ? `${plural(aConferir, 'ponto vale', 'pontos valem')} uma conferência` : ''].filter(Boolean).join(' e ')}.`)
  }
  if (graves.length) {
    return { nivel: 'critico', titulo: `${plural(graves.length, 'número aparece diferente', 'números aparecem diferentes')} dependendo da tela.`, frases }
  }
  if (contraOJira.length) {
    return { nivel: 'atencao', titulo: `As telas batem entre si, mas a regra do app discorda do board do Jira em ${plural(contraOJira.length, 'ponto', 'pontos')}.`, frases }
  }
  return { nivel: 'ok', titulo: 'As telas contam a mesma história, item por item.', frases }
}

const TELAS = ['Semanal', 'Estratégia', 'Portfólio', 'Operacional', 'Comparativo', 'Crescimento'] as const

/** A tela a que uma visão pertence (as contas internas, como "Regra do app" ou "Coluna no Jira", não são telas). */
function telaDaVisao(visao: string): string | null {
  if (/^(Funil|Lista da Estratégia|Soma dos semestres|Todo \d|Metas)/.test(visao)) return 'Estratégia'
  if (visao.startsWith('Soma das fatias')) return 'Semanal'
  return TELAS.find(t => visao.startsWith(t)) ?? null
}

/**
 * Para cada tela: em quantas conferências ela entra e como se sai. Numa divergência com consenso, só conta contra a
 * tela se ela está fora do consenso; se quem está fora é a coluna do Jira, as telas "diferem do Jira"; sem consenso,
 * as visões ficam "em disputa".
 */
function confiancaPorTela(verificacoes: Verificacao[]): ConfiancaDaTela[] {
  return TELAS.map(tela => {
    const dela = verificacoes.filter(v => Object.keys(v.valores).some(x => telaDaVisao(x) === tela))
    let destoa = 0, disputa = 0, contraOJira = 0
    for (const v of dela.filter(x => !x.ok)) {
      const fora = v.destoam ?? []
      if (fora.some(x => telaDaVisao(x) === tela)) destoa++
      else if (!fora.length) disputa++
      else if (fora.some(x => x.includes('Jira'))) contraOJira++
      // Senão, quem destoa é outra tela: esta está com a maioria e a divergência não conta contra ela.
    }
    const situacao: ConfiancaDaTela['situacao'] = destoa ? 'destoa' : disputa ? 'em disputa' : contraOJira ? 'difere do Jira' : 'bate'
    return { tela, conferencias: dela.length, divergencias: destoa + disputa + contraOJira, destoa, situacao }
  }).filter(t => t.conferencias > 0)
}

const NOME_DA_NATUREZA: Record<Natureza, [string, string]> = {
  telas: ['entre telas do app', 'entre telas do app'],
  jira: ['entre a regra do app e as colunas do Jira', 'entre a regra do app e as colunas do Jira'],
  soma: ['numa conta que deveria fechar', 'em contas que deveriam fechar'],
}

/** O placar em frases: quantas batem, onde estão as divergências e a causa que mais se repete. */
function resumoDoRelatorio(verificacoes: Verificacao[]): string[] {
  const falhas = verificacoes.filter(v => !v.ok)
  const frases = [falhas.length
    ? `${verificacoes.length} conferências: ${verificacoes.length - falhas.length} batem e ${falhas.length} ${falhas.length === 1 ? 'diverge' : 'divergem'}.`
    : `${verificacoes.length} conferências, todas batem: as telas contam a mesma história, item por item.`]
  for (const natureza of ['telas', 'jira', 'soma'] as const) {
    const n = falhas.filter(v => v.natureza === natureza).length
    if (n) frases.push(`${n} ${n === 1 ? 'divergência' : 'divergências'} ${NOME_DA_NATUREZA[natureza][n === 1 ? 0 : 1]}.`)
  }
  // A mesma causa em várias divergências é uma correção só.
  const causas = new Map<string, number>()
  for (const v of falhas) if (v.diagnostico?.causa) causas.set(v.diagnostico.causa, (causas.get(v.diagnostico.causa) ?? 0) + 1)
  const repetida = [...causas.entries()].sort((a, b) => b[1] - a[1])[0]
  if (repetida && repetida[1] > 1) frases.push(`${repetida[1]} delas têm a mesma causa provável: ${repetida[0]}`)
  return frases
}
