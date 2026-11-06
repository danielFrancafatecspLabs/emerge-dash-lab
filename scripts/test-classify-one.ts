/**
 * Script standalone para testar a função classifyOne do portfolio-classifier
 * usando OpenAI via proxy LiteLLM.
 *
 * COMO USAR:
 *   1. Defina LLM_API_BASE e LLM_API_KEY no ambiente (ou no .env.local)
 *   2. Rode com tsx (sem precisar compilar):
 *         npx tsx scripts/test-classify-one.ts
 *
 *   Se não tiver o tsx instalado, instale primeiro:
 *         npm install -g tsx
 *         # ou: npx tsx scripts/test-classify-one.ts (já resolve automático)
 */

// ============================================================
// CONFIGURAÇÃO (do ambiente)
// ============================================================

// Endpoint e chave do proxy LiteLLM vêm do ambiente (as mesmas variáveis do app, veja .env.example). Nunca escreva a
// chave aqui: este arquivo vai para o Git.
const LLM_API_BASE = process.env.LLM_API_BASE ?? ''
const LLM_API_KEY = process.env.LLM_API_KEY ?? ''
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini'
if (!LLM_API_BASE || !LLM_API_KEY) {
  console.error('Defina LLM_API_BASE e LLM_API_KEY no ambiente (veja .env.example).')
  process.exit(1)
}

const EPIC_TEST = {
  key: 'TEST-001',
  summary: 'Titulo:Análise de chamadas CCOE Mesa de Cloud, Descrição: Realização de análise de CSAT e NPS sobre os áudios das manifestações em chamadas dos clientes empresariais. Beneficio: Receita Base clientes EBT',
  dominio: 'Empresarial',
}

// ============================================================
// CÓDIGO — NÃO PRECISA ALTERAR DAQUI PRA BAIXO
// ============================================================

import OpenAI from 'openai'
import https from 'https'
import http from 'http'

const VALID_METAS = ['EBITDA', 'NPS', 'Receita'] as const
type MetaCategoria = (typeof VALID_METAS)[number]

interface EpicClassifyInput {
  key: string
  summary: string
  dominio?: string | null
}

async function classifyOne(
  client: OpenAI,
  epic: EpicClassifyInput
): Promise<{ raw: string; result: MetaCategoria }> {
  const dominioCtx = epic.dominio ? ` (Domínio: ${epic.dominio})` : ''

  const res = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um classificador de experimentos de inovação da Claro Brasil.
Classifique o experimento em UMA das metas estratégicas com base no nome e domínio informados:
- EBITDA: eficiência operacional, redução de custo, automação, margem, produtividade, infraestrutura
- Receita: crescimento de vendas, novos produtos, faturamento, upsell, aquisição de clientes
- NPS: experiência do cliente, satisfação, atendimento, jornada, retenção, qualidade percebida
Responda SOMENTE com uma palavra: EBITDA, NPS ou Receita.`,
      },
      {
        role: 'user',
        content: `Experimento: "${epic.summary}"${dominioCtx}`,
      },
    ],
    max_tokens: 10,
    temperature: 0,
  })

  const raw = res.choices[0]?.message?.content?.trim() ?? ''
  const result =
    VALID_METAS.find(m => raw.toUpperCase().includes(m.toUpperCase())) ?? 'Receita'
  return { raw, result }
}

// --- MAIN ---

console.log('=== Teste classifyOne ===\n')
console.log(`Modelo:         ${LLM_MODEL}`)
console.log(`Endpoint:       ${LLM_API_BASE}`)
console.log('')
console.log('Input:')
console.log(`  Key:     ${EPIC_TEST.key}`)
console.log(`  Summary: "${EPIC_TEST.summary}"`)
console.log(`  Domínio: ${EPIC_TEST.dominio ?? '(nenhum)'}`)
console.log('')

const isHttps = LLM_API_BASE.startsWith('https')

const client = new OpenAI({
  baseURL: LLM_API_BASE,
  apiKey: LLM_API_KEY,
  httpAgent: isHttps
    ? new https.Agent({ rejectUnauthorized: false })
    : new http.Agent(),
})

classifyOne(client, EPIC_TEST)
  .then(({ raw, result }) => {
    console.log(`Resposta bruta da LLM: "${raw}"`)
    console.log(`Classificação final:   ${result}`)
  })
  .catch(err => {
    console.error('')
    console.error('=== ERRO ===')
    console.error('Mensagem:', err.message)
  })