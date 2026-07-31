import sharp from 'sharp'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  type ReportImageMetrics,
} from './report-image'

export async function renderReportInfographicPng(metrics: ReportImageMetrics): Promise<Buffer> {
  const svg = buildReportInfographicSvg(metrics)
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  const metadata = await sharp(png).metadata()

  if (
    metadata.format !== 'png' ||
    metadata.width !== REPORT_IMAGE_WIDTH ||
    metadata.height !== REPORT_IMAGE_HEIGHT
  ) {
    throw new Error('Invalid report image output')
  }

  return png
}
