/**
 * Script standalone para testar a função classifyOne do portfolio-classifier
 * usando OpenAI via proxy LiteLLM.
 *
 * COMO USAR:
 *   1. Edite as variáveis no bloco CONFIGURAÇÃO abaixo
 *   2. Rode com tsx (sem precisar compilar):
 *         npx tsx scripts/test-classify-one.ts
 *
 *   Se não tiver o tsx instalado, instale primeiro:
 *         npm install -g tsx
 *         # ou: npx tsx scripts/test-classify-one.ts (já resolve automático)
 */

// ============================================================
// CONFIGURAÇÃO — PREENCHA AQUI
// ============================================================

// Endpoint do proxy LiteLLM (ex: http://localhost:4000/v1 ou https://ip:porta/v1)
const LLM_API_BASE = 'https://4.228.49.1:3010/v1'
const LLM_API_KEY = 'sk-g7dV7NmTYRGorcrsMb0Hdw'
const LLM_MODEL = 'gpt-4o-mini'

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