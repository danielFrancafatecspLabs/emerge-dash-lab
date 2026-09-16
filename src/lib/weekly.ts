import { DashboardData, EpicDetail, Iniciativa } from './types'
import type { ChangelogEntry } from './jira'
import { formatBeneficioMM, limparDescricao } from './report-utils'
import { buildGovernancaData, SAMPLE_GOVERNANCA_DATA, type GovernancaData } from './governanca'

export interface WeeklyStageMotivo {
  motivo: string
  count: number
}

export interface WeeklyExperimentoRow {
  key: string
  nome: string
  objetivo: string
  fase: string
  sponsor: string
  dominio: string
  beneficioLabel: string
}

export interface WeeklyStage {
  id: string
  label: string
  descricao: string
  quantidade: number
  motivos?: WeeklyStageMotivo[]   // top motivos (só preenchido na fase "Cancelados")
  experimentos: WeeklyExperimentoRow[]   // lista detalhada — usada no "Ver detalhes" de cada fase
}

export interface WeeklyRanking {
  nome: string
  count: number
}

export interface WeeklyData {
  geradoEm: string
  governanca: GovernancaData          // slide 1 — swimlane por Domínio × fase da jornada
  stages: WeeklyStage[]              // funil: Backlog -> Em andamento -> Cancelados -> Concluídos -> Aguardando piloto -> Piloto -> Em escala
  pendenteAnalise: WeeklyStage        // Iniciativas do board de Ideação em Backlog/Em refinamento — ideias que ainda não viraram experimento (não faz parte do funil, fica à parte)
  experimentosAprovados: number      // total de Epics no board de Experimentação (data.allEpics.length) — usado no slide de entrada
  emAndamentoMaisConcluidos: number  // Em andamento + Concluídos — a fatia dos experimentos aprovados já em execução real ou finalizada
  totalEpics: number
  totalIniciados: number
  taxaOportunidadesParaExperimentos: number
  conversaoPiloto: number
  conversaoEscala: number
  conversaoPilotoNumerador: number   // iniciativas já em Piloto ou Em escala (numerador da conversaoPiloto)
  conversaoEscalaNumerador: number   // iniciativas já em Em escala (numerador da conversaoEscala)
  conversaoDenominador: number       // total de experimentos aprovados (mesmo total do slide 1 — total de Epics)
  semBeneficio: { count: number; pct: number }
  semSponsor: { count: number; pct: number }
  topSponsors: WeeklyRanking[]       // top 6 sponsors por quantidade de experimentos (todas as fases do funil)
  topDiretorias: WeeklyRanking[]     // top 6 diretorias/domínios por quantidade de experimentos (idem)
  aprendizadosSemEscalar: number     // Concluídos - (Aguardando piloto + Piloto + Em escala): geraram aprendizado mas não seguiram adiante
  aprendizadosAcionaveis: number
  insightPrincipal: string    // maior gargalo do funil (conversão piloto -> escala)
  insightSecundario: string   // segundo risco em destaque (motivo de cancelamento ou backlog parado)
  isSample: boolean
}

