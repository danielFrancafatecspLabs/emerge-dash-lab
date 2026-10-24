/**
 * Aba Comparativo: indicadores-chave de um período contra outro — ano × ano, trimestre × trimestre ou mês × mês.
 * Tipos e agregação (rodam na tela). A leitura do Jira fica em ./montar.ts, no servidor.
 */

export type IndicadorId =
  | 'concluidos' | 'cancelados' | 'validadas' | 'refutadas' | 'beneficio'
  | 'leadExploracao' | 'leadExperimentacao' | 'aguardandoPiloto' | 'piloto'

/** Situação de hoje de cada Epic, com a mesma classificação do Semanal. */
export type SituacaoExperimento = 'exploracao' | 'andamento' | 'validada' | 'refutada' | 'cancelada' | 'outro'

// Paleta validada (dataviz/validate_palette, modo claro: faixa de luminosidade, croma, daltonismo e separação OK).
// Matizes diferentes do azul (período base) e do vermelho (período atual); "Outros status" fica em cinza, sempre com o número.
export const SITUACOES: { id: SituacaoExperimento; label: string; cor: string; descricao: string }[] = [
  { id: 'validada', label: 'Hipótese validada', cor: '#0F8A6C', descricao: 'Concluído, com a iniciativa em Aguardando piloto, Piloto ou Escala' },
  { id: 'refutada', label: 'Hipótese refutada', cor: '#D49A0A', descricao: 'Concluído, sem a iniciativa seguir para piloto' },
  { id: 'cancelada', label: 'Cancelado', cor: '#B5461E', descricao: 'Encerrado antes de concluir' },
  { id: 'andamento', label: 'Em andamento', cor: '#2B88C8', descricao: 'Em andamento ou em validação' },
  { id: 'exploracao', label: 'Em exploração', cor: '#6F8F12', descricao: 'Backlog ou em refinamento' },
  { id: 'outro', label: 'Outros status', cor: '#C4C7CE', descricao: 'Por exemplo, Pronto para execução' },
]

/** Um Epic do board de Experimentação, com as datas que decidem o período de cada evento. */
export interface Experimento {
  key: string
  nome: string
  situacao: SituacaoExperimento
  status: string
  beneficio: number | null
  /** Domínio do Epic; laboratório responsável (o da iniciativa-mãe, como no Semanal); diretoria. */
  area: string | null
  lab: string | null
  diretoria: string | null
  criadoEm: string | null     // AAAA-MM-DD
  concluidoEm: string | null
  canceladoEm: string | null
}

/** Iniciativa do board de Ideação, com a etapa de hoje e a primeira entrada em cada etapa (AAAA-MM-DD). */
export interface IniciativaResumo {
  key: string
  nome: string
  etapa: 'exploracao' | 'experimentacao' | 'aguardando' | 'piloto' | 'escala' | 'concluido' | 'cancelado' | null
  criadoEm: string | null
  experimentacaoEm: string | null
  validadaEm: string | null    // Aguardando piloto, Piloto ou Escala, o que vier primeiro
  pilotoEm: string | null
  escalaEm: string | null
}

/** Item que ficou fora de um indicador, com o motivo (a data, quando há, decide o período). */
export interface ForaDaConta { key: string; nome: string; motivo: string; data: string | null }

export interface Amostra {
  key: string
  nome: string
  /** Dias (tempos) ou R$ (benefício). */
  valor: number
  /** Dia (AAAA-MM-DD) em que a amostra conta: decide em que período ela cai. */
  data: string
}

/** Item que ainda está na etapa hoje (não entra na média; aparece como contexto). */
export interface EmAberto { key: string; nome: string; dias: number }

