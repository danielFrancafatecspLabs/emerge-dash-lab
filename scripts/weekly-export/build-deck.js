/**
 * Monta o PPTX e o PDF da Weekly a partir dos PNGs gerados por
 * capture-slides.js.
 *
 * - PDF: cada página tem o tamanho nativo da própria imagem (mesma técnica
 *   de "uma página por imagem" — sem bordas brancas, sem distorção). O PDF
 *   suporta páginas de tamanhos diferentes, então isso funciona bem mesmo
 *   misturando os slides principais (1280×720, 16:9) com as tabelas de
 *   detalhes (mais largas e baixas, formato de tabela).
 * - PPTX: o formato NÃO suporta slides de tamanhos diferentes no mesmo
 *   arquivo — o PowerPoint exige um único tamanho de slide para a
 *   apresentação inteira. Por isso fixamos 16:9 (o mesmo formato dos 4
 *   slides principais) e encaixamos cada imagem centralizada, preservando a
 *   proporção ("contain"). Os slides de tabela (mais largos que 16:9) vão
 *   sobrar uma margem branca acima/abaixo — isso é uma limitação do formato
 *   PPTX, não um bug: com dados reais do Jira (mais linhas por página) essa
 *   margem tende a ficar bem menor, já que a tabela fica proporcionalmente
 *   mais "quadrada".
 *
 * Uso:
 *   node scripts/weekly-export/build-deck.js
 *
 * Variáveis de ambiente (todas opcionais):
 *   WEEKLY_EXPORT_DIR   pasta com os PNGs de entrada (default: ./weekly-export/slides)
 *   WEEKLY_OUTPUT_DIR   pasta de saída do pptx/pdf (default: ./weekly-export)
 *   WEEKLY_OUTPUT_NAME  nome base dos arquivos gerados (default: Weekly-BeOnLabs)
 */
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')
const PptxGenJS = require('pptxgenjs')

const SLIDES_DIR = process.env.WEEKLY_EXPORT_DIR || path.join(process.cwd(), 'weekly-export', 'slides')
const OUTPUT_DIR = process.env.WEEKLY_OUTPUT_DIR || path.join(process.cwd(), 'weekly-export')
const OUTPUT_NAME = process.env.WEEKLY_OUTPUT_NAME || 'Weekly-BeOnLabs'

// html2canvas exporta em scale:2 (ver src/components/report/slideExport.tsx) —
// dividimos por 2 para voltar à dimensão "real" em pixels CSS (ex.: os slides
// principais viram 1280×720, o tamanho de slide de PowerPoint padrão).
const EXPORT_SCALE = 2

function getPngSizePx(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${filePath} não parece ser um PNG válido`)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function listSlideFiles() {
  return fs.readdirSync(SLIDES_DIR)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort()
    .map(f => path.join(SLIDES_DIR, f))
}

async function buildPdf(files) {
  const pdf = await PDFDocument.create()
  for (const file of files) {
    const { width, height } = getPngSizePx(file)
    const pngBytes = fs.readFileSync(file)
    const image = await pdf.embedPng(pngBytes)
    const page = pdf.addPage([width / EXPORT_SCALE, height / EXPORT_SCALE])
    page.drawImage(image, { x: 0, y: 0, width: width / EXPORT_SCALE, height: height / EXPORT_SCALE })
  }
  const outPath = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.pdf`)
  fs.writeFileSync(outPath, await pdf.save())
  return outPath
}

async function buildPptx(files) {
  const pres = new PptxGenJS()
  const SW = 13.333, SH = 7.5 // 16:9, mesmo tamanho de slide de PowerPoint dos 4 slides principais
  pres.defineLayout({ name: 'WEEKLY_169', width: SW, height: SH })
  pres.layout = 'WEEKLY_169'

  for (const file of files) {
    const { width, height } = getPngSizePx(file)
    const aspect = width / height
    const slideAspect = SW / SH
    let drawW, drawH
    if (aspect >= slideAspect) {
      drawW = SW
      drawH = SW / aspect
    } else {
      drawH = SH
      drawW = SH * aspect
    }
    const x = (SW - drawW) / 2
    const y = (SH - drawH) / 2

    const slide = pres.addSlide()
    // Fundo levemente cinza: deixa a margem das tabelas mais largas parecer
    // uma escolha de layout, não um espaço vazio "quebrado".
    slide.background = { color: 'FAFAFA' }
    slide.addImage({ path: file, x, y, w: drawW, h: drawH })
  }

  const outPath = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.pptx`)
  await pres.writeFile({ fileName: outPath })
  return outPath
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const files = listSlideFiles()
  if (files.length === 0) {
    throw new Error(`Nenhum PNG encontrado em ${SLIDES_DIR}. Rode capture-slides.js primeiro.`)
  }
  console.log(`${files.length} slides encontrados em ${SLIDES_DIR}`)

  const pdfPath = await buildPdf(files)
  console.log('PDF salvo em', pdfPath)

  const pptxPath = await buildPptx(files)
  console.log('PPTX salvo em', pptxPath)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