function pct(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

// Os dois insights do rodapé existem para apontar PROBLEMAS/riscos do
// funil — não para recapitular estatísticas já mostradas nos cards acima.
function buildInsights(
  conversaoPiloto: number,
  conversaoEscala: number,
  canceladosCount: number,
  topMotivo: WeeklyStageMotivo | undefined,
  backlogCount: number,
): { principal: string; secundario: string } {
  const presoNoPiloto = Math.max(0, conversaoPiloto - conversaoEscala)
  const principal = `Gargalo na escala: apenas ${conversaoEscala}% dos experimentos aprovados chega à implementação, mesmo com ${conversaoPiloto}% já validados em piloto — ${presoNoPiloto} pontos percentuais ficam presos na transição.`
  const secundario = topMotivo
    ? `"${topMotivo.motivo}" já responde por ${topMotivo.count} dos ${canceladosCount} cancelamentos (${pct(topMotivo.count, canceladosCount)}%) — maior risco de continuidade identificado no período.`
    : `${backlogCount} experimentos aprovados ainda não saíram do backlog — risco de perder tração se não forem priorizados.`
  return { principal, secundario }
}

function semBeneficioPotencial(e: EpicDetail): boolean {
  const semQuantitativo = (e.beneficioQuantitativo ?? 0) <= 0
  const semQualitativo = !e.beneficioQualitativo || !e.beneficioQualitativo.trim()
  return semQuantitativo && semQualitativo
}

/**
 * Linhas de detalhe por fase, para o "Ver detalhes" do funil. As fases
 * Backlog/Aguardando piloto/Piloto/Em escala vêm de Iniciativas (board de
 * Ideação — sem campos ricos próprios, por isso usamos os agregados dos
 * Epics filhos: sponsor/dominio/benefício). Em andamento/Cancelados/
 * Concluídos vêm direto dos Epics (board de Experimentação, fonte dos
 * dados ricos de negócio).
 */
function rowFromIniciativa(i: Iniciativa): WeeklyExperimentoRow {
  return {
    key: i.key,
    nome: i.nome,
    objetivo: limparDescricao(i.descricao),
    fase: i.status.name,
    sponsor: i.sponsor ?? i.sponsors[0] ?? '—',
    dominio: i.dominio ?? i.dominios[0] ?? '—',
    beneficioLabel: formatBeneficioMM(i.beneficioQuantitativoTotal || i.beneficioQuantitativo),
  }
}

function rowFromEpic(e: EpicDetail): WeeklyExperimentoRow {
  return {
    key: e.key,
    nome: e.nome,
    objetivo: limparDescricao(e.descricao),
    fase: e.status.name,
    sponsor: e.sponsor ?? '—',
    dominio: e.dominio ?? '—',
    beneficioLabel: formatBeneficioMM(e.beneficioQuantitativo),
  }
}

/**
 * Ranking (top N) de quantos experimentos cada valor de um campo concentra,
 * considerando TODAS as fases do funil (mesmo universo do total de
 * Experimentos Aprovados). Valores vazios/não identificados ("—") ficam de
 * fora do ranking — aparecem à parte, no card "Sem sponsor identificado".
 */
function buildRanking(rows: WeeklyExperimentoRow[], campo: 'sponsor' | 'dominio', limite = 6): WeeklyRanking[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const valor = r[campo]
    if (!valor || valor === '—') continue
    counts.set(valor, (counts.get(valor) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nome, count]) => ({ nome, count }))
}

/**
 * Extrai o último motivo preenchido no campo "Motivo de Bloqueio"
 * (customfield_13406) a partir do changelog do Epic. Usado nos Cancelados
 * porque o campo costuma ser o mesmo usado para registrar o motivo antes do
 * cancelamento, e pode já ter sido limpo no valor atual do campo — o
 * changelog preserva o último valor setado.
 */
function getMotivoDoChangelog(epicKey: string, changelogs: Record<string, ChangelogEntry[]>): string | null {
  const changelog = changelogs[epicKey]
  if (!changelog || changelog.length === 0) return null

  const sorted = [...changelog].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )

  let ultimoMotivo: string | null = null
  for (const entry of sorted) {
    for (const item of entry.items) {
      const fieldIdMatch = item.fieldId === 'customfield_13406'
      const fieldName = typeof item.field === 'string' ? item.field : ''
      const fieldNameMatch = fieldName === 'customfield_13406' || /motivo.*bloqueio/i.test(fieldName)
      if (!fieldIdMatch && !fieldNameMatch) continue

      const to = item.toString?.trim()
      if (to && to !== 'None' && to !== 'null') ultimoMotivo = to
    }
  }
  return ultimoMotivo
}

/**
 * Top motivos de cancelamento: para cada Epic cancelado, usa o valor atual
 * do campo "Motivo de Bloqueio" e, se vazio, cai para o último valor
 * encontrado no changelog. Agrupa por motivo e retorna os 3 mais frequentes.
 */
