import type { JiraIssue } from '@/lib/types'

// "O que estamos experimentando agora": os Experimentos (Epics do board de Experimentação) em andamento ou em validação,
// mostrados na Comunidade só pelo nome da Iniciativa-mãe e pela Diretoria. Nada de custos, benefícios ou sponsors.
// Mesmo critério de "em andamento" da Semanal (lib/weekly.ts): status 3 (Em andamento) e 10204 (Em validação).

export type FaseDoExperimento = 'Em andamento' | 'Em validação'

export interface ExperimentoAtivo {
  /** Chave da Iniciativa (ou do Experimento, quando ele não tem Iniciativa-mãe). */
  chave: string
  iniciativa: string
  diretoria: string | null
  fase: FaseDoExperimento
  /** Quantos Experimentos/Ciclos da Iniciativa estão ativos. */
  ciclos: number
  atualizadoEm: string | null
}

const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

export function faseDoExperimento(status: { id?: string; name?: string } | undefined): FaseDoExperimento | null {
  if (!status) return null
  const nome = sem(status.name ?? '')
  if (status.id === '3' || nome === 'em andamento') return 'Em andamento'
  if (status.id === '10204' || nome === 'em validacao') return 'Em validação'
  return null
}

/** Campo de texto do Jira que às vezes vem como opção ({ value }). */
function texto(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null
  if (v && typeof v === 'object' && typeof (v as { value?: unknown }).value === 'string') return ((v as { value: string }).value).trim() || null
  return null
}

/**
 * Uma linha por Iniciativa com Experimento ativo, a mais recentemente atualizada primeiro. Se a Iniciativa tem
 * vários Ciclos ativos, conta todos e fica "Em andamento" se algum estiver em andamento.
 */
export function experimentosAtivos(epics: JiraIssue[], iniciativas: JiraIssue[] = []): ExperimentoAtivo[] {
  const iniPorChave = new Map(iniciativas.map(i => [i.key, i]))
  const porIniciativa = new Map<string, ExperimentoAtivo>()
  for (const e of epics) {
    const fase = faseDoExperimento(e.fields.status)
    if (!fase) continue
    const pai = e.fields.parent
    const ini = pai ? iniPorChave.get(pai.key) : undefined
    const chave = pai?.key ?? e.key
    const nome = (ini?.fields.summary ?? pai?.fields?.summary ?? e.fields.summary ?? '').trim()
    if (!nome) continue
    const diretoria = texto(e.fields.customfield_21499) ?? texto(ini?.fields.customfield_21499)
    const atualizadoEm = e.fields.updated ?? null
    const atual = porIniciativa.get(chave)
    if (!atual) {
      porIniciativa.set(chave, { chave, iniciativa: nome, diretoria, fase, ciclos: 1, atualizadoEm })
      continue
    }
    atual.ciclos++
    if (fase === 'Em andamento') atual.fase = 'Em andamento'
    atual.diretoria ??= diretoria
    if (atualizadoEm && (!atual.atualizadoEm || atualizadoEm > atual.atualizadoEm)) atual.atualizadoEm = atualizadoEm
  }
  return [...porIniciativa.values()].sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '') || a.iniciativa.localeCompare(b.iniciativa))
}
