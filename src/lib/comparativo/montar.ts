import type { ChangelogEntry } from '../jira'
import { getPeriodosBloqueio, getPipelineStage, STATUS_PIPELINE, subtrairBloqueios } from '../mappers'
import type { JiraIssue, PipelineCount } from '../types'
import type { Amostra, ComparativoDados, EmAberto, Indicador } from './resumo'

/**
 * Monta os indicadores do Comparativo a partir dos dois boards e dos changelogs. Cada indicador vira uma lista
 * de amostras com a data em que o número "aconteceu" (fim da etapa, conclusão, validação).
 */

const MS_DIA = 86_400_000
const dia = (iso: string) => iso.slice(0, 10)
const dias = (de: string | number, ate: string | number) => {
  const a = typeof de === 'number' ? de : Date.parse(de)
  const b = typeof ate === 'number' ? ate : Date.parse(ate)
  return Math.round((b - a) / MS_DIA)
}

type Estagio = keyof PipelineCount

/** Estágio do pipeline de um lado da transição de status (o changelog traz o id em `to`/`from`). */
function estagio(id: unknown, nome: string | null): Estagio | undefined {
  if (typeof id === 'string' && STATUS_PIPELINE[id]) return STATUS_PIPELINE[id]
  if (!nome) return undefined
  return getPipelineStage({ id: typeof id === 'string' ? id : '', name: nome })
}

interface Transicao { data: string; de?: Estagio; para?: Estagio; deNome: string | null; paraNome: string | null }

function transicoes(log: ChangelogEntry[] | undefined): Transicao[] {
  if (!log?.length) return []
  return [...log]
    .sort((a, b) => Date.parse(a.created) - Date.parse(b.created))
    .flatMap(e => e.items
      .filter(i => i.field === 'status')
      .map(i => {
        const bruto = i as typeof i & { from?: string; to?: string }
        return { data: e.created, de: estagio(bruto.from, i.fromString), para: estagio(bruto.to, i.toString), deNome: i.fromString, paraNome: i.toString }
      }))
}

const EXPLORACAO: Estagio[] = ['BACKLOG', 'EM REFINAMENTO', 'PRONTO PARA EXECUÇÃO']
const DEPOIS_DA_EXPLORACAO: Estagio[] = ['EM EXPERIMENTAÇÃO', 'AGUARDANDO PILOTO', 'EM PILOTO', 'EM ESCALA']
const HIPOTESE_VALIDADA: Estagio[] = ['AGUARDANDO PILOTO', 'EM PILOTO', 'EM ESCALA']
const EPIC_CONCLUIDO = new Set(['10003', '10019'])
const NOMES_CONCLUIDO = new Set(['DONE', 'CONCLUÍDO', 'CONCLUIDO', 'FINALIZADO'])
// Mesmos status do cycle time de experimentação da aba Estratégia (calculateCycleTimeExperimentacao).
const NOMES_EXPERIMENTACAO = new Set(['Em andamento', 'In Progress', 'EM VALIDAÇÃO'])

/** Lead time da Exploração: da criação do card na Ideação até a primeira entrada em Experimentação (ou além). */
function leadExploracao(iniciativas: JiraIssue[], logs: Record<string, ChangelogEntry[]>, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const ini of iniciativas) {
    const criado = ini.fields.created
    if (!criado) continue
    const saida = transicoes(logs[ini.key]).find(t => t.para && DEPOIS_DA_EXPLORACAO.includes(t.para))
    if (saida) {
      const d = dias(criado, saida.data)
      if (d >= 0) amostras.push({ key: ini.key, nome: ini.fields.summary, valor: d, data: dia(saida.data) })
    } else {
      const atual = getPipelineStage(ini.fields.status)
      if (atual && EXPLORACAO.includes(atual)) emAberto.push({ key: ini.key, nome: ini.fields.summary, dias: dias(criado, agora) })
    }
  }
  return { amostras, emAberto }
}

