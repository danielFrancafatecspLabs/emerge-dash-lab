import type { ChangelogEntry } from '../jira'
import { getPeriodosBloqueio, subtrairBloqueios } from '../mappers'
import type { JiraIssue } from '../types'
import {
  criarClassificador, DEPOIS_DA_EXPLORACAO, ETAPAS_VALIDADAS, type Classificador, type EtapaEpic, type EtapaIniciativa,
} from './etapas'
import type { Amostra, ComparativoDados, EmAberto, Indicador } from './resumo'

/**
 * Monta os indicadores do Comparativo a partir dos dois boards e dos changelogs. Cada indicador vira uma lista
 * de amostras com a data em que o número "aconteceu" (fim da etapa, conclusão, validação). A etapa de cada status
 * vem das colunas reais dos boards (ver ./etapas.ts).
 */

const MS_DIA = 86_400_000
const dia = (iso: string) => iso.slice(0, 10)
const dias = (de: string | number, ate: string | number) => {
  const a = typeof de === 'number' ? de : Date.parse(de)
  const b = typeof ate === 'number' ? ate : Date.parse(ate)
  return Math.round((b - a) / MS_DIA)
}

interface Transicao<E> { data: string; de?: E; para?: E }

/** Mudanças de status em ordem, com a etapa de cada lado (o changelog traz o id em `from`/`to` e o nome da época). */
function transicoes<E>(log: ChangelogEntry[] | undefined, etapa: (id: string | undefined, nome: string | null) => E | undefined): Transicao<E>[] {
  if (!log?.length) return []
  return [...log]
    .sort((a, b) => Date.parse(a.created) - Date.parse(b.created))
    .flatMap(e => e.items
      .filter(i => i.field === 'status')
      .map(i => {
        const bruto = i as typeof i & { from?: string; to?: string }
        return { data: e.created, de: etapa(bruto.from, i.fromString), para: etapa(bruto.to, i.toString) }
      }))
}

/** Lead time da Exploração: da criação do card na Ideação até a primeira entrada em Experimentação (ou além). */
function leadExploracao(iniciativas: JiraIssue[], logs: Record<string, ChangelogEntry[]>, c: Classificador, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const ini of iniciativas) {
    const criado = ini.fields.created
    if (!criado) continue
    const saida = transicoes(logs[ini.key], c.iniciativa).find(t => t.para && DEPOIS_DA_EXPLORACAO.includes(t.para) && !(t.de && DEPOIS_DA_EXPLORACAO.includes(t.de)))
    if (saida) {
      const d = dias(criado, saida.data)
      if (d >= 0) amostras.push({ key: ini.key, nome: ini.fields.summary, valor: d, data: dia(saida.data) })
    } else if (c.iniciativa(ini.fields.status.id, ini.fields.status.name) === 'exploracao') {
      emAberto.push({ key: ini.key, nome: ini.fields.summary, dias: dias(criado, agora) })
    }
  }
  return { amostras, emAberto }
}

const EXPERIMENTANDO: EtapaEpic[] = ['andamento', 'validacao']

