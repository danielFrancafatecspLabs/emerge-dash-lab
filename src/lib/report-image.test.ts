import { describe, expect, it } from 'vitest'
import {
  REPORT_IMAGE_HEIGHT,
  REPORT_IMAGE_WIDTH,
  buildReportInfographicSvg,
  formatReportImageDate,
  type ReportImageMetrics,
} from './report-image'

const metrics: ReportImageMetrics = {
  generatedOn: '31/07/2026',
  totalIniciativas: 186,
  totalExperimentos: 199,
  emAndamento: 42,
  emPiloto: 18,
  concluidos: 27,
  beneficio: 2_500_000,
  topDominios: [
    { name: '<Rede & IA>', count: 31 },
    { name: 'Atendimento', count: 22 },
  ],
}

describe('buildReportInfographicSvg', () => {
  it('builds the complete 1024x1536 report with current metrics', () => {
    const svg = buildReportInfographicSvg(metrics)

    expect(REPORT_IMAGE_WIDTH).toBe(1024)
    expect(REPORT_IMAGE_HEIGHT).toBe(1536)
    expect(svg).toContain('width="1024"')
    expect(svg).toContain('height="1536"')
    expect(svg).toContain('Atualização Semanal do Portfólio de Inovação')
    expect(svg).toContain('31/07/2026')
    expect(svg).toContain('186 iniciativas')
    expect(svg).toContain('199 experimentos')
    expect(svg).toContain('R$ 2,5 MM')
    expect(svg).toContain('Em andamento')
    expect(svg).toContain('Concluídos')
  })

  it('escapes domain labels before inserting them into SVG', () => {
    const svg = buildReportInfographicSvg(metrics)

    expect(svg).toContain('&lt;Rede &amp; IA&gt;')
    expect(svg).not.toContain('<Rede & IA>')
  })
})

describe('formatReportImageDate', () => {
  it('formats the instant in the America/Sao_Paulo timezone', () => {
    expect(formatReportImageDate(new Date('2026-08-01T01:30:00.000Z'))).toBe('31/07/2026')
  })
})
