import { comCache } from '@/lib/cache-dados'

// Bolsa de tecnologia no beOn Radar: cotações das big techs, dos índices de tecnologia e das teles (inclusive a
// América Movil, controladora da Claro), lidas da API pública de gráficos do Yahoo Finance (sem chave; com o atraso
// que a bolsa impõe a dados gratuitos, em geral até 15 minutos). Com elas, a "régua": a variação média da cesta de
// tecnologia no dia e a leitura do humor do mercado.

export type GrupoDoAtivo = 'indice' | 'big-tech' | 'chips' | 'telecom' | 'cripto'

export interface Ativo { simbolo: string; nome: string; grupo: GrupoDoAtivo }

export interface Cotacao extends Ativo {
  preco: number
  variacao: number
  moeda: string
  /** Pregão aberto agora (pelo horário de negociação informado pela fonte). */
  aberto: boolean
  negociadoEm: string | null
  /** Preços do dia, para a minilinha (até 40 pontos). */
  serie: number[]
}

export interface LeituraDaRegua { rotulo: string; tom: 'forte-queda' | 'queda' | 'estavel' | 'alta' | 'forte-alta' }

export interface PainelDaBolsa {
  cotacoes: Cotacao[]
  regua: {
    /** Variação média do dia (%) da cesta de tecnologia (índices, big techs e chips). */
    media: number
    leitura: LeituraDaRegua
    emAlta: number
    emQueda: number
    maiorAlta: Cotacao | null
    maiorQueda: Cotacao | null
  } | null
  atualizadoEm: string
  fonte: string
  aviso: string
}

/** Cesta padrão (pode ser trocada por RADAR_COTACOES="NVDA|Nvidia|big-tech,^BVSP|Ibovespa|indice"). */
export const ATIVOS_PADRAO: Ativo[] = [
  { simbolo: '^IXIC', nome: 'Nasdaq', grupo: 'indice' },
  { simbolo: '^SOX', nome: 'Semicondutores (SOX)', grupo: 'indice' },
  { simbolo: '^BVSP', nome: 'Ibovespa', grupo: 'indice' },
  { simbolo: 'NVDA', nome: 'Nvidia', grupo: 'chips' },
  { simbolo: 'MSFT', nome: 'Microsoft', grupo: 'big-tech' },
  { simbolo: 'AAPL', nome: 'Apple', grupo: 'big-tech' },
  { simbolo: 'GOOGL', nome: 'Alphabet', grupo: 'big-tech' },
  { simbolo: 'AMZN', nome: 'Amazon', grupo: 'big-tech' },
  { simbolo: 'META', nome: 'Meta', grupo: 'big-tech' },
  { simbolo: 'TSLA', nome: 'Tesla', grupo: 'big-tech' },
  { simbolo: 'AVGO', nome: 'Broadcom', grupo: 'chips' },
  { simbolo: 'TSM', nome: 'TSMC', grupo: 'chips' },
  { simbolo: 'AMD', nome: 'AMD', grupo: 'chips' },
  { simbolo: 'ORCL', nome: 'Oracle', grupo: 'big-tech' },
  { simbolo: 'PLTR', nome: 'Palantir', grupo: 'big-tech' },
  { simbolo: 'AMX', nome: 'América Movil', grupo: 'telecom' },
  { simbolo: 'VIVT3.SA', nome: 'Vivo', grupo: 'telecom' },
  { simbolo: 'TIMS3.SA', nome: 'TIM Brasil', grupo: 'telecom' },
  { simbolo: 'BTC-USD', nome: 'Bitcoin', grupo: 'cripto' },
]

const GRUPOS: GrupoDoAtivo[] = ['indice', 'big-tech', 'chips', 'telecom', 'cripto']

export function ativosConfigurados(env = process.env.RADAR_COTACOES): Ativo[] {
  if (!env?.trim()) return ATIVOS_PADRAO
  const lista = env.split(',').map(par => {
    const [simbolo, nome, grupo] = par.split('|').map(x => x?.trim() ?? '')
    if (!/^[\w^.=-]{1,20}$/.test(simbolo)) return null
    return { simbolo, nome: nome || simbolo, grupo: (GRUPOS as string[]).includes(grupo) ? grupo as GrupoDoAtivo : 'big-tech' }
  }).filter((a): a is Ativo => !!a)
  return lista.length ? lista : ATIVOS_PADRAO
}

