import { join } from 'path'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import { PRAZO_ATENCAO_PCT, type SemanalCancelamento, type SemanalData, type SemanalResumo, type SemanalRow, type SemanalSecaoId, type SituacaoPrazo } from './semanal'
import {
  dataAtualizacao, GOV_BOLINHA_EXPLORACAO, GOV_GRAFITE, GOV_LAYOUT, layoutGovernanca, TECNOLOGIAS_GOV, type SemanalGovernanca,
} from './semanal-governanca'
import {
  CANCELAMENTO_PAINEL, chipCor, COR_PRAZO, colunasDa, contagemPorLab, corDoLab, diretorEPontoFocal, formatBeneficioMM, formatData,
  formatMilhoes, fraseDestaque, larguraPrazo, legendaPrazo, LINHAS_POR_PAGINA, montarPaginas, PAINEL, PAINEL_COR, PAINEL_ETAPAS, PAINEL_FATIA, paresConectados,
  pctUmaCasa, reaisMi, segmentosDaBarra, sequenciasDeLab, setaDoPainel, type PaginaDeck,
} from './semanal-deck'

/**
 * PPTX editável do deck da aba Semanal (Report do Comitê beOn Labs, V7).
 *
 * Cada slide é montado com formas nativas do PowerPoint nas mesmas posições da tela (components/semanal,
 * canvas de 1280×720 px = 13,33×7,5 pol). Capa, objetivo, divisores e encerramento usam a arte original do
 * deck (public/semanal). Os botões DETALHES e a seta de voltar são links entre slides, como no deck.
 */

const ASSETS = join(process.cwd(), 'public', 'semanal')
const icone = (nome: string) => join(ASSETS, 'icones', `${nome}.png`)

const FONTE = 'Calibri'
const RED = 'CC0000'
const TITLE_RED = 'B00000'
const LISTA_RED = 'A30000'
const INK = '1F2328'
const MUTED = '5B6472'
const BORDA = 'E5E7EB'

// Conversões: px da tela (96 por polegada) → polegadas; px de fonte → pontos.
const I = (px: number) => px / 96
const P = (px: number) => px * 0.75
// O deck original tem 10 × 5,63 pol; este, 13,33 × 7,5 (mesmo 16:9). Posições e fontes do deck crescem 4/3.
const ESCALA_DECK = 4 / 3
const E = (emu: number) => (emu / 914_400) * ESCALA_DECK

type Slide = PptxGenJS.Slide
type TextoOpts = PptxGenJS.TextPropsOptions

function texto(slide: Slide, conteudo: string | PptxGenJS.TextProps[], x: number, y: number, w: number, h: number, o: TextoOpts = {}) {
  slide.addText(conteudo, { x: I(x), y: I(y), w: I(w), h: I(h), fontFace: FONTE, margin: 0, valign: 'top', isTextBox: true, ...o })
}

const sombra = (): PptxGenJS.ShadowProps => ({ type: 'outer', blur: 4.5, offset: 1.5, angle: 90, color: '0F172A', opacity: 0.08 })

function cartao(slide: Slide, x: number, y: number, w: number, h: number, raio = 12) {
  slide.addShape('roundRect', {
    x: I(x), y: I(y), w: I(w), h: I(h), rectRadius: I(raio),
    fill: { color: 'FFFFFF' }, line: { color: BORDA, width: 0.75 }, shadow: sombra(),
  })
}

function circulo(slide: Slide, x: number, y: number, d: number, cor: string) {
  slide.addShape('ellipse', { x: I(x), y: I(y), w: I(d), h: I(d), fill: { color: cor }, line: { type: 'none' } })
}

function imagem(slide: Slide, caminho: string, x: number, y: number, w: number, h: number) {
  slide.addImage({ path: caminho, x: I(x), y: I(y), w: I(w), h: I(h) })
}

/** Corta o texto para caber em `linhas` linhas da largura dada (estimativa pela largura média do Calibri). */
function caber(t: string, larguraPx: number, fontePx: number, linhas: number): string {
  const porLinha = Math.max(8, Math.floor(larguraPx / (fontePx * 0.48)))
  const max = porLinha * linhas
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

function detalhes(slide: Slide, x: number, y: number, w: number, h: number, destino: number | undefined) {
  slide.addText([{ text: 'DETALHES', options: destino ? { hyperlink: { slide: destino, tooltip: 'Ver a lista' } } : {} }], {
    x: I(x), y: I(y), w: I(w), h: I(h), shape: 'roundRect', rectRadius: I(4),
    fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.1 }, margin: 0,
    fontFace: FONTE, fontSize: P(11.5), bold: true, color: RED, underline: { style: 'sng' }, align: 'center', valign: 'middle',
  })
}

/** Anel de percentual: fundo cinza e arco vermelho a partir do topo, no sentido horário. */
function anel(slide: Slide, x: number, y: number, d: number, espessura: number, pct: number) {
  const base = { x: I(x), y: I(y), w: I(d), h: I(d), line: { type: 'none' as const }, arcThicknessRatio: (2 * espessura) / d }
  slide.addShape('blockArc', { ...base, fill: { color: 'EDEFF2' }, angleRange: [0, 180] })
  slide.addShape('blockArc', { ...base, fill: { color: 'EDEFF2' }, angleRange: [180, 360] })
  const p = Math.min(100, Math.max(0, pct))
  if (p > 0) slide.addShape('blockArc', { ...base, fill: { color: RED }, angleRange: [270, (270 + Math.min(p, 99.9) * 3.6) % 360] })
}

// ── Capa, objetivo, divisores e encerramento (arte original do deck) ─────────────────────────────────────

function textoBranco(slide: Slide, t: string, xEmu: number, yEmu: number, sz: number, negrito: boolean) {
  slide.addText(t, {
    x: E(xEmu), y: E(yEmu), w: E(8_128_000), h: ((sz / 100) * ESCALA_DECK * 1.25) / 72, fontFace: FONTE,
    fontSize: (sz / 100) * ESCALA_DECK, bold: negrito,
    color: 'FFFFFF', margin: 0, valign: 'top', isTextBox: true,
  })
}

function capa(slide: Slide, periodo: string) {
  slide.background = { path: join(ASSETS, 'capa.jpg') }
  textoBranco(slide, 'Report', 977_849, 2_142_693, 4840, true)
  textoBranco(slide, periodo, 1_058_900, 2_955_772, 1370, false)
}

