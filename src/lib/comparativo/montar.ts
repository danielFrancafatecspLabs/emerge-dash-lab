import type { ChangelogEntry } from '../jira'
import { getPeriodosBloqueio, subtrairBloqueios } from '../mappers'
import type { DashboardData, JiraIssue } from '../types'
import type { WeeklyData } from '../weekly'
import {
  criarClassificador, DEPOIS_DA_EXPLORACAO, ETAPAS_VALIDADAS, type Classificador, type EtapaEpic, type EtapaIniciativa,
} from './etapas'
import { type Amostra, type ComparativoDados, type EmAberto, type Experimento, type ForaDaConta, type IniciativaResumo, type Indicador } from './resumo'

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
 * descontados os períodos bloqueados. Conta no período em que o Epic saiu da experimentação.
 */
function leadExperimentacao(epics: JiraIssue[], logs: Record<string, ChangelogEntry[]>, c: Classificador, agora: number): Pick<Indicador, 'amostras' | 'emAberto' | 'foraDaConta'> {
  const amostras: Amostra[] = []
  const emAberto: EmAberto[] = []
  const foraDaConta: ForaDaConta[] = []
  for (const e of epics) {
    const atual = c.epic(e.fields.status.id, e.fields.status.name)
    const { periodos, aberto, ultimaSaida } = periodosExperimentacao(logs[e.key], c)
    const bloqueios = getPeriodosBloqueio(e.key, logs)
    if (atual === 'concluido') {
      // Concluídos que não dá para medir também aparecem, com o motivo, no período da conclusão.
      const concluiu = transicoes(logs[e.key], c.epic).find(t => t.para === 'concluido')?.data ?? null
      const fora = (motivo: string) => foraDaConta.push({ key: e.key, nome: e.fields.summary, motivo, data: concluiu ? dia(concluiu) : null })
      if (!logs[e.key]) { fora('Sem histórico de status no Jira'); continue }
      if (!periodos.length || !ultimaSaida) { fora('Concluído sem passar por Em andamento ou Em validação no histórico'); continue }
      const d = subtrairBloqueios(periodos, bloqueios)
      if (d > 0) amostras.push({ key: e.key, nome: e.fields.summary, valor: d, data: dia(ultimaSaida) })
      else fora('Tempo em experimentação zerado (mudanças de status no mesmo dia ou só bloqueado)')
    } else if (aberto !== null && atual && EXPERIMENTANDO.includes(atual)) {
      emAberto.push({ key: e.key, nome: e.fields.summary, dias: subtrairBloqueios([...periodos, { inicio: aberto, fim: agora }], bloqueios) })
    }
  }
  return { amostras, emAberto, foraDaConta }
}

/** Epic do board de Experimentação com a situação do Semanal; as datas dos eventos vêm do histórico. */
export type ExperimentoEntrada = Omit<Experimento, 'concluidoEm' | 'canceladoEm'> & { concluidoEm?: string | null }

/**
 * Todos os Epics do board de Experimentação com a situação de hoje, na mesma classificação do Semanal: as fases da
 * Weekly (Backlog, Em andamento, Cancelados, Concluídos) e, entre os concluídos, as hipóteses validadas (iniciativa em
 * Aguardando piloto, Piloto ou Escala) e as refutadas (o resto). O que não cai em nenhuma fase fica como "outro".
 */
export function experimentosDoSemanal(data: DashboardData, weekly: WeeklyData): ExperimentoEntrada[] {
  const chaves = (id: string) => new Set((weekly.stages.find(s => s.id === id)?.experimentos ?? []).map(r => r.key))
  const exploracao = chaves('backlog'), andamento = chaves('andamento'), cancelados = chaves('cancelados'), concluidos = chaves('concluidos')
  const validadas = new Set(weekly.epicsConsiderados.filter(e => e.grupo === 'validada').map(e => e.key))
  const labDaIniciativa = new Map(data.iniciativas.map(i => [i.key, i.timeResponsavel ?? null]))
  const texto = (v: string | null | undefined) => v?.trim() || null
  return data.allEpics.map(e => ({
    key: e.key, nome: e.nome, status: e.status.name, criadoEm: e.criadoEm ?? null, concluidoEm: e.concluidoEm ?? null,
    area: texto(e.dominio), lab: texto((e.parentKey ? labDaIniciativa.get(e.parentKey) : null) ?? e.timeResponsavel), diretoria: texto(e.diretoria),
    beneficio: e.beneficioQuantitativo && e.beneficioQuantitativo > 0 ? e.beneficioQuantitativo : null,
    situacao: validadas.has(e.key) ? 'validada' : concluidos.has(e.key) ? 'refutada' : cancelados.has(e.key) ? 'cancelada'
      : andamento.has(e.key) ? 'andamento' : exploracao.has(e.key) ? 'exploracao' : 'outro',
  }))
}

