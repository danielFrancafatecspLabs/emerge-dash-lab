import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import { pontuar, type Edicao, type Secao } from './edicao'

// Histórico do beOn Radar: cada notícia que passa por uma edição fica guardada no mês em que apareceu pela primeira
// vez, com as fontes que a deram e os dias em que ficou na edição. No fim (ou no meio) de cada mês, as 10 que mais
// impactaram saem pelo Índice de Impacto beOn Radar, um critério fixo e explicável:
//
//   40 pontos · Repercussão: quantos veículos diferentes deram a mesma história (6 ou mais = nota máxima)
//   30 pontos · Conversa: comentários (valem 2) e marcações de "Útil" na discussão do fórum (10 ou mais = máxima)
//   20 pontos · Permanência: em quantos dias a notícia ficou na edição (3 dias = máxima)
//   10 pontos · Força do tema: quantos termos de tecnologia emergente, Vale, mercado, bolha ou impacto ela traz (6 = máxima)

export interface NoticiaArquivada {
  id: string
  titulo: string
  link: string
  fonte: string
  secao: Secao
  imagem: string | null
  resumo: string
  publicadoEm: string | null
  /** Mês (AAAA-MM) da primeira edição em que apareceu. */
  mes: string
  primeiraVez: string
  /** Datas (AAAA-MM-DD) das edições em que apareceu. */
  dias: string[]
  /** Todos os veículos que deram a história (a fonte principal e as outras). */
  fontes: string[]
  possivelSinal: boolean
  tema: number
}

interface Arquivo { ultimaEdicao: string | null; noticias: Record<string, NoticiaArquivada> }

const caminho = () => jsonStorePath('NEWSLETTER_HISTORICO_PATH', 'newsletter-historico.json')
const MESES_GUARDADOS = 13

export function lerArquivo(): Arquivo {
  const a = readJsonStore<Arquivo | null>(caminho(), null)
  return a && typeof a === 'object' && a.noticias ? a : { ultimaEdicao: null, noticias: {} }
}

const mesDe = (data: string) => data.slice(0, 7)

function mesesAtras(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 - n, 1))
  return d.toISOString().slice(0, 7)
}

/** Guarda as notícias da edição no histórico (uma vez por edição gerada). Devolve quantas eram novas. */
export function registrarEdicao(edicao: Edicao): number {
  const arquivo = lerArquivo()
  if (arquivo.ultimaEdicao === edicao.geradoEm) return 0
  let novas = 0
  for (const n of edicao.noticias) {
    const fontes = [n.fonte, ...(n.outrasFontes ?? [])]
    const atual = arquivo.noticias[n.id]
    if (atual) {
      if (!atual.dias.includes(edicao.data)) atual.dias.push(edicao.data)
      atual.fontes = [...new Set([...atual.fontes, ...fontes])]
      atual.imagem ??= n.imagem
      atual.possivelSinal ||= !!n.possivelSinal
      continue
    }
    const p = pontuar(`${n.titulo} ${n.resumo}`)
    arquivo.noticias[n.id] = {
      id: n.id, titulo: n.titulo, link: n.link, fonte: n.fonte, secao: n.secao, imagem: n.imagem, resumo: n.resumo.slice(0, 600),
      publicadoEm: n.publicadoEm, mes: mesDe(edicao.data), primeiraVez: edicao.geradoEm, dias: [edicao.data],
      fontes: [...new Set(fontes)], possivelSinal: !!n.possivelSinal,
      tema: Object.values(p).reduce((s, v) => s + v, 0),
    }
    novas++
  }
  // Guarda só os últimos 13 meses.
  const corte = mesesAtras(mesDe(edicao.data), MESES_GUARDADOS - 1)
  for (const [id, n] of Object.entries(arquivo.noticias)) if (n.mes < corte) delete arquivo.noticias[id]
  arquivo.ultimaEdicao = edicao.geradoEm
  writeJsonStore(caminho(), arquivo)
  return novas
}

export interface Conversa { comentarios: number; uteis: number; discussaoId: string | null }

export interface PartesDoIndice { repercussao: number; conversa: number; permanencia: number; tema: number }

export interface NoticiaDoHistorico extends NoticiaArquivada, Conversa {
  indice: number
  partes: PartesDoIndice
}

export const PESOS: PartesDoIndice = { repercussao: 40, conversa: 30, permanencia: 20, tema: 10 }
const teto = (v: number, max: number) => Math.min(v, max) / max

export function indiceDeImpacto(n: Pick<NoticiaArquivada, 'fontes' | 'dias' | 'tema'>, c: Pick<Conversa, 'comentarios' | 'uteis'>): { indice: number; partes: PartesDoIndice } {
  const partes: PartesDoIndice = {
    repercussao: Math.round(PESOS.repercussao * teto(n.fontes.length, 6) * 10) / 10,
    conversa: Math.round(PESOS.conversa * teto(c.comentarios * 2 + c.uteis, 10) * 10) / 10,
    permanencia: Math.round(PESOS.permanencia * teto(n.dias.length, 3) * 10) / 10,
    tema: Math.round(PESOS.tema * teto(n.tema, 6) * 10) / 10,
  }
  return { indice: Math.round(partes.repercussao + partes.conversa + partes.permanencia + partes.tema), partes }
}

export interface HistoricoDoMes {
  mes: string
  meses: { mes: string; total: number }[]
  total: number
  /** Desde quando o histórico existe (a primeira notícia guardada). */
  inicio: string | null
  top: NoticiaDoHistorico[]
}

/** As notícias que mais impactaram no mês (10, ou todas se o mês tiver menos), pelo Índice de Impacto. */
export function historicoDoMes(
  arquivo: Arquivo,
  conversaDe: (id: string) => Conversa,
  mesPedido?: string | null,
  quantas = 10,
): HistoricoDoMes {
  const todas = Object.values(arquivo.noticias)
  const contagem = new Map<string, number>()
  for (const n of todas) contagem.set(n.mes, (contagem.get(n.mes) ?? 0) + 1)
  const meses = [...contagem.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([mes, total]) => ({ mes, total }))
  const mes = mesPedido && /^\d{4}-\d{2}$/.test(mesPedido) ? mesPedido : meses[0]?.mes ?? new Date().toISOString().slice(0, 7)
  const doMes = todas.filter(n => n.mes === mes)
  const top = doMes
    .map(n => { const c = conversaDe(n.id); return { ...n, ...c, ...indiceDeImpacto(n, c) } })
    .sort((a, b) => b.indice - a.indice || b.fontes.length - a.fontes.length || b.primeiraVez.localeCompare(a.primeiraVez))
    .slice(0, quantas)
  const inicio = todas.reduce<string | null>((min, n) => (!min || n.primeiraVez < min ? n.primeiraVez : min), null)
  return { mes, meses, total: doMes.length, inicio, top }
}