export function leituraDaRegua(media: number): LeituraDaRegua {
  if (media <= -2) return { rotulo: 'Forte queda', tom: 'forte-queda' }
  if (media <= -0.5) return { rotulo: 'Em queda', tom: 'queda' }
  if (media < 0.5) return { rotulo: 'Estável', tom: 'estavel' }
  if (media < 2) return { rotulo: 'Em alta', tom: 'alta' }
  return { rotulo: 'Forte alta', tom: 'forte-alta' }
}

/** A régua: o humor do dia na cesta de tecnologia (teles e cripto ficam de fora da média). */
export function calcularRegua(cotacoes: Cotacao[]): PainelDaBolsa['regua'] {
  const cesta = cotacoes.filter(c => c.grupo === 'indice' ? c.simbolo !== '^BVSP' : c.grupo === 'big-tech' || c.grupo === 'chips')
  if (!cesta.length) return null
  const media = Math.round((cesta.reduce((s, c) => s + c.variacao, 0) / cesta.length) * 100) / 100
  const acoes = cotacoes.filter(c => c.grupo !== 'indice')
  const ordenadas = [...acoes].sort((a, b) => b.variacao - a.variacao)
  return {
    media,
    leitura: leituraDaRegua(media),
    emAlta: acoes.filter(c => c.variacao > 0).length,
    emQueda: acoes.filter(c => c.variacao < 0).length,
    maiorAlta: ordenadas[0] && ordenadas[0].variacao > 0 ? ordenadas[0] : null,
    maiorQueda: ordenadas.at(-1) && ordenadas.at(-1)!.variacao < 0 ? ordenadas.at(-1)! : null,
  }
}

interface RespostaDoGrafico {
  chart?: {
    result?: {
      meta?: {
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
        currency?: string
        regularMarketTime?: number
        currentTradingPeriod?: { regular?: { start?: number; end?: number } }
      }
      indicators?: { quote?: { close?: (number | null)[] }[] }
    }[]
  }
}

/** Uma cotação a partir da resposta do gráfico do Yahoo (null se faltar preço ou fechamento anterior). */
export function cotacaoDoGrafico(ativo: Ativo, json: RespostaDoGrafico, agora = Date.now()): Cotacao | null {
  const r = json.chart?.result?.[0]
  const m = r?.meta
  const preco = m?.regularMarketPrice
  const anterior = m?.chartPreviousClose ?? m?.previousClose
  if (typeof preco !== 'number' || typeof anterior !== 'number' || !anterior) return null
  const periodo = m?.currentTradingPeriod?.regular
  const s = Math.floor(agora / 1000)
  const aberto = !!periodo?.start && !!periodo?.end && s >= periodo.start && s <= periodo.end
  const fechamentos = (r?.indicators?.quote?.[0]?.close ?? []).filter((x): x is number => typeof x === 'number')
  const passo = Math.max(1, Math.ceil(fechamentos.length / 40))
  return {
    ...ativo,
    preco,
    variacao: Math.round(((preco - anterior) / anterior) * 10000) / 100,
    moeda: m?.currency ?? 'USD',
    aberto,
    negociadoEm: m?.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
    serie: fechamentos.filter((_, i) => i % passo === 0),
  }
}

const BASE_PADRAO = 'https://query1.finance.yahoo.com'

async function buscarCotacao(ativo: Ativo, base: string): Promise<Cotacao | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(`${base}/v8/finance/chart/${encodeURIComponent(ativo.simbolo)}?range=1d&interval=15m`, {
      signal: controller.signal, cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; beOnLabs-Radar/1.0)', Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return cotacaoDoGrafico(ativo, await res.json())
  } catch (err) {
    console.warn(`[bolsa] sem cotação de ${ativo.simbolo}: ${String(err)}`)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function montarPainel(ativos = ativosConfigurados(), base = process.env.RADAR_COTACOES_BASE_URL || BASE_PADRAO): Promise<PainelDaBolsa> {
  const cotacoes = (await Promise.all(ativos.map(a => buscarCotacao(a, base)))).filter((c): c is Cotacao => !!c)
  if (!cotacoes.length) throw new Error('nenhuma cotação disponível')
  return {
    cotacoes,
    regua: calcularRegua(cotacoes),
    atualizadoEm: new Date().toISOString(),
    fonte: 'Yahoo Finance',
    aviso: 'Cotações com o atraso das bolsas para dados gratuitos (em geral até 15 minutos). Não é recomendação de investimento.',
  }
}

/** Painel com cache no servidor: no máximo uma ida à fonte por minuto, para todo mundo. */
export function painelDaBolsa(): Promise<PainelDaBolsa> {
  return comCache('radar-bolsa', () => montarPainel(), { frescoPorMs: 60_000, maximoObsoletoMs: 3 * 86_400_000 })
}
