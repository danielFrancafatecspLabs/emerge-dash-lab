import { epicBloqueado } from '@/lib/bloqueio'
import { buildMonitoramentoData } from '@/lib/mappers'
import { contagensDoFunil, ehCancelado, filtrarDashboardData, resultadosDaEstrategia } from '@/lib/estrategia/resultados'
import { criarContexto, resumir } from '@/lib/portfolio/filtros'
import type { PortfolioDados } from '@/lib/portfolio/tipos'
import type { SemanalData } from '@/lib/semanal'
import type { DashboardData, EpicDetail } from '@/lib/types'
import type { WeeklyData } from '@/lib/weekly'

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
  exploracaoIds: string[]
  agora?: Date
}

function comparar(id: string, titulo: string, regra: string, valores: Record<string, number>, formato: Verificacao['formato'] = 'numero', tolerancia = 0): Verificacao {
  const nums = Object.values(valores)
  const diferenca = nums.length ? Math.max(...nums) - Math.min(...nums) : 0
  return { id, titulo, regra, valores, ok: diferenca <= tolerancia, diferenca, formato }
}

const exemplos = (epics: { key: string }[]) => epics.slice(0, 5).map(e => e.key)

export function verificarConsistencia(e: EntradaConsistencia): RelatorioConsistencia {
  // ── Cada visão, com as funções da própria tela ──
  const tudo = filtrarDashboardData(e.data, { tipo: 'tudo' })
  const est = resultadosDaEstrategia(tudo, e.exploracaoIds)
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
    comparar('validadas', 'Hipóteses validadas', 'Iniciativas em Aguardando piloto, Em piloto ou Em escala.', {
      Semanal: fatia('validadas'), 'Estratégia (Tudo)': est.hipoteses.validadas.length, Portfólio: portIni.validadas,
    }),
    comparar('aguardando', 'Aguardando piloto', 'Iniciativas em Aguardando piloto.', {
      Semanal: etapa('aguardando'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['AGUARDANDO PILOTO'].length, Portfólio: portIni.porEtapa.aguardando,
    }),
    comparar('piloto', 'Em piloto', 'Iniciativas em Em piloto.', {
      Semanal: etapa('piloto'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['EM PILOTO'].length, Portfólio: portIni.porEtapa.piloto,
    }),
    comparar('escala', 'Em escala', 'Iniciativas em Em escala.', {
      Semanal: etapa('escala'), 'Estratégia (Tudo)': est.hipoteses.porEtapa['EM ESCALA'].length, Portfólio: portIni.porEtapa.escala,
    }),
    comparar('refutadas', 'Hipóteses refutadas', 'Total de experimentos − exploração − andamento − validadas − cancelados.', {
      Semanal: fatia('refutadas'), 'Estratégia (Tudo)': est.hipoteses.refutadas, Portfólio: portIni.refutadas,
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

  // As 5 fatias do Semanal precisam somar o total: se não somam, a conta das refutadas foi cortada no zero.
  const somaFatias = ['exploracao', 'andamento', 'validadas', 'refutadas', 'cancelados'].reduce((s, id) => s + fatia(id), 0)
  verificacoes.push(comparar('fatias-semanal', 'As 5 fatias do Semanal somam o total', 'Exploração + andamento + validadas + refutadas + cancelados = total de Epics.', {
    'Soma das fatias': somaFatias, 'Total de Epics': e.dataSemanal.allEpics.length,
  }))

  // ── Qualidade dos dados no Jira ──
  const chavesIni = new Set(e.data.iniciativas.map(i => i.key))
  const semMae = e.data.allEpics.filter(x => !x.parentKey)
  const maeInexistente = e.data.allEpics.filter(x => x.parentKey && !chavesIni.has(x.parentKey))
  const dominioDaMae = new Map(e.data.iniciativas.map(i => [i.key, i.dominio || i.dominios[0] || null]))
  const semDominio = e.data.allEpics.filter(x => !ehCancelado(x) && !x.dominio?.trim() && !(x.parentKey && dominioDaMae.get(x.parentKey)))
  const validadasSemConcluido = est.hipoteses.validadas.filter(i => !i.epics.some(x => x.status?.id === '10019'))
  const bloqueioForaDeExperimentacao = e.data.allEpics.filter(x => !emExperimentacao(x) && epicBloqueado(x))
  const alertas: Alerta[] = [
    { id: 'sem-iniciativa', titulo: 'Experimentos sem iniciativa-mãe', quantidade: semMae.length, exemplos: exemplos(semMae) },
    { id: 'mae-inexistente', titulo: 'Experimentos com iniciativa-mãe fora do board de Ideação', quantidade: maeInexistente.length, exemplos: exemplos(maeInexistente) },
    { id: 'sem-dominio', titulo: 'Experimentos sem domínio (nem no experimento nem na iniciativa)', quantidade: semDominio.length, exemplos: exemplos(semDominio) },
    { id: 'sem-meta', titulo: 'Experimentos sem meta estratégica (classificação da IA pendente)', quantidade: est.semMeta.length, exemplos: exemplos(est.semMeta) },
    { id: 'validadas-sem-concluido', titulo: 'Hipóteses validadas sem experimento concluído vinculado', quantidade: validadasSemConcluido.length, exemplos: exemplos(validadasSemConcluido) },
    { id: 'bloqueio-fora', titulo: 'Sinal de bloqueio fora de experimentação (não conta em Bloqueados)', quantidade: bloqueioForaDeExperimentacao.length, exemplos: exemplos(bloqueioForaDeExperimentacao) },
    { id: 'cancelados-com-beneficio', titulo: 'Cancelados com benefício (fora do benefício potencial)', quantidade: est.cancelados.epics.length, exemplos: exemplos(est.cancelados.epics) },
  ].filter(a => a.quantidade > 0)

  return {
    geradoEm: (e.agora ?? new Date()).toISOString(),
    verificacoes,
    alertas,
    divergencias: verificacoes.filter(v => !v.ok).length,
  }
}