function buildTopMotivosCancelamento(
  canceladosEpics: EpicDetail[],
  epicChangelogs: Record<string, ChangelogEntry[]>
): WeeklyStageMotivo[] {
  const counts = new Map<string, number>()
  for (const e of canceladosEpics) {
    const motivo = e.motivoBloqueio ?? getMotivoDoChangelog(e.key, epicChangelogs)
    if (!motivo) continue
    counts.set(motivo, (counts.get(motivo) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([motivo, count]) => ({ motivo, count }))
}

/**
 * Mapeamento acordado com o time BeOn Labs para o slide Weekly (v7). Reusa os
 * MESMOS filtros por id+nome de status já usados em src/app/report/page.tsx
 * (funilStages / totalExperimentosIniciados / conversaoPiloto / conversaoEscala)
 * em vez do mapa STATUS_PIPELINE — aquele mapa ficou incompleto/desatualizado
 * em relação aos status reais do board e subcontava "Em andamento".
 *
 * O funil de pipeline ganhou 2 fases logo após "Em andamento": Cancelados e
 * Concluídos (ambas do board de Experimentação). "Ideias Qualificadas" saiu
 * do funil e virou "Experimentos Aprovados" — a métrica de saída do slide de
 * entrada (Solicitação/Iniciativas -> Critérios de Entrada -> Experimento
 * aprovado).
 *
 * - Backlog: Epics do board de Experimentação em "BACKLOG" (id 10004) +
 *   "Em refinamento" (id 10139) — experimentos JÁ aprovados, só não começaram.
 *   Não confundir com "Pendente para Análise" (ver abaixo), que são as
 *   Iniciativas do board de Ideação, ainda não viraram experimento.
 * - Aguardando piloto / Piloto / Em escala: Iniciativas nos respectivos
 *   status do board de Ideação.
 * - Em andamento: Epics em "Em andamento" (id 3) + "Em validação"/"EM VALIDAÇÃO" (id 10204).
 * - Cancelados: Epics em "Cancelado"/"CANCELADO" (id 10015, não confirmado
 *   nesse board — ajustar se o id real for outro). O card traz os 3
 *   principais motivos, extraídos do campo "Motivo de Bloqueio"
 *   (customfield_13406) — valor atual ou, se limpo, último valor do changelog.
 * - Concluídos: Epics em status concluído (id 10019).
 * - Experimentos Aprovados: total de Epics no board de Experimentação
 *   (data.allEpics.length) — MESMA definição de "Total de Experimentos" do
 *   Funil de Experimentos na aba Estratégia (ver FunilExperimentos.tsx).
 *   NÃO é a soma das fases do funil da pipeline acima: Backlog/Aguardando/
 *   Piloto/Escala são Iniciativas (board de Ideação), um universo diferente.
 * - Conversão para Piloto/Escala: numerador = iniciativas que já chegaram àquele
 *   marco (data.pilotoStatusIds / data.escalaStatusIds, igual à aba Estratégia);
 *   denominador = SEMPRE o total de Experimentos Aprovados (mesmo número do slide 1),
 *   não o total bruto de iniciativas do board de Ideação.
 * - Sem benefício potencial / Sem sponsor: sobre TODOS os Epics do board de
 *   Experimentação — benefício considera os campos quantitativo E qualitativo juntos.
 * - Pendente para Análise: Iniciativas do board de Ideação em "BACKLOG"
 *   (id 10004) + "EM REFINAMENTO" (id 10139) — ideias que ainda não passaram
 *   pelos critérios de entrada, portanto ainda não são um experimento.
 * - Em andamento + Concluídos: a soma das duas fases representa quanto do
 *   total de Experimentos Aprovados (slide 1) já está em execução real ou já
 *   foi concluído — Backlog (não começou) e Cancelados (não seguiu) ficam de
 *   fora dessa leitura.
 */
export function buildWeeklyData(data: DashboardData, epicChangelogs: Record<string, ChangelogEntry[]> = {}, board2735Config?: unknown): WeeklyData {
  // Pendente para Análise: Iniciativas do board de Ideação (ainda não são
  // experimento) — usado só no card à parte, não no funil.
  const pendenteAnaliseInis = data.iniciativas.filter(i =>
    i.status.id === '10004' || i.status.name === 'BACKLOG' ||
    i.status.id === '10139' || i.status.name === 'EM REFINAMENTO' || i.status.name === 'Em refinamento'
  )

  const aguardandoInis = data.iniciativas.filter(i => i.status.id === '13045' || i.status.name === 'Aguardando Piloto')
  const pilotoInis = data.iniciativas.filter(i => i.status.id === '12847' || i.status.name === 'EM PILOTO' || i.status.name === 'Em Piloto')
  const escalaInis = data.iniciativas.filter(i =>
    i.status.id === '12848' || ['EM ESCALA', 'Em Escala', 'Em escala', 'FINALIZADO', 'Finalizado'].includes(i.status.name)
  )

  // Backlog do funil: Epics já aprovados (board de Experimentação) que ainda
  // não começaram — diferente de "Pendente para Análise" acima, que são
  // Iniciativas cruas do board de Ideação.
  const backlogEpics = data.allEpics.filter(e =>
    e.status?.id === '10004' || e.status?.name === 'BACKLOG' ||
    e.status?.id === '10139' || e.status?.name === 'Em refinamento' || e.status?.name === 'EM REFINAMENTO'
  )
  const emAndamentoEpics = data.allEpics.filter(e => e.status?.id === '3' || e.status?.name === 'Em andamento')
  const emValidacaoEpics = data.allEpics.filter(e => e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação')
  const canceladosEpics = data.allEpics.filter(e => e.status?.id === '10015' || e.status?.name === 'Cancelado' || e.status?.name === 'CANCELADO')
  const concluidosEpics = data.allEpics.filter(e => e.status?.id === '10019')

  const emAndamentoCount = emAndamentoEpics.length + emValidacaoEpics.length
  const canceladosCount = canceladosEpics.length
  const concluidosCount = concluidosEpics.length
  const backlogCount = backlogEpics.length

  const topMotivosCancelamento = buildTopMotivosCancelamento(canceladosEpics, epicChangelogs)

  const stages: WeeklyStage[] = [
    { id: 'backlog', label: 'Backlog', descricao: 'Experimento aprovado, ainda não iniciado', quantidade: backlogCount, experimentos: backlogEpics.map(rowFromEpic) },
    { id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: emAndamentoCount, experimentos: [...emAndamentoEpics, ...emValidacaoEpics].map(rowFromEpic) },
    { id: 'cancelados', label: 'Cancelados', descricao: 'Principais motivos', quantidade: canceladosCount, motivos: topMotivosCancelamento, experimentos: canceladosEpics.map(rowFromEpic) },
    { id: 'concluidos', label: 'Concluídos', descricao: 'Experimentação encerrada', quantidade: concluidosCount, experimentos: concluidosEpics.map(rowFromEpic) },
    { id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: aguardandoInis.length, experimentos: aguardandoInis.map(rowFromIniciativa) },
    { id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: pilotoInis.length, experimentos: pilotoInis.map(rowFromIniciativa) },
    { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: escalaInis.length, experimentos: escalaInis.map(rowFromIniciativa) },
  ]

  // Experimentos aprovados = total de Epics no board de Experimentação
  // (data.allEpics.length) — MESMA definição de "Total de Experimentos" usada
  // no Funil de Experimentos da aba Estratégia (ver FunilExperimentos.tsx).
  // Não é a soma das fases do funil da pipeline: Backlog/Aguardando/Piloto/
  // Escala são Iniciativas (board de Ideação), um universo diferente, e somá-
  // -las ao total de Epics inflava e duplicava a contagem.
  const experimentosAprovados = data.allEpics.length

  // Ranking de sponsors/diretorias sobre o MESMO universo do total acima —
  // todos os Epics do board de Experimentação.
  const todosEpicsRows = data.allEpics.map(rowFromEpic)
  const topSponsors = buildRanking(todosEpicsRows, 'sponsor')
  const topDiretorias = buildRanking(todosEpicsRows, 'dominio')

  const totalIniciados = emAndamentoCount + concluidosCount
  // Denominador correto agora é Pendente para Análise (ideias cruas do board
  // de Ideação) — Backlog do funil já são experimentos aprovados, não "oportunidades".
  const taxaOportunidadesParaExperimentos = pct(emAndamentoCount, pendenteAnaliseInis.length)

  // Em andamento + Concluídos = a fatia dos experimentos aprovados (slide 1)
  // que já está em execução real ou já terminou — Backlog (não começou) e
  // Cancelados (não seguiu) ficam de fora dessa leitura.
  const emAndamentoMaisConcluidos = emAndamentoCount + concluidosCount

  // Aguardando piloto / Piloto / Em escala nascem DENTRO dos Concluídos — são
  // as iniciativas cujo experimento já terminou e seguiu adiante. O restante
  // dos Concluídos não avançou: virou aprendizado (benchmark, hipótese
  // refutada etc.) sem escalar. Mostrado no funil como um ramo derivado de
  // Concluídos, não como mais uma fase sequencial independente.
  const aprendizadosSemEscalar = Math.max(0, concluidosCount - (aguardandoInis.length + pilotoInis.length + escalaInis.length))

  // Numeradores na mesma lógica da aba Estratégia / Report (ver
  // src/app/report/page.tsx): iniciativas que já chegaram a Piloto/Escala.
  // Denominador: SEMPRE o total de experimentos aprovados do slide 1 (total de
  // Epics), não o total bruto de iniciativas do board de Ideação.
  const countEmPiloto = data.iniciativas.filter(i => data.pilotoStatusIds.includes(i.status.id)).length
  const countEmEscala = data.iniciativas.filter(i => data.escalaStatusIds.includes(i.status.id)).length
  const conversaoPiloto = pct(countEmPiloto + countEmEscala, experimentosAprovados)
  const conversaoEscala = pct(countEmEscala, experimentosAprovados)

  const totalEpics = experimentosAprovados
  const semBeneficioCount = data.allEpics.filter(semBeneficioPotencial).length
  const semSponsorCount = data.allEpics.filter(e => !e.sponsor).length

  // Aprendizados acionáveis: epics concluídos que documentaram um benefício
  // qualitativo (proxy para "gerou aprendizado", já que não há campo dedicado no Jira).
  const aprendizadosAcionaveis = data.allEpics.filter(
    e => ['Concluído', 'FINALIZADO'].includes(e.status.name) && !!e.beneficioQualitativo?.trim()
  ).length

  const { principal, secundario } = buildInsights(conversaoPiloto, conversaoEscala, canceladosCount, topMotivosCancelamento[0], backlogCount)

  const pendenteAnalise: WeeklyStage = {
    id: 'pendente-analise',
    label: 'Pendente para Análise',
    descricao: 'Ideias ainda não avaliadas',
    quantidade: pendenteAnaliseInis.length,
    experimentos: pendenteAnaliseInis.map(rowFromIniciativa),
  }

  return {
    geradoEm: new Date().toISOString(),
    isSample: false,
    governanca: buildGovernancaData(data, board2735Config),
    stages,
    pendenteAnalise,
    experimentosAprovados,
    emAndamentoMaisConcluidos,
    totalEpics,
    totalIniciados,
    taxaOportunidadesParaExperimentos,
    conversaoPiloto,
    conversaoEscala,
    conversaoPilotoNumerador: countEmPiloto + countEmEscala,
    conversaoEscalaNumerador: countEmEscala,
    conversaoDenominador: experimentosAprovados,
    semBeneficio: { count: semBeneficioCount, pct: pct(semBeneficioCount, totalEpics) },
    semSponsor: { count: semSponsorCount, pct: pct(semSponsorCount, totalEpics) },
    topSponsors,
    topDiretorias,
    aprendizadosSemEscalar,
    aprendizadosAcionaveis,
    insightPrincipal: principal,
    insightSecundario: secundario,
  }
}

// ── Dados de exemplo (usados quando o Jira está inacessível) ──
const SAMPLE_MOTIVOS_CANCELAMENTO: WeeklyStageMotivo[] = [
  { motivo: 'Falta de Engajamento do BO', count: 7 },
  { motivo: 'Amostra de Dados', count: 4 },
  { motivo: 'Falta de benefício potencial', count: 3 },
]

function sampleRow(i: number, nome: string, fase: string, sponsor: string, dominio: string, beneficio: string): WeeklyExperimentoRow {
  return { key: `GL-${1000 + i}`, nome, objetivo: 'Reduzir custo operacional e melhorar a experiência do cliente com automação.', fase, sponsor, dominio, beneficioLabel: beneficio }
}

const SAMPLE_PENDENTE_ANALISE: WeeklyStage = {
  id: 'pendente-analise', label: 'Pendente para Análise', descricao: 'Ideias ainda não avaliadas', quantidade: 82,
  experimentos: [
    sampleRow(11, 'Assistente de Onboarding', 'BACKLOG', 'Carla Tiemi', 'RH', 'Não Mapeado'),
    sampleRow(12, 'Previsão de Demanda de Suporte', 'EM REFINAMENTO', 'Sidney Neves', 'Atendimento', 'R$ 0.9 MM'),
  ],
}

const SAMPLE_STAGES: WeeklyStage[] = [
  {
    id: 'backlog', label: 'Backlog', descricao: 'Experimento aprovado, ainda não iniciado', quantidade: 14,
    experimentos: [
      sampleRow(1, 'Triagem Automática de Chamados', 'BACKLOG', 'Rodrigo Assad', 'Atendimento', 'R$ 1.2 MM'),
      sampleRow(2, 'Score de Risco de Churn', 'Em refinamento', 'Sidney Neves', 'Comercial', 'Não Mapeado'),
    ],
  },
  {
    id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: 56,
    experimentos: [
      sampleRow(3, 'Evolução da Clarinha', 'Em andamento', 'Rodrigo Duclos', 'Digital', 'R$ 3.4 MM'),
      sampleRow(4, 'Roteirização Inteligente', 'Em validação', 'Carla Tiemi', 'Rede', 'R$ 0.8 MM'),
    ],
  },
  {
    id: 'cancelados', label: 'Cancelados', descricao: 'Principais motivos', quantidade: 17, motivos: SAMPLE_MOTIVOS_CANCELAMENTO,
    experimentos: [
      sampleRow(5, 'IA para BD', 'Cancelado', 'Patrícia Mofato', 'Dados', 'Não Mapeado'),
      sampleRow(6, 'Recomendação de Produtos', 'Cancelado', 'Marco Zumba', 'Marketing', 'R$ 0.5 MM'),
    ],
  },
  {
    id: 'concluidos', label: 'Concluídos', descricao: 'Experimentação encerrada', quantidade: 33,
    experimentos: [
      sampleRow(7, 'ARI Jurídico', 'FINALIZADO', 'Rogério Estrela', 'Jurídico', 'R$ 2.1 MM'),
    ],
  },
  {
    id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: 28,
    experimentos: [
      sampleRow(8, 'Automação de Editais', 'Aguardando Piloto', 'Sidney Neves', 'Compras', 'R$ 1.6 MM'),
    ],
  },
  {
    id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: 18,
    experimentos: [
      sampleRow(9, 'Zelador', 'EM PILOTO', 'Rodrigo Assad', 'Operações Técnicas', 'R$ 2.8 MM'),
    ],
  },
  {
    id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: 11,
    experimentos: [
      sampleRow(10, 'Identificação de Chamadas de Spam', 'EM ESCALA', 'Marco Zumba', 'Segurança', 'R$ 4.5 MM'),
    ],
  },
]
const SAMPLE_TOTAL_EPICS = 199
const SAMPLE_EXPERIMENTOS_APROVADOS = SAMPLE_TOTAL_EPICS   // mesma definição: total de Epics
const SAMPLE_EM_ANDAMENTO_MAIS_CONCLUIDOS = 56 + 33   // Em andamento + Concluídos
const SAMPLE_TOTAL_INICIADOS = 89
const SAMPLE_TAXA_OPORTUNIDADES = pct(56, SAMPLE_PENDENTE_ANALISE.quantidade)
// Denominador das conversões é SEMPRE o total de experimentos aprovados (slide 1).
const SAMPLE_CONVERSAO_DENOMINADOR = SAMPLE_EXPERIMENTOS_APROVADOS
const SAMPLE_CONVERSAO_ESCALA_NUMERADOR = 24
const SAMPLE_CONVERSAO_PILOTO_NUMERADOR = 59
const SAMPLE_CONVERSAO_PILOTO = pct(SAMPLE_CONVERSAO_PILOTO_NUMERADOR, SAMPLE_CONVERSAO_DENOMINADOR)
const SAMPLE_CONVERSAO_ESCALA = pct(SAMPLE_CONVERSAO_ESCALA_NUMERADOR, SAMPLE_CONVERSAO_DENOMINADOR)
const SAMPLE_APRENDIZADOS = 24   // deve ser <= quantidade de Concluídos (33) — é um subconjunto
const SAMPLE_APRENDIZADOS_SEM_ESCALAR = 10   // Concluídos (33) - (Aguardando 28 + Piloto 18 + Escala 11), ilustrativo
const SAMPLE_TOP_SPONSORS: WeeklyRanking[] = [
  { nome: 'Rodrigo Assad', count: 34 },
  { nome: 'Sidney Neves', count: 28 },
  { nome: 'Rodrigo Duclos', count: 22 },
  { nome: 'Marco Zumba', count: 19 },
  { nome: 'Carla Tiemi', count: 15 },
  { nome: 'Patrícia Mofato', count: 11 },
]
const SAMPLE_TOP_DIRETORIAS: WeeklyRanking[] = [
  { nome: 'Atendimento', count: 41 },
  { nome: 'Comercial', count: 33 },
  { nome: 'Tecnologia', count: 27 },
  { nome: 'Operações Técnicas', count: 21 },
  { nome: 'Dados', count: 18 },
  { nome: 'Jurídico', count: 12 },
]
const SAMPLE_CANCELADOS_COUNT = 17
const SAMPLE_BACKLOG_COUNT = 14
const SAMPLE_INSIGHTS = buildInsights(SAMPLE_CONVERSAO_PILOTO, SAMPLE_CONVERSAO_ESCALA, SAMPLE_CANCELADOS_COUNT, SAMPLE_MOTIVOS_CANCELAMENTO[0], SAMPLE_BACKLOG_COUNT)

export const SAMPLE_WEEKLY_DATA: WeeklyData = {
  geradoEm: new Date().toISOString(),
  isSample: true,
  governanca: SAMPLE_GOVERNANCA_DATA,
  stages: SAMPLE_STAGES,
  pendenteAnalise: SAMPLE_PENDENTE_ANALISE,
  experimentosAprovados: SAMPLE_EXPERIMENTOS_APROVADOS,
  emAndamentoMaisConcluidos: SAMPLE_EM_ANDAMENTO_MAIS_CONCLUIDOS,
  totalEpics: SAMPLE_TOTAL_EPICS,
  totalIniciados: SAMPLE_TOTAL_INICIADOS,
  taxaOportunidadesParaExperimentos: SAMPLE_TAXA_OPORTUNIDADES,
  conversaoPiloto: SAMPLE_CONVERSAO_PILOTO,
  conversaoEscala: SAMPLE_CONVERSAO_ESCALA,
  conversaoPilotoNumerador: SAMPLE_CONVERSAO_PILOTO_NUMERADOR,
  conversaoEscalaNumerador: SAMPLE_CONVERSAO_ESCALA_NUMERADOR,
  conversaoDenominador: SAMPLE_CONVERSAO_DENOMINADOR,
  semBeneficio: { count: 36, pct: pct(36, SAMPLE_TOTAL_EPICS) },
  semSponsor: { count: 29, pct: pct(29, SAMPLE_TOTAL_EPICS) },
  topSponsors: SAMPLE_TOP_SPONSORS,
  topDiretorias: SAMPLE_TOP_DIRETORIAS,
  aprendizadosSemEscalar: SAMPLE_APRENDIZADOS_SEM_ESCALAR,
  aprendizadosAcionaveis: SAMPLE_APRENDIZADOS,
  insightPrincipal: SAMPLE_INSIGHTS.principal,
  insightSecundario: SAMPLE_INSIGHTS.secundario,
}