export interface Indicador {
  id: IndicadorId
  titulo: string
  /** Como o número é calculado, em uma frase para quem lê a tela. */
  regra: string
  unidade: 'dias' | 'reais' | 'itens'
  /** Para tempos, menor é melhor; para benefício e validadas, maior; refutadas não têm lado bom. */
  melhor: 'menor' | 'maior' | 'neutro'
  board: 'Ideação' | 'Experimentação'
  /** Seção da tela: resultados do período (eventos) ou tempos do processo. */
  grupo: 'resultados' | 'tempos'
  /** Mostra o indicador também como % de outro no mesmo período (validadas e refutadas sobre os concluídos). */
  relativoA?: IndicadorId
  /** Itens que poderiam entrar e ficaram de fora, com o motivo. */
  foraDaConta?: ForaDaConta[]
  amostras: Amostra[]
  emAberto: EmAberto[]
  /** Benefício: o total de hoje das hipóteses validadas (o mesmo conjunto do Semanal) e quantas não têm data de conclusão. */
  conciliacao?: { total: number; n: number; semData: number }
}

export interface ComparativoDados {
  indicadores: Indicador[]
  /** Todos os Epics do board de Experimentação (o total do histórico), para o panorama por período de criação. */
  experimentos: Experimento[]
  /** Todas as iniciativas do board de Ideação, para o report executivo (exploração e funil). */
  iniciativas: IniciativaResumo[]
  /** Quantos itens ficaram sem histórico de status (o Jira não devolveu) e por isso fora das contas. */
  cobertura?: { iniciativas: { total: number; semHistorico: number }; epics: { total: number; semHistorico: number } }
  /** Dia da leitura (AAAA-MM-DD): o período atual vai até ele, e o "mesmo período" corta a base no mesmo ponto. */
  hoje: string
  jiraUrl: string | null
}

// ── Períodos: anos, trimestres e meses ───────────────────────────────────────────────────────

export type Modo = 'anual' | 'trimestral' | 'mensal'
/** Primeiro ano com dados no Comparativo. */
export const PRIMEIRO_ANO = 2025

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Subdivisão de um período: os meses de um ano ou trimestre, as semanas de um mês. */
export interface Parte { rotulo: string; inicio: string; fim: string }

/** Um período comparado, com início e fim inclusivos (AAAA-MM-DD). */
export interface Janela { id: string; rotulo: string; inicio: string; fim: string; partes: Parte[] }

