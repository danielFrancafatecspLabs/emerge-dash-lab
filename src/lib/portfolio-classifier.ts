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

/**
 * O cache guarda só classificações que a IA de fato devolveu. A versão 1 (um objeto chave → meta) gravava "Receita"
 * para todo experimento quando a IA estava fora do ar, e esse erro ficava para sempre: a versão 1 é descartada e os
 * experimentos são classificados de novo.
 */
const VERSAO_DO_CACHE = 2
interface CacheV2 { versao: typeof VERSAO_DO_CACHE; metas: Record<string, MetaCategoria> }

function loadCache(): Record<string, MetaCategoria> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as Partial<CacheV2>
      if (c?.versao === VERSAO_DO_CACHE && c.metas && typeof c.metas === 'object') {
        return Object.fromEntries(Object.entries(c.metas).filter(([, m]) => VALID_METAS.includes(m)))
      }
    }
  } catch {}
  return {}
}

function saveCache(cache: Record<string, MetaCategoria>): void {
  try {
    const conteudo: CacheV2 = { versao: VERSAO_DO_CACHE, metas: cache }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(conteudo, null, 2), 'utf-8')
  } catch (e) {
    console.error('[portfolio-classifier] Falha ao salvar cache:', e)
  }
}

const ESPERA_APOS_FALHA_MS = 30 * 60 * 1000
const LOTE = 60
const G = globalThis as typeof globalThis & { __beonMetasEsperarAte: number }
G.__beonMetasEsperarAte ??= 0

/** A meta que a IA respondeu, ou null quando a resposta não é uma das três. */
export function metaDaResposta(raw: unknown): MetaCategoria | null {
  const t = String(raw ?? '').trim().toUpperCase()
  return VALID_METAS.find(m => t.includes(m.toUpperCase())) ?? null
}

/**
 * Classifica múltiplos epics em uma ÚNICA chamada de LLM (batch).
 * O prompt envia todos os experimentos de uma vez e pede um JSON de resposta.
 * Muito mais rápido que classificar um a um (~5s vs ~10min para 200 epics).
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

  // Valida cada classificação; o que vier inválido fica sem classificação (e é tentado de novo na próxima leitura).
  const resultado: Record<string, MetaCategoria> = {}
  for (const epic of epics) {
    const valida = metaDaResposta(parsed[epic.key])
    if (valida) resultado[epic.key] = valida
    else console.warn(`[portfolio-classifier] Classificação inválida para ${epic.key}: "${parsed[epic.key]}", fica sem classificação`)
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
    // Sem IA, os experimentos novos ficam sem classificação (nunca num chute): aparecem como "sem classificação".
    console.error('[portfolio-classifier] LLM indisponível; experimentos novos ficam sem classificação:', e)
    return cache
  }

  // Uma chamada em lote para todos. Se a IA falhar, espera um pouco antes de tentar de novo (a página não fica
  // lenta a cada leitura enquanto ela estiver fora do ar).
  if (Date.now() < G.__beonMetasEsperarAte) return cache
  try {
    // Lotes de até 60: a resposta em JSON de 200 experimentos passaria do limite de tokens e viria cortada.
    let classificados = 0
    for (let i = 0; i < novos.length; i += LOTE) {
      const lote = await classifyBatch(client, novos.slice(i, i + LOTE))
      Object.assign(cache, lote)
      classificados += Object.keys(lote).length
    }
    console.log(`[portfolio-classifier] ${classificados} de ${novos.length} experimento(s) classificado(s)`)
    saveCache(cache)
  } catch (e) {
    saveCache(cache)
    G.__beonMetasEsperarAte = Date.now() + ESPERA_APOS_FALHA_MS
    console.warn('[portfolio-classifier] IA indisponível; experimentos novos ficam sem classificação por enquanto:', e)
  }
  return cache
}