function objetivo(slide: Slide) {
  slide.background = { path: join(ASSETS, 'objetivo.jpg') }
  textoBranco(slide, 'Objetivo', 1_085_265, 2_291_511, 5410, true)
  const linhas = ['Sinalizar principais problemas, acompanhar', 'experimentos estratégicos e discussões de como', 'evoluir o processo de experimentação']
  linhas.forEach((l, i) => textoBranco(slide, l, 5_094_630, [2_247_798, 2_485_288, 2_724_048][i], 1080, false))
}

function divisor(slide: Slide, linhas: string[], icone: 'check' | 'flask') {
  slide.background = { path: join(ASSETS, icone === 'flask' ? 'divisor-frasco.jpg' : 'divisor-check.jpg') }
  const ultima = icone === 'flask' ? 2_664_409 : 3_018_739
  linhas.forEach((l, i) => {
    const normal = i === 0 && linhas.length > 1 && icone === 'check' && l === 'Experimentos'
    textoBranco(slide, l, 1_466_545, ultima - (linhas.length - 1 - i) * 550_000, 4040, !normal)
  })
}

function obrigado(slide: Slide) {
  slide.background = { path: join(ASSETS, 'obrigado.jpg') }
  textoBranco(slide, 'Obrigado', 1_466_545, 2_293_569, 4040, true)
}

// ── beOn Labs — visão geral ───────────────────────────────────────────────────────────────────────────

// ── Painel de experimentos (visão geral) ─────────────────────────────────────────────────────────────────

const PC = PAINEL_COR

/** Fundo do slide no tom do painel. */
function fundoPainel(slide: Slide) {
  slide.background = { color: PC.fundo }
}

/** Cartão branco do painel (sem borda, sombra leve). `topoReto` deixa os cantos de cima retos (cartão sob a seta). */
function cartaoPainel(slide: Slide, x: number, y: number, w: number, h: number, cor: string = PC.cartao, topoReto = false) {
  slide.addShape('roundRect', {
    x: I(x), y: I(y), w: I(w), h: I(h), rectRadius: I(14), fill: { color: cor }, line: { type: 'none' },
    shadow: { type: 'outer', blur: 3, offset: 1, angle: 90, color: '3C1414', opacity: 0.06 },
  })
  if (topoReto) slide.addShape('rect', { x: I(x), y: I(y), w: I(w), h: I(16), fill: { color: cor }, line: { type: 'none' } })
}

/** Cabeçalho comum: marca, título do slide, data da leitura e logo. */
function cabecalhoPainel(slide: Slide, titulo: string, data: string) {
  texto(slide, 'beOn Labs', PAINEL.margem, 30, 200, 40, { fontSize: P(30), bold: true, color: PC.vermelho, valign: 'middle' })
  slide.addShape('line', { x: I(270), y: I(36), w: 0, h: I(28), line: { color: 'DCD3D2', width: 0.75 } })
  const wTitulo = Math.ceil(titulo.length * 7.4)
  texto(slide, titulo, 286, 30, wTitulo + 10, 40, { fontSize: P(14.5), color: PC.tinta, valign: 'middle' })
  const xData = 286 + wTitulo + 42
  slide.addShape('roundRect', { x: I(xData), y: I(35), w: I(128), h: I(30), rectRadius: I(15), fill: { color: 'FFFFFF' }, line: { color: 'E9B8B8', width: 1.1 } })
  imagem(slide, icone('calendario'), xData + 14, 42, 16, 16)
  texto(slide, data, xData + 38, 35, 86, 30, { fontSize: P(14), bold: true, color: PC.tinta, valign: 'middle' })
  imagem(slide, join(ASSETS, 'logo.png'), PAINEL.direita - 76, 32, 76, 36)
}

/** Polígono livre (as setas do funil). */
function poligono(slide: Slide, x: number, y: number, w: number, h: number, pontos: [number, number][], cor: string) {
  // Forma livre: os tipos do pptxgenjs ainda não listam custGeom, mas a biblioteca o gera.
  slide.addShape('custGeom' as PptxGenJS.SHAPE_NAME, {
    x: I(x), y: I(y), w: I(w), h: I(h), fill: { color: cor }, line: { type: 'none' },
    points: [...pontos.map(([px, py]) => ({ x: I(px), y: I(py) })), { close: true }],
  })
}

/** Anel de percentual: fundo claro e arco a partir do topo, no sentido horário. */
function anelPainel(slide: Slide, x: number, y: number, d: number, espessura: number, pct: number, cor: string) {
  const base = { x: I(x), y: I(y), w: I(d), h: I(d), line: { type: 'none' as const }, arcThicknessRatio: (2 * espessura) / d }
  slide.addShape('blockArc', { ...base, fill: { color: 'EDE7E6' }, angleRange: [0, 180] })
  slide.addShape('blockArc', { ...base, fill: { color: 'EDE7E6' }, angleRange: [180, 360] })
  const p = Math.min(100, Math.max(0, pct))
  if (p > 0) slide.addShape('blockArc', { ...base, fill: { color: cor }, angleRange: [270, (270 + Math.min(p, 99.9) * 3.6) % 360] })
}

const umaCasa = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function detalhesPainel(slide: Slide, x: number, y: number, destino: number | undefined) {
  texto(slide, [{ text: 'DETALHES →', options: destino ? { hyperlink: { slide: destino, tooltip: 'Ver a lista' } } : {} }], x, y, 90, 18,
    { fontSize: P(11), bold: true, color: PC.vermelho, align: 'right', valign: 'middle', charSpacing: P(0.4) })
}