/** Datas de conclusão e de cancelamento pelo histórico (coluna do board); sem histórico, a conclusão do mapeamento. */
function comDatas(entradas: ExperimentoEntrada[], logs: Record<string, ChangelogEntry[]>, c: Classificador): Experimento[] {
  return entradas.map(e => {
    const ts = transicoes(logs[e.key], c.epic)
    const concluiu = ts.find(t => t.para === 'concluido')?.data ?? e.concluidoEm ?? null
    const cancelou = ts.find(t => t.para === 'cancelado')?.data ?? null
    return {
      ...e,
      criadoEm: e.criadoEm ? dia(e.criadoEm) : null,
      concluidoEm: concluiu ? dia(concluiu) : null,
      canceladoEm: cancelou ? dia(cancelou) : null,
    }
  })
}

/** Contagem de um evento por ano (conclusão ou cancelamento); quem não tem a data fica na lista de fora da conta. */
function eventos(lista: Experimento[], data: (e: Experimento) => string | null, valor: (e: Experimento) => number = () => 1): Pick<Indicador, 'amostras' | 'emAberto' | 'foraDaConta'> {
  return {
    amostras: lista.filter(e => data(e)).map(e => ({ key: e.key, nome: e.nome, valor: valor(e), data: data(e)! })),
    emAberto: [],
    foraDaConta: lista.filter(e => !data(e)).map(e => ({ key: e.key, nome: e.nome, motivo: 'Sem a data do evento no histórico do Jira', data: null })),
  }
}

/** Benefício: o total de hoje das hipóteses validadas (fecha com o Semanal) e quantas não têm data de conclusão. */
function conciliacao(validadas: Experimento[]): Indicador['conciliacao'] {
  return {
    total: validadas.reduce((s, h) => s + (h.beneficio ?? 0), 0),
    n: validadas.length,
    semData: validadas.filter(h => !h.concluidoEm).length,
  }
}

/** Iniciativas com a etapa de hoje e a primeira entrada em Experimentação, na validação, em Piloto e em Escala. */
function resumoIniciativas(iniciativas: JiraIssue[], logs: Record<string, ChangelogEntry[]>, c: Classificador): IniciativaResumo[] {
  return iniciativas.map(ini => {
    const ts = transicoes(logs[ini.key], c.iniciativa)
    const primeira = (etapas: EtapaIniciativa[]) => {
      const t = ts.find(x => x.para && etapas.includes(x.para) && !(x.de && etapas.includes(x.de)))
      return t ? dia(t.data) : null
    }
    return {
      key: ini.key, nome: ini.fields.summary,
      etapa: c.iniciativa(ini.fields.status.id, ini.fields.status.name) ?? null,
      criadoEm: ini.fields.created ? dia(ini.fields.created) : null,
      experimentacaoEm: primeira(DEPOIS_DA_EXPLORACAO),
      validadaEm: primeira(ETAPAS_VALIDADAS),
      pilotoEm: primeira(['piloto', 'escala']),
      escalaEm: primeira(['escala']),
    }
  })
}

