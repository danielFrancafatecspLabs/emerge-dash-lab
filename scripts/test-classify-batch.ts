/**
 * Script standalone para testar a classificação batch (classifyBatch)
 * de múltiplos experimentos em uma única chamada LLM.
 *
 * COMO USAR:
 *   npx tsx scripts/test-classify-batch.ts
 */

import OpenAI from 'openai'
import https from 'https'
import http from 'http'

const LLM_API_BASE = 'https://4.228.49.1:3010/v1'
const LLM_API_KEY = 'sk-g7dV7NmTYRGorcrsMb0Hdw'
const LLM_MODEL = 'gpt-4o-mini'

const VALID_METAS = ['EBITDA', 'NPS', 'Receita'] as const
type MetaCategoria = (typeof VALID_METAS)[number]

interface EpicClassifyInput {
  key: string
  summary: string
  dominio?: string | null
}

// ── Amostra de 10 experimentos reais (extraídos do board 2735) ──
const EPICS_TEST: EpicClassifyInput[] = [
  { key: 'GL-510', summary: 'Evolução da Clarinha — Ciclo 2', dominio: 'Digital' },
  { key: 'GL-275', summary: 'Livia', dominio: 'Digital' },
  { key: 'GL-254', summary: 'Análise de chamadas CCOE Mesa de Cloud', dominio: 'Empresarial' },
  { key: 'GL-533', summary: 'Automação de provisionamento de rede óptica', dominio: 'Rede' },
  { key: 'GL-636', summary: 'Chatbot de atendimento para clientes PME', dominio: 'PME' },
  { key: 'GL-124', summary: 'Plataforma de upselling para clientes pós-pago', dominio: 'Vendas' },
  { key: 'GL-8', summary: 'Otimização de roteamento de chamadas no call center', dominio: 'Atendimento' },
  { key: 'GL-590', summary: 'Dashboard de NPS em tempo real', dominio: 'Digital' },
  { key: 'GL-241', summary: 'Redução de churn com ofertas personalizadas via WhatsApp', dominio: 'Comercial' },
  { key: 'GL-197', summary: 'Automação de testes de qualidade em rede 5G', dominio: 'TI' },
]

// ── classifyBatch (cópia inline para teste independente) ──
async function classifyBatch(
  client: OpenAI,
  epics: EpicClassifyInput[]
): Promise<Record<string, MetaCategoria>> {
  const linhas = epics.map((e, i) => {
    const dom = e.dominio ? ` (Domínio: ${e.dominio})` : ''
    return `${i + 1}. [${e.key}] "${e.summary}"${dom}`
  }).join('\n')

  const res = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um classificador de experimentos de inovação da Claro Brasil.
Classifique CADA experimento abaixo em UMA das metas estratégicas:
- EBITDA: eficiência operacional, redução de custo, automação, margem, produtividade, infraestrutura
- Receita: crescimento de vendas, novos produtos, faturamento, upsell, aquisição de clientes
- NPS: experiência do cliente, satisfação, atendimento, jornada, retenção, qualidade percebida

Responda SOMENTE com um objeto JSON válido, sem markdown, sem explicações.
O formato deve ser: {"CHAVE_DO_EPIC": "CATEGORIA", ...}
Exemplo: {"GL-123": "EBITDA", "GL-456": "NPS", "GL-789": "Receita"}`,
      },
      {
        role: 'user',
        content: `Classifique os seguintes experimentos:\n\n${linhas}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0,
  })

  const raw = res.choices[0]?.message?.content?.trim() ?? '{}'
  console.log('\nResposta bruta da LLM:\n', raw.slice(0, 500), '\n')

  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/```(?:json)?\s*({[\s\S]*?})\s*```/)
    if (match) {
      try { parsed = JSON.parse(match[1]) } catch {}
    }
  }

  const resultado: Record<string, MetaCategoria> = {}
  for (const epic of epics) {
    const rawMeta = (parsed[epic.key] ?? '').toString().trim().toUpperCase()
    const valida = VALID_METAS.find(m => rawMeta.includes(m.toUpperCase()))
    resultado[epic.key] = valida ?? 'Receita'
  }
  return resultado
}

// ── MAIN ──
async function main() {
  console.log('=== Teste classifyBatch ===')
  console.log(`Modelo:  ${LLM_MODEL}`)
  console.log(`Epics:   ${EPICS_TEST.length} experimentos`)
  console.log('')

  const isHttps = LLM_API_BASE.startsWith('https')
  const client = new OpenAI({
    baseURL: LLM_API_BASE,
    apiKey: LLM_API_KEY,
    httpAgent: isHttps
      ? new https.Agent({ rejectUnauthorized: false })
      : new http.Agent(),
  })

  console.time('batch')
  const resultado = await classifyBatch(client, EPICS_TEST)
  console.timeEnd('batch')

  console.log('\n=== Resultados ===')
  for (const epic of EPICS_TEST) {
    console.log(`  ${epic.key.padEnd(8)} → ${resultado[epic.key]?.padEnd(10)}  "${epic.summary.slice(0, 60)}"`)
  }

  // Validação
  const categorias = Object.values(resultado)
  const countEbitda = categorias.filter(c => c === 'EBITDA').length
  const countNps = categorias.filter(c => c === 'NPS').length
  const countReceita = categorias.filter(c => c === 'Receita').length
  const total = categorias.length

  console.log(`\n=== Distribuição ===`)
  console.log(`  EBITDA: ${countEbitda} (${Math.round(countEbitda / total * 100)}%)`)
  console.log(`  NPS:    ${countNps} (${Math.round(countNps / total * 100)}%)`)
  console.log(`  Receita: ${countReceita} (${Math.round(countReceita / total * 100)}%)`)
  console.log(`  Total:  ${total}`)
}

main().catch(err => {
  console.error('\n=== ERRO ===')
  console.error('Mensagem:', err.message)
})