import { Resvg } from '@resvg/resvg-js'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  type ReportImageMetrics,
} from './report-image'

export async function renderReportInfographicPng(metrics: ReportImageMetrics): Promise<Buffer> {
  const svg = buildReportInfographicSvg(metrics)
  const png = Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: 'width', value: REPORT_IMAGE_WIDTH },
      font: { loadSystemFonts: true },
    }).render().asPng(),
  )

  if (
    png.length < 24 ||
    !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    png.toString('ascii', 12, 16) !== 'IHDR' ||
    png.readUInt32BE(16) !== REPORT_IMAGE_WIDTH ||
    png.readUInt32BE(20) !== REPORT_IMAGE_HEIGHT
  ) {
    throw new Error('Invalid report image output')
  }

  return png
}