/** Períodos em que o Epic esteve em experimentação (Em andamento / Em validação), com a data de saída do último. */
function periodosExperimentacao(log: ChangelogEntry[] | undefined, c: Classificador) {
  const periodos: { inicio: number; fim: number }[] = []
  let entrou: number | null = null
  let ultimaSaida: string | null = null
  for (const t of transicoes(log, c.epic)) {
    const entra = !!t.para && EXPERIMENTANDO.includes(t.para)
    const sai = !!t.de && EXPERIMENTANDO.includes(t.de)
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
function leadExperimentacao(epics: JiraIssue[], logs: Record<string, ChangelogEntry[]>, c: Classificador, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const e of epics) {
    const atual = c.epic(e.fields.status.id, e.fields.status.name)
    const { periodos, aberto, ultimaSaida } = periodosExperimentacao(logs[e.key], c)
    const bloqueios = getPeriodosBloqueio(e.key, logs)
    if (atual === 'concluido') {
      if (!periodos.length || !ultimaSaida) continue
      const d = subtrairBloqueios(periodos, bloqueios)
      if (d > 0) amostras.push({ key: e.key, nome: e.fields.summary, valor: d, data: dia(ultimaSaida) })
    } else if (aberto !== null && atual && EXPERIMENTANDO.includes(atual)) {
      emAberto.push({ key: e.key, nome: e.fields.summary, dias: subtrairBloqueios([...periodos, { inicio: aberto, fim: agora }], bloqueios) })
    }
  }
  return { amostras, emAberto }
}

/**
 * Benefício potencial das hipóteses validadas: Epics concluídos cuja iniciativa-mãe está em Aguardando piloto,
 * Piloto ou Escala (inclui Finalizado; as refutadas ficam de fora), como na Semanal. Conta no ano da validação: a
 * data mais recente entre a conclusão do Epic e a entrada da iniciativa nessas colunas.
 */
function beneficio(iniciativas: JiraIssue[], epics: JiraIssue[], logsIni: Record<string, ChangelogEntry[]>, logsEpic: Record<string, ChangelogEntry[]>, c: Classificador): Pick<Indicador, 'amostras' | 'emAberto'> {
  const maes = new Map(iniciativas.map(i => [i.key, i]))
  const amostras: Amostra[] = []
  for (const e of epics) {
    if (c.epic(e.fields.status.id, e.fields.status.name) !== 'concluido') continue
    const mae = e.fields.parent?.key ? maes.get(e.fields.parent.key) : undefined
    const etapaMae = mae ? c.iniciativa(mae.fields.status.id, mae.fields.status.name) : undefined
    if (!mae || !etapaMae || !ETAPAS_VALIDADAS.includes(etapaMae)) continue
    const concluiu = transicoes(logsEpic[e.key], c.epic).find(t => t.para === 'concluido')?.data ?? null
    const validou = transicoes(logsIni[mae.key], c.iniciativa).find(t => t.para && ETAPAS_VALIDADAS.includes(t.para))?.data ?? null
    const quando = [concluiu, validou].filter((d): d is string => !!d).sort((a, b) => Date.parse(b) - Date.parse(a))[0]
    if (!quando) continue
    amostras.push({ key: e.key, nome: e.fields.summary, valor: Number(e.fields.customfield_30216) || 0, data: dia(quando) })
  }
  return { amostras, emAberto: [] }
}

/** Cycle time de uma etapa do board de Ideação: soma dos períodos na etapa; conta no ano da última saída. */
function cycleTimeEstagio(iniciativas: JiraIssue[], logs: Record<string, ChangelogEntry[]>, c: Classificador, alvo: EtapaIniciativa, agora: number): Pick<Indicador, 'amostras' | 'emAberto'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  for (const ini of iniciativas) {
    const ts = transicoes(logs[ini.key], c.iniciativa)
    let entrou: number | null = null
    let total = 0
    let saiu: string | null = null
    for (const t of ts) {
      if (t.para === alvo && t.de !== alvo) entrou = Date.parse(t.data)
      else if (t.de === alvo && t.para !== alvo) {
        // Criada já na etapa: o período começa na criação do card.
        const inicio = entrou ?? (ini.fields.created ? Date.parse(ini.fields.created) : null)
        if (inicio !== null) total += Date.parse(t.data) - inicio
        entrou = null
        saiu = t.data
      }
    }
    if (c.iniciativa(ini.fields.status.id, ini.fields.status.name) === alvo) {
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
  board2734Config?: unknown
  board2735Config?: unknown
}, agora = new Date(), jiraUrl: string | null = null): ComparativoDados {
  const t = agora.getTime()
  const c = criarClassificador(raw.board2734Config, raw.board2735Config)
  const indicadores: Indicador[] = [
    {
      id: 'leadExploracao', titulo: 'Lead time da Exploração', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Da criação do card no board de Ideação até a entrada em Experimentação (passando por estruturação e consolidação). Conta no ano em que a iniciativa entrou em Experimentação.',
      ...leadExploracao(raw.iniciativas, raw.iniciativaChangelogs, c, t),
    },
    {
      id: 'leadExperimentacao', titulo: 'Lead time da Experimentação', unidade: 'dias', melhor: 'menor', board: 'Experimentação',
      regra: 'Experimentos concluídos: tempo em Em andamento e Em validação, sem os períodos bloqueados (mesma regra da aba Estratégia). Conta no ano em que o experimento saiu da experimentação.',
      ...leadExperimentacao(raw.epics, raw.epicChangelogs, c, t),
    },
    {
      id: 'beneficio', titulo: 'Benefício potencial validado', unidade: 'reais', melhor: 'maior', board: 'Experimentação',
      regra: 'Soma do benefício dos experimentos concluídos com hipótese validada (iniciativa-mãe em Aguardando piloto, Em piloto ou Em escala/Finalizado), como na Semanal. Refutadas não entram. Conta no ano da validação.',
      ...beneficio(raw.iniciativas, raw.epics, raw.iniciativaChangelogs, raw.epicChangelogs, c),
    },
    {
      id: 'aguardandoPiloto', titulo: 'Cycle time de Aguardando piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou em Aguardando piloto até sair da coluna. Conta no ano da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, c, 'aguardando', t),
    },
    {
      id: 'piloto', titulo: 'Cycle time do Piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou Em piloto até sair da coluna. Conta no ano da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, c, 'piloto', t),
    },
  ]
  // Itens cujo histórico de status não veio do Jira (erro ou limite de requisições) ficam fora dos cálculos.
  const cobertura = {
    iniciativas: { total: raw.iniciativas.length, semHistorico: raw.iniciativas.filter(i => !raw.iniciativaChangelogs[i.key]).length },
    epics: { total: raw.epics.length, semHistorico: raw.epics.filter(e => !raw.epicChangelogs[e.key]).length },
  }
  return { indicadores, cobertura, hoje: hojeEmSaoPaulo(agora), jiraUrl: jiraUrl ? jiraUrl.replace(/\/+$/, '') : null }
}

function hojeEmSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

