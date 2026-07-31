import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { renderReportInfographicPng } from './report-image-renderer'

describe('renderReportInfographicPng', () => {
  it('returns a valid 1024x1536 PNG', async () => {
    const png = await renderReportInfographicPng({
      generatedOn: '31/07/2026',
      totalIniciativas: 186,
      totalExperimentos: 199,
      emAndamento: 42,
      emPiloto: 18,
      concluidos: 27,
      beneficio: 2_500_000,
      topDominios: [{ name: 'Rede', count: 31 }],
    })

    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    await expect(sharp(png).metadata()).resolves.toMatchObject({
      format: 'png',
      width: 1024,
      height: 1536,
    })
  })
})
