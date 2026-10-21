import type { EpicDetail, JiraIssueFields, JiraStatus } from './types'

// Detecção de bloqueio dos Experimentos (Epics). O Jira marca bloqueio de várias formas, e cada time usa uma:
// a flag de impedimento (campo "Flagged", que a API devolve como LISTA de opções), os campos "Motivo de
// Bloqueio" e "Tipo de Impedimento" (cujos ids mudaram na migração de campos), status como "Bloqueado",
// etiquetas e vínculos "is blocked by". Aqui todas viram uma lista de sinais legíveis.

/** Ids conhecidos, usados quando a lista de campos do Jira não pode ser consultada. */
export const CAMPOS_BLOQUEIO_PADRAO = [
  { id: 'customfield_10021', nome: 'Flagged' },
  { id: 'customfield_13406', nome: 'Motivo de Bloqueio' },
  { id: 'customfield_30437', nome: 'Tipo de Impedimento' },
]

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Campo do Jira que fala de bloqueio, pelo nome (inclui o "Flagged" e as variações em português). */
export function ehCampoDeBloqueio(nome: string): boolean {
  const n = norm(nome)
  // Datas e contadores ("Data do bloqueio", "Dias bloqueado") continuam preenchidos depois do desbloqueio.
  if (/\b(data|date|dias|days|tempo|time|historico|history|qtd|quantidade)\b/.test(n)) return false
  return n.includes('bloque') || n.includes('impedi') || n.includes('blocked') || ['flagged', 'flag', 'sinalizado', 'sinalizador'].includes(n)
}

const NEGATIVOS = new Set(['', 'nao', 'no', 'false', 'nenhum', 'nenhuma', 'none', 'null', 'n/a', 'na', '-', '—', '0', 'sem bloqueio', 'sem impedimento'])

/** Texto de um valor de campo do Jira: texto, número, opção ({ value }), lista de opções ou documento ADF. */
export function textoDoValor(v: unknown): string {
  if (v === null || v === undefined || v === false) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim()
  if (v === true) return 'Sim'
  if (Array.isArray(v)) return v.map(textoDoValor).filter(Boolean).join(', ')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    for (const k of ['value', 'name', 'displayName', 'text']) if (typeof o[k] === 'string' && o[k]) return (o[k] as string).trim()
    if (Array.isArray(o.content)) return textoDoValor(o.content.map(c => textoDoValor(c)).join(' '))
    if (o.child && typeof o.child === 'object') return textoDoValor(o.child)
  }
  return ''
}

/** Valor que, na prática, diz "tem bloqueio" (ignora "Não", "Nenhum", "-"…). */
function valorPositivo(v: unknown): string {
  const t = textoDoValor(v)
  return NEGATIVOS.has(norm(t)) ? '' : t
}

export interface CampoBloqueio { id: string; nome: string; valor: string }

export interface Bloqueio {
  sinais: string[]
  motivo: string | null
  tipo: string | null
  flag: boolean
}

const STATUS_BLOQUEIO = /bloque|imped|blocked|on hold|paralisad|suspens/
const ETIQUETA_BLOQUEIO = /bloq|imped|block/

/** Todos os sinais de bloqueio de um Epic, a partir dos campos que vieram do Jira. */
export function sinaisDeBloqueio(f: JiraIssueFields): Bloqueio {
  const sinais: string[] = []
  let motivo: string | null = null
  let tipo: string | null = null
  let flag = false

  // Campos de bloqueio já resolvidos pelo nome (jira.ts); sem eles, os ids conhecidos.
  const campos: CampoBloqueio[] = f.bloqueioCampos
    ?? CAMPOS_BLOQUEIO_PADRAO
      .map(c => ({ ...c, valor: valorPositivo((f as unknown as Record<string, unknown>)[c.id]) }))
      .filter(c => c.valor)
  for (const c of campos) {
    const valor = valorPositivo(c.valor)
    if (!valor) continue
    const n = norm(c.nome)
    if (c.id === 'customfield_10021' || ['flagged', 'flag', 'sinalizado', 'sinalizador'].includes(n)) {
      flag = true
      sinais.push('Sinalizado com a flag de impedimento')
    } else if (n.includes('motivo')) {
      motivo ??= valor
      sinais.push(`${c.nome}: ${valor}`)
    } else if (n.includes('tipo')) {
      tipo ??= valor
      sinais.push(`${c.nome}: ${valor}`)
    } else {
      sinais.push(`${c.nome}: ${valor}`)
    }
  }

  if (f.status?.name && STATUS_BLOQUEIO.test(norm(f.status.name))) sinais.push(`Status no Jira: ${f.status.name}`)

  for (const l of f.labels ?? []) if (ETIQUETA_BLOQUEIO.test(norm(l))) sinais.push(`Etiqueta: ${l}`)

  for (const link of f.issuelinks ?? []) {
    const inward = norm(link.type?.inward ?? '')
    const outro = link.inwardIssue
    if (!outro || !(inward.includes('blocked by') || inward.includes('bloqueado por') || inward.includes('impedido por'))) continue
    if (outro.fields?.status?.statusCategory?.key === 'done') continue
    sinais.push(`Bloqueado por ${outro.key}${outro.fields?.summary ? ` (${outro.fields.summary})` : ''}`)
  }

  return { sinais: [...new Set(sinais)], motivo, tipo, flag }
}

/** Categoria de um sinal, para filtrar e contar ("Flag de impedimento", "Motivo de bloqueio"…). */
export function categoriaDoSinal(sinal: string): string {
  if (sinal.startsWith('Sinalizado')) return 'Flag de impedimento'
  if (sinal.startsWith('Bloqueado por')) return 'Vínculo "bloqueado por"'
  if (sinal.startsWith('Status no Jira')) return 'Status de bloqueio'
  if (sinal.startsWith('Etiqueta')) return 'Etiqueta de bloqueio'
  const n = norm(sinal.split(':')[0])
  if (n.includes('motivo')) return 'Motivo de bloqueio'
  if (n.includes('tipo')) return 'Tipo de impedimento'
  return 'Outro campo de bloqueio'
}

/** Status encerrado: concluído, finalizado (inclui a coluna Em escala) ou cancelado. */
export function statusEncerrado(s: JiraStatus | null | undefined): boolean {
  if (!s) return false
  if (['10003', '10019', '13562', '10015'].includes(s.id)) return true
  const n = norm(s.name ?? '')
  return /conclu|finaliz|cancel|^done$|escala/.test(n)
}

/**
 * Epic bloqueado agora: está aberto e tem algum sinal de bloqueio. O "Motivo de Bloqueio" também guarda o
 * motivo de cancelamento, por isso item encerrado nunca conta como bloqueado.
 */
export function epicBloqueado(e: Pick<EpicDetail, 'status' | 'motivoBloqueio' | 'flagged' | 'sinaisBloqueio'>): boolean {
  if (statusEncerrado(e.status)) return false
  return (e.sinaisBloqueio?.length ?? 0) > 0 || !!e.flagged || !!e.motivoBloqueio?.trim()
}