/** Cycle time de uma etapa do board de Ideação: soma dos períodos na etapa; conta no período da última saída. */
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
  /** Todos os Epics do board de Experimentação, com a situação do Semanal (validada, refutada, cancelada…). */
  experimentos: ExperimentoEntrada[]
}, agora = new Date(), jiraUrl: string | null = null): ComparativoDados {
  const t = agora.getTime()
  const c = criarClassificador(raw.board2734Config, raw.board2735Config)
  const experimentos = comDatas(raw.experimentos, raw.epicChangelogs, c)
  const de = (...s: Experimento['situacao'][]) => experimentos.filter(e => s.includes(e.situacao))
  const validadas = de('validada')
  const indicadores: Indicador[] = [
    {
      id: 'concluidos', titulo: 'Experimentos concluídos', unidade: 'itens', melhor: 'maior', board: 'Experimentação', grupo: 'resultados',
      regra: 'Experimentos que chegaram a Concluído, com hipótese validada ou refutada. Conta no período em que o experimento foi concluído.',
      ...eventos(de('validada', 'refutada'), e => e.concluidoEm),
    },
    {
      id: 'validadas', titulo: 'Hipóteses validadas', unidade: 'itens', melhor: 'maior', board: 'Experimentação', grupo: 'resultados', relativoA: 'concluidos',
      regra: 'Experimentos concluídos cuja iniciativa-mãe seguiu para Aguardando piloto, Piloto ou Escala (os mesmos do Semanal). Conta no período em que o experimento foi concluído.',
      ...eventos(validadas, e => e.concluidoEm),
    },
    {
      id: 'refutadas', titulo: 'Hipóteses refutadas', unidade: 'itens', melhor: 'neutro', board: 'Experimentação', grupo: 'resultados', relativoA: 'concluidos',
      regra: 'Experimentos concluídos cuja iniciativa-mãe não seguiu para piloto: o experimento gerou aprendizado, mas não avançou. Conta no período da conclusão.',
      ...eventos(de('refutada'), e => e.concluidoEm),
    },
    {
      id: 'cancelados', titulo: 'Experimentos cancelados', unidade: 'itens', melhor: 'menor', board: 'Experimentação', grupo: 'resultados',
      regra: 'Experimentos encerrados antes de concluir. Conta no período em que o experimento foi para Cancelado.',
      ...eventos(de('cancelada'), e => e.canceladoEm),
    },
    {
      id: 'beneficio', titulo: 'Benefício das hipóteses validadas', unidade: 'reais', melhor: 'maior', board: 'Experimentação', grupo: 'resultados',
      regra: 'Os mesmos experimentos do número "Hipóteses validadas" do Semanal: concluídos, com a iniciativa-mãe em Aguardando piloto, Piloto ou Escala. Soma o benefício potencial de cada um no período em que o experimento foi concluído.',
      ...eventos(validadas, e => e.concluidoEm, e => e.beneficio ?? 0),
      conciliacao: conciliacao(validadas),
    },
    {
      id: 'leadExploracao', grupo: 'tempos', titulo: 'Lead time da Exploração', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Da criação do card no board de Ideação até a entrada em Experimentação (passando por estruturação e consolidação). Conta no período em que a iniciativa entrou em Experimentação.',
      ...leadExploracao(raw.iniciativas, raw.iniciativaChangelogs, c, t),
    },
    {
      id: 'leadExperimentacao', grupo: 'tempos', titulo: 'Lead time da Experimentação', unidade: 'dias', melhor: 'menor', board: 'Experimentação',
      regra: 'Experimentos concluídos: tempo em Em andamento e Em validação, sem os períodos bloqueados (mesma regra da aba Estratégia). Conta no período em que o experimento saiu da experimentação.',
      ...leadExperimentacao(raw.epics, raw.epicChangelogs, c, t),
    },
    {
      id: 'aguardandoPiloto', grupo: 'tempos', titulo: 'Cycle time de Aguardando piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou em Aguardando piloto até sair da coluna. Conta no período da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, c, 'aguardando', t),
    },
    {
      id: 'piloto', grupo: 'tempos', titulo: 'Cycle time do Piloto', unidade: 'dias', melhor: 'menor', board: 'Ideação',
      regra: 'Tempo que a iniciativa ficou Em piloto até sair da coluna. Conta no período da saída.',
      ...cycleTimeEstagio(raw.iniciativas, raw.iniciativaChangelogs, c, 'piloto', t),
    },
  ]
  // Itens cujo histórico de status não veio do Jira (erro ou limite de requisições) ficam fora dos cálculos.
  const cobertura = {
    iniciativas: { total: raw.iniciativas.length, semHistorico: raw.iniciativas.filter(i => !raw.iniciativaChangelogs[i.key]).length },
    epics: { total: raw.epics.length, semHistorico: raw.epics.filter(e => !raw.epicChangelogs[e.key]).length },
  }
  return { indicadores, experimentos, iniciativas: resumoIniciativas(raw.iniciativas, raw.iniciativaChangelogs, c), cobertura, hoje: hojeEmSaoPaulo(agora), jiraUrl: jiraUrl ? jiraUrl.replace(/\/+$/, '') : null }
}

function hojeEmSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

