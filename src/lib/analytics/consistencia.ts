import { epicBloqueado } from '@/lib/bloqueio'
import { buildMonitoramentoData } from '@/lib/mappers'
import { janelaDe, resumir as resumirIndicador, type ComparativoDados } from '@/lib/comparativo/resumo'
import { contagensDoFunil, ehCancelado, filtrarDashboardData, gruposDoFunil, resultadosDaEstrategia } from '@/lib/estrategia/resultados'
import { ehExperimentoConcluido } from '@/lib/concluido'
import { criarContexto, hipoteseDe, HIPOTESES, resumir } from '@/lib/portfolio/filtros'
import type { PortfolioDados } from '@/lib/portfolio/tipos'
import type { SemanalData } from '@/lib/semanal'
import type { DashboardData, EpicDetail, JiraBoardConfiguration, JiraStatus } from '@/lib/types'
import { etapaValidada, type WeeklyData } from '@/lib/weekly'
import type { Movimento } from './movimento'

/**
 * Agente de analytics: o "cientista analítico" que roda por baixo dos panos. Ele recalcula cada número com as mesmas
 * funções que cada tela usa (Semanal, Estratégia, Portfólio, Crescimento da Experimentação) e confere se as visões
 * contam a mesma história. Não decide qual tela está certa: aponta onde elas divergem, por quanto e POR QUÊ.
 *
 * Confere item por item, não só o total: duas telas com o mesmo número mas com experimentos diferentes também são
 * divergência. Quando diverge, o diagnóstico lista os itens que uma tela conta e a outra não e procura o que eles
 * têm em comum (o status), que costuma ser a causa.
 *
 * Dois tipos de achado:
 * - divergência: o mesmo indicador dá números diferentes em telas diferentes (precisa de correção);
 * - alerta: qualidade dos dados no Jira (experimento sem iniciativa, sem domínio…), que explica números estranhos.
 */

export type Visao = 'Semanal' | 'Estratégia' | 'Portfólio' | 'Crescimento'

/** Um item do Jira citado num diagnóstico. */
export interface ItemRef { key: string; nome: string; status: string }

/** Itens que uma visão conta e a outra não. */
export interface Diferenca { conta: string; naoConta: string; total: number; itens: ItemRef[] }

export interface Diagnostico {
  diferencas: Diferenca[]
  /** O que os itens divergentes têm em comum: a causa provável. */
  causa?: string
}

/**
 * De onde vem a divergência: 'telas' (duas telas do app discordam), 'jira' (a regra do app discorda da coluna do
 * board) ou 'soma' (uma conta que deveria fechar não fecha).
 */
export type Natureza = 'telas' | 'jira' | 'soma'

export interface Verificacao {
  id: string
  titulo: string
  /** Como o número é contado (para quem for corrigir). */
  regra: string
  valores: Partial<Record<Visao | string, number>>
  ok: boolean
  /** Maior diferença entre as visões. */
  diferenca: number
  formato?: 'numero' | 'moeda'
  natureza: Natureza
  /** Só nas divergências conferidas item por item. */
  diagnostico?: Diagnostico
}

export interface Alerta {
  id: string
  titulo: string
  quantidade: number
  /** Algumas chaves de exemplo, para ir direto ao Jira. */
  exemplos: string[]
}

export interface RelatorioConsistencia {
  geradoEm: string
  verificacoes: Verificacao[]
  alertas: Alerta[]
  divergencias: number
  /** A conclusão em frases curtas: quantas conferências batem, onde estão as divergências e a causa mais comum. */
  resumo: string[]
  /** O que mudou no Jira desde a leitura anterior (o runner preenche). */
  movimento?: Movimento
}

export interface EntradaConsistencia {
  /** O DashboardData como a Estratégia e o Portfólio montam (com histórico e classificação). */
  data: DashboardData
  /** O DashboardData como o Semanal monta. */
  dataSemanal: DashboardData
  weekly: WeeklyData
  semanal: SemanalData
  portfolio: PortfolioDados
  exploracaoIds?: string[]
  /**
   * Configuração dos boards no Jira: a fonte independente. Cada regra do app (por id ou nome de status) é conferida
   * contra a coluna em que o item realmente está no board.
   */
  board2734Config?: JiraBoardConfiguration
  board2735Config?: JiraBoardConfiguration
  /** Issues arquivadas no Jira que a leitura tirou de todas as contas. */
  arquivadas?: string[]
  /** Os dados do Comparativo, como a aba monta: o benefício potencial de cada ano tem de bater com a Estratégia. */
  comparativo?: ComparativoDados
  agora?: Date
}

