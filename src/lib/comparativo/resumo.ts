/**
 * Aba Comparativo: indicadores-chave do ano corrente contra o anterior (2025 × 2026).
 * Tipos e agregação (rodam na tela). A leitura do Jira fica em ./montar.ts, no servidor.
 */

export const ANOS = [2025, 2026] as const
export type Ano = (typeof ANOS)[number]

export type IndicadorId =
  | 'concluidos' | 'cancelados' | 'validadas' | 'refutadas' | 'beneficio'
  | 'leadExploracao' | 'leadExperimentacao' | 'aguardandoPiloto' | 'piloto'

/** Situação de hoje de cada Epic, com a mesma classificação do Semanal. */
export type SituacaoExperimento = 'exploracao' | 'andamento' | 'validada' | 'refutada' | 'cancelada' | 'outro'

// Paleta validada (dataviz/validate_palette, modo claro: faixa de luminosidade, croma, daltonismo e separação OK).
// Matizes diferentes do azul de 2025 e do vermelho de 2026; "Outros status" fica em cinza neutro, sempre com o número.
export const SITUACOES: { id: SituacaoExperimento; label: string; cor: string; descricao: string }[] = [
  { id: 'validada', label: 'Hipótese validada', cor: '#0F8A6C', descricao: 'Concluído, com a iniciativa em Aguardando piloto, Piloto ou Escala' },
  { id: 'refutada', label: 'Hipótese refutada', cor: '#D49A0A', descricao: 'Concluído, sem a iniciativa seguir para piloto' },
  { id: 'cancelada', label: 'Cancelado', cor: '#B5461E', descricao: 'Encerrado antes de concluir' },
  { id: 'andamento', label: 'Em andamento', cor: '#2B88C8', descricao: 'Em andamento ou em validação' },
  { id: 'exploracao', label: 'Em exploração', cor: '#6F8F12', descricao: 'Backlog ou em refinamento' },
  { id: 'outro', label: 'Outros status', cor: '#C4C7CE', descricao: 'Por exemplo, Pronto para execução' },
]

/** Um Epic do board de Experimentação, com as datas que decidem o ano de cada evento. */
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

/** Item que ficou fora de um indicador, com o motivo (a data, quando há, decide o ano). */
export interface ForaDaConta { key: string; nome: string; motivo: string; data: string | null }

export interface Amostra {
  key: string
  nome: string
  /** Dias (tempos) ou R$ (benefício). */
  valor: number
  /** Dia (AAAA-MM-DD) em que a amostra conta para o ano. */
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
  /** Seção da tela: resultados do ano (eventos) ou tempos do processo. */
  grupo: 'resultados' | 'tempos'
  /** Mostra o indicador também como % de outro no mesmo ano (validadas e refutadas sobre os concluídos). */
  relativoA?: IndicadorId
  /** Itens que poderiam entrar e ficaram de fora, com o motivo. */
  foraDaConta?: ForaDaConta[]
  amostras: Amostra[]
  emAberto: EmAberto[]
  /** Benefício: o total de hoje das hipóteses validadas (o mesmo conjunto do Semanal) e o que não cai em 2025 nem 2026. */
  conciliacao?: { total: number; n: number; foraDosAnos: number; semData: number }
}

export interface ComparativoDados {
  indicadores: Indicador[]
  /** Todos os Epics do board de Experimentação (o total do histórico), para o panorama por ano de criação. */
  experimentos: Experimento[]
  /** Quantos itens ficaram sem histórico de status (o Jira não devolveu) e por isso fora das contas. */
  cobertura?: { iniciativas: { total: number; semHistorico: number }; epics: { total: number; semHistorico: number } }
  /** Dia da leitura (AAAA-MM-DD), usado no corte "mesmo período". */
  hoje: string
  jiraUrl: string | null
}

// ── Agregação (roda na tela) ──────────────────────────────────────────────────────────────────

export interface ResumoAno {
  ano: number
  n: number
  media: number | null
  mediana: number | null
  soma: number
  /** Por mês (jan a dez): mediana (dias), soma (R$) ou quantidade (itens); null quando não há amostra. */
  porMes: (number | null)[]
  /** Quantidade de amostras por mês. */
  nPorMes: number[]
  amostras: Amostra[]
}

/** Amostras do ano; com `ate` (MM-DD), só até esse dia do ano, para comparar o mesmo período. */
export function amostrasDoAno(ind: Indicador, ano: number, ate: string | null): Amostra[] {
  return ind.amostras.filter(a => a.data.startsWith(`${ano}-`) && (!ate || a.data.slice(5) <= ate))
}

export function resumirAno(ind: Indicador, ano: number, ate: string | null): ResumoAno {
  const amostras = amostrasDoAno(ind, ano, ate).sort((a, b) => a.data.localeCompare(b.data))
  const valores = amostras.map(a => a.valor).sort((a, b) => a - b)
  const n = valores.length
  const soma = valores.reduce((s, v) => s + v, 0)
  const meio = Math.floor(n / 2)
  const porMes: (number | null)[] = Array(12).fill(null)
  const nPorMes = Array(12).fill(0)
  const valoresMes: number[][] = Array.from({ length: 12 }, () => [])
  for (const a of amostras) {
    const m = Number(a.data.slice(5, 7)) - 1
    nPorMes[m]++
    valoresMes[m].push(a.valor)
  }
  for (let m = 0; m < 12; m++) {
    if (nPorMes[m]) {
      porMes[m] = ind.unidade === 'reais' ? valoresMes[m].reduce((x, v) => x + v, 0) : ind.unidade === 'itens' ? nPorMes[m] : mediana(valoresMes[m])
    }
  }
  return {
    ano, n, soma, porMes, nPorMes, amostras,
    media: n ? Math.round(soma / n) : null,
    mediana: n ? (n % 2 ? valores[meio] : Math.round((valores[meio - 1] + valores[meio]) / 2)) : null,
  }
}

