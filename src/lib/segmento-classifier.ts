import fs from 'fs'
import path from 'path'
import { getAzureOpenAIClient, DEPLOYMENT } from './llm'

export type SegmentoMercado = 'Consumo' | 'Corporativo' | 'PME/GE/GOV'

// Valores de customfield_30014 (was customfield_11661) que vão direto para PME/GE/GOV (sem LLM)
const PME_GOV_DOMINIOS = ['empresarial', 'pme']

const VALID_LLM: ('Consumo' | 'Corporativo')[] = ['Consumo', 'Corporativo']
// Nova versão de cache — evita conflito com cache antigo (tipo diferente)
const CACHE_FILE = path.resolve(process.cwd(), '.segmento-cache-v2.json')

export interface EpicInput {
  key: string
  summary: string
  dominio?: string | null   // customfield_30014 (was customfield_11661) — "Empresarial" | "PME" | outros
}

function loadCache(): Record<string, SegmentoMercado> {
  try {
    if (fs.existsSync(CACHE_FILE))
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
  } catch {}
  return {}
}

function saveCache(cache: Record<string, SegmentoMercado>): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.error('[segmento-classifier] Falha ao salvar cache:', e)
  }
}

async function classifyOne(
  client: ReturnType<typeof getAzureOpenAIClient>,
  epic: EpicInput
): Promise<'Consumo' | 'Corporativo'> {
  const dominioCtx = epic.dominio ? ` (Domínio: ${epic.dominio})` : ''
  const res = await client.chat.completions.create({
    model: DEPLOYMENT,
    messages: [
      {
        role: 'system',
        content: `Você é um classificador de experimentos de inovação da Claro Brasil (operadora de telecom).
Classifique o experimento em um dos dois segmentos com base no nome e domínio informados:
- Consumo: voltado para pessoas físicas, clientes residenciais, varejo, B2C (ex: Atendimento ao cliente, Vendas varejo, Marketing, CRM, Clarinha, app, autoatendimento, pós-pago pessoa física, pré-pago, planos residenciais, Net Promoter Score de clientes PF)
- Corporativo: voltado para empresas, clientes B2B, tecnologia interna, operações (ex: TI, Segurança, Rede, Operações, Engenharia, Jurídico, RH, Financeiro, regulatório, vendas B2B, atendimento empresarial, corporativo)
Responda SOMENTE com uma das opções: Consumo ou Corporativo.`,
      },
      {
        role: 'user',
        content: `Experimento: "${epic.summary}"${dominioCtx}`,
      },
    ],
    max_tokens: 15,
    temperature: 0,
  })
  const raw = res.choices[0]?.message?.content?.trim() ?? ''
  return VALID_LLM.find(v => raw.toLowerCase().includes(v.toLowerCase())) ?? 'Consumo'
}

/**
 * Classifica epics em: PME/GE/GOV (regra fixa) | Consumo | Corporativo (LLM).
 *
 * Regra fixa: se customfield_30014 (dominio, was customfield_11661) for 'Empresarial' ou 'PME' → 'PME/GE/GOV'.
 * Demais epics → LLM classifica como 'Consumo' ou 'Corporativo'.
 *
 * Cache em .segmento-cache-v2.json — só chama LLM para epics novos não-PME/GOV.
 */
export async function classifySegmentos(
  epics: EpicInput[]
): Promise<Record<string, SegmentoMercado>> {
  const cache = loadCache()

  // Aplica regra fixa para PME/GE/GOV
  let cacheUpdated = false
  for (const epic of epics) {
    const dom = (epic.dominio ?? '').trim().toLowerCase()
    if (PME_GOV_DOMINIOS.includes(dom)) {
      if (cache[epic.key] !== 'PME/GE/GOV') {
        cache[epic.key] = 'PME/GE/GOV'
        cacheUpdated = true
      }
    }
  }

  // Epics que precisam de LLM (não são PME/GOV e ainda não estão no cache)
  const novos = epics.filter(e => {
    const dom = (e.dominio ?? '').trim().toLowerCase()
    return !PME_GOV_DOMINIOS.includes(dom) && !(e.key in cache)
  })

  if (novos.length === 0) {
    if (cacheUpdated) saveCache(cache)
    return cache
  }

  console.log(`[segmento-classifier] Classificando ${novos.length} epic(s) via LLM (Consumo/Corporativo)...`)

  let client: ReturnType<typeof getAzureOpenAIClient>
  try {
    client = getAzureOpenAIClient()
  } catch (e) {
    console.error('[segmento-classifier] LLM indisponível, usando fallback "Consumo":', e)
    for (const epic of novos) cache[epic.key] = 'Consumo'
    saveCache(cache)
    return cache
  }

  for (const epic of novos) {
    try {
      cache[epic.key] = await classifyOne(client, epic)
      console.log(`  "${epic.summary}" → ${cache[epic.key]}`)
    } catch (e) {
      console.error(`[segmento-classifier] Erro em "${epic.key}":`, e)
      cache[epic.key] = 'Consumo'
    }
  }

  saveCache(cache)
  return cache
}