const normal = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()

/** Coluna do board (nome normalizado) por id de status; vazio quando não há configuração. */
function colunas(config?: JiraBoardConfiguration): Map<string, string> {
  const m = new Map<string, string>()
  for (const c of config?.columnConfig?.columns ?? []) for (const st of c.statuses ?? []) if (st?.id) m.set(String(st.id), normal(c.name ?? ''))
  return m
}

/** Etapa da iniciativa pela coluna do board de Ideação (independente da regra por id/nome). */
function etapaPelaColuna(coluna: string | undefined): 'aguardando' | 'piloto' | 'escala' | null {
  if (!coluna) return null
  if (coluna.includes('AGUARDANDO')) return 'aguardando'
  // Finalizado é o status antigo de Em escala e conta como escala. "Concluído" NÃO: iniciativa concluída fora de
  // Em escala é hipótese que não seguiu (a regra oficial, lib/hipoteses.ts).
  if (coluna.includes('ESCALA') || coluna.includes('FINALIZ')) return 'escala'
  if (coluna.includes('PILOTO')) return 'piloto'
  return null
}

const rotuloDoStatus = (s: JiraStatus) => `${s.name} (id ${s.id})`

function comparar(id: string, titulo: string, regra: string, valores: Record<string, number>, formato: Verificacao['formato'] = 'numero', tolerancia = 0, natureza: Natureza = 'soma'): Verificacao {
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  return { id, titulo, regra, valores, ok: diferenca <= tolerancia, diferenca, formato, natureza }
}

/** O que uma visão mostra: só o número, as chaves dos itens, ou o número da tela com as chaves que o formam. */
type Mostra = number | string[] | { n: number; chaves: string[] }
type Catalogo = Map<string, ItemRef>

const LIMITE_DE_ITENS = 8

/** Status em comum dos itens divergentes: quando a maioria compartilha um status, é ali que a regra discorda. */
function causaProvavel(itens: ItemRef[]): string | undefined {
  if (!itens.length) return undefined
  const porStatus = new Map<string, number>()
  for (const i of itens) porStatus.set(i.status, (porStatus.get(i.status) ?? 0) + 1)
  const [status, n] = [...porStatus.entries()].sort((a, b) => b[1] - a[1])[0]
  if (n === itens.length) return `${n === 1 ? 'O item divergente está' : `Os ${n} itens divergentes estão`} com o status ${status}: as telas tratam esse status de formas diferentes.`
  if (n / itens.length >= 0.6) return `${n} dos ${itens.length} itens divergentes estão com o status ${status}: as telas tratam esse status de formas diferentes.`
  return undefined
}

/**
 * Confere as visões item por item. Bate quando todos os números são iguais E os conjuntos de itens são os mesmos.
 * Quando diverge, monta o diagnóstico: o que cada visão conta e a de referência (a primeira com itens) não.
 */
function conferir(id: string, titulo: string, regra: string, natureza: Natureza, visoes: Record<string, Mostra>, catalogo: Catalogo): Verificacao {
  const nome = Object.keys(visoes)
  const n = (m: Mostra) => (typeof m === 'number' ? m : Array.isArray(m) ? m.length : m.n)
  const chaves = (m: Mostra) => (typeof m === 'number' ? null : new Set(Array.isArray(m) ? m : m.chaves))
  const valores = Object.fromEntries(nome.map(v => [v, n(visoes[v])]))
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  const comItens = nome.map(v => [v, chaves(visoes[v])] as const).filter((x): x is readonly [string, Set<string>] => x[1] !== null)
  const ref = (k: string): ItemRef => catalogo.get(k) ?? { key: k, nome: '', status: 'fora da leitura do Jira' }
  const diferencas: Diferenca[] = []
  if (comItens.length > 1) {
    const [base, itensBase] = comItens[0]
    for (const [visao, itens] of comItens.slice(1)) {
      const soNaBase = [...itensBase].filter(k => !itens.has(k))
      const soNaVisao = [...itens].filter(k => !itensBase.has(k))
      if (soNaBase.length) diferencas.push({ conta: base, naoConta: visao, total: soNaBase.length, itens: soNaBase.slice(0, LIMITE_DE_ITENS).map(ref) })
      if (soNaVisao.length) diferencas.push({ conta: visao, naoConta: base, total: soNaVisao.length, itens: soNaVisao.slice(0, LIMITE_DE_ITENS).map(ref) })
    }
  }
  const ok = diferenca === 0 && diferencas.length === 0
  if (ok) return { id, titulo, regra, valores, ok, diferenca, formato: 'numero', natureza }
  // Itens distintos entre todas as diferenças (o mesmo item pode faltar em mais de uma visão).
  const divergentes = [...new Map(diferencas.flatMap(d => d.itens).map(i => [i.key, i])).values()]
  const mesmoTotal = diferenca === 0 ? 'Os totais são iguais, mas os itens não são os mesmos. ' : ''
  const causa = causaProvavel(divergentes)
  const diagnostico: Diagnostico | undefined = diferencas.length ? { diferencas, causa: mesmoTotal || causa ? `${mesmoTotal}${causa ?? ''}`.trim() : undefined } : undefined
  return { id, titulo, regra, valores, ok, diferenca, formato: 'numero', natureza, diagnostico }
}

