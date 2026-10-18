import { readFile } from 'fs/promises'
import { join } from 'path'
import JSZip from 'jszip'
import { fimDoArco, type ComiteResumoView } from './comite-resumo'

/**
 * PPTX editável do slide "beOn Labs — visão geral" (Comitê V6).
 *
 * O modelo (templates/comite-resumo.pptx) é o próprio slide do deck original, com tema, layout, ícones e
 * formas nativas. Aqui só trocamos os textos de cada forma (identificada pelo id do PowerPoint), o ângulo dos
 * anéis de percentual e os links dos botões DETALHES — o design continua exatamente o do deck, e tudo segue
 * editável no PowerPoint.
 */

const TEMPLATE = join(process.cwd(), 'templates', 'comite-resumo.pptx')
const SLIDE = 'ppt/slides/slide3.xml'
const SLIDE_RELS = 'ppt/slides/_rels/slide3.xml.rels'
const LINK_BASE = 'https://beonlabs.invalid'

// Ids das formas no slide do modelo.
const FATIA_IDS = { exploracao: 19, andamento: 137, validadas: 140, refutadas: 146, cancelados: 143 } as const
const METRICAS = [
  { arco: 89, pct: 90, descricao: 92 },
  { arco: 96, pct: 97, descricao: 99 },
  { arco: 103, pct: 104, descricao: 106 },
  { arco: 110, pct: 111, descricao: 113 },
]
const GRUPO_OUTLIER = 122

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Trecho [início, fim) da forma `<p:sp>` (ou `<p:grpSp>`) com o id indicado. */
function localizar(xml: string, id: number, tag: 'p:sp' | 'p:grpSp' = 'p:sp'): [number, number] {
  const marca = xml.indexOf(`<p:cNvPr id="${id}" `)
  if (marca < 0) throw new Error(`Forma ${id} não encontrada no modelo`)
  const inicio = xml.lastIndexOf(`<${tag}>`, marca)
  const fim = xml.indexOf(`</${tag}>`, marca) + `</${tag}>`.length
  return [inicio, fim]
}

function editarForma(xml: string, id: number, editar: (bloco: string) => string): string {
  const [a, b] = localizar(xml, id)
  return xml.slice(0, a) + editar(xml.slice(a, b)) + xml.slice(b)
}

/**
 * Troca o texto das "runs" da forma, na ordem em que aparecem. `null` mantém o texto original; quando há
 * menos valores que runs, as runs restantes ficam vazias (o primeiro valor herda a formatação da primeira run).
 */
function textos(xml: string, id: number, valores: (string | null)[]): string {
  return editarForma(xml, id, bloco => {
    let i = 0
    return bloco.replace(/<a:t>([^<]*)<\/a:t>/g, (original, atual: string) => {
      const valor = i < valores.length ? valores[i] : ''
      i++
      return valor === null ? original : `<a:t>${escapar(valor)}</a:t>`
    })
  })
}

function anel(xml: string, id: number, pct: number): string {
  // Sem percentual, o arco vermelho sai (o blockArc com início = fim desenharia o anel inteiro).
  if (pct <= 0) {
    const [a, b] = localizar(xml, id)
    return xml.slice(0, a) + xml.slice(b)
  }
  return editarForma(xml, id, bloco => bloco.replace(/<a:gd name="adj2" fmla="val \d+"\/>/, `<a:gd name="adj2" fmla="val ${fimDoArco(pct)}"/>`))
}

export function preencherSlide(xml: string, v: ComiteResumoView): string {
  let s = xml
  s = textos(s, 132, [v.ateLabel])
  s = textos(s, 8, [v.total])
  for (const f of v.fatias) s = textos(s, FATIA_IDS[f.id], [f.numero, `  ${f.pct}`])
  s = textos(s, 24, [v.beneficioTotal])
  // A nota tem uma quebra de linha antes do total: só a última parte muda.
  s = textos(s, 26, [null, null, null, `${v.total} experimentos`])

  s = textos(s, 47, [v.exploracao.ideiasNaoAvaliadas, '', '', '', '', '', v.exploracao.oportunidades, '  ', v.exploracao.oportunidadesLabel])
  s = textos(s, 50, [v.exploracao.beneficio])
  s = textos(s, 55, [v.experimentacao.experimentos, `  ${v.experimentacao.experimentosLabel}`])
  s = textos(s, 58, [v.experimentacao.beneficio])
  s = textos(s, 71, [v.piloto.experimentos, `  ${v.piloto.experimentosLabel}`])
  s = textos(s, 76, [v.piloto.aguardando])
  s = textos(s, 77, [v.piloto.aguardandoBeneficio])
  s = textos(s, 78, [v.piloto.execucao])
  s = textos(s, 79, [`   ${v.piloto.execucaoBeneficio}`])
  s = textos(s, 63, [v.escala.experimentos, `  ${v.escala.experimentosLabel}`])
  s = textos(s, 66, [v.escala.beneficio])

  if (v.piloto.outlier) {
    s = textos(s, 115, [v.piloto.outlier])
  } else {
    const [a, b] = localizar(s, GRUPO_OUTLIER, 'p:grpSp')
    s = s.slice(0, a) + s.slice(b)
  }

  v.metricas.slice(0, METRICAS.length).forEach((m, k) => {
    const ids = METRICAS[k]
    s = textos(s, ids.pct, [m.pctLabel])
    s = textos(s, ids.descricao, [m.descricao])
    s = anel(s, ids.arco, m.pct)
  })
  return s
}

/**
 * Gera o PPTX. `linkBase` é o endereço do portal (ex.: https://servidor/jira): os botões DETALHES abrem a
 * lista correspondente na aba Semanal; sem ele, os links são removidos.
 */
export async function gerarPptxComite(view: ComiteResumoView, linkBase: string | null): Promise<Buffer> {
  const zip = await JSZip.loadAsync(await readFile(TEMPLATE))
  const slide = await zip.file(SLIDE)!.async('string')
  zip.file(SLIDE, preencherSlide(slide, view))

  let rels = await zip.file(SLIDE_RELS)!.async('string')
  if (linkBase) {
    rels = rels.split(LINK_BASE).join(escapar(linkBase.replace(/\/+$/, '')))
    zip.file(SLIDE_RELS, rels)
  } else {
    zip.file(SLIDE_RELS, rels.replace(/<Relationship Id="(rId\d+)" Type="[^"]*\/hyperlink"[^>]*\/>/g, ''))
    zip.file(SLIDE, (await zip.file(SLIDE)!.async('string')).replace(/<a:hlinkClick [^>]*\/>|<a:hlinkClick [^>]*>.*?<\/a:hlinkClick>/g, ''))
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
