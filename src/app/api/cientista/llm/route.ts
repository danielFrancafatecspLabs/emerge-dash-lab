import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
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

  // Top 10 experimentos por benefício (com detalhes)
  const top10Beneficio = [...data.allEpics]
    .filter(e => (e.beneficioQuantitativo ?? 0) > 0)
    .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
    .slice(0, 10)

  // Top 10 experimentos por custo
  const top10Custo = [...data.allEpics]
    .filter(e => (e.custoEstimado ?? 0) > 0)
    .sort((a, b) => (b.custoEstimado ?? 0) - (a.custoEstimado ?? 0))
    .slice(0, 10)

  // Agrupamento por domínio (completo)
  const dominioCount: Record<string, { qtd: number; beneficio: number; custo: number }> = {}
  data.allEpics.forEach(e => {
    const d = e.dominio ?? 'Não classificado'
    if (!dominioCount[d]) dominioCount[d] = { qtd: 0, beneficio: 0, custo: 0 }
    dominioCount[d].qtd++
    dominioCount[d].beneficio += e.beneficioQuantitativo ?? 0
    dominioCount[d].custo += e.custoEstimado ?? 0
  })

  // Agrupamento por status
  const statusCount: Record<string, number> = {}
  data.allEpics.forEach(e => {
    const s = e.status.name
    statusCount[s] = (statusCount[s] ?? 0) + 1
  })

  // Agrupamento por time responsável (Lab)
  const labCount: Record<string, number> = {}
  data.allEpics.forEach(e => {
    const l = e.timeResponsavel ?? 'Não definido'
    labCount[l] = (labCount[l] ?? 0) + 1
  })

  // Agrupamento por complexidade
  const complexidadeCount: Record<string, number> = {}
  data.allEpics.forEach(e => {
    const c = e.complexidade ?? 'Não definida'
    complexidadeCount[c] = (complexidadeCount[c] ?? 0) + 1
  })

  // Iniciativas com mais experimentos
  const topIniciativas = [...data.iniciativas]
    .sort((a, b) => b.epics.length - a.epics.length)
    .slice(0, 10)

  // Experimentos bloqueados
  const bloqueados = data.allEpics.filter(e => e.motivoBloqueio).map(e => ({
    nome: e.nome,
    motivo: e.motivoBloqueio,
    status: e.status.name,
    dominio: e.dominio,
  }))

  // ROIs (benefício / custo)
  const comROI = data.allEpics
    .filter(e => (e.beneficioQuantitativo ?? 0) > 0 && (e.custoEstimado ?? 0) > 0)
    .map(e => ({
      nome: e.nome,
      key: e.key,
      beneficio: e.beneficioQuantitativo ?? 0,
      custo: e.custoEstimado ?? 0,
      roi: ((e.beneficioQuantitativo ?? 0) / (e.custoEstimado ?? 1)).toFixed(1),
      dominio: e.dominio,
      status: e.status.name,
    }))
    .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
    .slice(0, 10)

  // Últimos experimentos criados
  const ultimosCriados = [...data.allEpics]
    .filter(e => e.criadoEm)
    .sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? ''))
    .slice(0, 5)

  const top5Dom = Object.entries(dominioCount)
    .sort((a, b) => b[1].qtd - a[1].qtd)
    .slice(0, 10)

  const sponsorCount: Record<string, number> = {}
  data.iniciativas.forEach(i => { if (i.sponsor) sponsorCount[i.sponsor] = (sponsorCount[i.sponsor] ?? 0) + 1 })
  const topSpon = Object.entries(sponsorCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Monta o contexto rico
  const ctx = `
# PERSONA
Você é o **Cientista BeOn Labs**, um analista de dados sênior especializado no portfólio de inovação da Claro Brasil.
Seu papel é ajudar líderes e times a entender os dados dos experimentos, identificar padrões, riscos e oportunidades.

# REGRAS DE OURO
1. **Sempre responda em português**, com tom profissional mas acessível.
2. **Use os dados fornecidos abaixo** como fonte única da verdade. NUNCA invente números.
3. **Seja analítico**: não apenas descreva os números, interprete-os. Destaque tendências, anomalias, riscos.
4. **Quando relevante, compare**: "O domínio X tem 3x mais experimentos que Y, mas o benefício médio de Y é maior..."
5. **Se a pergunta for vaga**, peça esclarecimento educadamente.
6. **Use formatação Markdown** para estruturar respostas: **negrito** para destaque, listas para enumerações, títulos (###) para seções.
7. **Seja conciso mas completo**. Prefira 3-5 parágrafos bem estruturados a um textão.
8. **Quando perguntarem sobre um experimento específico**, procure nos dados e dê todos os detalhes disponíveis.
9. **Sugira ações**: ao identificar um problema, sugira o que pode ser feito.
10. **Use emojis com moderação** para dar tom amigável (📊 para dados, ⚠️ para alertas, ✅ para pontos positivos).

# DADOS DO PORTFÓLIO (tempo real do Jira)

## 📈 VISÃO GERAL
- Total de Iniciativas: **${totalIniciativas}**
- Total de Experimentos (Epics): **${totalEpics}**
- Experimentos em andamento: **${emAndamento}**
- Benefício quantitativo total: **R$ ${(beneficio / 1_000_000).toFixed(1)} MM**
- Custo estimado total: **R$ ${(custo / 1_000_000).toFixed(1)} MM**
- ROI médio do portfólio: **${custo > 0 ? (beneficio / custo).toFixed(1) : 'N/A'}x**

## 🔄 PIPELINE DE INICIATIVAS
| Estágio | Quantidade |
|---------|-----------|
| Backlog | ${pipe['BACKLOG'] ?? 0} |
| Em Refinamento | ${pipe['EM REFINAMENTO'] ?? 0} |
| Pronto para Execução | ${pipe['PRONTO PARA EXECUÇÃO'] ?? 0} |
| Aguardando Piloto | ${pipe['AGUARDANDO PILOTO'] ?? 0} |
| Em Experimentação | ${pipe['EM EXPERIMENTAÇÃO'] ?? 0} |
| Em Piloto | ${pipe['EM PILOTO'] ?? 0} |
| Finalizado/Concluído | ${pipe['FINALIZADO'] ?? 0} |
| Cancelado | ${pipe['CANCELADO'] ?? 0} |

## 📊 STATUS DOS EXPERIMENTOS
${Object.entries(statusCount).map(([s, n]) => `- ${s}: ${n}`).join('\n')}

## 🏆 TOP 10 EXPERIMENTOS POR BENEFÍCIO (R$)
${top10Beneficio.map((e, i) => `${i + 1}. **${e.nome}** (${e.key}) — R$ ${((e.beneficioQuantitativo ?? 0) / 1_000_000).toFixed(2)} MM | Domínio: ${e.dominio ?? 'N/A'} | Status: ${e.status.name} | Time: ${e.timeResponsavel ?? 'N/A'}`).join('\n')}

## 💰 TOP 10 EXPERIMENTOS POR CUSTO (R$)
${top10Custo.map((e, i) => `${i + 1}. **${e.nome}** (${e.key}) — R$ ${((e.custoEstimado ?? 0) / 1_000_000).toFixed(2)} MM | Domínio: ${e.dominio ?? 'N/A'} | Status: ${e.status.name}`).join('\n')}

## 📈 TOP 10 MELHORES ROIs (Benefício/Custo)
${comROI.map((e, i) => `${i + 1}. **${e.nome}** (${e.key}) — ROI: ${e.roi}x | Benef: R$ ${(e.beneficio / 1_000_000).toFixed(2)} MM | Custo: R$ ${(e.custo / 1_000_000).toFixed(2)} MM | ${e.dominio ?? 'N/A'} | ${e.status}`).join('\n')}

## 🏗️ DOMÍNIOS (completo)
${top5Dom.map(([d, v]) => `- **${d}**: ${v.qtd} experimentos | Benefício: R$ ${(v.beneficio / 1_000_000).toFixed(1)} MM | Custo: R$ ${(v.custo / 1_000_000).toFixed(1)} MM`).join('\n')}

## 🧪 TIMES RESPONSÁVEIS (Labs)
${Object.entries(labCount).sort((a, b) => b[1] - a[1]).map(([l, n]) => `- ${l}: ${n} experimentos`).join('\n')}

## 🎯 COMPLEXIDADE
${Object.entries(complexidadeCount).map(([c, n]) => `- ${c}: ${n} experimentos`).join('\n')}

## 👥 TOP SPONSORS
${topSpon.map(([s, n]) => `- ${s}: ${n} iniciativas`).join('\n')}

## 🔗 TOP INICIATIVAS (mais experimentos vinculados)
${topIniciativas.map((i, idx) => `- **${i.nome}** (${i.key}): ${i.epics.length} experimentos | Status: ${i.status.name}`).join('\n')}

## ⚠️ EXPERIMENTOS BLOQUEADOS (${bloqueados.length} total)
${bloqueados.slice(0, 15).map(b => `- **${b.nome}**: "${b.motivo}" | Status: ${b.status} | Domínio: ${b.dominio ?? 'N/A'}`).join('\n')}
${bloqueados.length > 15 ? `... e mais ${bloqueados.length - 15} bloqueados.` : ''}

## 🆕 ÚLTIMOS EXPERIMENTOS CRIADOS
${ultimosCriados.map((e, i) => `${i + 1}. **${e.nome}** (${e.key}) — Criado: ${e.criadoEm?.split('T')[0] ?? 'N/A'} | Domínio: ${e.dominio ?? 'N/A'} | Status: ${e.status.name}`).join('\n')}
`.trim()

  return ctx
}

export async function POST(request: NextRequest) {
  try {
    const { question, history } = await request.json() as {
      question: string
      history?: { role: 'user' | 'assistant'; content: string }[]
    }
    if (!question?.trim()) return NextResponse.json({ error: 'Pergunta vazia' }, { status: 400 })

    const raw = await fetchDashboardRaw()
    const [cls, seg] = await Promise.all([
      classifyPortfolios(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_16400?.value ?? null }))),
      classifySegmentos(raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_11661 ?? null }))),
    ])
    const data = buildDashboardData(raw.iniciativas, raw.epics, cls, seg, raw.board2706Config)

    const systemPrompt = buildContext(data)

    // Monta mensagens com histórico (últimas 10 interações para não estourar contexto)
    const recentHistory = (history ?? []).slice(-20) // 10 pares user/assistant
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: question },
    ]

    const client = getAzureOpenAIClient()
    const completion = await client.chat.completions.create({
      model: DEPLOYMENT,
      messages,
      max_tokens: 1200,
      temperature: 0.5,
    })

    const answer = completion.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta.'
    return NextResponse.json({ answer })
  } catch (e) {
    console.error('LLM error:', e)
    return NextResponse.json({ error: 'Erro ao consultar IA' }, { status: 500 })
  }
}