const exemplos = (epics: { key: string }[]) => epics.slice(0, 5).map(e => e.key)

/**
 * Inventário dos status: onde a regra do app e a coluna do Jira discordam sobre um status, e status que nenhuma
 * coluna do board mostra. É aqui que costuma nascer a divergência entre telas.
 */
function inventarioDeStatus(e: EntradaConsistencia, colIni: Map<string, string>, colExp: Map<string, string>): Alerta[] {
  const alertas: Alerta[] = []
  const porStatus = <T extends { key: string; status: JiraStatus }>(itens: T[]) => {
    const m = new Map<string, { status: JiraStatus; itens: T[] }>()
    // Por id E nome: o mesmo id pode chegar com nomes diferentes (caixa, acento), e a regra do app olha o nome.
    for (const x of itens) {
      const chave = `${x.status.id}|${x.status.name}`
      const g = m.get(chave) ?? { status: x.status, itens: [] }
      g.itens.push(x)
      m.set(chave, g)
    }
    return [...m.values()]
  }
  if (colIni.size) {
    for (const g of porStatus(e.dataSemanal.iniciativas)) {
      const coluna = colIni.get(g.status.id)
      const regra = etapaValidada(g.status)
      const peloJira = etapaPelaColuna(coluna)
      if (!coluna) {
        alertas.push({ id: `ini-sem-coluna-${g.status.id}-${g.status.name}`, titulo: `Iniciativas com status ${rotuloDoStatus(g.status)} fora das colunas do board de Ideação`, quantidade: g.itens.length, exemplos: exemplos(g.itens) })
      } else if (regra !== peloJira) {
        alertas.push({
          id: `ini-regra-${g.status.id}-${g.status.name}`,
          titulo: `Status ${rotuloDoStatus(g.status)}, na coluna "${coluna}": a regra do app conta como ${regra ?? 'não validada'}, a coluna indica ${peloJira ?? 'não validada'}`,
          quantidade: g.itens.length, exemplos: exemplos(g.itens),
        })
      }
    }
  }
  if (colExp.size) {
    for (const g of porStatus(e.data.allEpics)) {
      if (!colExp.has(g.status.id)) {
        alertas.push({ id: `exp-sem-coluna-${g.status.id}-${g.status.name}`, titulo: `Experimentos com status ${rotuloDoStatus(g.status)} fora das colunas do board de Experimentação`, quantidade: g.itens.length, exemplos: exemplos(g.itens) })
      }
    }
  }
  return alertas
}

