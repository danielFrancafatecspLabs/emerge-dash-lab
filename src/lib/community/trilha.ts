// Etapas da Trilha de Experimentação, na ordem em que aparecem. O conteúdo fica em
// src/components/trilha; aqui só o que o servidor precisa para validar e guardar o progresso.

export const TRILHA_ETAPAS = [
  'boas-vindas', 'e-um-experimento',
  'problema', 'hipotese', 'estrategia', 'metricas', 'ficha',
  'execucao', 'analise', 'aprendizado',
] as const

export type EtapaTrilha = (typeof TRILHA_ETAPAS)[number]

export function isEtapaTrilha(valor: unknown): valor is EtapaTrilha {
  return typeof valor === 'string' && (TRILHA_ETAPAS as readonly string[]).includes(valor)
}

/** A trilha antiga tinha oito etapas numeradas; cada número corresponde a uma etapa atual. */
const ETAPAS_NUMERADAS: EtapaTrilha[] = ['problema', 'hipotese', 'estrategia', 'metricas', 'ficha', 'execucao', 'analise', 'aprendizado']

/** Progresso salvo, sem repetições e na ordem da trilha. Aceita o formato antigo (números de 1 a 8). */
export function normalizarTrilha(valores: unknown): EtapaTrilha[] {
  if (!Array.isArray(valores)) return []
  const ids = new Set<EtapaTrilha>()
  for (const v of valores) {
    if (isEtapaTrilha(v)) ids.add(v)
    else if (typeof v === 'number' && ETAPAS_NUMERADAS[v - 1]) ids.add(ETAPAS_NUMERADAS[v - 1])
  }
  return TRILHA_ETAPAS.filter(id => ids.has(id))
}
