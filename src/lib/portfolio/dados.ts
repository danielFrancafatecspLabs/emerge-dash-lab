import type { DashboardData, EpicDetail, Iniciativa, JiraBoardConfiguration, JiraStatus } from '../types'
import { getPipelineStage } from '../mappers'
import type { BoardInfo, ColunaBoard, Entidade, ExperimentoItem, IniciativaItem, PortfolioDados, Situacao } from './tipos'

/**
 * Monta os dados da aba Portfólio (no servidor) a partir do DashboardData e da configuração dos dois
 * boards: cada Iniciativa e cada Experimento vira um item plano, já com a coluna do board e a situação.
 */

export function situacaoDo(status: JiraStatus): Situacao {
  switch (getPipelineStage(status)) {
    // Em escala a iniciativa já saiu do ciclo do lab (no Jira, o status é "Finalizado"); igual ao funil da Estratégia.
    case 'FINALIZADO': case 'EM ESCALA': return 'concluido'
    case 'CANCELADO': return 'cancelado'
    case 'EM EXPERIMENTAÇÃO': case 'AGUARDANDO PILOTO': case 'EM PILOTO': return 'em-execucao'
    default: return 'nao-iniciado'
  }
}

const ORDEM_SITUACAO: Situacao[] = ['nao-iniciado', 'em-execucao', 'concluido', 'cancelado']

/** Texto de apoio de cada coluna, pelo nome (os boards usam nomes parecidos, em caixas diferentes). */
export function descricaoDaColuna(nome: string): string {
  const n = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  if (n.includes('BACKLOG')) return 'Registrado, aguardando triagem e priorização.'
  if (n.includes('REFINAMENTO')) return 'Problema, hipótese e benefício sendo detalhados com a área.'
  if (n.includes('PRONTO')) return 'Refinado e priorizado, aguardando o início da execução.'
  if (n.includes('AGUARDANDO')) return 'Validado, aguardando as condições para o piloto.'
  if (n.includes('VALIDA')) return 'Resultados em validação com a área de negócio.'
  if (n.includes('EXPERIMENTA') || n.includes('ANDAMENTO')) return 'Hipóteses em teste para gerar evidências.'
  if (n.includes('PILOTO')) return 'Solução em validação em ambiente real e controlado.'
  if (n.includes('ESCALA')) return 'Solução em operação, ampliando a adoção e o valor.'
  if (n.includes('CANCEL')) return 'Encerrado antes da conclusão (ver o motivo).'
  if (n.includes('CONCLU') || n.includes('FINALIZ') || n === 'DONE') return 'Ciclo encerrado.'
  return 'Coluna do board no Jira.'
}

export const SEM_COLUNA = 'fora-do-board'

/**
 * Colunas do board na ordem do Jira. Colunas sem status são ignoradas; itens com um status que nenhuma
 * coluna mapeia vão para "Fora do board". Sem a configuração, as colunas são os próprios status.
 */
export function colunasDoBoard(entidade: Entidade, config: JiraBoardConfiguration | undefined, statuses: JiraStatus[]): {
  colunas: ColunaBoard[]
  colunaDe: (status: JiraStatus) => string
} {
  const colunas: ColunaBoard[] = []
  const porStatus = new Map<string, string>()
  const doJira = (config?.columnConfig?.columns ?? []).filter(c => (c.statuses ?? []).length > 0)

  if (doJira.length > 0) {
    doJira.forEach((c, i) => {
      const id = `${entidade}-${i}`
      const ids = c.statuses.map(s => String(s.id))
      ids.forEach(sid => { if (!porStatus.has(sid)) porStatus.set(sid, id) })
      const situacoes = statuses.filter(s => ids.includes(s.id)).map(situacaoDo)
      colunas.push({
        id, nome: c.name.trim(), descricao: descricaoDaColuna(c.name), statusIds: ids,
        situacao: situacoes[0] ?? situacaoDo({ id: ids[0], name: c.name }),
      })
    })
  } else {
    const unicos = new Map<string, JiraStatus>()
    for (const s of statuses) if (!unicos.has(s.id)) unicos.set(s.id, s)
    const ordenados = [...unicos.values()].sort((a, b) =>
      ORDEM_SITUACAO.indexOf(situacaoDo(a)) - ORDEM_SITUACAO.indexOf(situacaoDo(b)) || a.name.localeCompare(b.name, 'pt-BR'))
    ordenados.forEach((s, i) => {
      const id = `${entidade}-${i}`
      porStatus.set(s.id, id)
      colunas.push({ id, nome: s.name, descricao: descricaoDaColuna(s.name), statusIds: [s.id], situacao: situacaoDo(s) })
    })
  }

  const foraDoBoard = statuses.some(s => !porStatus.has(s.id))
  if (foraDoBoard) {
    colunas.push({
      id: `${entidade}-${SEM_COLUNA}`, nome: 'Fora do board', situacao: 'nao-iniciado', statusIds: [],
      descricao: 'Status que não aparece em nenhuma coluna do board no Jira.',
    })
  }
  return { colunas, colunaDe: s => porStatus.get(s.id) ?? `${entidade}-${SEM_COLUNA}` }
}

