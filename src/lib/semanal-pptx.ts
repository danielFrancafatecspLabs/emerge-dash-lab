import { join } from 'path'
import PptxGenJS from 'pptxgenjs'
import type { SemanalCancelamento, SemanalData, SemanalResumo, SemanalRow, SemanalSecaoId } from './semanal'
import {
  CANCELAMENTO_LAYOUT, chipCor, colunasDa, contagemPorLab, corDoLab, diretorEPontoFocal, formatBeneficioMM, formatData,
  formatMilhoes, fraseDestaque, LINHAS_POR_PAGINA, montarPaginas, pctUmaCasa, sequenciasDeLab, type PaginaDeck,
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

const FATIA_COR: Record<string, string> = {
  exploracao: 'E07B00', andamento: 'F2B8B8', validadas: 'CC0000', refutadas: 'C5C9D0', cancelados: '6B0000',
}

const ETAPAS = [
  { n: 1, t: 'Exploração', d: 'Entender e validar o problema, o benefício potencial e definir as bases para experimentação', bg: 'FBE4E4', fg: INK, nbg: RED, nfg: 'FFFFFF' },
  { n: 2, t: 'Experimentação', d: 'Testar hipóteses rapidamente para gerar evidências e reduzir incertezas.', bg: 'F5C0C0', fg: INK, nbg: '5A0609', nfg: 'FFFFFF' },
  { n: 3, t: 'Piloto', d: 'Aguardando e em execução. Validar solução em ambiente controlado e confirmar seu potencial de escala.', bg: 'CC0000', fg: 'FFFFFF', nbg: 'FFFFFF', nfg: RED },
  { n: 4, t: 'Em escala', d: 'Operar, evoluir e ampliar a adoção da solução, maximizando a geração de valor para o negócio.', bg: '6B0000', fg: 'FFFFFF', nbg: 'FFFFFF', nfg: '6B0000' },
]

function seta(slide: Slide, x: number, y: number, w: number, h: number, cor: string, entalhe: boolean) {
  const d = w * 0.09
  const pts = entalhe
    ? [[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]
    : [[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h]]
  // Forma livre: os tipos do pptxgenjs ainda não listam custGeom, mas a biblioteca o gera.
  slide.addShape('custGeom' as PptxGenJS.SHAPE_NAME, {
    x: I(x), y: I(y), w: I(w), h: I(h), fill: { color: cor }, line: { type: 'none' },
    points: [...pts.map(([px, py]) => ({ x: I(px), y: I(py) })), { close: true }],
  })
}

function numeroGrande(slide: Slide, x: number, y: number, n: number, rotulo: string, w = 220) {
  texto(slide, [
    { text: String(n), options: { fontSize: P(40), bold: true, color: INK } },
    { text: `   ${rotulo}`, options: { fontSize: P(13), color: MUTED } },
  ], x, y, w, 50, { valign: 'middle' })
}

function beneficio(slide: Slide, cx: number, cy: number, cw: number, valor: number) {
  slide.addShape('line', { x: I(cx + 18), y: I(cy + 76), w: I(cw - 36), h: 0, line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Benefício potencial', cx + 18, cy + 90, cw - 36, 18, { fontSize: P(13), color: MUTED })
  texto(slide, `R$ ${formatMilhoes(valor)}`, cx + 18, cy + 112, cw - 36, 32, { fontSize: P(24), bold: true, color: RED })
}

function rodape(slide: Slide, cx: number, cy: number, cw: number, y: number, ic: string, t: string) {
  circulo(slide, cx + 18, cy + y, 28, 'FBE4E4')
  imagem(slide, icone(ic), cx + 24, cy + y + 6, 16, 16)
  texto(slide, t, cx + 56, cy + y, cw - 68, 28, { fontSize: P(12.5), color: INK, valign: 'middle' })
}

function potencial(slide: Slide, x: number, y: number, valor: number, destino?: number) {
  texto(slide, 'Com benefício potencial de:', x, y, 140, 13, { fontSize: P(9.5), color: MUTED })
  texto(slide, [{ text: formatMilhoes(valor, 'Milhões'), options: destino ? { hyperlink: { slide: destino } } : {} }],
    x, y + 12, 140, 20, { fontSize: P(15), bold: true, color: INK })
}

function resumo(slide: Slide, r: SemanalResumo, ate: string, destino: (id: SemanalSecaoId) => number | undefined) {
  texto(slide, [
    { text: 'beOn Labs', options: { fontSize: P(40), bold: true, color: TITLE_RED } },
    { text: `     ${ate}`, options: { fontSize: P(14), bold: true, color: INK } },
  ], 44, 22, 600, 56, { valign: 'bottom' })
  imagem(slide, join(ASSETS, 'logo.png'), 1280 - 40 - 92, 28, 92, 44)

  // Total + composição
  cartao(slide, 44, 90, 930, 104)
  circulo(slide, 62, 114, 56, 'FBE4E4')
  imagem(slide, icone('frasco'), 76, 128, 28, 28)
  texto(slide, String(r.totalExperimentos), 132, 96, 160, 54, { fontSize: P(46), bold: true, color: RED, valign: 'middle' })
  texto(slide, 'Total de experimentos no beOn Labs', 132, 152, 190, 34, { fontSize: P(14), color: MUTED })
  r.fatias.forEach((f, i) => {
    const x = 344 + i * 126
    texto(slide, [
      { text: '● ', options: { fontSize: P(13), color: FATIA_COR[f.id] } },
      { text: String(f.quantidade), options: { fontSize: P(30), bold: true, color: INK } },
      { text: ` ${f.pct}%`, options: { fontSize: P(13), color: MUTED } },
    ], x - 10, 102, 136, 40, { align: 'center', valign: 'bottom' })
    texto(slide, f.label, x - 10, 143, 136, 16, { fontSize: P(12.5), color: MUTED, align: 'center' })
    slide.addShape('rect', { x: I(x), y: I(165), w: I(116), h: I(11), fill: { color: FATIA_COR[f.id] }, line: { type: 'none' } })
  })

  // Benefício potencial total
  slide.addShape('roundRect', { x: I(988), y: I(90), w: I(248), h: I(104), rectRadius: I(10), fill: { color: INK }, line: { type: 'none' } })
  texto(slide, `R$ ${formatMilhoes(r.beneficioTotal, 'milhões', true)}`, 1004, 100, 170, 32, { fontSize: P(24), bold: true, color: 'FFFFFF', valign: 'middle' })
  texto(slide, 'Benefício potencial total', 1004, 133, 216, 18, { fontSize: P(14), color: 'FFFFFF' })
  texto(slide, `Concedido pelas áreas de negócio para os ${r.totalExperimentos} experimentos`, 1004, 154, 216, 30, { fontSize: P(10.5), color: 'B8BEC6' })
  circulo(slide, 1180, 102, 40, RED)
  imagem(slide, icone('moedas'), 1189, 111, 22, 22)

  // Etapas do funil
  ETAPAS.forEach((e, i) => {
    const x = 44 + i * 298
    seta(slide, x, 214, 312, 86, e.bg, i > 0)
    const nx = x + (i === 0 ? 18 : 42)
    circulo(slide, nx, 242, 30, e.nbg)
    texto(slide, String(e.n), nx, 242, 30, 30, { fontSize: P(15), bold: true, color: e.nfg, align: 'center', valign: 'middle' })
    texto(slide, [
      { text: e.t, options: { fontSize: P(15), bold: true, color: e.fg, breakLine: true } },
      { text: e.d, options: { fontSize: P(12.5), color: e.fg } },
    ], nx + 42, 218, 312 - (nx - x) - 42 - 34, 78, { valign: 'middle', lineSpacingMultiple: 0.95 })
  })

  // Exploração
  cartao(slide, 44, 314, 262, 250)
  texto(slide, `${r.exploracao.ideiasNaoAvaliadas} ideias não avaliadas`, 62, 322, 230, 18, { fontSize: P(12.5), color: MUTED })
  numeroGrande(slide, 62, 340, r.exploracao.oportunidades, 'oportunidades')
  beneficio(slide, 44, 314, 262, r.exploracao.beneficio)
  rodape(slide, 44, 314, 262, 178, 'lampada', 'Triagem e priorização de ideias')
  detalhes(slide, 62, 530, 226, 22, destino('backlog'))

  // Experimentação
  cartao(slide, 318, 314, 240, 250)
  numeroGrande(slide, 336, 328, r.experimentacao.experimentos, 'experimentos')
  beneficio(slide, 318, 314, 240, r.experimentacao.beneficio)
  rodape(slide, 318, 314, 240, 178, 'engrenagem', 'Construção e validação da solução')
  detalhes(slide, 336, 530, 204, 22, destino('andamento'))

  // Piloto
  cartao(slide, 592, 314, 376, 250)
  numeroGrande(slide, 608, 320, r.piloto.total, 'experimentos')
  detalhes(slide, 772, 330, 180, 22, destino('aguardando'))
  slide.addShape('roundRect', { x: I(606), y: I(372), w: I(348), h: I(38), rectRadius: I(6), fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.1 } })
  texto(slide, [
    { text: String(r.piloto.aguardando.quantidade), options: { fontSize: P(20), bold: true, color: RED } },
    { text: '  AGUARDANDO PILOTO', options: { fontSize: P(12), color: RED } },
  ], 618, 372, 190, 38, { valign: 'middle' })
  potencial(slide, 806, 375, r.piloto.aguardando.beneficio)
  slide.addShape('roundRect', { x: I(606), y: I(416), w: I(348), h: I(112), rectRadius: I(6), fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.1 } })
  texto(slide, [
    { text: String(r.piloto.execucao.quantidade), options: { fontSize: P(20), bold: true, color: RED } },
    { text: '  EM EXECUÇÃO', options: { fontSize: P(12), color: RED } },
  ], 618, 420, 190, 32, { valign: 'middle' })
  potencial(slide, 806, 420, r.piloto.execucao.beneficio, destino('piloto'))
  const { destaque, demais } = r.piloto.execucao
  if (destaque && demais) {
    const caixas = [
      { n: 1, titulo: `Outlier ${destaque.nome}`, valor: destaque.beneficio },
      { n: demais.quantidade, titulo: '', valor: demais.beneficio },
    ]
    caixas.forEach((c, i) => {
      const x = 618 + i * 165
      slide.addShape('roundRect', { x: I(x), y: I(466), w: I(159), h: I(52), rectRadius: I(4), fill: { color: 'FBE4E4' }, line: { type: 'none' } })
      texto(slide, String(c.n), x + 8, 466, 24, 52, { fontSize: P(18), bold: true, color: INK, valign: 'middle' })
      if (c.titulo) texto(slide, caber(c.titulo, 62, 9, 4), x + 28, 466, 62, 52, { fontSize: P(9), bold: true, color: INK, valign: 'middle', lineSpacingMultiple: 0.9 })
      texto(slide, [
        { text: formatMilhoes(c.valor), options: { fontSize: P(13), bold: true, color: RED, underline: { style: 'sng' }, breakLine: true } },
        { text: 'Em benefício potencial', options: { fontSize: P(8), color: MUTED } },
      ], x + 70, 466, 81, 52, { align: 'right', valign: 'middle' })
    })
  }
  rodape(slide, 592, 314, 376, 218, 'microscopio', 'Avaliação e execução de pilotos em ambiente real')

  // Em escala
  cartao(slide, 980, 314, 256, 250)
  numeroGrande(slide, 998, 328, r.escala.experimentos, 'experimentos')
  beneficio(slide, 980, 314, 256, r.escala.beneficio)
  rodape(slide, 980, 314, 256, 178, 'foguete', 'Escala e geração de valor')
  detalhes(slide, 998, 530, 220, 22, destino('escala'))

  // Principais métricas
  texto(slide, 'PRINCIPAIS MÉTRICAS', 44, 578, 400, 18, { fontSize: P(12.5), bold: true, color: RED, charSpacing: P(3) })
  r.metricas.slice(0, 4).forEach((m, i) => {
    const x = 44 + i * 302
    cartao(slide, x, 602, 290, 78)
    anel(slide, x + 16.5, 611.5, 59, 7, m.pct)
    texto(slide, `${m.pct}%`, x + 14, 609, 64, 64, { fontSize: P(14), bold: true, color: INK, align: 'center', valign: 'middle' })
    texto(slide, [
      { text: m.titulo, options: { fontSize: P(15), bold: true, color: INK, breakLine: true } },
      { text: m.descricao, options: { fontSize: P(11.5), color: MUTED } },
    ], x + 90, 606, 190, 70, { valign: 'middle' })
  })
}

// ── Principais motivos de cancelamento ────────────────────────────────────────────────────────────────

function cancelamento(slide: Slide, c: SemanalCancelamento) {
  const L = CANCELAMENTO_LAYOUT
  const ARIAL = { fontFace: 'Arial' }
  const CINZA = '6B7280'
  texto(slide, 'Principais motivos de cancelamento dos Experimentos', 44, 26, 1000, 52, { ...ARIAL, fontSize: P(38), bold: true, color: RED })
  imagem(slide, join(ASSETS, 'logo.png'), 1280 - 44 - 92, 36, 92, 44)

  texto(slide, String(c.total), 44, 108, 140, 84, { ...ARIAL, fontSize: P(70), bold: true, color: RED })
  texto(slide, 'experimentos\ncancelados', 180, 128, 260, 56, { ...ARIAL, fontSize: P(21), color: CINZA })
  if (c.destaque) {
    texto(slide, pctUmaCasa(c.destaque.pct), 460, 116, 240, 70, { ...ARIAL, fontSize: P(56), bold: true, color: RED, align: 'right' })
    texto(slide, fraseDestaque(c), 722, 124, 520, 60, { ...ARIAL, fontSize: P(21), color: INK })
  }

  const cabecalho = { ...ARIAL, fontSize: P(15), bold: true, color: CINZA }
  texto(slide, 'MOTIVO', 44, 232, 300, 20, cabecalho)
  texto(slide, '% DO TOTAL', L.pctDireita - 160, 232, 160, 20, { ...cabecalho, align: 'right' })
  texto(slide, 'QUANTIDADE DE EXPERIMENTOS', L.barraX + 10, 232, 400, 20, cabecalho)

  const max = Math.max(1, ...c.motivos.map(m => m.quantidade))
  c.motivos.forEach((m, i) => {
    const y = L.linhaTopo + i * L.passo(c.motivos.length)
    const principal = i < (c.destaque?.motivos.length ?? 0)
    const w = Math.max(4, (m.quantidade / max) * L.barraMaxW)
    texto(slide, caber(m.motivo, 640, 25, 1), 44, y - 2, 640, 32, { ...ARIAL, fontSize: P(25), bold: principal, color: INK })
    if (m.descricao) texto(slide, m.descricao, 52, y + 33, 640, 20, { fontSize: P(14), color: INK })
    texto(slide, pctUmaCasa(m.pct), L.pctDireita - 160, y - 2, 160, 32, { ...ARIAL, fontSize: P(25), bold: true, color: principal ? RED : CINZA, align: 'right' })
    slide.addShape('rect', {
      x: I(L.barraX), y: I(y - 4), w: I(w), h: I(L.barraH), line: { type: 'none' },
      fill: { color: principal ? ['CC0000', '8B0000'][i] : 'C4C7CE' },
    })
    texto(slide, String(m.quantidade), L.barraX + w + 8, y - 4, 80, L.barraH, { ...ARIAL, fontSize: P(21), bold: true, color: INK, valign: 'middle' })
  })

  texto(slide, `Base: ${c.total} experimentos cancelados. Percentuais arredondados a uma casa decimal.`, 44, 668, 900, 22, { ...ARIAL, fontSize: P(15), color: CINZA })
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
      texto(slide, [
        { text: caber(row.nome, tw, 13, 2), options: { fontSize: P(13), bold: true, color: INK, breakLine: true } },
        { text: row.key, options: { fontSize: P(10.5), color: '9CA3AF' } },
      ], tx, y, tw, h, meio)
      return
    }
    case 'descricao':
      texto(slide, caber(row.descricao, cw, 10.5, Math.min(4, Math.max(2, Math.floor((h - 10) / 15)))), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '4B5563' })
      return
    case 'observacao':
      texto(slide, caber(row.situacao ?? 'Sem visibilidade', cw, 10, 3), cx, y, cw, h, { ...meio, fontSize: P(10), color: '374151' })
      return
    case 'situacao':
      texto(slide, [
        { text: 'Sit. Atual: ', options: { bold: true, color: row.situacao ? INK : RED } },
        { text: caber(row.situacao ?? 'Não informada', cw, 10, 2), options: { breakLine: true } },
        { text: 'Pendência: ', options: { bold: true, color: INK } },
        { text: caber(row.pendencia ?? '—', cw, 10, 2) },
      ], cx, y, cw, h, { ...meio, fontSize: P(10), color: '374151' })
      return
    case 'fase': {
      const t = row.pendencia ?? row.fase
      const c = chipCor(t)
      texto(slide, caber(t, cw - 20, 9.5, 2), cx, y + h / 2 - 14, cw, 28, {
        shape: 'roundRect', rectRadius: I(14), fill: { color: c.bg.slice(1) }, line: { type: 'none' },
        fontSize: P(9.5), color: c.fg.slice(1), align: 'center', valign: 'middle', margin: 0, lineSpacingMultiple: 0.9,
      })
      return
    }
    case 'previsao':
      texto(slide, formatData(row.previsao), cx, y, cw, h, { ...meio, fontSize: P(10.5), color: '374151', align: 'center' })
      return
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

  // Legenda
  slide.addShape('line', { x: 0, y: I(656), w: I(1280), h: 0, line: { color: 'D9DCE1', width: 1.1 } })
  texto(slide, 'LEGENDAS:', 12, 656, 80, 64, { fontSize: P(10.5), color: '6B7280', valign: 'middle' })
  slide.addShape('line', { x: I(92), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Estratégico:', 110, 664, 90, 16, { fontSize: P(10.5), color: '6B7280' })
  imagem(slide, icone('estrela-legenda'), 110, 686, 22, 22)
  slide.addShape('line', { x: I(196), y: I(656), w: 0, h: I(64), line: { color: BORDA, width: 0.75 } })
  texto(slide, 'Qt. de Iniciativas + Laboratórios resp.:', 214, 664, 400, 16, { fontSize: P(10.5), color: '6B7280' })
  let lx = 214, ly = 688
  for (const [lab, n] of contagemPorLab(pg.todas)) {
    const rotulo = `${String(n).padStart(2, '0')} ${lab}`
    const w = 20 + rotulo.length * 6
    if (lx + w > 1260) { lx = 214; ly += 16 }
    const cor = corDoLab(lab).slice(1)
    slide.addShape('roundRect', { x: I(lx), y: I(ly + 2), w: I(11), h: I(11), rectRadius: I(3), fill: { color: 'FFFFFF' }, line: { color: cor, width: 1.1 } })
    texto(slide, [
      { text: String(n).padStart(2, '0'), options: { bold: true } },
      { text: ` ${lab}` },
    ], lx + 16, ly, w, 16, { fontSize: P(10.5), color: cor })
    lx += w + 16
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
      case 'resumo': resumo(slide, data.resumo, pg.ateLabel, id => slideDe.get(id)); break
      case 'cancelamento': cancelamento(slide, pg.cancelamento); break
      case 'divisor': divisor(slide, pg.linhas, pg.icone); break
      case 'lista': lista(slide, pg, slideDe.get('resumo')); break
      case 'obrigado': obrigado(slide); break
    }
  }
  return (await pres.write({ outputType: 'nodebuffer' })) as Buffer
}