function resumo(slide: Slide, r: SemanalResumo, dataLabel: string, destino: (id: SemanalSecaoId) => number | undefined) {
  const L = PAINEL
  fundoPainel(slide)
  cabecalhoPainel(slide, 'Painel de experimentos', dataLabel)

  // Total e composição
  cartaoPainel(slide, L.total.x, L.topoCartoes, L.total.w, L.alturaTopo)
  slide.addShape('roundRect', { x: I(82), y: I(125), w: I(56), h: I(56), rectRadius: I(12), fill: { color: PC.rosa }, line: { type: 'none' } })
  imagem(slide, icone('frasco-vermelho'), 96, 139, 28, 28)
  texto(slide, String(r.totalExperimentos), 150, 110, 200, 62, { fontSize: P(54), bold: true, color: PC.tinta, valign: 'middle' })
  texto(slide, 'experimentos no beOn Labs', 152, 171, 200, 20, { fontSize: P(13.5), color: PC.apagado })
  slide.addShape('line', { x: I(358), y: I(110), w: 0, h: I(86), line: { color: PC.linha, width: 0.75 } })
  for (const s of segmentosDaBarra(r.fatias.map(f => f.quantidade))) {
    slide.addShape('rect', { x: I(s.x), y: I(L.barra.y), w: I(s.w), h: I(L.barra.h), fill: { color: PAINEL_FATIA[r.fatias[s.i].id] }, line: { type: 'none' } })
  }
  r.fatias.forEach((f, i) => {
    const x = L.barra.x + i * L.barra.passoLegenda
    texto(slide, [
      { text: '● ', options: { fontSize: P(9), color: PAINEL_FATIA[f.id] } },
      { text: String(f.quantidade), options: { fontSize: P(21), bold: true, color: PC.tinta } },
      { text: ` ${umaCasa(f.pctDecimal)}%`, options: { fontSize: P(10.5), color: PC.apagado } },
    ], x, 140, 98, 28, { valign: 'middle' })
    texto(slide, f.label, x, 172, 92, 32, { fontSize: P(11.5), color: PC.apagado, lineSpacingMultiple: 0.95 })
  })

  // Benefício potencial total
  cartaoPainel(slide, L.beneficio.x, L.topoCartoes, L.beneficio.w, L.alturaTopo, PC.escuro)
  texto(slide, 'BENEFÍCIO POTENCIAL TOTAL', L.beneficio.x, 110, L.beneficio.w, 18, { fontSize: P(10.5), bold: true, color: 'FFFFFF', align: 'center', charSpacing: P(2.6) })
  texto(slide, [
    { text: 'R$  ', options: { fontSize: P(17), color: 'FFFFFF' } },
    { text: formatMilhoes(r.beneficioTotal, '', true).trim(), options: { fontSize: P(28), bold: true, color: 'FFFFFF' } },
    { text: '  milhões', options: { fontSize: P(20), bold: true, color: 'FFFFFF' } },
  ], L.beneficio.x, 132, L.beneficio.w, 40, { align: 'center', valign: 'middle' })
  texto(slide, 'Concedido pelas áreas de negócio para os experimentos (sem cancelados e refutados)', L.beneficio.x + 32, 174, L.beneficio.w - 64, 32,
    { fontSize: P(10.5), color: 'E6E1E0', align: 'center' })

  // Setas das etapas
  PAINEL_ETAPAS.forEach((e, i) => {
    const s = setaDoPainel(i)
    poligono(slide, s.x, L.setaTopo, s.w, L.setaAltura, s.pontos, e.bg)
    const xt = (i === 0 ? s.x : L.colunas[i]) + 10
    const yc = L.setaTopo + L.setaAltura / 2
    circulo(slide, xt, yc - 14, 28, e.nbg)
    texto(slide, String(e.n), xt, yc - 14, 28, 28, { fontSize: P(13), bold: true, color: e.nfg, align: 'center', valign: 'middle' })
    const fim = s.x + s.w - (i === 3 ? 12 : L.ponta + 4)
    texto(slide, [
      { text: e.t, options: { fontSize: P(16), bold: true, color: e.titulo, breakLine: true } },
      { text: e.d, options: { fontSize: P(10.5), color: e.texto } },
    ], xt + 38, L.setaTopo + 4, fim - xt - 38, L.setaAltura - 8, { valign: 'middle', lineSpacingMultiple: 0.95 })
  })

  // Cartões das etapas
  const { destaque, demais } = r.piloto.execucao
  const linhaPiloto = (cx: number, y: number, h: number, n: number, rotulo: string, valor: number, nome?: string, amarelo = false, dest?: number) => {
    slide.addShape('roundRect', { x: I(cx + 17), y: I(y), w: I(L.larguraColuna - 34), h: I(h), rectRadius: I(8), fill: { color: amarelo ? PC.amarelo : PC.linhaRosa }, line: { type: 'none' } })
    texto(slide, [{ text: String(n), options: dest ? { hyperlink: { slide: dest } } : {} }], cx + 29, y, 30, h, { fontSize: P(20), bold: true, color: amarelo ? PC.tinta : PC.vermelho, valign: 'middle' })
    texto(slide, [
      { text: rotulo, options: { fontSize: P(11), bold: true, color: PC.tinta, charSpacing: P(0.6), ...(nome ? { breakLine: true } : {}) } },
      ...(nome ? [{ text: caber(nome, 100, 11, 2), options: { fontSize: P(11), color: PC.tinta } }] : []),
    ], cx + 64, y, 110, h, { valign: 'middle', lineSpacingMultiple: 0.95 })
    texto(slide, [
      { text: 'benefício potencial', options: { fontSize: P(8.5), color: amarelo ? '5B4A1F' : PC.apagado, breakLine: true } },
      { text: reaisMi(valor), options: { fontSize: P(14), bold: true, color: PC.tinta } },
    ], cx + 160, y, L.larguraColuna - 189, h, { align: 'right', valign: 'middle' })
  }
  const cartoes: [number, string, SemanalSecaoId][] = [
    [r.exploracao.oportunidades, 'oportunidades', 'backlog'], [r.experimentacao.experimentos, 'experimentos', 'andamento'],
    [r.piloto.total, 'experimentos', 'aguardando'], [r.escala.experimentos, 'experimentos', 'escala'],
  ]
  cartoes.forEach(([n, rotulo, secao], i) => {
    const cx = L.colunas[i], top = L.cartaoTopo
    cartaoPainel(slide, cx, top, L.larguraColuna, L.cartaoAltura, PC.cartao, true)
    texto(slide, [
      { text: String(n), options: { fontSize: P(44), bold: true, color: PC.tinta } },
      { text: `    ${rotulo}`, options: { fontSize: P(13.5), color: PC.apagado } },
    ], cx + 22, top + 10, L.larguraColuna - 30, 56, { valign: 'middle' })
    if (i === 2) {
      linhaPiloto(cx, top + 73, 42, r.piloto.aguardando.quantidade, 'AGUARDANDO', r.piloto.aguardando.beneficio, undefined, false, destino('aguardando'))
      if (destaque && demais) {
        linhaPiloto(cx, top + 121, 42, demais.quantidade, 'EM EXECUÇÃO', demais.beneficio, undefined, false, destino('piloto'))
        linhaPiloto(cx, top + 169, 54, 1, 'OUTLIER', destaque.beneficio, destaque.nome, true, destino('piloto'))
      } else {
        linhaPiloto(cx, top + 121, 42, r.piloto.execucao.quantidade, 'EM EXECUÇÃO', r.piloto.execucao.beneficio, undefined, false, destino('piloto'))
      }
    } else {
      if (i === 0 && r.exploracao.ideiasNaoAvaliadas > 0) {
        const t = `+ ${r.exploracao.ideiasNaoAvaliadas} IDEIAS NÃO AVALIADAS`
        texto(slide, t, cx + 17, top + 72, t.length * 6.2 + 24, 21, {
          shape: 'roundRect', rectRadius: I(4), fill: { color: PC.areia }, line: { type: 'none' },
          fontSize: P(8.5), bold: true, color: PC.tinta, charSpacing: P(1.1), align: 'center', valign: 'middle',
        })
      }
      slide.addShape('line', { x: I(cx + 17), y: I(top + 104), w: I(L.larguraColuna - 34), h: 0, line: { color: PC.linha, width: 0.75 } })
      texto(slide, 'Benefício potencial', cx + 17, top + 124, 200, 18, { fontSize: P(12), color: PC.apagado })
      const valor = i === 0 ? 'Em análise' : reaisMi(i === 1 ? r.experimentacao.beneficio : r.escala.beneficio)
      texto(slide, valor, cx + 17, top + 146, L.larguraColuna - 34, 40, { fontSize: P(28), bold: true, color: PC.vermelho, valign: 'middle' })
    }
    slide.addShape('line', { x: I(cx + 17), y: I(top + 238), w: I(L.larguraColuna - 34), h: 0, line: { color: PC.linha, width: 0.75 } })
    imagem(slide, icone(PAINEL_ETAPAS[i].icone), cx + 17, top + 253, 14, 14)
    texto(slide, PAINEL_ETAPAS[i].rodape, cx + 38, top + 250, 150, 20, { fontSize: P(11.5), color: PC.tinta, valign: 'middle' })
    detalhesPainel(slide, cx + L.larguraColuna - 17 - 90, top + 251, destino(secao))
  })

  // Principais métricas
  texto(slide, 'PRINCIPAIS', L.margem, 616, 160, 14, { fontSize: P(10), bold: true, color: PC.vermelho, charSpacing: P(3) })
  texto(slide, 'Métricas', L.margem, 632, 160, 30, { fontSize: P(22), bold: true, color: PC.tinta })
  r.metricas.slice(0, 2).forEach((m, i) => {
    const { x, w } = L.metricas[i]
    cartaoPainel(slide, x, L.metricasTopo, w, L.metricasAltura)
    anelPainel(slide, x + 24, L.metricasTopo + 8, 68, 9, m.pct, i === 0 ? PC.vermelhoForte : PC.bordo)
    texto(slide, `${m.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, x + 24, L.metricasTopo + 8, 68, 68, { fontSize: P(13), bold: true, color: PC.tinta, align: 'center', valign: 'middle' })
    texto(slide, [
      { text: m.titulo, options: { fontSize: P(17), bold: true, color: PC.tinta, breakLine: true } },
      { text: m.descricao, options: { fontSize: P(11.5), color: PC.apagado } },
    ], x + 112, L.metricasTopo + 10, w - 130, L.metricasAltura - 20, { valign: 'middle' })
  })
}

// ── Governança beOn Labs ──────────────────────────────────────────────────────────────────────────────

function governanca(slide: Slide, g: SemanalGovernanca, geradoEm: string) {
  const L = GOV_LAYOUT
  const lay = layoutGovernanca(g)
  const AMX = { fontFace: 'AMX' }
  const DARK_RED = '8B0000'
  const cor = (h: string) => h.replace('#', '')
  const x0 = L.margem, x1 = 1280 - L.margem
  const semLinha = { type: 'none' as const }

  // Título e legendas
  texto(slide, [
    { text: 'GOVERNANÇA ', options: { charSpacing: P(2) } },
    { text: 'beOn Labs' },
  ], x0, 14, 420, 44, { ...AMX, fontSize: P(30), bold: true, color: RED, valign: 'middle' })
  texto(slide, 'SUB-STATUS', 440, 16, 190, 14, { ...AMX, fontSize: P(10), bold: true, color: INK })
  imagem(slide, icone('prioridade'), 440, 35, 14, 14)
  texto(slide, 'Prioridade', 459, 34, 70, 16, { ...AMX, fontSize: P(11.5), color: MUTED, valign: 'middle' })
  imagem(slide, icone('cadeado'), 536, 36, 12, 12)
  texto(slide, 'Bloqueio', 553, 34, 70, 16, { ...AMX, fontSize: P(11.5), color: MUTED, valign: 'middle' })
  texto(slide, 'TIPO DE TECNOLOGIA', 640, 16, 300, 14, { ...AMX, fontSize: P(10), bold: true, color: INK })
  let lx = 640
  for (const t of [...TECNOLOGIAS_GOV, { label: 'Em exploração', cor: GOV_BOLINHA_EXPLORACAO }]) {
    circulo(slide, lx, 36, 12, cor(t.cor))
    const w = t.label.length * 5.3 + 4
    texto(slide, t.label, lx + 17, 34, w, 16, { ...AMX, fontSize: P(11), color: MUTED, valign: 'middle', wrap: false })
    lx += 17 + w + 8
  }
  texto(slide, 'ATUALIZADO EM:', x1 - 120, 16, 120, 14, { ...AMX, fontSize: P(10), bold: true, color: INK, align: 'center' })
  slide.addText(dataAtualizacao(geradoEm), {
    x: I(x1 - 120), y: I(33), w: I(120), h: I(19), shape: 'roundRect', rectRadius: I(4), fill: { color: 'FFFFFF' },
    line: { color: RED, width: 1.1 }, margin: 0, ...AMX, fontSize: P(12), bold: true, color: INK, align: 'center', valign: 'middle',
  })

  // Total de experimentos
  slide.addShape('roundRect', {
    x: I(x0), y: I(L.faixaY), w: I(x1 - x0), h: I(L.faixaH + 12), rectRadius: I(10), fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.5 },
  })
  texto(slide, `${g.totalExperimentos} EXPERIMENTOS`, x0, L.faixaY, x1 - x0, L.faixaH, {
    ...AMX, fontSize: P(15), bold: true, color: RED, align: 'center', valign: 'middle', charSpacing: P(3),
  })

  // Cabeçalho das fases (cobre a borda de baixo da faixa)
  // Degradê laranja → vermelho → vinho (GOV_DEGRADE): o pptxgenjs não gera preenchimento em degradê, então vai como imagem.
  const degrade = join(ASSETS, 'governanca-cabecalho.png')
  imagem(slide, degrade, x0, L.grupoY, L.areaW, L.grupoH + L.subH)
  slide.addText('ÁREA', {
    x: I(x0), y: I(L.grupoY), w: I(L.areaW), h: I(L.grupoH + L.subH), line: semLinha, margin: 0,
    ...AMX, fontSize: P(15), bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', charSpacing: P(1),
  })
  for (const { grupo, x, w } of lay.grupos) {
    imagem(slide, degrade, x, L.grupoY, w, L.grupoH)
    slide.addShape('line', { x: I(x), y: I(L.grupoY), w: 0, h: I(L.grupoH + L.subH), line: { color: 'FFFFFF', width: 1.5 } })
    texto(slide, [
      { text: `${grupo.total}  `, options: { fontSize: P(24), bold: true } },
      { text: grupo.label, options: { fontSize: P(14), bold: true } },
    ], x + 12, L.grupoY, w - 20, L.grupoH, { ...AMX, color: 'FFFFFF', valign: 'middle' })
    grupo.colunas.forEach((gc, k) => {
      const col = lay.colunas.find(c => c.id === gc.id)!
      slide.addShape('rect', { x: I(col.x + (k === 0 ? 1 : 0)), y: I(L.subY), w: I(col.w - (k === 0 ? 1 : 0)), h: I(L.subH), fill: { color: 'FBE4E4' }, line: semLinha })
      if (k > 0) slide.addShape('line', { x: I(col.x), y: I(L.subY), w: 0, h: I(L.subH), line: { color: 'E8A0A0', width: 0.75, dashType: 'dash' } })
      if (gc.label) {
        texto(slide, [
          { text: `${gc.label} `, options: { bold: true } },
          { text: `(${gc.total})` },
        ], col.x, L.subY, col.w, L.subH, { ...AMX, fontSize: P(11), color: DARK_RED, align: 'center', valign: 'middle' })
      }
    })
  }

  // Fundo de destaque dos experimentos em andamento
  const andamento = lay.grupos.find(gr => gr.grupo.id === 'andamento')
  if (andamento) slide.addShape('rect', { x: I(andamento.x), y: I(L.gradeY), w: I(andamento.w), h: I(L.gradeFim - L.gradeY), fill: { color: 'FFF6F6' }, line: semLinha })

  // Divisórias das colunas
  lay.colunas.forEach((c, k) => {
    if (k === 0) return
    const inicioDeGrupo = lay.grupos.some(gr => gr.x === c.x)
    slide.addShape('line', {
      x: I(c.x), y: I(L.gradeY), w: 0, h: I(L.gradeFim - L.gradeY),
      line: inicioDeGrupo ? { color: 'C9CDD3', width: 0.75 } : { color: 'E3B5B5', width: 0.75, dashType: 'dash' },
    })
  })

  // Linhas por área
  lay.linhas.forEach((linha, r) => {
    slide.addText(linha.area.toUpperCase(), {
      x: I(x0), y: I(linha.y + (r ? 2 : 0)), w: I(L.areaW), h: I(linha.h - (r ? 2 : 0)), fill: { color: cor(GOV_GRAFITE) }, line: semLinha,
      margin: [0, 10, 0, 10].map(P) as [number, number, number, number],
      ...AMX, fontSize: P(12.5), bold: true, color: 'FFFFFF', valign: 'middle',
    })
    for (const cel of linha.celulas) {
      for (const { x, y, item, linhasNome } of cel.itens) {
        const bx = x + (L.itemW - L.bolinha) / 2
        const corBolinha = cel.coluna === 'exploracao' ? GOV_BOLINHA_EXPLORACAO : TECNOLOGIAS_GOV.find(t => t.id === item.tecnologia)!.cor
        circulo(slide, bx, y, L.bolinha, cor(corBolinha))
        if (item.prioridade) imagem(slide, icone('prioridade'), bx - 8, y - 5, 12, 12)
        if (item.bloqueio) imagem(slide, icone('cadeado'), bx + L.bolinha + 1, y - 4, 10, 10)
        texto(slide, linhasNome.join('\n'), x - 4, y + L.bolinha + 1, L.itemW + 8, L.linhaH - L.bolinha - 1, {
          // As linhas já vêm quebradas (quebrarNome): sem quebra automática, uma fonte mais larga não cria uma 3ª linha.
          ...AMX, fontSize: P(L.fonteNome), color: INK, align: 'center', lineSpacingMultiple: 0.9, wrap: false,
        })
      }
      if (cel.mais) {
        texto(slide, [
          { text: `+${cel.mais.n}`, options: { fontSize: P(12), bold: true, breakLine: true } },
          { text: 'mais', options: { fontSize: P(L.fonteNome) } },
        ], cel.mais.x - 4, cel.mais.y - 2, L.itemW + 8, L.linhaH, { ...AMX, color: MUTED, align: 'center' })
      }
    }
  })
}

// ── Principais motivos de cancelamento ────────────────────────────────────────────────────────────────

function cancelamento(slide: Slide, k: SemanalCancelamento, dataLabel: string) {
  const L = CANCELAMENTO_PAINEL, T = PAINEL
  fundoPainel(slide)
  cabecalhoPainel(slide, 'Principais motivos de cancelamento', dataLabel)

  // Total de cancelados e o peso no total de experimentos
  cartaoPainel(slide, L.total.x, T.topoCartoes, L.total.w, T.alturaTopo)
  slide.addShape('roundRect', { x: I(L.total.x + 24), y: I(T.topoCartoes + 37), w: I(56), h: I(56), rectRadius: I(12), fill: { color: PC.rosa }, line: { type: 'none' } })
  imagem(slide, icone('cancelado'), L.total.x + 38, T.topoCartoes + 51, 28, 28)
  texto(slide, String(k.total), L.total.x + 94, T.topoCartoes + 22, 200, 62, { fontSize: P(54), bold: true, color: PC.tinta, valign: 'middle' })
  texto(slide, 'experimentos cancelados', L.total.x + 96, T.topoCartoes + 84, 200, 20, { fontSize: P(13.5), color: PC.apagado })
  if (k.totalExperimentos) {
    slide.addShape('line', { x: I(L.total.x + 300), y: I(T.topoCartoes + 22), w: 0, h: I(86), line: { color: PC.linha, width: 0.75 } })
    texto(slide, pctUmaCasa(Math.round((k.total / k.totalExperimentos) * 1000) / 10), L.total.x + 326, T.topoCartoes + 30, 220, 42,
      { fontSize: P(30), bold: true, color: PC.vermelho, valign: 'middle' })
    texto(slide, `dos ${k.totalExperimentos} experimentos do beOn Labs`, L.total.x + 326, T.topoCartoes + 78, 220, 30, { fontSize: P(12), color: PC.apagado })
  }

  // Concentração nos dois principais motivos
  cartaoPainel(slide, L.destaque.x, T.topoCartoes, L.destaque.w, T.alturaTopo, PC.escuro)
  texto(slide, 'CONCENTRAÇÃO', L.destaque.x + 30, T.topoCartoes + 22, 300, 16, { fontSize: P(10.5), bold: true, color: 'FFFFFF', charSpacing: P(2.6) })
  if (k.destaque) {
    texto(slide, pctUmaCasa(k.destaque.pct), L.destaque.x + 30, T.topoCartoes + 44, 180, 60, { fontSize: P(44), bold: true, color: 'FFFFFF', valign: 'middle' })
    texto(slide, fraseDestaque(k), L.destaque.x + 210, T.topoCartoes + 46, 360, 64, { fontSize: P(15), color: 'EDE8E7', valign: 'middle' })
  } else {
    texto(slide, 'Nenhum motivo registrado ainda.', L.destaque.x + 30, T.topoCartoes + 54, 400, 24, { fontSize: P(15), color: 'EDE8E7' })
  }

  // Ranking dos motivos
  cartaoPainel(slide, L.tabela.x, L.tabela.y, L.tabela.w, L.tabela.h)
  const cab = { fontSize: P(10), bold: true, color: PC.apagado, charSpacing: P(1.6) }
  texto(slide, 'MOTIVO DA SAÍDA', L.colMotivo, 254, 300, 16, cab)
  texto(slide, 'QUANTIDADE DE EXPERIMENTOS', L.colBarra, 254, 300, 16, cab)
  texto(slide, '% DO TOTAL', L.colPct - 160, 254, 160, 16, { ...cab, align: 'right' })
  slide.addShape('line', { x: I(82), y: I(280), w: I(L.tabela.w - 48), h: 0, line: { color: PC.linha, width: 0.75 } })
  const max = Math.max(1, ...k.motivos.map(m => m.quantidade))
  const passo = L.alturaLinhas / Math.max(5, k.motivos.length)
  const principais = k.destaque?.motivos.length ?? 0
  k.motivos.forEach((m, i) => {
    const y = L.topoLinhas + i * passo
    const principal = i < principais
    if (i > 0) slide.addShape('line', { x: I(82), y: I(y - 8), w: I(L.tabela.w - 48), h: 0, line: { color: PC.linha, width: 0.75 } })
    circulo(slide, 82, y + 4, 26, principal ? PC.vermelhoForte : PC.linhaRosa)
    texto(slide, String(i + 1), 82, y + 4, 26, 26, { fontSize: P(12), bold: true, color: principal ? 'FFFFFF' : PC.vermelho, align: 'center', valign: 'middle' })
    texto(slide, [
      { text: caber(m.motivo, 560, 17, 1), options: { fontSize: P(17), bold: principal, color: PC.tinta, ...(m.descricao ? { breakLine: true } : {}) } },
      ...(m.descricao ? [{ text: caber(m.descricao, 560, 11.5, 1), options: { fontSize: P(11.5), color: PC.apagado } }] : []),
    ], L.colMotivo, y - 2, 560, 44, { valign: 'top' })
    const w = Math.max(4, (m.quantidade / max) * L.barraMaxW)
    slide.addShape('roundRect', { x: I(L.colBarra), y: I(y + 6), w: I(w), h: I(22), rectRadius: I(4), line: { type: 'none' },
      fill: { color: principal ? [PC.vermelhoForte, PC.bordo][i] : 'D5CCCB' } })
    texto(slide, String(m.quantidade), L.colBarra + w + 10, y + 6, 60, 22, { fontSize: P(16), bold: true, color: PC.tinta, valign: 'middle' })
    texto(slide, pctUmaCasa(m.pct), L.colPct - 160, y + 2, 160, 28, { fontSize: P(19), bold: true, color: principal ? PC.vermelho : PC.apagado, align: 'right', valign: 'middle' })
  })
  const fonte = k.fonte === 'bloqueio' ? 'Motivo de Bloqueio do épico no Jira (nenhum épico cancelado tem a Saída preenchida)' : 'campo Saída do épico no Jira'
  texto(slide, `Base: ${k.total} experimentos cancelados. Motivo pelo ${fonte}. Percentuais com uma casa decimal.`, 82, L.tabela.y + L.tabela.h - 36, 1000, 18,
    { fontSize: P(11), color: PC.apagado })
}

// ── Listas por fase ───────────────────────────────────────────────────────────────────────────────────

function celula(slide: Slide, col: string, row: SemanalRow, x: number, y: number, w: number, h: number) {
  const cx = x + 8, cw = w - 16
  const meio = { valign: 'middle' as const }
  switch (col) {
    case 'nome': {
      let tx = cx, tw = cw
      if (row.estrategico) {
        imagem(slide, icone('estrela'), cx, y + h / 2 - 11, 22, 22)
        tx += 30; tw -= 30
      }
      texto(slide, caber(row.nome, tw, 13, 3), tx, y, tw, h, { ...meio, fontSize: P(13), bold: true, color: INK })
      return
    }
    case 'descricao':
      texto(slide, caber(row.descricao, cw, 10.5, Math.min(4, Math.max(2, Math.floor((h - 10) / 15)))), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '4B5563' })
      return
    case 'observacao':
      texto(slide, caber(row.situacao ?? 'Sem visibilidade', cw, 10, 3), cx, y, cw, h, { ...meio, fontSize: P(10), color: '374151' })
      return
    case 'situacao': {
      // Como no deck: "Sit Atual:" e "Pendência:" só quando há o que mostrar.
      if (!row.situacao && !row.pendencia) {
        texto(slide, 'Sem atualização no Jira', cx, y, cw, h, { ...meio, fontSize: P(10), color: 'B5BAC1' })
        return
      }
      const linhas = row.situacao && row.pendencia ? 2 : 4
      texto(slide, [
        ...(row.situacao ? [
          { text: 'Sit Atual: ', options: { bold: true, color: INK } },
          { text: caber(row.situacao, cw, 10, linhas), options: row.pendencia ? { breakLine: true } : {} },
        ] : []),
        ...(row.pendencia ? [
          { text: 'Pendência: ', options: { bold: true, color: INK } },
          { text: caber(row.pendencia, cw, 10, linhas) },
        ] : []),
      ], cx, y, cw, h, { ...meio, fontSize: P(10), color: '374151' })
      return
    }
    case 'fase': {
      const t = row.pendencia ?? row.fase
      const c = chipCor(t)
      texto(slide, caber(t, cw - 20, 9.5, 2), cx, y + h / 2 - 14, cw, 28, {
        shape: 'roundRect', rectRadius: I(14), fill: { color: c.bg.slice(1) }, line: { type: 'none' },
        fontSize: P(9.5), color: c.fg.slice(1), align: 'center', valign: 'middle', margin: 0, lineSpacingMultiple: 0.9,
      })
      return
    }
    case 'previsao': {
      const p = row.progresso
      if (!p) {
        texto(slide, formatData(row.previsao), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '374151', align: 'center' })
        return
      }
      // Data, barra de progresso do prazo e legenda, centralizados na linha (mesmo desenho da tela).
      const cor = COR_PRAZO[p.situacao].slice(1)
      const topo = y + (h - 38) / 2
      texto(slide, formatData(row.previsao), cx, topo, cw, 14, { fontSize: P(10.5), color: '374151', align: 'center', valign: 'middle' })
      slide.addShape('roundRect', { x: I(cx), y: I(topo + 18), w: I(cw), h: I(6), rectRadius: I(3), fill: { color: 'EDEFF2' }, line: { type: 'none' } })
      const preenchido = (cw * larguraPrazo(p)) / 100
      if (preenchido > 0) {
        slide.addShape('roundRect', { x: I(cx), y: I(topo + 18), w: I(Math.max(6, preenchido)), h: I(6), rectRadius: I(3), fill: { color: cor }, line: { type: 'none' } })
      }
      texto(slide, legendaPrazo(p), cx - 6, topo + 26, cw + 12, 12, {
        fontSize: P(9), color: p.situacao === 'atrasado' ? cor : '6B7280', bold: p.situacao === 'atrasado', align: 'center', valign: 'middle', wrap: false,
      })
      return
    }
    case 'diretor':
      texto(slide, caber(diretorEPontoFocal(row), cw, 10.5, 3), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '374151' })
      return
    case 'area':
      texto(slide, caber(row.area ?? '—', cw, 10.5, 2), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '6B7280' })
      return
    case 'beneficio': {
      const mapeado = row.beneficio !== null
      texto(slide, formatBeneficioMM(row.beneficio), cx, y, cw, h, { ...meio, fontSize: P(mapeado ? 12 : 10.5), bold: mapeado, color: mapeado ? INK : 'B5BAC1' })
      return
    }
  }
}

function lista(slide: Slide, pg: Extract<PaginaDeck, { tipo: 'lista' }>, voltar: number | undefined) {
  texto(slide, [
    { text: pg.titulo, options: { fontSize: P(30), bold: true, color: LISTA_RED } },
    ...(pg.subtitulo ? [{ text: `  | ${pg.subtitulo}`, options: { fontSize: P(19), bold: true, color: LISTA_RED } }] : []),
  ], 34, 14, 1000, 40, { valign: 'bottom' })
  texto(slide, 'Lista de experimentos', 35, 54, 400, 18, { fontSize: P(13.5), color: LISTA_RED, charSpacing: P(1.5) })
  texto(slide, [
    { text: String(pg.todas.length), options: { fontSize: P(28), bold: true, color: LISTA_RED } },
    { text: '   EXPERIMENTOS', options: { fontSize: P(22), color: '8A8F98', charSpacing: P(6) } },
  ], 1280 - 64 - 460, 30, 460, 40, { align: 'right', valign: 'bottom' })
  slide.addImage({ path: icone('voltar'), x: I(1280 - 18 - 28), y: I(10), w: I(28), h: I(28), ...(voltar ? { hyperlink: { slide: voltar, tooltip: 'Voltar para a visão geral' } } : {}) })

  const colunas = colunasDa(pg.secao)
  const xs: number[] = []
  colunas.reduce((x, c) => { xs.push(x); return x + c.w }, 34)
  colunas.forEach((c, j) => {
    const centro = ['lab', 'fase', 'previsao'].includes(c.id)
    texto(slide, c.label.toUpperCase(), xs[j] + 8, 88, c.w - 16, 24, { fontSize: P(9.5), color: '6B7280', charSpacing: P(1.2), valign: 'bottom', align: centro ? 'center' : 'left' })
  })

  const porPagina = LINHAS_POR_PAGINA[pg.secao]
  const rowH = Math.floor(522 / porPagina)
  const TOP = 116
  slide.addShape('roundRect', {
    x: I(26), y: I(TOP), w: I(1228), h: I(pg.rows.length * rowH + 8), rectRadius: I(10),
    fill: { color: 'FFFFFF' }, line: { color: 'E3E5E8', width: 0.75 },
  })
  const labIdx = colunas.findIndex(c => c.id === 'lab')
  pg.rows.forEach((row, i) => {
    const y = TOP + 4 + i * rowH
    if (i > 0) {
      // Separador entre linhas, interrompido na coluna Laboratório (onde ficam as caixas).
      const antes = xs[labIdx] - 34, depois = 34 + colunas.reduce((s, c) => s + c.w, 0) - (xs[labIdx] + colunas[labIdx].w)
      slide.addShape('line', { x: I(34), y: I(y), w: I(antes), h: 0, line: { color: 'F0F1F3', width: 0.75 } })
      slide.addShape('line', { x: I(xs[labIdx] + colunas[labIdx].w), y: I(y), w: I(depois), h: 0, line: { color: 'F0F1F3', width: 0.75 } })
    }
    colunas.forEach((c, j) => { if (c.id !== 'lab') celula(slide, c.id, row, xs[j], y, c.w, rowH) })
  })
  for (const run of sequenciasDeLab(pg.rows)) {
    const cor = corDoLab(run.lab).slice(1)
    const y = TOP + 4 + run.ini * rowH + 5
    const h = (run.fim - run.ini + 1) * rowH - 10
    texto(slide, run.lab ?? 'Não definido', xs[labIdx] + 6, y, colunas[labIdx].w - 12, h, {
      shape: 'roundRect', rectRadius: I(8), fill: { color: 'FFFFFF' }, line: { color: cor, width: 1.1 }, shadow: sombra(),
      fontSize: P(10.5), bold: true, color: cor, align: 'center', valign: 'middle', margin: [0, 4, 0, 4],
    })
  }

  // Iniciativas conectadas: colchete à esquerda ligando as linhas vinculadas no Jira
  for (const i of paresConectados(pg.rows)) {
    const y1 = TOP + 4 + i * rowH + rowH / 2, y2 = y1 + rowH
    const traco = { color: RED, width: 1.1 }
    slide.addShape('line', { x: I(30), y: I(y1), w: 0, h: I(y2 - y1), line: traco })
    slide.addShape('line', { x: I(30), y: I(y1), w: I(10), h: 0, line: traco })
    slide.addShape('line', { x: I(30), y: I(y2), w: I(10), h: 0, line: traco })
    slide.addShape('ellipse', { x: I(21), y: I((y1 + y2) / 2 - 10), w: I(20), h: I(20), fill: { color: 'FFFFFF' }, line: traco })
    imagem(slide, icone('conexao'), 25, (y1 + y2) / 2 - 6, 12, 12)
  }

  // Legenda
  slide.addShape('line', { x: 0, y: I(656), w: I(1280), h: 0, line: { color: 'D9DCE1', width: 1.1 } })
  texto(slide, 'LEGENDAS:', 12, 656, 80, 64, { fontSize: P(10.5), color: '6B7280', valign: 'middle' })
  slide.addShape('line', { x: I(92), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Iniciativas Conectadas:', 102, 664, 124, 16, { fontSize: P(10.5), color: '6B7280', align: 'center' })
  slide.addShape('ellipse', { x: I(153), y: I(686), w: I(22), h: I(22), fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.1 } })
  imagem(slide, icone('conexao'), 157, 690, 14, 14)
  slide.addShape('line', { x: I(226), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Estratégico:', 244, 664, 90, 16, { fontSize: P(10.5), color: '6B7280' })
  imagem(slide, icone('estrela-legenda'), 244, 686, 22, 22)
  slide.addShape('line', { x: I(312), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Qt. de Iniciativas + Laboratórios resp.:', 330, 664, 400, 16, { fontSize: P(10.5), color: '6B7280' })
  // Em andamento, a legenda da barra de prazo ocupa a direita do rodapé.
  const prazo = pg.secao === 'andamento'
  const limiteLabs = prazo ? 930 : 1260
  let lx = 330, ly = 688
  for (const [lab, n] of contagemPorLab(pg.todas)) {
    const rotulo = `${String(n).padStart(2, '0')} ${lab}`
    const w = 20 + rotulo.length * 6
    if (lx + w > limiteLabs) { lx = 330; ly += 16 }
    const cor = corDoLab(lab).slice(1)
    slide.addShape('roundRect', { x: I(lx), y: I(ly + 2), w: I(11), h: I(11), rectRadius: I(3), fill: { color: 'FFFFFF' }, line: { color: cor, width: 1.1 } })
    texto(slide, [
      { text: String(n).padStart(2, '0'), options: { bold: true } },
      { text: ` ${lab}` },
    ], lx + 16, ly, w, 16, { fontSize: P(10.5), color: cor })
    lx += w + 16
  }
  if (prazo) {
    slide.addShape('line', { x: I(948), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
    texto(slide, 'Barra: prazo decorrido desde o início da execução', 966, 664, 310, 16, { fontSize: P(10.5), color: '6B7280' })
    let px = 966
    for (const [s, rotulo] of [['no-prazo', 'No prazo'], ['atencao', `Atenção (${PRAZO_ATENCAO_PCT}%+)`], ['atrasado', 'Atrasado']] as [SituacaoPrazo, string][]) {
      slide.addShape('roundRect', { x: I(px), y: I(693), w: I(18), h: I(6), rectRadius: I(3), fill: { color: COR_PRAZO[s].slice(1) }, line: { type: 'none' } })
      const w = rotulo.length * 6 + 4
      texto(slide, rotulo, px + 23, 688, w, 16, { fontSize: P(10.5), color: '6B7280', valign: 'middle', wrap: false })
      px += 23 + w + 12
    }
  }
}

/** Gera o deck completo da Semanal em PPTX editável. */
export async function gerarPptxSemanal(data: SemanalData): Promise<Buffer> {
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_WIDE'
  pres.title = 'Report beOn Labs — Comitê'
  pres.company = 'beOn Labs'

  const paginas = montarPaginas(data)
  // Número (1…n) do slide de cada âncora, para os links DETALHES e "voltar".
  const slideDe = new Map(paginas.flatMap((p, i) => (p.anchor ? [[p.anchor, i + 1] as const] : [])))

  for (const pg of paginas) {
    const slide = pres.addSlide()
    switch (pg.tipo) {
      case 'capa': capa(slide, pg.periodo); break
      case 'objetivo': objetivo(slide); break
      case 'resumo': resumo(slide, data.resumo, pg.dataLabel, id => slideDe.get(id)); break
      case 'governanca': governanca(slide, data.governanca, data.geradoEm); break
      case 'cancelamento': cancelamento(slide, pg.cancelamento, pg.dataLabel); break
      case 'divisor': divisor(slide, pg.linhas, pg.icone); break
      case 'lista': lista(slide, pg, slideDe.get('resumo')); break
      case 'obrigado': obrigado(slide); break
    }
  }
  return semPastas((await pres.write({ outputType: 'nodebuffer' })) as Buffer)
}

/** Tira do ZIP as entradas de pasta que o pptxgenjs grava: com elas, o arquivo não abre para coedição na nuvem. */
async function semPastas(buf: Buffer): Promise<Buffer> {
  const origem = await JSZip.loadAsync(buf)
  const limpo = new JSZip()
  for (const [nome, entrada] of Object.entries(origem.files)) {
    if (!entrada.dir) limpo.file(nome, await entrada.async('nodebuffer'), { createFolders: false })
  }
  return limpo.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
