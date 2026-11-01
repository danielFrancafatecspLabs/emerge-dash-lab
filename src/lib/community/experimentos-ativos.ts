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
  /** Chaves dos Experimentos (Epics) ativos desta Iniciativa, o mais recente primeiro. */
  experimentos: string[]
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
      porIniciativa.set(chave, { chave, iniciativa: nome, diretoria, fase, ciclos: 1, atualizadoEm, experimentos: [e.key] })
      continue
    }
    atual.ciclos++
    if (atualizadoEm && (!atual.atualizadoEm || atualizadoEm > atual.atualizadoEm)) atual.experimentos.unshift(e.key)
    else atual.experimentos.push(e.key)
    if (fase === 'Em andamento') atual.fase = 'Em andamento'
    atual.diretoria ??= diretoria
    if (atualizadoEm && (!atual.atualizadoEm || atualizadoEm > atual.atualizadoEm)) atual.atualizadoEm = atualizadoEm
  }
  return [...porIniciativa.values()].sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '') || a.iniciativa.localeCompare(b.iniciativa))
}

// ── Aba "Experimentos ativos" da Comunidade ──────────────────────────────────────────────────────────────────
// Um card por Experimento (Epic) ativo, com o que a Comunidade pode ver: nome, Iniciativa, descrição, fase, sponsor e
// diretoria. Custos, benefícios e o restante do portfólio ficam de fora. A ficha e o relatório são links que os admins
// cadastram (ver experimentos-links.ts).

export interface LinksDoExperimento { ficha?: string; relatorio?: string; atualizadoPor?: string; atualizadoEm?: string }

export interface ExperimentoDetalhado {
  chave: string
  nome: string
  iniciativa: string | null
  iniciativaChave: string | null
  descricao: string | null
  fase: FaseDoExperimento
  sponsor: string | null
  diretoria: string | null
  criadoEm: string | null
  atualizadoEm: string | null
  links: LinksDoExperimento
}

interface NoAdf { type?: string; text?: string; content?: NoAdf[] }

function textoDoAdf(no: NoAdf | NoAdf[] | undefined): string {
  if (!no) return ''
  if (Array.isArray(no)) return no.map(textoDoAdf).join('')
  if (no.type === 'text') return no.text ?? ''
  if (no.type === 'hardBreak') return '\n'
  const filhos = textoDoAdf(no.content)
  if (no.type === 'listItem') return `• ${filhos.trim()}\n`
  if (no.type === 'paragraph' || no.type === 'heading') return `${filhos}\n\n`
  return filhos
}

/** Texto legível da descrição do Jira (wiki markup ou ADF), sem marcação, imagens nem blocos de código. */
export function textoDaDescricao(valor: unknown, limite = 3000): string | null {
  let t = ''
  if (typeof valor === 'string') {
    t = valor
      .replace(/\{(code|noformat)[^}]*\}[\s\S]*?\{\1\}/g, '')
      .replace(/\{color[^}]*\}|\{panel[^}]*\}|\{quote\}/g, '')
      .replace(/!\S[^!\n]*!/g, '')
      .replace(/\[([^|\]]+)\|[^\]]+\]/g, '$1')
      .replace(/\[(https?:[^\]]+)\]/g, '$1')
      .replace(/^h[1-6]\.\s*/gm, '')
      .replace(/^\s*[*#-]+\s+/gm, '• ')
      .replace(/\|\|?/g, ' ')
      .replace(/(^|\s)[*_+]([^*_+\n]+)[*_+](?=\s|$|[.,;:!?])/g, '$1$2')
      .replace(/\{\{([^}]+)\}\}/g, '$1')
  } else if (valor && typeof valor === 'object') {
    t = textoDoAdf(valor as NoAdf)
  }
  t = t.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
  if (!t) return null
  return t.length > limite ? `${t.slice(0, limite - 1).trimEnd()}…` : t
}

export function experimentosDetalhados(
  epics: JiraIssue[],
  iniciativas: JiraIssue[] = [],
  links: Record<string, LinksDoExperimento> = {},
  normalizarSponsor: (s: string) => string = s => s.trim(),
): ExperimentoDetalhado[] {
  const iniPorChave = new Map(iniciativas.map(i => [i.key, i]))
  return epics
    .map(e => {
      const fase = faseDoExperimento(e.fields.status)
      if (!fase) return null
      const pai = e.fields.parent
      const ini = pai ? iniPorChave.get(pai.key) : undefined
      const sponsor = texto(e.fields.customfield_30394) ?? texto(ini?.fields.customfield_30394)
      return {
        chave: e.key,
        nome: (e.fields.summary ?? e.key).trim(),
        iniciativa: (ini?.fields.summary ?? pai?.fields?.summary ?? '').trim() || null,
        iniciativaChave: pai?.key ?? null,
        descricao: textoDaDescricao(e.fields.description) ?? textoDaDescricao(ini?.fields.description),
        fase,
        sponsor: sponsor ? normalizarSponsor(sponsor) : null,
        diretoria: texto(e.fields.customfield_21499) ?? texto(ini?.fields.customfield_21499),
        criadoEm: e.fields.created ?? null,
        atualizadoEm: e.fields.updated ?? null,
        links: links[e.key] ?? {},
      } satisfies ExperimentoDetalhado
    })
    .filter((x): x is ExperimentoDetalhado => !!x)
    .sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '') || a.nome.localeCompare(b.nome))
}