/** Os dois períodos da tela: a base (azul) e o atual (vermelho). */
export interface Comparacao {
  modo: Modo
  base: Janela
  atual: Janela
  /** O período atual ainda não terminou (vai até hoje). */
  parcial: boolean
  /** A base foi cortada no mesmo ponto do período atual ("mesmo período"). */
  cortada: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const diaN = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000
const nDia = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
const mesRotulo = (ano: number, mes: number) => `${MESES[mes][0].toUpperCase()}${MESES[mes].slice(1)}/${ano}`

function janelaMeses(id: string, rotulo: string, ano: number, de: number, ate: number): Janela {
  const partes = Array.from({ length: ate - de + 1 }, (_, k) => {
    const m = de + k
    return { rotulo: MESES[m], inicio: `${ano}-${pad(m + 1)}-01`, fim: `${ano}-${pad(m + 1)}-${pad(ultimoDia(ano, m))}` }
  })
  return { id, rotulo, inicio: partes[0].inicio, fim: partes[partes.length - 1].fim, partes }
}

/** Período pelo id: "2026" (ano), "2026-T4" (trimestre) ou "2026-10" (mês, com as semanas como partes). */
export function janelaDe(id: string): Janela {
  const ano = Number(id.slice(0, 4))
  if (id.length === 4) return janelaMeses(id, String(ano), ano, 0, 11)
  if (id[5] === 'T') {
    const t = Number(id.slice(6)) - 1
    return janelaMeses(id, `${t + 1}º tri/${ano}`, ano, t * 3, t * 3 + 2)
  }
  const m = Number(id.slice(5, 7)) - 1
  const fim = ultimoDia(ano, m)
  const partes = [1, 8, 15, 22, 29].filter(d => d <= fim).map((d, k) => ({
    rotulo: `sem ${k + 1}`, inicio: `${ano}-${pad(m + 1)}-${pad(d)}`, fim: `${ano}-${pad(m + 1)}-${pad(Math.min(fim, d + 6))}`,
  }))
  return { id, rotulo: mesRotulo(ano, m), inicio: partes[0].inicio, fim: partes[partes.length - 1].fim, partes }
}

/** Id do período em que cai um dia. */
export function idDoPeriodo(modo: Modo, dia: string): string {
  const ano = dia.slice(0, 4), mes = Number(dia.slice(5, 7))
  return modo === 'anual' ? ano : modo === 'trimestral' ? `${ano}-T${Math.ceil(mes / 3)}` : `${ano}-${pad(mes)}`
}

/** Período anterior (ano, trimestre ou mês imediatamente antes) ou o mesmo período um ano antes. */
export function periodoBase(id: string, tipo: 'anterior' | 'ano-anterior'): string {
  const ano = Number(id.slice(0, 4))
  if (id.length === 4 || tipo === 'ano-anterior') return `${ano - 1}${id.slice(4)}`
  if (id[5] === 'T') {
    const t = Number(id.slice(6))
    return t === 1 ? `${ano - 1}-T4` : `${ano}-T${t - 1}`
  }
  const m = Number(id.slice(5, 7))
  return m === 1 ? `${ano - 1}-12` : `${ano}-${pad(m - 1)}`
}

/** Períodos que dá para escolher, do mais recente ao primeiro com base de comparação. */
export function periodosDisponiveis(modo: Modo, hoje: string): { id: string; rotulo: string }[] {
  const ids: string[] = []
  for (let id = idDoPeriodo(modo, hoje); ; id = periodoBase(id, 'anterior')) {
    if (Number(id.slice(0, 4)) < PRIMEIRO_ANO) break
    ids.push(id)
  }
  // No anual, o primeiro ano não tem base dentro do histórico do Comparativo.
  return (modo === 'anual' ? ids.filter(id => Number(id) > PRIMEIRO_ANO) : ids).map(id => ({ id, rotulo: janelaDe(id).rotulo }))
}

/**
 * Monta os dois períodos. O atual vai até hoje; com "mesmo período", a base é cortada no mesmo número de dias
 * decorridos, para não comparar um mês pela metade com um mês inteiro.
 */
export function criarComparacao(o: { modo: Modo; id: string; base: 'anterior' | 'ano-anterior'; mesmoPeriodo: boolean; hoje: string }): Comparacao {
  const cheio = janelaDe(o.id)
  const parcial = o.hoje < cheio.fim
  const atual = { ...cheio, fim: parcial ? o.hoje : cheio.fim }
  const baseCheia = janelaDe(periodoBase(o.id, o.base))
  const cortada = o.mesmoPeriodo && parcial
  const fimBase = cortada ? nDia(Math.min(diaN(baseCheia.fim), diaN(baseCheia.inicio) + (diaN(atual.fim) - diaN(atual.inicio)))) : baseCheia.fim
  return { modo: o.modo, base: { ...baseCheia, fim: fimBase }, atual, parcial, cortada }
}

/** "1º/jan a 24/out" — o trecho de um período que entra na conta. */
export function trecho(j: Janela): string {
  const f = (d: string) => `${Number(d.slice(8, 10)) === 1 ? '1º' : Number(d.slice(8, 10))}/${MESES[Number(d.slice(5, 7)) - 1]}`
  return `${f(j.inicio)} a ${f(j.fim)}${j.inicio.slice(0, 4) !== j.fim.slice(0, 4) ? `/${j.fim.slice(0, 4)}` : ''}`
}

export const dentro = (d: string | null | undefined, j: Janela): d is string => !!d && d >= j.inicio && d <= j.fim

// ── Agregação (roda na tela) ──────────────────────────────────────────────────────────────────

export interface Resumo {
  janela: Janela
  n: number
  media: number | null
  mediana: number | null
  soma: number
  /** Por parte do período (mês ou semana): mediana (dias), soma (R$) ou quantidade (itens); null sem amostra. */
  porParte: (number | null)[]
  /** Quantidade de amostras por parte. */
  nPorParte: number[]
  amostras: Amostra[]
}

/** Amostras que caem no período. */
export function amostrasDa(ind: Indicador, j: Janela): Amostra[] {
  return ind.amostras.filter(a => dentro(a.data, j))
}

const parteDe = (j: Janela, d: string) => j.partes.findIndex(p => d >= p.inicio && d <= p.fim)

function agregar(ind: Indicador, valores: number[]): number | null {
  if (!valores.length) return null
  return ind.unidade === 'itens' ? valores.length : ind.unidade === 'reais' ? valores.reduce((s, v) => s + v, 0) : mediana(valores)
}

export function resumir(ind: Indicador, j: Janela): Resumo {
  const amostras = amostrasDa(ind, j).sort((a, b) => a.data.localeCompare(b.data))
  const valores = amostras.map(a => a.valor)
  const n = valores.length
  const soma = valores.reduce((s, v) => s + v, 0)
  const porParteValores: number[][] = j.partes.map(() => [])
  for (const a of amostras) porParteValores[parteDe(j, a.data)]?.push(a.valor)
  return {
    janela: j, n, soma, amostras,
    porParte: porParteValores.map(v => agregar(ind, v)),
    nPorParte: porParteValores.map(v => v.length),
    media: n ? Math.round(soma / n) : null,
    mediana: n ? mediana(valores) : null,
  }
}

function mediana(v: number[]): number {
  const o = [...v].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2)
}

