import { renderAsync } from '@resvg/resvg-js'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  type ReportImageMetrics,
} from './report-image'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const PNG_IEND = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])

export async function renderReportInfographicPng(metrics: ReportImageMetrics): Promise<Buffer> {
  const svg = buildReportInfographicSvg(metrics)
  const renderedImage = await renderAsync(svg, {
    fitTo: { mode: 'width', value: REPORT_IMAGE_WIDTH },
    font: { loadSystemFonts: true },
  })
  const png = Buffer.from(renderedImage.asPng())

  if (
    renderedImage.width !== REPORT_IMAGE_WIDTH ||
    renderedImage.height !== REPORT_IMAGE_HEIGHT ||
    png.length < 33 ||
    !png.subarray(0, 8).equals(PNG_SIGNATURE) ||
    png.toString('ascii', 12, 16) !== 'IHDR' ||
    png.readUInt32BE(16) !== REPORT_IMAGE_WIDTH ||
    png.readUInt32BE(20) !== REPORT_IMAGE_HEIGHT ||
    !png.subarray(-PNG_IEND.length).equals(PNG_IEND)
  ) {
    throw new Error('Invalid report image output')
  }

  return png
}
