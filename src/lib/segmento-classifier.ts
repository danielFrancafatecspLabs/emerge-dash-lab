export type SegmentoMercado = 'Consumo' | 'Corporativo' | 'PME/GE/GOV'

/**
 * Mapeamento determinístico de domínio → mercado.
 * Usa o domínio estruturado (customfield_11987) como chave.
 */
const DOMAIN_TO_MARKET: Record<string, SegmentoMercado> = {
  // ── CONSUMO (B2C) ──
  'Atendimento': 'Consumo',
  'Digital': 'Consumo',
  'TV': 'Consumo',
  'Comercial': 'Consumo',
  'Vendas': 'Consumo',
  // ── PME/GE/GOV (B2B) ──
  'PME': 'PME/GE/GOV',
  'GE': 'PME/GE/GOV',
  'GOV': 'PME/GE/GOV',
  'Hitss': 'PME/GE/GOV',
  // ── CORPORATIVO (funções transversais/suporte) ──
  'TI': 'Corporativo',
  'Rede': 'Corporativo',
  'Operações Técnicas': 'Corporativo',
  'Financeiro / ADM': 'Corporativo',
  'Jurídico': 'Corporativo',
  'Corporativo': 'Corporativo',
  'RH': 'Corporativo',
  'Compras': 'Corporativo',
  'Dados e IA': 'Corporativo',
  'Segurança': 'Corporativo',
  'Engenharia': 'Corporativo',
}

export interface EpicInput {
  key: string
  summary: string
  dominio?: string | null   // customfield_11987?.value — domínio estruturado (ex: "Digital", "TI", "Financeiro / ADM")
}

/**
 * Classifica epics em Consumo | Corporativo | PME/GE/GOV
 * usando mapeamento determinístico de domínio estruturado → mercado.
 *
 * 1. Se o epic tem domínio conhecido → usa DOMAIN_TO_MARKET.
 * 2. Se o domínio é "Empresarial" (legado) → PME/GE/GOV.
 * 3. Fallback: "Consumo" (seguro para não classificar errado).
 *
 * NÃO usa LLM — classificação 100% determinística e instantânea.
 */
export async function classifySegmentos(
  epics: EpicInput[]
): Promise<Record<string, SegmentoMercado>> {
  const result: Record<string, SegmentoMercado> = {}

  for (const epic of epics) {
    const dom = (epic.dominio ?? '').trim()

    // Regra: "Empresarial" legado → PME/GE/GOV
    if (dom.toLowerCase() === 'empresarial') {
      result[epic.key] = 'PME/GE/GOV'
      continue
    }

    // Mapeamento determinístico por domínio estruturado
    const mapped = DOMAIN_TO_MARKET[dom]
    if (mapped) {
      result[epic.key] = mapped
      continue
    }

    // Fallback: Consumo (menos danoso que jogar tudo em um bucket só)
    result[epic.key] = 'Consumo'
  }

  return result
}