/**
 * Valor que resume o período: soma de R$, quantidade de itens ou, nos tempos, a mediana de dias. A mediana não deixa um
 * punhado de itens parados há muito tempo puxar o número do período inteiro (a média continua no detalhe).
 */
export const principal = (ind: Indicador, r: Resumo) =>
  ind.unidade === 'reais' ? (r.n ? r.soma : null) : ind.unidade === 'itens' ? r.n : r.mediana

/** Abaixo disso a variação percentual não diz muito: o cartão mostra os números, mas não o %. */
export const MINIMO_PARA_COMPARAR = 3

/** Variação de `antes` para `depois`, em %, e se ela é boa para o indicador. */
export function variacao(ind: Indicador, antes: number | null, depois: number | null): { pct: number; diferenca: number; melhorou: boolean | null } | null {
  if (antes === null || depois === null || antes === 0) return null
  const diferenca = depois - antes
  const pct = Math.round((diferenca / antes) * 100)
  return { pct, diferenca, melhorou: diferenca === 0 || ind.melhor === 'neutro' ? null : ind.melhor === 'menor' ? diferenca < 0 : diferenca > 0 }
}

/**
 * Valor de cada grupo de partes do período (de `tamanho` em `tamanho`: 1 = cada mês ou semana; 3 = trimestres de um
 * ano), com quantos itens entraram. Grupo sem item fica null.
 */
export function serie(ind: Indicador, r: Resumo, tamanho = 1): { valor: number | null; n: number }[] {
  const grupos = Math.ceil(r.janela.partes.length / tamanho)
  return Array.from({ length: grupos }, (_, g) => {
    const valores = r.amostras.filter(a => Math.floor(parteDe(r.janela, a.data) / tamanho) === g).map(a => a.valor)
    return { valor: agregar(ind, valores), n: valores.length }
  })
}

