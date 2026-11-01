import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cidadeMaisProxima, localPeloFuso } from '@/components/newsletter/local'
import { deriveNotifications, normalizePost } from '@/lib/community/model'
import { discussaoDaNoticia } from '@/lib/community/noticias-radar'
import { ativosConfigurados, calcularRegua, cotacaoDoGrafico, leituraDaRegua, type Cotacao } from './bolsa'
import { classificar, ehPossivelSinal, montarNoticias, type Edicao, type Noticia } from './edicao'
import { historicoDoMes, indiceDeImpacto, lerArquivo, registrarEdicao } from './historico'

const AGORA = new Date('2026-11-01T12:00:00Z')
const item = (titulo: string, extra: Record<string, unknown> = {}) => ({
  titulo, link: `https://ex.com/${encodeURIComponent(titulo)}`, publicadoEm: '2026-11-01T08:00:00Z', resumo: '', imagem: null, ...extra,
})

describe('Fontes, Vale do Silício, repercussão e sinais', () => {
  it('a seção Vale do Silício pede um ator do Vale e um lançamento ou rodada', () => {
    expect(classificar('OpenAI launches new AI agent platform for developers', '')).toBe('vale')
    expect(classificar('AI startup founded by ex-Google engineers raises Series B', '')).toBe('vale')
    expect(classificar('IBM unveils quantum processor with error correction milestone', '')).toBe('emergentes')
    expect(classificar('Nvidia stock hits record as AI chip demand explodes', 'market cap tops $5 trillion')).toBe('mercado')
  })

  it('a mesma história em fontes diferentes vira uma notícia só, com a repercussão', () => {
    const n = montarNoticias([
      { fonte: { nome: 'NYT', url: 'x' }, itens: [item('Nvidia quantum computing chip breaks performance record')] },
      { fonte: { nome: 'BBC', url: 'x' }, itens: [item('Nvidia quantum computing chip breaks record in performance test')] },
      { fonte: { nome: 'Gartner', url: 'x' }, itens: [item('Quantum computing chip from Nvidia breaks performance record'), item('Robot humanoid factory pilot program in Japan')] },
    ], AGORA)
    expect(n).toHaveLength(2)
    expect(n[0].outrasFontes?.sort()).toEqual(['BBC', 'Gartner'].filter(f => f !== n[0].fonte).concat(n[0].fonte === 'NYT' ? [] : ['NYT']).sort())
    expect(n.find(x => x.titulo.startsWith('Robot'))?.possivelSinal).toBe(true)
    expect(ehPossivelSinal('Pesquisadores criam protótipo de bateria de grafeno', '')).toBe(true)
    expect(ehPossivelSinal('Apple divulga resultado trimestral', '')).toBe(false)
  })
})

describe('Bolsa de tecnologia', () => {
  const grafico = (preco: number, anterior: number, closes = [1, 2, 3]) => ({
    chart: { result: [{ meta: { regularMarketPrice: preco, chartPreviousClose: anterior, currency: 'USD', regularMarketTime: 1_793_500_000,
      currentTradingPeriod: { regular: { start: 1_793_490_000, end: 1_793_520_000 } } }, indicators: { quote: [{ close: [...closes, null] }] } }] },
  })
  const c = (simbolo: string, variacao: number, grupo: Cotacao['grupo'] = 'big-tech'): Cotacao =>
    ({ simbolo, nome: simbolo, grupo, preco: 1, variacao, moeda: 'USD', aberto: true, negociadoEm: null, serie: [] })

  it('lê a cotação do gráfico do Yahoo: preço, variação do dia, pregão aberto e minilinha', () => {
    const cot = cotacaoDoGrafico({ simbolo: 'NVDA', nome: 'Nvidia', grupo: 'chips' }, grafico(110, 100), 1_793_500_000_000)!
    expect(cot).toMatchObject({ preco: 110, variacao: 10, aberto: true, moeda: 'USD', serie: [1, 2, 3] })
    expect(cotacaoDoGrafico({ simbolo: 'X', nome: 'X', grupo: 'chips' }, grafico(110, 100), 1_793_600_000_000)!.aberto).toBe(false)
    expect(cotacaoDoGrafico({ simbolo: 'X', nome: 'X', grupo: 'chips' }, { chart: { result: [] } })).toBeNull()
  })

  it('a régua é a média da cesta de tecnologia (sem Ibovespa, teles e cripto) e dá a leitura do dia', () => {
    const r = calcularRegua([c('^IXIC', 1, 'indice'), c('^BVSP', -5, 'indice'), c('NVDA', 3, 'chips'), c('AAPL', -1), c('AMX', -4, 'telecom'), c('BTC-USD', 9, 'cripto')])!
    expect(r.media).toBe(1)
    expect(r.leitura.rotulo).toBe('Em alta')
    expect(r.maiorAlta?.simbolo).toBe('BTC-USD')
    expect(r.maiorQueda?.simbolo).toBe('AMX')
    expect([leituraDaRegua(-2.5).tom, leituraDaRegua(0.2).tom, leituraDaRegua(2).tom]).toEqual(['forte-queda', 'estavel', 'forte-alta'])
    expect(ativosConfigurados('NVDA|Nvidia|chips, ^BVSP|Ibovespa|indice, $$$|x')).toEqual([
      { simbolo: 'NVDA', nome: 'Nvidia', grupo: 'chips' }, { simbolo: '^BVSP', nome: 'Ibovespa', grupo: 'indice' }])
    expect(ativosConfigurados(undefined).some(a => a.simbolo === 'AMX')).toBe(true)
  })
})

