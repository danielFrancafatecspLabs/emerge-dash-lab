import { DashboardData, EpicDetail, Iniciativa } from './types'
import type { ChangelogEntry } from './jira'
import { formatBeneficioMM, limparDescricao } from './report-utils'

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

export interface WeeklyData {
  geradoEm: string
  stages: WeeklyStage[]              // funil: Backlog -> Em andamento -> Cancelados -> Concluídos -> Aguardando piloto -> Piloto -> Em escala
  experimentosAprovados: number      // Em andamento + Cancelados + Concluídos (board de Experimentação) — usado no slide de entrada
  totalEpics: number
  totalIniciados: number
  taxaOportunidadesParaExperimentos: number
  conversaoPiloto: number
  conversaoEscala: number
  conversaoPilotoNumerador: number   // iniciativas já em Piloto ou Em escala (numerador da conversaoPiloto)
  conversaoEscalaNumerador: number   // iniciativas já em Em escala (numerador da conversaoEscala)
  conversaoDenominador: number       // total de iniciativas do board de Ideação (denominador das duas)
  semBeneficio: { count: number; pct: number }
  semSponsor: { count: number; pct: number }
  aprendizadosAcionaveis: number
  insightPrincipal: string
  insightPositivo: string
  isSample: boolean
}

function pct(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function buildInsights(conversaoPiloto: number, conversaoEscala: number, totalIniciados: number, taxaOportunidades: number, aprendizados: number): { principal: string; positivo: string } {
  const presoNoPiloto = Math.max(0, conversaoPiloto - conversaoEscala)
  const principal = `${conversaoPiloto}% das iniciativas já chegaram ao piloto, mas só ${conversaoEscala}% avança até a escala — ${presoNoPiloto} pontos percentuais ficam pelo caminho.`
  const positivo = `${taxaOportunidades}% das oportunidades em backlog viram experimentos (${totalIniciados} já iniciados), e ${aprendizados} deles já geraram aprendizados acionáveis.`
  return { principal, positivo }
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
 * - Backlog / Aguardando piloto / Piloto / Em escala: Iniciativas nos
 *   respectivos status do board de Ideação.
 * - Em andamento: Epics em "Em andamento" (id 3) + "Em validação"/"EM VALIDAÇÃO" (id 10204).
 * - Cancelados: Epics em "Cancelado"/"CANCELADO" (id 10015, não confirmado
 *   nesse board — ajustar se o id real for outro). O card traz os 3
 *   principais motivos, extraídos do campo "Motivo de Bloqueio"
 *   (customfield_13406) — valor atual ou, se limpo, último valor do changelog.
 * - Concluídos: Epics em status concluído (id 10019).
 * - Experimentos Aprovados: soma de Em andamento + Cancelados + Concluídos.
 * - Conversão para Piloto/Escala: % de TODAS as iniciativas que já chegaram àquele
 *   marco, usando data.pilotoStatusIds / data.escalaStatusIds (igual à aba Estratégia).
 * - Sem benefício potencial / Sem sponsor: sobre TODOS os Epics do board de
 *   Experimentação — benefício considera os campos quantitativo E qualitativo juntos.
 */
export function buildWeeklyData(data: DashboardData, epicChangelogs: Record<string, ChangelogEntry[]> = {}): WeeklyData {
  const backlogInis = data.iniciativas.filter(i => i.status.id === '10004' || i.status.name === 'BACKLOG')
  const aguardandoInis = data.iniciativas.filter(i => i.status.id === '13045' || i.status.name === 'Aguardando Piloto')
  const pilotoInis = data.iniciativas.filter(i => i.status.id === '12847' || i.status.name === 'EM PILOTO' || i.status.name === 'Em Piloto')
  const escalaInis = data.iniciativas.filter(i =>
    i.status.id === '12848' || ['EM ESCALA', 'Em Escala', 'Em escala', 'FINALIZADO', 'Finalizado'].includes(i.status.name)
  )

  const emAndamentoEpics = data.allEpics.filter(e => e.status?.id === '3' || e.status?.name === 'Em andamento')
  const emValidacaoEpics = data.allEpics.filter(e => e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação')
  const canceladosEpics = data.allEpics.filter(e => e.status?.id === '10015' || e.status?.name === 'Cancelado' || e.status?.name === 'CANCELADO')
  const concluidosEpics = data.allEpics.filter(e => e.status?.id === '10019')

  const emAndamentoCount = emAndamentoEpics.length + emValidacaoEpics.length
  const canceladosCount = canceladosEpics.length
  const concluidosCount = concluidosEpics.length
  const backlogCount = backlogInis.length
  const experimentosAprovados = emAndamentoCount + canceladosCount + concluidosCount

  const topMotivosCancelamento = buildTopMotivosCancelamento(canceladosEpics, epicChangelogs)

  const stages: WeeklyStage[] = [
    { id: 'backlog', label: 'Backlog', descricao: 'Ideias qualificadas para análise', quantidade: backlogCount, experimentos: backlogInis.map(rowFromIniciativa) },
    { id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: emAndamentoCount, experimentos: [...emAndamentoEpics, ...emValidacaoEpics].map(rowFromEpic) },
    { id: 'cancelados', label: 'Cancelados', descricao: 'Principais motivos', quantidade: canceladosCount, motivos: topMotivosCancelamento, experimentos: canceladosEpics.map(rowFromEpic) },
    { id: 'concluidos', label: 'Concluídos', descricao: 'Experimentação encerrada', quantidade: concluidosCount, experimentos: concluidosEpics.map(rowFromEpic) },
    { id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: aguardandoInis.length, experimentos: aguardandoInis.map(rowFromIniciativa) },
    { id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: pilotoInis.length, experimentos: pilotoInis.map(rowFromIniciativa) },
    { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: escalaInis.length, experimentos: escalaInis.map(rowFromIniciativa) },
  ]

  const totalIniciados = emAndamentoCount + concluidosCount
  const taxaOportunidadesParaExperimentos = pct(emAndamentoCount, backlogCount)

  // Mesma lógica da aba Estratégia / Report (ver src/app/report/page.tsx):
  // % de TODAS as iniciativas do board de Ideação que já chegaram a Piloto/Escala.
  const totalIniciativas = data.iniciativas.length
  const countEmPiloto = data.iniciativas.filter(i => data.pilotoStatusIds.includes(i.status.id)).length
  const countEmEscala = data.iniciativas.filter(i => data.escalaStatusIds.includes(i.status.id)).length
  const conversaoPiloto = pct(countEmPiloto + countEmEscala, totalIniciativas)
  const conversaoEscala = pct(countEmEscala, totalIniciativas)

  const totalEpics = data.allEpics.length
  const semBeneficioCount = data.allEpics.filter(semBeneficioPotencial).length
  const semSponsorCount = data.allEpics.filter(e => !e.sponsor).length

  // Aprendizados acionáveis: epics concluídos que documentaram um benefício
  // qualitativo (proxy para "gerou aprendizado", já que não há campo dedicado no Jira).
  const aprendizadosAcionaveis = data.allEpics.filter(
    e => ['Concluído', 'FINALIZADO'].includes(e.status.name) && !!e.beneficioQualitativo?.trim()
  ).length

  const { principal, positivo } = buildInsights(conversaoPiloto, conversaoEscala, totalIniciados, taxaOportunidadesParaExperimentos, aprendizadosAcionaveis)

  return {
    geradoEm: new Date().toISOString(),
    isSample: false,
    stages,
    experimentosAprovados,
    totalEpics,
    totalIniciados,
    taxaOportunidadesParaExperimentos,
    conversaoPiloto,
    conversaoEscala,
    conversaoPilotoNumerador: countEmPiloto + countEmEscala,
    conversaoEscalaNumerador: countEmEscala,
    conversaoDenominador: totalIniciativas,
    semBeneficio: { count: semBeneficioCount, pct: pct(semBeneficioCount, totalEpics) },
    semSponsor: { count: semSponsorCount, pct: pct(semSponsorCount, totalEpics) },
    aprendizadosAcionaveis,
    insightPrincipal: principal,
    insightPositivo: positivo,
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

const SAMPLE_STAGES: WeeklyStage[] = [
  {
    id: 'backlog', label: 'Backlog', descricao: 'Ideias qualificadas para análise', quantidade: 82,
    experimentos: [
      sampleRow(1, 'Triagem Automática de Chamados', 'BACKLOG', 'Rodrigo Assad', 'Atendimento', 'R$ 1.2 MM'),
      sampleRow(2, 'Score de Risco de Churn', 'BACKLOG', 'Sidney Neves', 'Comercial', 'Não Mapeado'),
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
const SAMPLE_EXPERIMENTOS_APROVADOS = 106
const SAMPLE_TOTAL_EPICS = 199
const SAMPLE_TOTAL_INICIADOS = 89
const SAMPLE_TAXA_OPORTUNIDADES = pct(56, 82)
const SAMPLE_CONVERSAO_PILOTO = 32
const SAMPLE_CONVERSAO_ESCALA = 13
const SAMPLE_CONVERSAO_DENOMINADOR = 186
const SAMPLE_CONVERSAO_ESCALA_NUMERADOR = 24
const SAMPLE_CONVERSAO_PILOTO_NUMERADOR = 59
const SAMPLE_APRENDIZADOS = 24   // deve ser <= quantidade de Concluídos (33) — é um subconjunto
const SAMPLE_INSIGHTS = buildInsights(SAMPLE_CONVERSAO_PILOTO, SAMPLE_CONVERSAO_ESCALA, SAMPLE_TOTAL_INICIADOS, SAMPLE_TAXA_OPORTUNIDADES, SAMPLE_APRENDIZADOS)

export const SAMPLE_WEEKLY_DATA: WeeklyData = {
  geradoEm: new Date().toISOString(),
  isSample: true,
  stages: SAMPLE_STAGES,
  experimentosAprovados: SAMPLE_EXPERIMENTOS_APROVADOS,
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
  aprendizadosAcionaveis: SAMPLE_APRENDIZADOS,
  insightPrincipal: SAMPLE_INSIGHTS.principal,
  insightPositivo: SAMPLE_INSIGHTS.positivo,
}
