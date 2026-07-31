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
    expect(png.toString('ascii', 12, 16)).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(1024)
    expect(png.readUInt32BE(20)).toBe(1536)
    expect(png.subarray(-12)).toEqual(
      Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]),
    )
  })
})
