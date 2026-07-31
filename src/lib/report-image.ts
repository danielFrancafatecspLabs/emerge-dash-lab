export const REPORT_IMAGE_WIDTH = 1024
export const REPORT_IMAGE_HEIGHT = 1536

export interface ReportImageDomain {
  name: string
  count: number
}

export interface ReportImageMetrics {
  generatedOn: string
  totalIniciativas: number
  totalExperimentos: number
  emAndamento: number
  emPiloto: number
  concluidos: number
  beneficio: number
  topDominios: ReportImageDomain[]
}

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const formatMillions = (value: number): string =>
  `R$ ${(value / 1_000_000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MM`

const scaledBarWidth = (value: number, maximum: number, width: number): number => {
  if (value <= 0 || maximum <= 0) return 0
  return Math.max(12, Math.round((value / maximum) * width))
}

export function formatReportImageDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function buildReportInfographicSvg(metrics: ReportImageMetrics): string {
  const funnel = [
    { label: 'Em andamento', value: metrics.emAndamento, color: '#B91C1C' },
    { label: 'Em Piloto', value: metrics.emPiloto, color: '#DC2626' },
    { label: 'Concluídos', value: metrics.concluidos, color: '#F87171' },
  ]
  const funnelMaximum = Math.max(1, ...funnel.map(stage => stage.value))
  const domainMaximum = Math.max(1, ...metrics.topDominios.map(domain => domain.count))
  const funnelRows = funnel.map((stage, index) => {
    const y = 748 + index * 82
    const width = scaledBarWidth(stage.value, funnelMaximum, 610)
    return `<text x="126" y="${y}" class="label">${stage.label}</text>
      <rect x="300" y="${y - 25}" width="610" height="32" rx="16" fill="#F3F4F6"/>
      <rect x="300" y="${y - 25}" width="${width}" height="32" rx="16" fill="${stage.color}"/>
      <text x="930" y="${y}" text-anchor="end" class="value-small">${stage.value}</text>`
  }).join('')
  const domainRows = metrics.topDominios.slice(0, 5).map((domain, index) => {
    const y = 1135 + index * 58
    const width = scaledBarWidth(domain.count, domainMaximum, 520)
    return `<text x="126" y="${y}" class="domain">${escapeXml(domain.name)}</text>
      <rect x="340" y="${y - 20}" width="520" height="24" rx="12" fill="#F3F4F6"/>
      <rect x="340" y="${y - 20}" width="${width}" height="24" rx="12" fill="#991B1B"/>
      <text x="930" y="${y}" text-anchor="end" class="value-small">${domain.count}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${REPORT_IMAGE_WIDTH}" height="${REPORT_IMAGE_HEIGHT}" viewBox="0 0 ${REPORT_IMAGE_WIDTH} ${REPORT_IMAGE_HEIGHT}">
    <title>Atualização Semanal do Portfólio de Inovação</title>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
      .eyebrow { font-size: 22px; font-weight: 700; letter-spacing: 3px; fill: #FECACA; }
      .title { font-size: 43px; font-weight: 700; fill: #FFFFFF; }
      .subtitle { font-size: 24px; fill: #FEE2E2; }
      .section { font-size: 22px; font-weight: 700; letter-spacing: 2px; fill: #7F1D1D; }
      .metric { font-size: 54px; font-weight: 700; fill: #111827; }
      .metric-label { font-size: 20px; fill: #6B7280; }
      .body { font-size: 27px; fill: #374151; }
      .label { font-size: 24px; fill: #374151; }
      .domain { font-size: 21px; fill: #374151; }
      .value-small { font-size: 24px; font-weight: 700; fill: #111827; }
      .footer { font-size: 20px; fill: #6B7280; }
    </style>
    <rect width="1024" height="1536" fill="#F5F5F5"/>
    <rect width="1024" height="260" fill="#8B0000"/>
    <text x="64" y="70" class="eyebrow">BEON LABS | CLARO BRASIL</text>
    <text x="64" y="132" class="title">Atualização Semanal do</text>
    <text x="64" y="184" class="title">Portfólio de Inovação</text>
    <text x="64" y="226" class="subtitle">${escapeXml(metrics.generatedOn)}</text>
    <rect x="64" y="306" width="896" height="268" rx="26" fill="#FFFFFF"/>
    <rect x="64" y="306" width="12" height="268" rx="6" fill="#B91C1C"/>
    <text x="112" y="360" class="section">DESTAQUES DA SEMANA</text>
    <text x="112" y="438" class="metric">${metrics.totalIniciativas}</text>
    <text x="112" y="474" class="metric-label">iniciativas</text>
    <text x="390" y="438" class="metric">${metrics.totalExperimentos}</text>
    <text x="390" y="474" class="metric-label">experimentos</text>
    <text x="650" y="430" class="metric">${escapeXml(formatMillions(metrics.beneficio))}</text>
    <text x="650" y="474" class="metric-label">potencial financeiro bruto</text>
    <text x="112" y="535" class="body">${metrics.totalIniciativas} iniciativas e ${metrics.totalExperimentos} experimentos no portfólio.</text>
    <rect x="64" y="620" width="896" height="380" rx="26" fill="#FFFFFF"/>
    <text x="112" y="682" class="section">FUNIL DE INOVAÇÃO</text>
    ${funnelRows}
    <rect x="64" y="1040" width="896" height="410" rx="26" fill="#FFFFFF"/>
    <text x="112" y="1094" class="section">TOP DOMÍNIOS</text>
    ${domainRows}
    <line x1="64" y1="1484" x2="960" y2="1484" stroke="#D1D5DB"/>
    <text x="64" y="1518" class="footer">beOn Labs | P&amp;D Claro Brasil</text>
    <text x="960" y="1518" text-anchor="end" class="footer">Relatório semanal</text>
  </svg>`
}
