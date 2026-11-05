import { epicBloqueado } from '@/lib/bloqueio'
import { buildMonitoramentoData } from '@/lib/mappers'
import { contagensDoFunil, ehCancelado, filtrarDashboardData, resultadosDaEstrategia } from '@/lib/estrategia/resultados'
import { ehExperimentoConcluido } from '@/lib/concluido'
import { criarContexto, resumir } from '@/lib/portfolio/filtros'
import type { PortfolioDados } from '@/lib/portfolio/tipos'
import type { SemanalData } from '@/lib/semanal'
import type { DashboardData, EpicDetail, JiraBoardConfiguration, JiraStatus } from '@/lib/types'
import { etapaValidada, type WeeklyData } from '@/lib/weekly'

/**
 * Agente de analytics: o "cientista analítico" que roda por baixo dos panos. Ele recalcula cada número com as mesmas
 * funções que cada tela usa (Semanal, Estratégia, Portfólio, Crescimento da Experimentação) e confere se as visões
 * contam a mesma história. Não decide qual tela está certa: aponta onde elas divergem e por quanto.
 *
 * Dois tipos de achado:
 * - divergência: o mesmo indicador dá números diferentes em telas diferentes (precisa de correção);
 * - alerta: qualidade dos dados no Jira (experimento sem iniciativa, sem domínio…), que explica números estranhos.
 */

export type Visao = 'Semanal' | 'Estratégia' | 'Portfólio' | 'Crescimento'

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
  // Finalizado é o status antigo de Em escala: a coluna Concluído/Finalizado do board de Ideação conta como escala.
  if (coluna.includes('ESCALA') || coluna.includes('FINALIZ') || coluna.includes('CONCLU')) return 'escala'
  if (coluna.includes('PILOTO')) return 'piloto'
  return null
}

const rotuloDoStatus = (s: JiraStatus) => `${s.name} (id ${s.id})`

