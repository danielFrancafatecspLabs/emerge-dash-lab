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

  it('bounds long domain labels and large financial values', () => {
    const svg = buildReportInfographicSvg({
      ...metrics,
      beneficio: 9_876_543_210,
      topDominios: [{ name: 'Experiência do Cliente e Operações', count: 99 }],
    })

    expect(svg).toContain('Experiência do Cl…')
    expect(svg).not.toContain('Experiência do Cliente e Operações')
    expect(svg).toContain('<rect x="300" y="723" width="560" height="32"')

    const benefitTag = svg.match(/<text x="932" y="430"[^>]*>R\$ 9\.876,5 MM<\/text>/)?.[0]
    const fontSize = Number(benefitTag?.match(/font-size: (\d+)px/)?.[1])

    expect(benefitTag).toContain('text-anchor="end"')
    expect(fontSize).toBeLessThan(54)
  })
})

describe('formatReportImageDate', () => {
  it('formats the instant in the America/Sao_Paulo timezone', () => {
    expect(formatReportImageDate(new Date('2026-08-01T01:30:00.000Z'))).toBe('31/07/2026')
  })
})
