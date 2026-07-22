import { NextRequest, NextResponse } from 'next/server'
import { getAzureOpenAIClient, DEPLOYMENT } from '@/lib/llm'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'

function buildContext(data: Awaited<ReturnType<typeof buildDashboardData>>): string {
  const pipe = data.pipeline
  const totalIniciativas = data.iniciativas.length
  const totalEpics = data.allEpics.length
  const emAndamento = data.allEpics.filter(e => e.status.name === 'Em andamento').length
  const beneficio = data.allEpics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
  const custo = data.allEpics.reduce((s, e) => s + (e.custoEstimado ?? 0), 0)

  const dominioCount: Record<string, number> = {}
  data.allEpics.forEach(e => { if (e.dominio) dominioCount[e.dominio] = (dominioCount[e.dominio] ?? 0) + 1 })
  const top5Dom = Object.entries(dominioCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const sponsorCount: Record<string, number> = {}
  data.iniciativas.forEach(i => { if (i.sponsor) sponsorCount[i.sponsor] = (sponsorCount[i.sponsor] ?? 0) + 1 })
  const top5Spon = Object.entries(sponsorCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return `
Você é o Cientista de Dados do BeOn Lab da Claro Brasil. Responda em português, de forma clara e concisa.

DADOS DO PORTFÓLIO (em tempo real do Jira):
- Total de Iniciativas: ${totalIniciativas}
- Total de Experimentos (Epics): ${totalEpics}
- Em andamento: ${emAndamento}
- Pipeline de Iniciativas:
  • Backlog: ${pipe['BACKLOG'] ?? 0}
  • Em Refinamento: ${pipe['EM REFINAMENTO'] ?? 0}
  • Pré-Piloto / Pronto para Execução: ${pipe['PRÉ PILOTO'] ?? (pipe['PRONTO PARA EXECUÇÃO'] ?? 0)}
  • Em Piloto: ${pipe['EM PILOTO'] ?? 0}
  • Em Experimentação: ${pipe['EM EXPERIMENTAÇÃO'] ?? 0}
  • Aguardando Piloto: ${pipe['AGUARDANDO PILOTO'] ?? 0}
  • Finalizado/Concluído: ${pipe['FINALIZADO'] ?? 0}
  • Cancelado: ${pipe['CANCELADO'] ?? 0}
- Benefício quantitativo total: R$ ${(beneficio / 1_000_000).toFixed(1)} MM
- Custo estimado total: R$ ${(custo / 1_000_000).toFixed(1)} MM
- Top 5 domínios: ${top5Dom.map(([d, n]) => `${d} (${n})`).join(', ')}
- Top 5 sponsors: ${top5Spon.map(([s, n]) => `${s} (${n})`).join(', ')}
`.trim()
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!process.env.AUTH_SECRET || token !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { question } = await request.json()
    if (!question?.trim()) return NextResponse.json({ error: 'Pergunta vazia' }, { status: 400 })

    const raw = await fetchDashboardRaw()
    const [cls, seg] = await Promise.all([
      classifyPortfolios(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_16400?.value ?? null }))),
      classifySegmentos(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_11661 ?? null }))),
    ])
    const data = buildDashboardData(raw.iniciativas, raw.epics, cls, seg, raw.board2706Config)

    const client = getAzureOpenAIClient()
    const completion = await client.chat.completions.create({
      model: DEPLOYMENT,
      messages: [
        { role: 'system', content: buildContext(data) },
        { role: 'user', content: question },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    const answer = completion.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta.'
    return NextResponse.json({ answer })
  } catch (e) {
    console.error('LLM error:', e)
    return NextResponse.json({ error: 'Erro ao consultar IA' }, { status: 500 })
  }
}