/** Texto plano e curto para a tela (a descrição do Jira vem em markup de wiki). */
export function textoLimpo(t: string | null | undefined, max = 700): string | null {
  if (!t) return null
  const limpo = t
    .replace(/\{[a-z]+(:[^}]*)?\}/gi, '')
    .replace(/^h[1-6]\.\s*/gim, '')
    .replace(/\[([^|\]]+)\|[^\]]+\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  if (!limpo) return null
  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}…` : limpo
}

const encerrado = (s: Situacao) => s === 'concluido' || s === 'cancelado'

function experimentoItem(e: EpicDetail, colunaDe: (s: JiraStatus) => string): ExperimentoItem {
  const situacao = situacaoDo(e.status)
  return {
    tipo: 'experimento',
    key: e.key,
    nome: e.nome,
    status: e.status.name,
    coluna: colunaDe(e.status),
    situacao,
    lab: e.timeResponsavel,
    sponsor: e.sponsor,
    dominio: e.dominio,
    impacto: e.metaCategoria,
    beneficio: e.beneficioQuantitativo || null,
    criadoEm: e.criadoEm ?? null,
    prazo: e.duedate ?? null,
    descricao: textoLimpo(e.descricao),
    // O "Motivo de Bloqueio" também guarda o motivo do cancelamento: só bloqueia o que ainda está aberto.
    bloqueado: !!e.flagged || (!!e.motivoBloqueio && !encerrado(situacao)),
    iniciativaKey: e.parentKey,
    bo: e.bo,
    complexidade: e.complexidade,
    segmento: e.segmento,
    portfolio: e.portfolio,
    diretoria: e.diretoria,
    mercado: e.mercado || null,
    tecnologia: e.tecnologia,
    prioridade: e.prioridade ?? null,
    motivoBloqueio: e.motivoBloqueio,
    tipoImpedimento: e.tipoImpedimento ?? null,
    custoEstimado: e.custoEstimado || null,
    custoRealizado: e.custoRealizado,
    concluidoEm: e.concluidoEm ?? null,
    beneficioQualitativo: textoLimpo(e.beneficioQualitativo, 500),
    ultimoComentario: textoLimpo(e.statusDetalhado, 500),
    anexos: (e.anexos ?? []).map(a => ({ nome: a.filename, url: a.url })),
  }
}

function iniciativaItem(ini: Iniciativa, filhos: ExperimentoItem[], colunaDe: (s: JiraStatus) => string): IniciativaItem {
  const primeiro = <T,>(f: (e: ExperimentoItem) => T | null) => filhos.map(f).find(v => v != null) ?? null
  const prazos = filhos.filter(e => e.prazo && !encerrado(e.situacao)).map(e => e.prazo!).sort()
  const somaFilhos = filhos.reduce((s, e) => s + (e.beneficio ?? 0), 0)
  return {
    tipo: 'iniciativa',
    key: ini.key,
    nome: ini.nome,
    status: ini.status.name,
    coluna: colunaDe(ini.status),
    situacao: situacaoDo(ini.status),
    lab: ini.timeResponsavel ?? primeiro(e => e.lab),
    sponsor: ini.sponsor ?? primeiro(e => e.sponsor),
    dominio: ini.dominio ?? primeiro(e => e.dominio),
    impacto: ini.metaCategoria,
    // Regra do domínio: o benefício dos Experimentos soma na Iniciativa; sem Experimentos, vale o da própria.
    beneficio: somaFilhos || ini.beneficioQuantitativo || null,
    criadoEm: ini.criadoEm,
    prazo: prazos[0] ?? null,
    descricao: textoLimpo(ini.descricao),
    bloqueado: filhos.some(e => e.bloqueado),
    experimentos: filhos.map(e => e.key),
  }
}

export function montarPortfolio(data: DashboardData, configs: {
  iniciativa?: JiraBoardConfiguration
  experimento?: JiraBoardConfiguration
}, jiraUrl: string | null = null): PortfolioDados {
  const bIni = colunasDoBoard('iniciativa', configs.iniciativa, data.iniciativas.map(i => i.status))
  const bExp = colunasDoBoard('experimento', configs.experimento, data.allEpics.map(e => e.status))

  const experimentos = data.allEpics.map(e => experimentoItem(e, bExp.colunaDe))
  const porPai = new Map<string, ExperimentoItem[]>()
  for (const e of experimentos) {
    if (!e.iniciativaKey) continue
    porPai.set(e.iniciativaKey, [...(porPai.get(e.iniciativaKey) ?? []), e])
  }
  const iniciativas = data.iniciativas.map(i => iniciativaItem(i, porPai.get(i.key) ?? [], bIni.colunaDe))

  const board = (cfg: JiraBoardConfiguration | undefined, padrao: string, colunas: ColunaBoard[]): BoardInfo =>
    ({ id: cfg?.id ?? 0, nome: cfg?.name ?? padrao, colunas })

  return {
    iniciativas,
    experimentos,
    boards: {
      iniciativa: board(configs.iniciativa, 'P&D - Ideação', bIni.colunas),
      experimento: board(configs.experimento, 'P&D - Experimentação/Piloto', bExp.colunas),
    },
    jiraUrl: jiraUrl ? jiraUrl.replace(/\/+$/, '') : null,
    geradoEm: new Date().toISOString(),
  }
}