export function verificarConsistencia(e: EntradaConsistencia): RelatorioConsistencia {
  // ── Cada visão, com as funções da própria tela ──
  const tudo = filtrarDashboardData(e.data, { tipo: 'tudo' })
  const est = resultadosDaEstrategia(tudo)
  const funil = contagensDoFunil(tudo.allEpics)
  const crescimento = buildMonitoramentoData(tudo, { tipo: 'tudo' }, e.data.allEpics)
  const ctx = criarContexto(e.portfolio)
  const portIni = resumir(e.portfolio.iniciativas, ctx, true)
  const portExp = resumir(e.portfolio.experimentos, ctx, true)
  const fatia = (id: string) => e.semanal.resumo.fatias.find(f => f.id === id)?.quantidade ?? 0
  const etapa = (id: string) => e.weekly.stages.find(s => s.id === id)?.quantidade ?? 0
  const expPorSituacao = (s: string) => e.portfolio.experimentos.filter(x => x.situacao === s).length

  // Catálogo para os diagnósticos: nome e status de cada experimento e iniciativa.
  const catalogo: Catalogo = new Map()
  for (const x of [...e.data.allEpics, ...e.dataSemanal.allEpics, ...e.data.iniciativas, ...e.dataSemanal.iniciativas]) {
    catalogo.set(x.key, { key: x.key, nome: x.nome, status: rotuloDoStatus(x.status) })
  }
  const k = (xs: { key: string }[]) => xs.map(x => x.key)
  const grupos = gruposDoFunil(tudo.allEpics)
  const fase = (id: string) => k(e.weekly.stages.find(s => s.id === id)?.experimentos ?? [])
  const portExpDe = (teste: (x: PortfolioDados['experimentos'][number]) => boolean) => k(e.portfolio.experimentos.filter(teste))
  const portIniNa = (et: string) => k(e.portfolio.iniciativas.filter(i => etapaValidada({ id: i.statusId, name: i.status }) === et))

  const verificacoes: Verificacao[] = [
    conferir('total', 'Total de experimentos', 'Todos os Epics do board de Experimentação.', 'telas', {
      Semanal: { n: e.semanal.resumo.totalExperimentos, chaves: k(e.dataSemanal.allEpics) }, 'Estratégia (Tudo)': k(grupos.total), Portfólio: k(e.portfolio.experimentos),
    }, catalogo),
    conferir('validadas', 'Hipóteses validadas', 'Experimentos concluídos com a iniciativa em Aguardando piloto, Em piloto ou Em escala (lib/hipoteses.ts).', 'telas', {
      Semanal: fatia('validadas'), 'Estratégia (Tudo)': k(est.hipoteses.validadas), Portfólio: portExpDe(x => hipoteseDe(x, ctx) === HIPOTESES[0]),
      'Comparativo / benefício do Semanal': k(e.weekly.epicsConsiderados.filter(x => x.grupo === 'validada')),
    }, catalogo),
    conferir('refutadas', 'Hipóteses refutadas', 'Experimentos concluídos com a iniciativa fora dessas colunas.', 'telas', {
      Semanal: fatia('refutadas'), 'Estratégia (Tudo)': k(est.hipoteses.refutadas), Portfólio: portExpDe(x => hipoteseDe(x, ctx) === HIPOTESES[1]),
      'Comparativo / benefício do Semanal': e.weekly.foraDaConta.refutados,
    }, catalogo),
    conferir('aguardando', 'Aguardando piloto (iniciativas)', 'Iniciativas em Aguardando piloto.', 'telas', {
      Semanal: { n: etapa('aguardando'), chaves: fase('aguardando') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['AGUARDANDO PILOTO']),
      Portfólio: portIniNa('aguardando'), Operacional: e.data.pipeline['AGUARDANDO PILOTO'],
    }, catalogo),
    conferir('piloto', 'Em piloto (iniciativas)', 'Iniciativas em Em piloto.', 'telas', {
      Semanal: { n: etapa('piloto'), chaves: fase('piloto') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['EM PILOTO']),
      Portfólio: portIniNa('piloto'), Operacional: e.data.pipeline['EM PILOTO'],
    }, catalogo),
    conferir('escala', 'Em escala (iniciativas)', 'Iniciativas em Em escala (Finalizado conta como Em escala).', 'telas', {
      Semanal: { n: etapa('escala'), chaves: fase('escala') }, 'Estratégia (Tudo)': k(est.hipoteses.porEtapa['EM ESCALA']),
      Portfólio: portIniNa('escala'), Operacional: e.data.pipeline['EM ESCALA'],
    }, catalogo),
    conferir('andamento', 'Em andamento', 'Epics em Em andamento ou Em validação.', 'telas', {
      Semanal: { n: fatia('andamento'), chaves: fase('andamento') }, 'Estratégia (Tudo)': k([...grupos.emAndamento, ...grupos.emValidacao]),
    }, catalogo),
    conferir('cancelados', 'Cancelados', 'Epics cancelados (inclui Descontinuado).', 'telas', {
      Semanal: { n: fatia('cancelados'), chaves: fase('cancelados') }, 'Estratégia (Tudo)': k(grupos.cancelados), Portfólio: portExpDe(x => x.situacao === 'cancelado'),
    }, catalogo),
    conferir('concluidos', 'Experimentos concluídos', 'Epics em Concluído.', 'telas', {
      Semanal: { n: e.weekly.experimentosConcluidos, chaves: fase('concluidos') }, 'Estratégia (Tudo)': k(grupos.concluidos),
      Crescimento: { n: crescimento.burnup.realizado.at(-1)?.valor ?? 0, chaves: k(crescimento.burnup.realizado.at(-1)?.epics ?? []) },
      Portfólio: portExpDe(x => x.situacao === 'concluido'),
    }, catalogo),
    comparar('beneficio', 'Benefício potencial (sem cancelados)', 'Soma do benefício dos Epics, tirando os cancelados.', {
      'Estratégia (Tudo)': est.beneficio, 'Portfólio (experimentos)': portExp.beneficio,
    }, 'moeda', 1, 'telas'),
  ]

  // Conta independente da regra do app: lê só o NOME do status (o id é reaproveitado entre boards no Jira). Nenhum
  // experimento com status "Cancelado"/"Descontinuado" pode entrar no benefício potencial nem na lista dele.
  const pareceCancelado = (x: { status: { id: string; name: string } }) =>
    /CANCEL|DESCONTINU/.test((x.status?.name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  verificacoes.push(
    comparar('beneficio-pelo-nome', 'Benefício potencial sem nenhum status de nome cancelado',
      'Soma direta do benefício, tirando todo Epic cujo nome de status diz cancelado/descontinuado.', {
        'Estratégia (Tudo)': est.beneficio,
        'Conta direta pelo nome do status': e.data.allEpics.reduce((acc, x) => acc + (pareceCancelado(x) ? 0 : x.beneficioQuantitativo ?? 0), 0),
      }, 'moeda', 1),
    comparar('lista-beneficio-sem-cancelado', 'Cancelados na lista do benefício potencial',
      'Epics com status de nome cancelado na lista "contribuem para o benefício" (tem de ser zero).', {
        'Lista da Estratégia': est.comBeneficio.filter(pareceCancelado).length, Esperado: 0,
      }),
  )

  // Visão de iniciativas do Portfólio: fica de fora o Epic sem iniciativa e entra o benefício próprio da iniciativa sem
  // experimento. Descontadas essas duas diferenças conhecidas, tem de bater com a visão de experimentos.
  const orfaos = e.data.allEpics.filter(x => !x.parentKey || !e.data.iniciativas.some(i => i.key === x.parentKey))
  const beneficioOrfaos = orfaos.reduce((s, x) => s + (ehCancelado(x) ? 0 : x.beneficioQuantitativo ?? 0), 0)
  const proprioSemExp = e.portfolio.iniciativas
    .filter(i => !i.experimentos.length && i.situacao !== 'cancelado')
    .reduce((s, i) => s + (i.beneficio ?? 0), 0)
  verificacoes.push(comparar('beneficio-iniciativas', 'Benefício na visão de iniciativas do Portfólio',
    'Visão de experimentos − Epics sem iniciativa + benefício próprio das iniciativas sem experimento.', {
      'Portfólio (iniciativas)': portIni.beneficio, 'Esperado pelos experimentos': portExp.beneficio - beneficioOrfaos + proprioSemExp,
    }, 'moeda', 1, 'telas'))

  // Bloqueados: só experimentos em experimentação (andamento ou validação), com a regra de bloqueio do app.
  const emExperimentacao = (x: EpicDetail) => ['3', '10204'].includes(x.status?.id) || /andamento|valida/i.test(x.status?.name ?? '')
  verificacoes.push(conferir('bloqueados', 'Experimentos bloqueados', 'Em andamento ou em validação, com sinal de bloqueio.', 'telas', {
    Portfólio: portExpDe(x => x.bloqueado), 'Regra do app (lib/bloqueio)': k(e.data.allEpics.filter(x => emExperimentacao(x) && epicBloqueado(x))),
  }, catalogo))

  // As 5 fatias do Semanal precisam somar o total de experimentos.
  const somaFatias = ['exploracao', 'andamento', 'validadas', 'refutadas', 'cancelados'].reduce((s, id) => s + fatia(id), 0)
  verificacoes.push(comparar('fatias-semanal', 'As 5 fatias do Semanal somam o total', 'Exploração + andamento + validadas + refutadas + cancelados = total de Epics.', {
    'Soma das fatias': somaFatias, 'Total de Epics': e.dataSemanal.allEpics.length,
  }))

  // ── Contra a fonte independente: a coluna real de cada item nos boards do Jira ──
  const colIni = colunas(e.board2734Config)
  const colExp = colunas(e.board2735Config)
  if (colIni.size) {
    // O que o Operacional mostra: as contagens do pipeline do DashboardData.
    for (const [et, titulo, stage] of [['aguardando', 'Aguardando piloto', 'AGUARDANDO PILOTO'], ['piloto', 'Em piloto', 'EM PILOTO'], ['escala', 'Em escala', 'EM ESCALA']] as const) {
      verificacoes.push(conferir(`coluna-${et}`, `${titulo}: regra do app × coluna no Jira`,
        'A regra do Semanal (por id/nome de status) e a do Operacional (por estágio) contra a coluna em que a iniciativa está no board de Ideação.', 'jira', {
          'Semanal (regra por status)': k(e.dataSemanal.iniciativas.filter(i => etapaValidada(i.status) === et)),
          'Operacional (estágio)': e.data.pipeline[stage],
          'Coluna no Jira': k(e.dataSemanal.iniciativas.filter(i => etapaPelaColuna(colIni.get(i.status.id)) === et)),
        }, catalogo))
    }
  }
  if (colExp.size) {
    const naColuna = (teste: (c: string) => boolean) => k(e.data.allEpics.filter(x => teste(colExp.get(x.status.id) ?? '')))
    verificacoes.push(conferir('coluna-concluidos', 'Concluídos: regra do app × coluna no Jira', 'Status Concluído (id 10019) contra a coluna Concluído do board de Experimentação.', 'jira', {
      'Regra do app': k(e.data.allEpics.filter(ehExperimentoConcluido)), 'Coluna no Jira': naColuna(c => c.includes('CONCLU') || c === 'DONE'),
    }, catalogo))
    verificacoes.push(conferir('coluna-cancelados', 'Cancelados: regra do app × coluna no Jira', 'Regra de cancelado do app contra a coluna Cancelado do board de Experimentação.', 'jira', {
      'Regra do app': k(e.data.allEpics.filter(ehCancelado)), 'Coluna no Jira': naColuna(c => c.includes('CANCEL') || c.includes('DESCONTINU')),
    }, catalogo))
    verificacoes.push(conferir('coluna-andamento', 'Em andamento: regra do app × coluna no Jira', 'Em andamento + Em validação contra as colunas de andamento e validação do board.', 'jira', {
      'Regra do app': k([...grupos.emAndamento, ...grupos.emValidacao]), 'Coluna no Jira': naColuna(c => c.includes('ANDAMENTO') || c.includes('VALIDA')),
    }, catalogo))
  }

  // ── Período: o funil e o Crescimento precisam contar os mesmos concluídos ──
  for (const periodo of [{ tipo: 'ultimos12' } as const, { tipo: 'ano', ano: (e.agora ?? new Date()).getFullYear() } as const]) {
    const d = filtrarDashboardData(e.data, periodo)
    const m = buildMonitoramentoData(d, periodo, e.data.allEpics)
    verificacoes.push(comparar(`periodo-${periodo.tipo}`, `Concluídos em ${periodo.tipo === 'ultimos12' ? 'Últimos 12 meses' : `Todo ${periodo.ano}`}: funil × Crescimento`,
      'Experimentos concluídos no período: o funil da Estratégia e o "+N no período" do Crescimento da Experimentação.', {
        'Funil (Estratégia)': contagensDoFunil(d.allEpics).concluidos, 'Crescimento (+N no período)': m.experimentosConcluidos,
      }, 'numero', 0, 'telas'))
  }

  // ── Períodos somam: 1º semestre + 2º semestre = o ano todo (cada experimento cai em um período só) ──
  const anoAtual = (e.agora ?? new Date()).getFullYear()
  for (const ano of [anoAtual - 1, anoAtual]) {
    const doPeriodo = (p: Parameters<typeof filtrarDashboardData>[1]) => {
      const d = filtrarDashboardData(e.data, p)
      return { beneficio: resultadosDaEstrategia(d).beneficio, experimentos: d.allEpics.length, concluidos: contagensDoFunil(d.allEpics).concluidos }
    }
    const s1 = doPeriodo({ tipo: 'semestre', ano, semestre: 1 })
    const s2 = doPeriodo({ tipo: 'semestre', ano, semestre: 2 })
    const todo = doPeriodo({ tipo: 'ano', ano })
    verificacoes.push(
      comparar(`semestres-beneficio-${ano}`, `Benefício potencial: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Os semestres somados têm de dar o ano: nenhum experimento conta em dois períodos.', {
          'Soma dos semestres': s1.beneficio + s2.beneficio, [`Todo ${ano}`]: todo.beneficio,
        }, 'moeda', 1),
      comparar(`semestres-experimentos-${ano}`, `Experimentos: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Total de experimentos e concluídos dos semestres somados contra o ano.', {
          'Soma dos semestres': s1.experimentos + s2.experimentos, [`Todo ${ano}`]: todo.experimentos,
        }),
      comparar(`semestres-concluidos-${ano}`, `Concluídos: 1º + 2º semestre de ${ano} = Todo ${ano}`,
        'Experimentos concluídos em cada semestre, somados, contra o ano.', {
          'Soma dos semestres': s1.concluidos + s2.concluidos, [`Todo ${ano}`]: todo.concluidos,
        }),
    )
  }

  // ── Comparativo × Estratégia: o benefício potencial de cada ano é a mesma conta nas duas abas ──
  const benComp = e.comparativo?.indicadores.find(i => i.id === 'beneficio')
  if (benComp) {
    for (const ano of [anoAtual - 1, anoAtual]) {
      verificacoes.push(comparar(`comparativo-beneficio-${ano}`, `Benefício potencial de ${ano}: Comparativo × Estratégia`,
        'O cartão de benefício do Comparativo e o Benefício Potencial da Estratégia em "Todo ano" somam os mesmos experimentos.', {
          'Comparativo': resumirIndicador(benComp, janelaDe(String(ano))).soma,
          [`Estratégia (Todo ${ano})`]: resultadosDaEstrategia(filtrarDashboardData(e.data, { tipo: 'ano', ano })).beneficio,
        }, 'moeda', 1, 'telas'))
    }
  }

  // ── Metas: as três metas mais os sem meta somam os experimentos não cancelados ──
  const metas = tudo.metasAgregadas
  verificacoes.push(comparar('metas', 'Metas: soma das metas + sem meta = experimentos não cancelados', 'Cada experimento não cancelado está em uma meta ou na lista de sem meta.', {
    'Metas + sem meta': metas.EBITDA.count + metas.NPS.count + metas.Receita.count + est.semMeta.length,
    'Experimentos não cancelados': tudo.allEpics.filter(x => !ehCancelado(x)).length,
  }))

  // ── Qualidade dos dados no Jira ──
  const chavesIni = new Set(e.data.iniciativas.map(i => i.key))
  const semMae = e.data.allEpics.filter(x => !x.parentKey)
  const maeInexistente = e.data.allEpics.filter(x => x.parentKey && !chavesIni.has(x.parentKey))
  const dominioDaMae = new Map(e.data.iniciativas.map(i => [i.key, i.dominio || i.dominios[0] || null]))
  const semDominio = e.data.allEpics.filter(x => !ehCancelado(x) && !x.dominio?.trim() && !(x.parentKey && dominioDaMae.get(x.parentKey)))
  const etapaSemConcluido = e.data.iniciativas.filter(i => etapaValidada(i.status) && !i.epics.some(x => x.status?.id === '10019'))
  const bloqueioForaDeExperimentacao = e.data.allEpics.filter(x => !emExperimentacao(x) && epicBloqueado(x))
  // Datas: concluído sem a data de conclusão cai, nos filtros de período, no período da criação.
  const concluidos = e.data.allEpics.filter(ehExperimentoConcluido)
  const concluidoSemData = concluidos.filter(x => !x.concluidoEm)
  const datasIncoerentes = concluidos.filter(x => x.concluidoEm && x.criadoEm && Date.parse(x.concluidoEm) < Date.parse(x.criadoEm))
  // Benefício: um experimento que sozinho passa de 20% do total merece conferência do valor cadastrado.
  const concentrados = est.beneficio > 0 ? est.comBeneficio.filter(x => (x.beneficioQuantitativo ?? 0) / est.beneficio >= 0.2) : []
  const validadasSemBeneficio = est.hipoteses.validadas.filter(x => !(x.beneficioQuantitativo && x.beneficioQuantitativo > 0))
  // Mesmo nome em mais de um experimento não cancelado: possível cadastro duplicado (o benefício entra duas vezes).
  const porNome = new Map<string, EpicDetail[]>()
  for (const x of e.data.allEpics) if (!ehCancelado(x)) porNome.set(normal(x.nome), [...(porNome.get(normal(x.nome)) ?? []), x])
  const duplicados = [...porNome.values()].filter(g => g.length > 1)
  const alertas: Alerta[] = [
    { id: 'sem-iniciativa', titulo: 'Experimentos sem iniciativa-mãe', quantidade: semMae.length, exemplos: exemplos(semMae) },
    { id: 'mae-inexistente', titulo: 'Experimentos com iniciativa-mãe fora do board de Ideação', quantidade: maeInexistente.length, exemplos: exemplos(maeInexistente) },
    { id: 'sem-dominio', titulo: 'Experimentos sem domínio (nem no experimento nem na iniciativa)', quantidade: semDominio.length, exemplos: exemplos(semDominio) },
    { id: 'sem-meta', titulo: 'Experimentos sem meta estratégica (classificação da IA pendente)', quantidade: est.semMeta.length, exemplos: exemplos(est.semMeta) },
    {
      id: 'etapa-sem-concluido', titulo: 'Iniciativas em aguardando piloto, piloto ou escala sem experimento concluído (contam nas etapas, não nas hipóteses)',
      quantidade: etapaSemConcluido.length, exemplos: exemplos(etapaSemConcluido),
    },
    { id: 'bloqueio-fora', titulo: 'Sinal de bloqueio fora de experimentação (não conta em Bloqueados)', quantidade: bloqueioForaDeExperimentacao.length, exemplos: exemplos(bloqueioForaDeExperimentacao) },
    ...inventarioDeStatus(e, colIni, colExp),
    { id: 'concluido-sem-data', titulo: 'Concluídos sem data de conclusão no histórico (nos filtros de período, contam pela criação)', quantidade: concluidoSemData.length, exemplos: exemplos(concluidoSemData) },
    { id: 'datas-incoerentes', titulo: 'Concluídos com data de conclusão anterior à criação', quantidade: datasIncoerentes.length, exemplos: exemplos(datasIncoerentes) },
    {
      id: 'beneficio-concentrado', titulo: 'Experimentos que sozinhos passam de 20% do benefício potencial (confira o valor cadastrado)', quantidade: concentrados.length,
      exemplos: concentrados.slice(0, 5).map(x => `${x.key} (${Math.round(((x.beneficioQuantitativo ?? 0) / est.beneficio) * 100)}%)`),
    },
    { id: 'validadas-sem-beneficio', titulo: 'Hipóteses validadas sem benefício cadastrado', quantidade: validadasSemBeneficio.length, exemplos: exemplos(validadasSemBeneficio) },
    {
      id: 'possiveis-duplicados', titulo: 'Experimentos com o mesmo nome (possível cadastro duplicado)', quantidade: duplicados.reduce((t, g) => t + g.length, 0),
      exemplos: duplicados.slice(0, 5).map(g => g.map(x => x.key).join(' = ')),
    },
    { id: 'cancelados-com-beneficio', titulo: 'Cancelados com benefício (fora do benefício potencial)', quantidade: est.cancelados.epics.length, exemplos: exemplos(est.cancelados.epics) },
    { id: 'arquivadas', titulo: 'Arquivadas no Jira, fora de todas as contas', quantidade: e.arquivadas?.length ?? 0, exemplos: (e.arquivadas ?? []).slice(0, 8) },
  ].filter(a => a.quantidade > 0)

  return {
    geradoEm: (e.agora ?? new Date()).toISOString(),
    verificacoes,
    alertas,
    divergencias: verificacoes.filter(v => !v.ok).length,
    resumo: resumoDoRelatorio(verificacoes),
  }
}

const NOME_DA_NATUREZA: Record<Natureza, [string, string]> = {
  telas: ['entre telas do app', 'entre telas do app'],
  jira: ['entre a regra do app e as colunas do Jira', 'entre a regra do app e as colunas do Jira'],
  soma: ['numa conta que deveria fechar', 'em contas que deveriam fechar'],
}

/** A conclusão em frases: o placar, onde estão as divergências e a causa que mais se repete. */
function resumoDoRelatorio(verificacoes: Verificacao[]): string[] {
  const falhas = verificacoes.filter(v => !v.ok)
  const frases = [falhas.length
    ? `${verificacoes.length} conferências: ${verificacoes.length - falhas.length} batem e ${falhas.length} ${falhas.length === 1 ? 'diverge' : 'divergem'}.`
    : `${verificacoes.length} conferências, todas batem: as telas contam a mesma história, item por item.`]
  for (const natureza of ['telas', 'jira', 'soma'] as const) {
    const n = falhas.filter(v => v.natureza === natureza).length
    if (n) frases.push(`${n} ${n === 1 ? 'divergência' : 'divergências'} ${NOME_DA_NATUREZA[natureza][n === 1 ? 0 : 1]}.`)
  }
  // A mesma causa em várias divergências é uma correção só.
  const causas = new Map<string, number>()
  for (const v of falhas) if (v.diagnostico?.causa) causas.set(v.diagnostico.causa, (causas.get(v.diagnostico.causa) ?? 0) + 1)
  const repetida = [...causas.entries()].sort((a, b) => b[1] - a[1])[0]
  if (repetida && repetida[1] > 1) frases.push(`${repetida[1]} delas têm a mesma causa provável: ${repetida[0]}`)
  return frases
}
