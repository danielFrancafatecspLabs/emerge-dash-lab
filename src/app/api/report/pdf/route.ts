import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import ReportPDF from '@/components/report/ReportPDF'

export const dynamic = 'force-dynamic'

const PRIORITY_ORDER: Record<string, number> = {
  'Highest': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Lowest': 4,
}

export async function GET() {
  try {
    // 1. Fetch data (same logic as report page)
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_30014 ?? null,
    }))
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])
    const data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2734Config)

    // 2. Compute derived data
    const emAndamento = data.allEpics
      .filter(e => e.status.name === 'Em andamento')
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.prioridade ?? ''] ?? 99
        const pb = PRIORITY_ORDER[b.prioridade ?? ''] ?? 99
        return pa - pb
      })

    // ── Funil de Inovação ──
    // Em Andamento: Experimentos (Epics do board 2735) com status "Em andamento"
    // Em Piloto: Iniciativas (board 2734) na coluna "EM PILOTO"
    // Concluídos: Experimentos (Epics do board 2735) com status "Concluído"
    // Em Escala: Iniciativas (board 2734) na coluna "EM ESCALA"
    const emAndamentoCount = data.allEpics.filter(e => e.status.id === '3').length
    const emPilotoCount = data.pipeline['EM PILOTO']
    const concluidosCount = data.allEpics.filter(e => e.status.id === '10019').length
    const emEscalaCount = data.pipeline['EM ESCALA']

    const funilStages = [
      { label: 'Em Andamento', value: emAndamentoCount, color: '#3B82F6' },
      { label: 'Em Piloto', value: emPilotoCount, color: '#EF4444' },
      { label: 'Concluídos', value: concluidosCount, color: '#134E4A' },
      { label: 'Em Escala', value: emEscalaCount, color: '#22C55E' },
    ]
    const funilMax = Math.max(...funilStages.map(s => s.value), 1)

    // Domínios
    const dominioData = new Map<string, {
      iniciativas: typeof data.iniciativas
      epics: typeof data.allEpics
      totalIniciativas: number
      emAndamento: number
      emPiloto: number
      concluidos: number
      beneficioTotal: number
    }>()
    for (const ini of data.iniciativas) {
      const dominios = ini.dominios.length > 0 ? ini.dominios : ['Sem domínio']
      for (const d of dominios) {
        const dominioNome = d.trim()
        if (!dominioNome || dominioNome.toLowerCase() === 'sem domínio') continue
        if (!dominioData.has(dominioNome)) {
          dominioData.set(dominioNome, { iniciativas: [], epics: [], totalIniciativas: 0, emAndamento: 0, emPiloto: 0, concluidos: 0, beneficioTotal: 0 })
        }
        const s = dominioData.get(dominioNome)!
        if (!s.iniciativas.some(x => x.key === ini.key)) {
          s.iniciativas.push(ini)
          s.totalIniciativas++
        }
        for (const epic of ini.epics) {
          if (!s.epics.some(x => x.key === epic.key)) {
            s.epics.push(epic)
            s.beneficioTotal += epic.beneficioQuantitativo ?? 0
            const statusName = epic.status?.name ?? ''
            if (statusName === 'Em andamento') s.emAndamento++
            if (statusName === 'EM PILOTO' || statusName === 'Em Piloto') s.emPiloto++
            if (statusName === 'Concluído' || statusName === 'FINALIZADO') s.concluidos++
          }
        }
      }
    }
    if (!dominioData.has('Operações Técnicas')) {
      dominioData.set('Operações Técnicas', { iniciativas: [], epics: [], totalIniciativas: 0, emAndamento: 0, emPiloto: 0, concluidos: 0, beneficioTotal: 0 })
    }
    const top5Dominios = [...dominioData.entries()]
      .sort((a, b) => b[1].totalIniciativas - a[1].totalIniciativas)
      .slice(0, 7)
      .map(([nome, stats]) => ({
        nome,
        total: stats.totalIniciativas,
        emAndamento: stats.emAndamento,
        emPiloto: stats.emPiloto,
        concluidos: stats.concluidos,
        beneficioTotal: stats.beneficioTotal,
        epics: stats.epics,
        topEpics: [...stats.epics]
          .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
          .slice(0, 3),
      }))

    const dominiosComAtividade = top5Dominios.filter(d => d.emAndamento + d.emPiloto > 0)

    const totalIniciativas = data.iniciativas.length
    const qtdExperimentos = data.allEpics.length
    const pilotoOuEscalaIds = new Set([...data.pilotoStatusIds, ...data.escalaStatusIds])
    const iniciativasEmPilotoOuEscala = data.iniciativas.filter(ini => pilotoOuEscalaIds.has(ini.status.id))
    const conversao = totalIniciativas > 0
      ? `${Math.round((iniciativasEmPilotoOuEscala.length / totalIniciativas) * 100)}%`
      : '0%'
    const beneficioPotencial = data.allEpics.reduce((sum, e) => sum + (e.beneficioQuantitativo ?? 0), 0)

    const dataHora = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // 3. Render PDF to stream
    const stream = await renderToStream(
      React.createElement(ReportPDF, {
        dataHora,
        totalIniciativas,
        qtdExperimentos,
        conversao,
        beneficioPotencial,
        funilStages,
        funilMax,
        top5Dominios,
        emAndamento,
        dominiosComAtividade,
      })
    )

    // 4. Return as downloadable PDF
    const chunks: Buffer[] = []
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(chunk)
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-beon-lab-${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (e) {
    console.error('PDF generation error:', e)
    return NextResponse.json({ error: 'Falha ao gerar PDF', details: String(e) }, { status: 500 })
  }
}