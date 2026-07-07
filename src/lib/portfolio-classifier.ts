import fs from 'fs'
import path from 'path'
import { getAzureOpenAIClient, DEPLOYMENT } from './llm'

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
  client: ReturnType<typeof getAzureOpenAIClient>,
  epic: EpicClassifyInput
): Promise<MetaCategoria> {
  const dominioCtx = epic.dominio ? ` (Domínio: ${epic.dominio})` : ''
  const res = await client.chat.completions.create({
    model: DEPLOYMENT,
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

  console.log(`[portfolio-classifier] Classificando ${novos.length} epic(s) novo(s) via LLM...`)

  let client: ReturnType<typeof getAzureOpenAIClient>
  try {
    client = getAzureOpenAIClient()
  } catch (e) {
    console.error('[portfolio-classifier] LLM indisponível, usando fallback "Receita":', e)
    for (const epic of novos) cache[epic.key] = 'Receita'
    saveCache(cache)
    return cache
  }

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
