/**
 * Aba Comparativo: indicadores-chave do ano corrente contra o anterior (2025 × 2026).
 * Tipos e agregação (rodam na tela). A leitura do Jira fica em ./montar.ts, no servidor.
 */

export const ANOS = [2025, 2026] as const
export type Ano = (typeof ANOS)[number]

export type IndicadorId = 'leadExploracao' | 'leadExperimentacao' | 'beneficio' | 'aguardandoPiloto' | 'piloto'

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
  unidade: 'dias' | 'reais'
  /** Para tempos, menor é melhor; para benefício, maior. */
  melhor: 'menor' | 'maior'
  board: 'Ideação' | 'Experimentação'
  amostras: Amostra[]
  emAberto: EmAberto[]
  /** Benefício: o total de hoje das hipóteses validadas (o mesmo conjunto do Semanal) e o que não cai em 2025 nem 2026. */
  conciliacao?: { total: number; n: number; foraDosAnos: number; semData: number }
}

export interface ComparativoDados {
  indicadores: Indicador[]
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
  /** Por mês (jan a dez): mediana (dias) ou soma (R$); null quando não há amostra. */
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
    if (nPorMes[m]) porMes[m] = ind.unidade === 'reais' ? valoresMes[m].reduce((x, v) => x + v, 0) : mediana(valoresMes[m])
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
 * Valor que resume o ano: soma de R$ ou, nos tempos, a mediana de dias. A mediana não deixa um punhado de itens
 * parados há muito tempo puxar o número do ano inteiro (a média continua no detalhe).
 */
export const principal = (ind: Indicador, r: ResumoAno) => (ind.unidade === 'reais' ? (r.n ? r.soma : null) : r.mediana)

/** Abaixo disso a variação percentual não diz muito: o cartão mostra os números, mas não o %. */
export const MINIMO_PARA_COMPARAR = 3

/** Variação de `antes` para `depois`, em %, e se ela é boa para o indicador. */
export function variacao(ind: Indicador, antes: number | null, depois: number | null): { pct: number; diferenca: number; melhorou: boolean | null } | null {
  if (antes === null || depois === null || antes === 0) return null
  const diferenca = depois - antes
  const pct = Math.round((diferenca / antes) * 100)
  return { pct, diferenca, melhorou: diferenca === 0 ? null : ind.melhor === 'menor' ? diferenca < 0 : diferenca > 0 }
}