describe('Histórico do mês', () => {
  let dir: string
  beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'historico-')); process.env.NEWSLETTER_HISTORICO_PATH = path.join(dir, 'h.json') })
  afterEach(() => { delete process.env.NEWSLETTER_HISTORICO_PATH; rmSync(dir, { recursive: true, force: true }) })
  const noticia = (id: string, extra: Partial<Noticia> = {}): Noticia => ({
    id, titulo: `AI chip ${id}`, link: `https://ex.com/${id}`, fonte: 'NYT', publicadoEm: null, resumo: 'quantum AI startup stock', imagem: null, secao: 'emergentes', ...extra,
  })
  const edicao = (data: string, noticias: Noticia[]): Edicao => ({ numero: 1, data, geradoEm: `${data}T09:00:00.000Z`, noticias, fontes: [] })

  it('guarda cada notícia no mês em que apareceu, soma dias e fontes, e registra cada edição uma vez', () => {
    expect(registrarEdicao(edicao('2026-10-30', [noticia('a'), noticia('b')]))).toBe(2)
    expect(registrarEdicao(edicao('2026-10-30', [noticia('a')]))).toBe(0) // mesma edição
    expect(registrarEdicao(edicao('2026-11-01', [noticia('a', { outrasFontes: ['BBC', 'Gartner'] }), noticia('c')]))).toBe(1)
    const a = lerArquivo().noticias.a
    expect(a).toMatchObject({ mes: '2026-10', dias: ['2026-10-30', '2026-11-01'], fontes: ['NYT', 'BBC', 'Gartner'] })
    expect(lerArquivo().noticias.c.mes).toBe('2026-11')
  })

  it('o índice soma repercussão, conversa, permanência e tema; o top 10 do mês sai por ele', () => {
    expect(indiceDeImpacto({ fontes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], dias: ['1', '2', '3'], tema: 9 }, { comentarios: 5, uteis: 3 }))
      .toEqual({ indice: 100, partes: { repercussao: 40, conversa: 30, permanencia: 20, tema: 10 } })
    expect(indiceDeImpacto({ fontes: ['a'], dias: ['1'], tema: 3 }, { comentarios: 1, uteis: 0 }).indice).toBe(Math.round(6.7 + 6 + 6.7 + 5))
    for (let i = 0; i < 12; i++) registrarEdicao(edicao(`2026-11-${String(i + 1).padStart(2, '0')}`, [noticia(`n${i}`, { outrasFontes: Array.from({ length: i % 6 }, (_, k) => `F${k}`) })]))
    const h = historicoDoMes(lerArquivo(), id => ({ comentarios: id === 'n0' ? 10 : 0, uteis: 0, discussaoId: id === 'n0' ? `radar:${id}` : null }), '2026-11')
    expect(h.total).toBe(12)
    expect(h.top).toHaveLength(10)
    // 6 veículos (40) vencem; empate fica com a mais recente. Com 10 de conversa, n0 (1 veículo) passa as de 5 veículos.
    expect(h.top.slice(0, 3).map(n => n.id)).toEqual(['n11', 'n5', 'n0'])
    expect(h.top[2]).toMatchObject({ discussaoId: 'radar:n0', partes: { conversa: 30 } })
    expect(h.meses).toEqual([{ mes: '2026-11', total: 12 }])
    expect(h.top.every((n, i) => i === 0 || n.indice <= h.top[i - 1].indice)).toBe(true)
  })
})

describe('Notificações e abertura', () => {
  it('as notícias mais relevantes de cada dia (até 4, dos últimos 3 dias) viram notificação, respeitando a preferência', () => {
    const agora = Date.parse('2026-11-01T12:00:00Z')
    const posts = Array.from({ length: 6 }, (_, i) => normalizePost(discussaoDaNoticia(
      { id: `n${i}`, titulo: `Notícia ${i}`, link: 'https://ex.com', fonte: 'X', publicadoEm: null, resumo: '', imagem: null, secao: 'emergentes' },
      undefined, new Date(agora - i * 1000))))
    const antiga = normalizePost(discussaoDaNoticia({ id: 'velha', titulo: 'Velha', link: 'https://ex.com', fonte: 'X', publicadoEm: null, resumo: '', imagem: null, secao: 'emergentes' }, undefined, new Date('2026-10-20T10:00:00Z')))
    const n = deriveNotifications([...posts, antiga], 'ana', null, undefined, agora)
    expect(n.map(x => x.postId)).toEqual(['radar:n0', 'radar:n1', 'radar:n2', 'radar:n3'])
    expect(n[0]).toMatchObject({ tipo: 'noticia', lida: false })
    expect(deriveNotifications(posts, 'ana', null, { comentarios: true, respostas: true, mensagens: true, noticias: false }, agora)).toEqual([])
  })

  it('a cidade sai do fuso ou, com a localização, da cidade mais próxima', () => {
    expect(localPeloFuso('America/Sao_Paulo')).toEqual({ cidade: 'São Paulo', pais: 'Brasil', fonte: 'fuso' })
    expect(localPeloFuso('Pacific/Fiji').cidade).toBe('Fiji')
    expect(cidadeMaisProxima(-22.95, -43.2)).toEqual({ cidade: 'Rio de Janeiro', pais: 'Brasil', fonte: 'aparelho' })
    expect(cidadeMaisProxima(37.4, -122.08)?.cidade).toBe('San José')
    expect(cidadeMaisProxima(-60, -30)).toBeNull()
  })
})
