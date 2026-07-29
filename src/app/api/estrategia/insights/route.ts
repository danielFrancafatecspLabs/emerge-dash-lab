import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { getAzureOpenAIClient, DEPLOYMENT } from '@/lib/llm'

export const dynamic = 'force-dynamic'

interface GraficoContext {
  id: string
  titulo: string
  descricao: string
  dados: Record<string, unknown>
}

function buildPrompt(graficos: GraficoContext[]): string {
  const blocos = graficos.map(g => {
    return `## Gráfico: ID="${g.id}" — ${g.titulo}
${g.descricao}

Dados:
\`\`\`json
${JSON.stringify(g.dados, null, 2)}
\`\`\``
  }).join('\n\n---\n\n')

  return `
# PERSONA
Você é o **Cientista BeOn Labs**, analista de dados sênior do portfólio de inovação da Claro Brasil.
Seu papel é gerar insights executivos concisos para cada gráfico do dashboard de estratégia.

# REGRAS
1. **Responda em português**, tom profissional e direto.
2. **Use APENAS os dados fornecidos**. NUNCA invente números.
3. Para cada gráfico, gere **2 a 3 frases curtas** (máximo 250 caracteres por insight).
4. **Identifique outliers**: valores muito acima ou abaixo da média, tendências anômalas, concentrações suspeitas.
5. **Explique o porquê**: não apenas descreva o número, interprete a causa provável.
6. **Seja acionável**: quando relevante, sugira uma ação.
7. Use **emoji no início** para indicar o tom: 📈 (positivo/tendência boa), ⚠️ (alerta/atenção), 📊 (neutro/informativo).

# FORMATO DE RESPOSTA (JSON)
Retorne APENAS um JSON array, sem texto adicional. Cada elemento:
{
  "id": "<USE O id EXATO do gráfico, NÃO o título>",
  "tipo": "positivo" | "neutro" | "alerta",
  "texto": "<insight conciso, máx 250 caracteres>"
}

IMPORTANTE: O campo "id" deve ser EXATAMENTE o id fornecido em cada gráfico (ex: "resumo", "portfolio", "funil", "top5", "burnup", "leadtime"). NÃO use o título, use o id.

# GRÁFICOS PARA ANALISAR

${blocos}
`.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { graficos } = await request.json() as { graficos: GraficoContext[] }
    if (!graficos?.length) {
      return NextResponse.json({ insights: [] })
    }

    const prompt = buildPrompt(graficos)

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Gere os insights para cada gráfico no formato JSON especificado.' },
    ]

    const client = getAzureOpenAIClient()
    const completion = await client.chat.completions.create({
      model: DEPLOYMENT,
      messages,
      max_tokens: 1500,
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'

    // Tenta extrair JSON da resposta (pode vir com markdown)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw
    const insights = JSON.parse(jsonStr)

    return NextResponse.json({ insights })
  } catch (e) {
    console.error('Insights LLM error:', e)
    return NextResponse.json({ error: 'Erro ao gerar insights', insights: [] }, { status: 500 })
  }
}