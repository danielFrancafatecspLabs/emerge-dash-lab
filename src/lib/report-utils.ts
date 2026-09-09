import type { ChangelogEntry } from './jira'

/**
 * Formata um valor numérico em R$ MM para exibição nos slides.
 */
export function formatBeneficioMM(valor: number | null): string {
  if (!valor) return 'Não Mapeado'
  const mm = valor / 1_000_000
  const casas = mm >= 10 || Number.isInteger(mm) ? 0 : 1
  return `R$ ${mm.toFixed(casas)} MM`
}

/**
 * Limpa a descrição: remove emojis e a palavra "Objetivo" do início.
 */
export function limparDescricao(raw: string | null): string {
  if (!raw) return '—'
  // TS: Unicode property escapes / u-flag may error on older lib targets — ignore here
  // @ts-ignore TS1501
  let texto = raw.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{23FF}]/gu,
    ''
  ).trim()
  texto = texto.replace(/^(?:\*\*)?Objetivo(?:\*\*)?:?\s*/i, '').trim()
  return texto || '—'
}

/**
 * Formata o tempo decorrido desde a conclusão de um experimento.
 */
export function formatTempoDesdeConclusao(concluidoEm: string | null): string {
  if (!concluidoEm) return '—'
  const agora = new Date()
  const conclusao = new Date(concluidoEm)
  const diffMs = agora.getTime() - conclusao.getTime()
  if (diffMs < 0) return '—'
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias < 1) return 'Hoje'
  if (diffDias === 1) return '1 dia'
  if (diffDias < 30) return `${diffDias} dias`
  const diffMeses = Math.floor(diffDias / 30)
  const diasResto = diffDias % 30
  if (diffMeses === 1) return diasResto > 0 ? `1 mês e ${diasResto}d` : '1 mês'
  return diasResto > 0 ? `${diffMeses} meses e ${diasResto}d` : `${diffMeses} meses`
}

/**
 * Determina se um epic está bloqueado no momento atual com base no changelog.
 * Um epic é considerado bloqueado se a última transição do campo motivoBloqueio
 * foi "de vazio → com valor", sem transição de volta.
 */
export function estaBloqueadoAgora(
  epicKey: string,
  changelogs: Record<string, ChangelogEntry[]>
): boolean {
  const changelog = changelogs[epicKey]
  if (!changelog || changelog.length === 0) return false

  const sorted = [...changelog].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )

  let bloqueado = false
  for (const entry of sorted) {
    for (const item of entry.items) {
      // Aceita tanto o fieldId técnico quanto o nome legível do campo
      const fieldIdMatch = item.fieldId === 'customfield_13406'
      const fieldName = typeof item.field === 'string' ? item.field : ''
      const fieldNameMatch = fieldName === 'customfield_13406' || /motivo.*bloqueio/i.test(fieldName)
      if (!fieldIdMatch && !fieldNameMatch) continue

      const from = item.fromString ?? (item as any).from
      const to = item.toString ?? (item as any).to
      const estavaBloqueado = !!from && from !== 'None' && from !== 'null'
      const ficouBloqueado = !!to && to !== 'None' && to !== 'null'
      if (!estavaBloqueado && ficouBloqueado) bloqueado = true
      else if (estavaBloqueado && !ficouBloqueado) bloqueado = false
    }
  }
  return bloqueado
}

/**
 * Mapa de prioridade Jira → label em português.
 */
export const PRIORIDADE_LABEL: Record<string, string> = {
  Highest: 'Alta',
  High: 'Alta',
  Medium: 'Média',
  Low: 'Baixa',
  Lowest: 'Baixa',
}

/**
 * Ordem de prioridade para ordenação.
 */
export const PRIORITY_ORDER: Record<string, number> = {
  Highest: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Lowest: 4,
}

/**
 * Nomes das iniciativas candidatas a delivery (filtro fixo).
 */
export const CANDIDATAS_DELIVERY_NOMES = new Set([
  'ARI Juridico',
  'Zelador',
  // 'Reajuste Telmex' removed per request
  // 'OCR do Solar' removed per request
  'Processamento de Manifestos',
  'Identificação de Chamadas de Spam',
  'Automação de Editais',
  'Qualificações de Segurança',
  // 'Tabulação Automática em Leitura de Contexto' removed per request
])

/**
 * Status que indicam experimento em andamento ou validação.
 */
export const STATUS_ANDAMENTO_VALIDACAO = new Set([
  'Em andamento',
  'EM VALIDAÇÃO',
  'Em validação',
])