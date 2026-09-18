import fs from 'fs'
import path from 'path'
import { getLiteLLMClient, DEPLOYMENT_LLM } from './llm'

export type MetaCategoria = 'EBITDA' | 'NPS' | 'Receita'
const VALID_METAS: MetaCategoria[] = ['EBITDA', 'NPS', 'Receita']
const CACHE_FILE = path.resolve(process.cwd(), '.portfolio-cache.json')

export interface EpicClassifyInput {
  key: string
  summary: string
  dominio?: string | null
}

function loadCache(): Record<string, MetaCategoria> {
  try {
    if (fs.existsSync(CACHE_FILE))
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
  } catch {}
  return {}
}

function saveCache(cache: Record<string, MetaCategoria>): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.error('[portfolio-classifier] Falha ao salvar cache:', e)
  }
}

async function classifyOne(
  client: ReturnType<typeof getLiteLLMClient>,
  epic: EpicClassifyInput
): Promise<MetaCategoria> {
  const dominioCtx = epic.dominio ? ` (Domínio: ${epic.dominio})` : ''
  const res = await client.chat.completions.create({
    model: DEPLOYMENT_LLM,
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
  return VALID_METAS.find(m => raw.toUpperCase().includes(m.toUpperCase())) ?? 'Receita'
}

/**
 * Classifica múltiplos epics em uma ÚNICA chamada de LLM (batch).
 * O prompt envia todos os experimentos de uma vez e pede um JSON de resposta.
 * Muito mais rápido que chamar classifyOne N vezes (~5s vs ~10min para 200 epics).
 */
async function classifyBatch(
  client: ReturnType<typeof getLiteLLMClient>,
  epics: EpicClassifyInput[]
): Promise<Record<string, MetaCategoria>> {
  // Monta a lista numerada de experimentos para o prompt
  const linhas = epics.map((e, i) => {
    const dom = e.dominio ? ` (Domínio: ${e.dominio})` : ''
    return `${i + 1}. [${e.key}] "${e.summary}"${dom}`
  }).join('\n')

  const res = await client.chat.completions.create({
    model: DEPLOYMENT_LLM,
    messages: [
      {
        role: 'system',
        content: `Classifique experimentos em EBITDA, NPS ou Receita.

- EBITDA: eficiência, custo, automação, margem, produtividade, infraestrutura
- Receita: vendas, novos produtos, faturamento, upsell, aquisição
- NPS: experiência do cliente, satisfação, atendimento, jornada, retenção, qualidade

Responda APENAS JSON: {"CHAVE": "CATEGORIA", ...}. Sem markdown.`,
      },
      {
        role: 'user',
        content: `Classifique:\n\n${linhas}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0,
    response_format: { type: 'json_object' } as any,
  })

  const raw = res.choices[0]?.message?.content?.trim() ?? '{}'

  // Parse do JSON retornado
  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.warn('[portfolio-classifier] Resposta batch não é JSON válido, tentando extrair...')
    // Tenta extrair JSON de dentro de markdown ```json ... ```
    const match = raw.match(/```(?:json)?\s*({[\s\S]*?})\s*```/)
    if (match) {
      try { parsed = JSON.parse(match[1]) } catch {}
    }
  }

  // Valida e normaliza cada classificação
  const resultado: Record<string, MetaCategoria> = {}
  for (const epic of epics) {
    const rawMeta = (parsed[epic.key] ?? '').toString().trim().toUpperCase()
    const valida = VALID_METAS.find(m => rawMeta.includes(m.toUpperCase()))
    resultado[epic.key] = valida ?? 'Receita'
    if (!valida) {
      console.warn(`[portfolio-classifier] Classificação inválida para ${epic.key}: "${parsed[epic.key]}", fallback "Receita"`)
    }
  }
  return resultado
}

/**
 * Classifica epics em EBITDA / NPS / Receita usando summary + domínio.
 * Cache por epic.key em .portfolio-cache.json — só chama a IA para epics novos.
 * Retorna Record<epicKey, MetaCategoria>.
 */
export async function classifyPortfolios(
  epics: EpicClassifyInput[]
): Promise<Record<string, MetaCategoria>> {
  const cache = loadCache()
  const novos = epics.filter(e => !(e.key in cache))

  if (novos.length === 0) return cache

  console.log(`[portfolio-classifier] Classificando ${novos.length} epic(s) novo(s) via LLM (batch)...`)

  let client: ReturnType<typeof getLiteLLMClient>
  try {
    client = getLiteLLMClient()
  } catch (e) {
    console.error('[portfolio-classifier] LLM indisponível, usando fallback "Receita":', e)
    for (const epic of novos) cache[epic.key] = 'Receita'
    saveCache(cache)
    return cache
  }

  // Tenta classificação em batch (única chamada LLM para todos)
  try {
    const batchResult = await classifyBatch(client, novos)
    for (const epic of novos) {
      cache[epic.key] = batchResult[epic.key] ?? 'Receita'
    }
    console.log(`[portfolio-classifier] Batch concluído: ${Object.keys(batchResult).length} classificado(s)`)
    saveCache(cache)
    return cache
  } catch (e) {
    console.warn('[portfolio-classifier] Batch falhou, caindo para classificação individual:', e)
  }

  // Fallback: classificação individual sequencial
  for (const epic of novos) {
    try {
      cache[epic.key] = await classifyOne(client, epic)
      console.log(`  "${epic.summary}" → ${cache[epic.key]}`)
    } catch (e) {
      console.error(`[portfolio-classifier] Erro em "${epic.key}":`, e)
      cache[epic.key] = 'Receita'
    }
  }

  saveCache(cache)
  return cache
}