function comparar(id: string, titulo: string, regra: string, valores: Record<string, number>, formato: Verificacao['formato'] = 'numero', tolerancia = 0): Verificacao {
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  return { id, titulo, regra, valores, ok: diferenca <= tolerancia, diferenca, formato }
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

  const verificacoes: Verificacao[] = [
    comparar('total', 'Total de experimentos', 'Todos os Epics do board de Experimentação.', {
      Semanal: e.semanal.resumo.totalExperimentos, 'Estratégia (Tudo)': funil.total, Portfólio: e.portfolio.experimentos.length,
    }),
    comparar('validadas', 'Hipóteses validadas', 'Experimentos concluídos com a iniciativa em Aguardando piloto, Em piloto ou Em escala (lib/hipoteses.ts).', {
      Semanal: fatia('validadas'), 'Estratégia (Tudo)': est.hipoteses.validadas.length, Portfólio: portExp.validadas,
      'Comparativo / benefício do Semanal': e.weekly.epicsConsiderados.filter(x => x.grupo === 'validada').length,
    }),
    comparar('refutadas', 'Hipóteses refutadas', 'Experimentos concluídos com a iniciativa fora dessas colunas.', {
      Semanal: fatia('refutadas'), 'Estratégia (Tudo)': est.hipoteses.refutadas.length, Portfólio: portExp.refutadas,
      'Comparativo / benefício do Semanal': e.weekly.foraDaConta.refutados,
    }),
    comparar('aguardando', 'Aguardando piloto (iniciativas)', 'Iniciativas em Aguardando piloto.', {
      Semanal: etapa('aguardando'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['AGUARDANDO PILOTO'].length,
      Portfólio: portIni.porEtapa.aguardando, Operacional: e.data.pipeline['AGUARDANDO PILOTO'],
    }),
    comparar('piloto', 'Em piloto (iniciativas)', 'Iniciativas em Em piloto.', {
      Semanal: etapa('piloto'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['EM PILOTO'].length,
      Portfólio: portIni.porEtapa.piloto, Operacional: e.data.pipeline['EM PILOTO'],
    }),
    comparar('escala', 'Em escala (iniciativas)', 'Iniciativas em Em escala (Finalizado conta como Em escala).', {
      Semanal: etapa('escala'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['EM ESCALA'].length,
      Portfólio: portIni.porEtapa.escala, Operacional: e.data.pipeline['EM ESCALA'],
    }),
    comparar('andamento', 'Em andamento', 'Epics em Em andamento ou Em validação.', {
      Semanal: fatia('andamento'), 'Estratégia (Tudo)': funil.emAndamento + funil.emValidacao,
    }),
    comparar('cancelados', 'Cancelados', 'Epics cancelados (inclui Descontinuado).', {
      Semanal: fatia('cancelados'), 'Estratégia (Tudo)': funil.cancelados, Portfólio: expPorSituacao('cancelado'),
    }),
    comparar('concluidos', 'Experimentos concluídos', 'Epics em Concluído.', {
      Semanal: e.weekly.experimentosConcluidos, 'Estratégia (Tudo)': funil.concluidos,
      Crescimento: crescimento.burnup.realizado.at(-1)?.valor ?? 0, Portfólio: expPorSituacao('concluido'),
    }),
    comparar('beneficio', 'Benefício potencial (sem cancelados)', 'Soma do benefício dos Epics, tirando os cancelados.', {
      'Estratégia (Tudo)': est.beneficio, 'Portfólio (experimentos)': portExp.beneficio,
    }, 'moeda', 1),
  ]

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
    }, 'moeda', 1))

  // Bloqueados: só experimentos em experimentação (andamento ou validação), com a regra de bloqueio do app.
  const emExperimentacao = (x: EpicDetail) => ['3', '10204'].includes(x.status?.id) || /andamento|valida/i.test(x.status?.name ?? '')
  verificacoes.push(comparar('bloqueados', 'Experimentos bloqueados', 'Em andamento ou em validação, com sinal de bloqueio.', {
    Portfólio: portExp.bloqueados, 'Regra do app (lib/bloqueio)': e.data.allEpics.filter(x => emExperimentacao(x) && epicBloqueado(x)).length,
  }))

  // As 5 fatias do Semanal precisam somar o total de experimentos.
  const somaFatias = ['exploracao', 'andamento', 'validadas', 'refutadas', 'cancelados'].reduce((s, id) => s + fatia(id), 0)
  verificacoes.push(comparar('fatias-semanal', 'As 5 fatias do Semanal somam o total', 'Exploração + andamento + validadas + refutadas + cancelados = total de Epics.', {
    'Soma das fatias': somaFatias, 'Total de Epics': e.dataSemanal.allEpics.length,
  }))

  // ── Contra a fonte independente: a coluna real de cada item nos boards do Jira ──
  const colIni = colunas(e.board2734Config)
  const colExp = colunas(e.board2735Config)
  if (colIni.size) {
    const pelaColuna = (etapa: string) => e.dataSemanal.iniciativas.filter(i => etapaPelaColuna(colIni.get(i.status.id)) === etapa).length
    // O que o Operacional mostra: as contagens do pipeline do DashboardData.
    const peloPipeline = (stage: 'AGUARDANDO PILOTO' | 'EM PILOTO' | 'EM ESCALA') => e.data.pipeline[stage]
    for (const [etapa, titulo, stage] of [['aguardando', 'Aguardando piloto', 'AGUARDANDO PILOTO'], ['piloto', 'Em piloto', 'EM PILOTO'], ['escala', 'Em escala', 'EM ESCALA']] as const) {
      verificacoes.push(comparar(`coluna-${etapa}`, `${titulo}: regra do app × coluna no Jira`,
        'A regra do Semanal (por id/nome de status) e a do Operacional (por estágio) contra a coluna em que a iniciativa está no board de Ideação.', {
          'Semanal (regra por status)': e.dataSemanal.iniciativas.filter(i => etapaValidada(i.status) === etapa).length,
          'Operacional (estágio)': peloPipeline(stage),
          'Coluna no Jira': pelaColuna(etapa),
        }))
    }
  }
  if (colExp.size) {
    const naColuna = (teste: (c: string) => boolean) => e.data.allEpics.filter(x => teste(colExp.get(x.status.id) ?? '')).length
    verificacoes.push(comparar('coluna-concluidos', 'Concluídos: regra do app × coluna no Jira', 'Status Concluído (id 10019) contra a coluna Concluído do board de Experimentação.', {
      'Regra do app': e.data.allEpics.filter(ehExperimentoConcluido).length, 'Coluna no Jira': naColuna(c => c.includes('CONCLU') || c === 'DONE'),
    }))
    verificacoes.push(comparar('coluna-cancelados', 'Cancelados: regra do app × coluna no Jira', 'Regra de cancelado do app contra a coluna Cancelado do board de Experimentação.', {
      'Regra do app': e.data.allEpics.filter(ehCancelado).length, 'Coluna no Jira': naColuna(c => c.includes('CANCEL') || c.includes('DESCONTINU')),
    }))
    verificacoes.push(comparar('coluna-andamento', 'Em andamento: regra do app × coluna no Jira', 'Em andamento + Em validação contra as colunas de andamento e validação do board.', {
      'Regra do app': funil.emAndamento + funil.emValidacao, 'Coluna no Jira': naColuna(c => c.includes('ANDAMENTO') || c.includes('VALIDA')),
    }))
  }

  // ── Período: o funil e o Crescimento precisam contar os mesmos concluídos ──
  for (const periodo of [{ tipo: 'ultimos12' } as const, { tipo: 'ano', ano: (e.agora ?? new Date()).getFullYear() } as const]) {
    const d = filtrarDashboardData(e.data, periodo)
    const m = buildMonitoramentoData(d, periodo, e.data.allEpics)
    verificacoes.push(comparar(`periodo-${periodo.tipo}`, `Concluídos em ${periodo.tipo === 'ultimos12' ? 'Últimos 12 meses' : `Todo ${periodo.ano}`}: funil × Crescimento`,
      'Experimentos concluídos no período: o funil da Estratégia e o "+N no período" do Crescimento da Experimentação.', {
        'Funil (Estratégia)': contagensDoFunil(d.allEpics).concluidos, 'Crescimento (+N no período)': m.experimentosConcluidos,
      }))
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
    { id: 'cancelados-com-beneficio', titulo: 'Cancelados com benefício (fora do benefício potencial)', quantidade: est.cancelados.epics.length, exemplos: exemplos(est.cancelados.epics) },
  ].filter(a => a.quantidade > 0)

  return {
    geradoEm: (e.agora ?? new Date()).toISOString(),
    verificacoes,
    alertas,
    divergencias: verificacoes.filter(v => !v.ok).length,
  }
}