/** Períodos em que o Epic esteve em experimentação (Em andamento / Em validação), com a data de saída do último. */
function periodosExperimentacao(log: ChangelogEntry[] | undefined) {
  const periodos: { inicio: number; fim: number }[] = []
  let entrou: number | null = null
  let ultimaSaida: string | null = null
  for (const t of transicoes(log)) {
    const entra = NOMES_EXPERIMENTACAO.has(t.paraNome ?? '')
    const sai = NOMES_EXPERIMENTACAO.has(t.deNome ?? '')
    if (entra && !sai) entrou = Date.parse(t.data)
    else if (sai && !entra && entrou !== null) {
      periodos.push({ inicio: entrou, fim: Date.parse(t.data) })
      entrou = null
      ultimaSaida = t.data
    }
  }
  return { periodos, aberto: entrou, ultimaSaida }
}

/**
 * Lead time da Experimentação: mesma regra da aba Estratégia. Epics concluídos, tempo em Em andamento + Em validação,
 * descontados os períodos bloqueados. Conta no ano em que o Epic saiu da experimentação.
 */
function leadExperimentacao(epics: JiraIssue[], logs: Record<string, ChangelogEntry[]>, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const e of epics) {
    const { periodos, aberto, ultimaSaida } = periodosExperimentacao(logs[e.key])
    const bloqueios = getPeriodosBloqueio(e.key, logs)
    if (EPIC_CONCLUIDO.has(e.fields.status.id)) {
      if (!periodos.length || !ultimaSaida) continue
      const d = subtrairBloqueios(periodos, bloqueios)
      if (d > 0) amostras.push({ key: e.key, nome: e.fields.summary, valor: d, data: dia(ultimaSaida) })
    } else if (aberto !== null && NOMES_EXPERIMENTACAO.has(e.fields.status.name)) {
      emAberto.push({ key: e.key, nome: e.fields.summary, dias: subtrairBloqueios([...periodos, { inicio: aberto, fim: agora }], bloqueios) })
    }
  }
  return { amostras, emAberto }
}

/** Data em que o Epic foi concluído (primeira transição para Concluído). */
function conclusao(log: ChangelogEntry[] | undefined): string | null {
  for (const e of [...(log ?? [])].sort((a, b) => Date.parse(a.created) - Date.parse(b.created))) {
    for (const i of e.items) {
      if (i.field !== 'status') continue
      const to = (i as typeof i & { to?: string }).to
      if ((to && EPIC_CONCLUIDO.has(to)) || NOMES_CONCLUIDO.has((i.toString ?? '').trim().toUpperCase())) return e.created
    }
  }
  return null
}

/**
 * Benefício potencial das hipóteses validadas: Epics concluídos cuja iniciativa-mãe está em Aguardando piloto,
 * Em piloto ou Em escala (as refutadas ficam de fora). Conta no ano da validação: a data mais recente entre a
 * conclusão do Epic e a entrada da iniciativa nessas colunas.
 */
function beneficio(iniciativas: JiraIssue[], epics: JiraIssue[], logsIni: Record<string, ChangelogEntry[]>, logsEpic: Record<string, ChangelogEntry[]>): Pick<Indicador, 'amostras' | 'emAberto'> {
  const maes = new Map(iniciativas.map(i => [i.key, i]))
  const amostras: Amostra[] = []
  for (const e of epics) {
    if (!EPIC_CONCLUIDO.has(e.fields.status.id)) continue
    const mae = e.fields.parent?.key ? maes.get(e.fields.parent.key) : undefined
    const estagioMae = mae ? getPipelineStage(mae.fields.status) : undefined
    if (!mae || !estagioMae || !HIPOTESE_VALIDADA.includes(estagioMae)) continue
    const concluiu = conclusao(logsEpic[e.key])
    const validou = transicoes(logsIni[mae.key]).find(t => t.para && HIPOTESE_VALIDADA.includes(t.para))?.data ?? null
    const quando = [concluiu, validou].filter((d): d is string => !!d).sort((a, b) => Date.parse(b) - Date.parse(a))[0]
    if (!quando) continue
    amostras.push({ key: e.key, nome: e.fields.summary, valor: Number(e.fields.customfield_30216) || 0, data: dia(quando) })
  }
  return { amostras, emAberto: [] }
}