/** Em que período um Epic foi criado: na base, no atual, em outro período ou sem data. */
export function periodoDeCriacao(e: Experimento, c: Comparacao): 'base' | 'atual' | 'outro' | 'sem-data' {
  if (!e.criadoEm) return 'sem-data'
  return dentro(e.criadoEm, c.base) ? 'base' : dentro(e.criadoEm, c.atual) ? 'atual' : 'outro'
}

// ── Por área ──────────────────────────────────────────────────────────────────────────────────

export type Dimensao = 'area' | 'lab' | 'diretoria'
export const DIMENSOES: { id: Dimensao; label: string; vazio: string }[] = [
  { id: 'area', label: 'Área', vazio: 'Área não informada' },
  { id: 'lab', label: 'Laboratório', vazio: 'Laboratório não informado' },
  { id: 'diretoria', label: 'Diretoria', vazio: 'Diretoria não informada' },
]

export interface Metricas {
  concluidos: number
  validadas: number
  refutadas: number
  cancelados: number
  beneficio: number
  /** Validadas sobre concluídos; null sem concluídos. */
  taxaValidacao: number | null
}

/** Um evento de um experimento num dos dois períodos (0 = base, 1 = atual): conclusão ou cancelamento. */
export interface Evento { periodo: 0 | 1; data: string; experimento: Experimento }

export interface LinhaDimensao { nome: string; informado: boolean; porPeriodo: Metricas[]; eventos: Evento[] }

/** Data do evento que conta: conclusão (validada ou refutada) ou cancelamento. */
export const dataDoEvento = (e: Experimento) =>
  e.situacao === 'validada' || e.situacao === 'refutada' ? e.concluidoEm : e.situacao === 'cancelada' ? e.canceladoEm : null

function eventosDa(experimentos: Experimento[], j: Janela, periodo: 0 | 1): Evento[] {
  return experimentos.flatMap(e => {
    const data = dataDoEvento(e)
    return dentro(data, j) ? [{ periodo, data, experimento: e }] : []
  })
}

function metricas(eventos: Evento[]): Metricas {
  const de = (s: Experimento['situacao']) => eventos.filter(ev => ev.experimento.situacao === s)
  const validadas = de('validada'), refutadas = de('refutada')
  const concluidos = validadas.length + refutadas.length
  return {
    concluidos, validadas: validadas.length, refutadas: refutadas.length, cancelados: de('cancelada').length,
    beneficio: validadas.reduce((s, ev) => s + (ev.experimento.beneficio ?? 0), 0),
    taxaValidacao: concluidos ? Math.round((validadas.length / concluidos) * 100) : null,
  }
}

/**
 * Resultados dos dois períodos quebrados por área, laboratório ou diretoria: cada linha é um valor do campo, com as
 * métricas de cada período e os eventos que as formam. Ordem: quem teve mais eventos; "não informado" por último.
 */
export function porDimensao(experimentos: Experimento[], dim: Dimensao, c: Pick<Comparacao, 'base' | 'atual'>): { linhas: LinhaDimensao[]; total: Metricas[] } {
  const vazio = DIMENSOES.find(d => d.id === dim)!.vazio
  const todos = [...eventosDa(experimentos, c.base, 0), ...eventosDa(experimentos, c.atual, 1)]
  const grupos = new Map<string, Evento[]>()
  for (const ev of todos) {
    const nome = ev.experimento[dim] ?? vazio
    grupos.set(nome, [...(grupos.get(nome) ?? []), ev])
  }
  const porPeriodo = (evs: Evento[]) => [metricas(evs.filter(ev => ev.periodo === 0)), metricas(evs.filter(ev => ev.periodo === 1))]
  const linhas = [...grupos.entries()].map(([nome, eventos]) => ({ nome, informado: nome !== vazio, eventos, porPeriodo: porPeriodo(eventos) }))
  linhas.sort((a, b) => Number(b.informado) - Number(a.informado) || b.eventos.length - a.eventos.length || a.nome.localeCompare(b.nome, 'pt-BR'))
  return { linhas, total: porPeriodo(todos) }
}
