import { NextRequest, NextResponse } from 'next/server'
import { getAzureOpenAIClient } from '@/lib/llm'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const raw = await fetchDashboardRaw()
    const [cls, seg] = await Promise.all([
      classifyPortfolios(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_16400?.value ?? null }))),
      classifySegmentos(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_11661 ?? null }))),
    ])
    const data = buildDashboardData(raw.iniciativas, raw.epics, cls, seg, raw.board2706Config)

    const totalIniciativas = data.iniciativas.length
    const totalEpics = data.allEpics.length
    const emAndamento = data.allEpics.filter(e => e.status.name === 'Em andamento').length
    const concluidos = data.allEpics.filter(e => ['Concluído', 'FINALIZADO'].includes(e.status.name)).length
    const emPiloto = data.allEpics.filter(e => ['EM PILOTO', 'Em andamento'].includes(e.status.name)).length
    const beneficio = data.allEpics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)

    const dominioCount: Record<string, number> = {}
    data.allEpics.forEach(e => { if (e.dominio) dominioCount[e.dominio] = (dominioCount[e.dominio] ?? 0) + 1 })
    const top5Dom = Object.entries(dominioCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const semana = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const prompt = `Create a professional weekly report infographic for "BeOn Lab" innovation portfolio of Claro Brasil telecom company. Style: corporate, clean, modern. Colors: deep red (#8B0000) header, white body, gray accents. Layout (portrait, like a newsletter):

HEADER: Bold red background. Logo area "BeOn Lab | Claro Brasil". Title "Atualização Semanal do Portfólio de Inovação" and date "${semana}".

SECTION 1 - DESTAQUES DA SEMANA (white card with red left border):
"O portfólio conta com ${totalIniciativas} iniciativas ativas e ${totalEpics} experimentos, com potencial financeiro bruto de R$ ${(beneficio / 1_000_000).toFixed(1)} MM."

SECTION 2 - FUNIL DE INOVAÇÃO (3 funnel stages with red tones):
- Experimentos em andamento: ${emAndamento}
- Em Piloto: ${emPiloto}
- Concluídos: ${concluidos}

SECTION 3 - TOP DOMÍNIOS (horizontal bar chart in red):
${top5Dom.map(([d, n]) => `${d}: ${n}`).join(', ')}

FOOTER: "BeOn Lab | P&D Claro Brasil" in small text.

Make it look like a polished corporate newsletter/infographic with good typography and visual hierarchy. No Lorem ipsum.`

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_IMAGE ?? 'gpt-image-2'
    const client = getAzureOpenAIClient()

    const response = await client.images.generate({
      model: deployment,
      prompt,
      size: '1024x1536',
    })

    const item = response.data?.[0]
    let b64 = item?.b64_json ?? null

    // gpt-image-1/2 retorna URL em vez de b64_json — buscar e converter
    if (!b64 && item?.url) {
      const imgRes = await fetch(item.url)
      const buf = await imgRes.arrayBuffer()
      b64 = Buffer.from(buf).toString('base64')
    }

    if (!b64) return NextResponse.json({ error: 'Imagem não gerada' }, { status: 500 })

    return NextResponse.json({ image: b64, format: 'png' })
  } catch (e) {
    console.error('Image generation error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