/** Cycle time de um estágio do board de Ideação: soma dos períodos no estágio; conta no ano da última saída. */
function cycleTimeEstagio(iniciativas: JiraIssue[], logs: Record<string, ChangelogEntry[]>, alvo: Estagio, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const ini of iniciativas) {
    const ts = transicoes(logs[ini.key])
    let entrou: number | null = null
    let total = 0
    let saiu: string | null = null
    for (const t of ts) {
      if (t.para === alvo && t.de !== alvo) entrou = Date.parse(t.data)
      else if (t.de === alvo && t.para !== alvo) {
        // Criada já no estágio: o período começa na criação do card.
        const inicio = entrou ?? (ini.fields.created ? Date.parse(ini.fields.created) : null)
        if (inicio !== null) total += Date.parse(t.data) - inicio
        entrou = null
        saiu = t.data
      }
    }
    const atual = getPipelineStage(ini.fields.status)
    if (atual === alvo) {
      const inicio = entrou ?? (ts.length === 0 && ini.fields.created ? Date.parse(ini.fields.created) : null)
      if (inicio !== null) emAberto.push({ key: ini.key, nome: ini.fields.summary, dias: Math.round((total + agora - inicio) / MS_DIA) })
    } else if (saiu && total > 0) {
      amostras.push({ key: ini.key, nome: ini.fields.summary, valor: Math.round(total / MS_DIA), data: dia(saiu) })
    }
  }
  return { amostras, emAberto }
}

export function montarComparativo(raw: {
  iniciativas: JiraIssue[]
  epics: JiraIssue[]
  iniciativaChangelogs: Record<string, ChangelogEntry[]>
  epicChangelogs: Record<string, ChangelogEntry[]>
}, agora = new Date(), jiraUrl: string | null = null): ComparativoDados {
  const t = agora.getTime()
  const indicadores: Indicador[] = [
    {
      id: 'leadExploracao', titulo: 'Lead time da Exploração', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Da criação do card no board de Ideação até a entrada em Experimentação (passando por estruturação e consolidação). Conta no ano em que a iniciativa entrou em Experimentação.',
      ...leadExploracao(raw.iniciativas, raw.iniciativaChangelogs, t),
    },
    {
      id: 'leadExperimentacao', titulo: 'Lead time da Experimentação', unidade: 'dias', melhor: 'menor', board: 'Experimentação',
      regra: 'Experimentos concluídos: tempo em Em andamento e Em validação, sem os períodos bloqueados (mesma regra da aba Estratégia). Conta no ano em que o experimento saiu da experimentação.',
      ...leadExperimentacao(raw.epics, raw.epicChangelogs, t),
    },
    {
      id: 'beneficio', titulo: 'Benefício potencial validado', unidade: 'reais', melhor: 'maior', board: 'Experimentação',
      regra: 'Soma do benefício dos experimentos concluídos com hipótese validada (iniciativa-mãe em Aguardando piloto, Em piloto ou Em escala). Refutadas não entram. Conta no ano da validação.',
      ...beneficio(raw.iniciativas, raw.epics, raw.iniciativaChangelogs, raw.epicChangelogs),
    },
    {
      id: 'aguardandoPiloto', titulo: 'Cycle time de Aguardando piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou em Aguardando piloto até sair da coluna. Conta no ano da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, 'AGUARDANDO PILOTO', t),
    },
    {
      id: 'piloto', titulo: 'Cycle time do Piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou Em piloto até sair da coluna. Conta no ano da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, 'EM PILOTO', t),
    },
  ]
  return { indicadores, hoje: hojeEmSaoPaulo(agora), jiraUrl: jiraUrl ? jiraUrl.replace(/\/+$/, '') : null }
}

function hojeEmSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

