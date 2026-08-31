import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { formatReportImageDate, type ReportImageMetrics } from '@/lib/report-image'
import { renderReportInfographicPng } from '@/lib/report-image-renderer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(
      raw.iniciativas,
      raw.epics,
      {},
      {},
      raw.board2734Config,
    )
    const dominioCount: Record<string, number> = {}

    for (const epic of data.allEpics) {
      if (epic.dominio) {
        dominioCount[epic.dominio] = (dominioCount[epic.dominio] ?? 0) + 1
      }
    }

    const metrics: ReportImageMetrics = {
      generatedOn: formatReportImageDate(new Date()),
      totalIniciativas: data.iniciativas.length,
      totalExperimentos: data.allEpics.length,
      emAndamento: data.allEpics.filter(epic => epic.status.name === 'Em andamento').length,
      emPiloto: data.allEpics.filter(epic => ['EM PILOTO', 'Em andamento'].includes(epic.status.name)).length,
      concluidos: data.allEpics.filter(epic => ['Concluído', 'FINALIZADO'].includes(epic.status.name)).length,
      beneficio: data.allEpics.reduce((total, epic) => total + (epic.beneficioQuantitativo ?? 0), 0),
      topDominios: Object.entries(dominioCount)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    }
    const png = await renderReportInfographicPng(metrics)

    return NextResponse.json({ image: png.toString('base64'), format: 'png' })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 })
  }
}