function mediana(v: number[]): number {
  const o = [...v].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2)
}

/**
 * Valor que resume o ano: soma de R$, quantidade de itens ou, nos tempos, a mediana de dias. A mediana não deixa um
 * punhado de itens parados há muito tempo puxar o número do ano inteiro (a média continua no detalhe).
 */
export const principal = (ind: Indicador, r: ResumoAno) =>
  ind.unidade === 'reais' ? (r.n ? r.soma : null) : ind.unidade === 'itens' ? r.n : r.mediana

/** Ano de criação de cada Epic: os dois anos comparados, antes deles ou sem data. */
export function anoDeCriacao(e: Experimento): number | 'antes' | 'sem-data' {
  if (!e.criadoEm) return 'sem-data'
  const ano = Number(e.criadoEm.slice(0, 4))
  return (ANOS as readonly number[]).includes(ano) ? ano : ano < ANOS[0] ? 'antes' : 'sem-data'
}

/** Abaixo disso a variação percentual não diz muito: o cartão mostra os números, mas não o %. */
export const MINIMO_PARA_COMPARAR = 3

/** Variação de `antes` para `depois`, em %, e se ela é boa para o indicador. */
export function variacao(ind: Indicador, antes: number | null, depois: number | null): { pct: number; diferenca: number; melhorou: boolean | null } | null {
  if (antes === null || depois === null || antes === 0) return null
  const diferenca = depois - antes
  const pct = Math.round((diferenca / antes) * 100)
  return { pct, diferenca, melhorou: diferenca === 0 || ind.melhor === 'neutro' ? null : ind.melhor === 'menor' ? diferenca < 0 : diferenca > 0 }
}

// ── Granularidade: por período e por área ────────────────────────────────────────────────────

export type Granularidade = 'mes' | 'trimestre'

/**
 * Valor de cada mês ou trimestre do ano: quantidade (itens), soma (R$) ou mediana (dias), com quantos itens entraram.
 * Período sem item fica null.
 */
export function serie(ind: Indicador, r: ResumoAno, g: Granularidade): { valor: number | null; n: number }[] {
  const tamanho = g === 'mes' ? 1 : 3
  return Array.from({ length: 12 / tamanho }, (_, p) => {
    const valores = r.amostras.filter(a => Math.floor((Number(a.data.slice(5, 7)) - 1) / tamanho) === p).map(a => a.valor)
    if (!valores.length) return { valor: null, n: 0 }
    const valor = ind.unidade === 'itens' ? valores.length : ind.unidade === 'reais' ? valores.reduce((s, v) => s + v, 0) : mediana(valores)
    return { valor, n: valores.length }
  })
}

export type Dimensao = 'area' | 'lab' | 'diretoria'
export const DIMENSOES: { id: Dimensao; label: string; vazio: string }[] = [
  { id: 'area', label: 'Área', vazio: 'Área não informada' },
  { id: 'lab', label: 'Laboratório', vazio: 'Laboratório não informado' },
  { id: 'diretoria', label: 'Diretoria', vazio: 'Diretoria não informada' },
]

export interface MetricasAno {
  concluidos: number
  validadas: number
  refutadas: number
  cancelados: number
  beneficio: number
  /** Validadas sobre concluídos; null sem concluídos. */
  taxaValidacao: number | null
}

/** Um evento de um experimento no ano: conclusão (validada ou refutada) ou cancelamento. */
export interface EventoDoAno { ano: number; data: string; experimento: Experimento }

export interface LinhaDimensao { nome: string; informado: boolean; porAno: MetricasAno[]; eventos: EventoDoAno[] }

/** Eventos do ano: conclusões e cancelamentos, com o mesmo corte de período dos cartões. */
function eventosDoAno(experimentos: Experimento[], ano: number, ate: string | null): EventoDoAno[] {
  const noAno = (d: string | null): d is string => !!d && d.startsWith(`${ano}-`) && (!ate || d.slice(5) <= ate)
  return experimentos.flatMap(e => {
    const data = e.situacao === 'validada' || e.situacao === 'refutada' ? e.concluidoEm : e.situacao === 'cancelada' ? e.canceladoEm : null
    return noAno(data) ? [{ ano, data, experimento: e }] : []
  })
}

function metricas(eventos: EventoDoAno[]): MetricasAno {
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
 * Resultados dos dois anos quebrados por área, laboratório ou diretoria: cada linha é um valor do campo, com as
 * métricas de cada ano e os eventos que as formam. Ordem: quem teve mais eventos nos dois anos; "não informado" por último.
 */
export function porDimensao(experimentos: Experimento[], dim: Dimensao, ate: string | null): { linhas: LinhaDimensao[]; total: MetricasAno[] } {
  const vazio = DIMENSOES.find(d => d.id === dim)!.vazio
  const todos = ANOS.flatMap(ano => eventosDoAno(experimentos, ano, ate))
  const grupos = new Map<string, EventoDoAno[]>()
  for (const ev of todos) {
    const nome = ev.experimento[dim] ?? vazio
    grupos.set(nome, [...(grupos.get(nome) ?? []), ev])
  }
  const linhas = [...grupos.entries()].map(([nome, eventos]) => ({
    nome, informado: nome !== vazio, eventos,
    porAno: ANOS.map(ano => metricas(eventos.filter(ev => ev.ano === ano))),
  }))
  linhas.sort((a, b) => Number(b.informado) - Number(a.informado) || b.eventos.length - a.eventos.length || a.nome.localeCompare(b.nome, 'pt-BR'))
  return { linhas, total: ANOS.map(ano => metricas(todos.filter(ev => ev.ano === ano))) }
}
