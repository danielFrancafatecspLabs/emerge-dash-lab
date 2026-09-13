import { DashboardData, EpicDetail } from './types'

export interface WeeklyStage {
  id: string
  label: string
  descricao: string
  quantidade: number
}

export interface WeeklyData {
  geradoEm: string
  stages: WeeklyStage[]
  totalEpics: number                // data.allEpics.length — denominador dos cards de risco
  totalIniciados: number            // Epics em Em andamento + Em validação + Concluído (board de Experimentação)
  taxaOportunidadesParaExperimentos: number  // % Backlog (Iniciativas) -> Em andamento (Epics)
  conversaoPiloto: number           // % de TODAS as iniciativas que já chegaram a Piloto ou Escala (mesma lógica da aba Estratégia/Report)
  conversaoEscala: number           // % de TODAS as iniciativas que já chegaram a Escala (mesma lógica da aba Estratégia/Report)
  semBeneficio: { count: number; pct: number }  // Epics sem benefício quantitativo E sem benefício qualitativo
  semSponsor: { count: number; pct: number }    // Epics sem sponsor
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
 * Mapeamento acordado com o time BeOn Labs para o slide Weekly (v4 — corrigido
 * após teste com dados reais). Reusa os MESMOS filtros por id+nome de status já
 * usados em src/app/report/page.tsx (funilStages / totalExperimentosIniciados /
 * conversaoPiloto / conversaoEscala) em vez do mapa STATUS_PIPELINE — aquele mapa
 * ficou incompleto/desatualizado em relação aos status reais do board e subcontava
 * "Em andamento".
 *
 * Ordem das etapas: Oportunidades Mapeadas → Backlog → Ideias Qualificadas →
 * Em andamento → Concluídos → Piloto → Em escala ("Aguardando piloto" removida).
 *
 * - Oportunidades Mapeadas: total de Iniciativas do board de Ideação (sem filtro de status).
 * - Backlog: Iniciativas no status BACKLOG (id 10004 / nome "BACKLOG").
 * - Ideias Qualificadas: soma de Epics em Em andamento + Em validação + Concluído
 *   (board de Experimentação) — o mesmo total de "Experimentos iniciados".
 * - Em andamento: Epics em "Em andamento" (id 3) + "Em validação"/"EM VALIDAÇÃO" (id 10204).
 * - Concluídos: Epics com status "Concluído" (id 10019).
 * - Piloto / Em escala: Iniciativas nos respectivos status do board de Ideação.
 * - Conversão para Piloto/Escala: % de TODAS as iniciativas que já chegaram àquele
 *   marco, usando data.pilotoStatusIds / data.escalaStatusIds (igual à aba Estratégia).
 * - Sem benefício potencial / Sem sponsor: sobre TODOS os Epics do board de
 *   Experimentação — benefício considera os campos quantitativo E qualitativo juntos.
 */
export function buildWeeklyData(data: DashboardData): WeeklyData {
  const backlogInis = data.iniciativas.filter(i => i.status.id === '10004' || i.status.name === 'BACKLOG')
  const pilotoInis = data.iniciativas.filter(i => i.status.id === '12847' || i.status.name === 'EM PILOTO' || i.status.name === 'Em Piloto')
  const escalaInis = data.iniciativas.filter(i =>
    i.status.id === '12848' || ['EM ESCALA', 'Em Escala', 'Em escala', 'FINALIZADO', 'Finalizado'].includes(i.status.name)
  )

  const emAndamentoEpics = data.allEpics.filter(e => e.status?.id === '3' || e.status?.name === 'Em andamento')
  const emValidacaoEpics = data.allEpics.filter(e => e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação')
  const concluidosEpics = data.allEpics.filter(e => e.status?.id === '10019')

  const emAndamentoCount = emAndamentoEpics.length + emValidacaoEpics.length
  const concluidosCount = concluidosEpics.length
  const ideiasQualificadas = emAndamentoCount + concluidosCount
  const backlogCount = backlogInis.length
  const oportunidadesMapeadas = data.iniciativas.length

  const stages: WeeklyStage[] = [
    { id: 'oportunidades', label: 'Oportunidades Mapeadas', descricao: 'Total do board de Ideação', quantidade: oportunidadesMapeadas },
    { id: 'backlog', label: 'Backlog', descricao: 'Ideias pendentes de avaliação', quantidade: backlogCount },
    { id: 'ideias', label: 'Ideias Qualificadas', descricao: 'Ativos ou concluídos', quantidade: ideiasQualificadas },
    { id: 'andamento', label: 'Em andamento', descricao: 'Execução ativa', quantidade: emAndamentoCount },
    { id: 'concluidos', label: 'Concluídos', descricao: 'Experimento finalizado', quantidade: concluidosCount },
    { id: 'piloto', label: 'Piloto', descricao: 'Validação real', quantidade: pilotoInis.length },
    { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: escalaInis.length },
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
    totalEpics,
    totalIniciados,
    taxaOportunidadesParaExperimentos,
    conversaoPiloto,
    conversaoEscala,
    semBeneficio: { count: semBeneficioCount, pct: pct(semBeneficioCount, totalEpics) },
    semSponsor: { count: semSponsorCount, pct: pct(semSponsorCount, totalEpics) },
    aprendizadosAcionaveis,
    insightPrincipal: principal,
    insightPositivo: positivo,
  }
}

// ── Dados de exemplo (usados quando o Jira está inacessível) ──
const SAMPLE_STAGES: WeeklyStage[] = [
  { id: 'oportunidades', label: 'Oportunidades Mapeadas', descricao: 'Total do board de Ideação', quantidade: 186 },
  { id: 'backlog', label: 'Backlog', descricao: 'Ideias pendentes de avaliação', quantidade: 82 },
  { id: 'ideias', label: 'Ideias Qualificadas', descricao: 'Ativos ou concluídos', quantidade: 100 },
  { id: 'andamento', label: 'Em andamento', descricao: 'Execução ativa', quantidade: 56 },
  { id: 'concluidos', label: 'Concluídos', descricao: 'Experimento finalizado', quantidade: 44 },
  { id: 'piloto', label: 'Piloto', descricao: 'Validação real', quantidade: 18 },
  { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: 11 },
]
const SAMPLE_TOTAL_EPICS = 199
const SAMPLE_TOTAL_INICIADOS = 100
const SAMPLE_TAXA_OPORTUNIDADES = pct(56, 82)
const SAMPLE_CONVERSAO_PILOTO = 32
const SAMPLE_CONVERSAO_ESCALA = 13
const SAMPLE_APRENDIZADOS = 37
const SAMPLE_INSIGHTS = buildInsights(SAMPLE_CONVERSAO_PILOTO, SAMPLE_CONVERSAO_ESCALA, SAMPLE_TOTAL_INICIADOS, SAMPLE_TAXA_OPORTUNIDADES, SAMPLE_APRENDIZADOS)

export const SAMPLE_WEEKLY_DATA: WeeklyData = {
  geradoEm: new Date().toISOString(),
  isSample: true,
  stages: SAMPLE_STAGES,
  totalEpics: SAMPLE_TOTAL_EPICS,
  totalIniciados: SAMPLE_TOTAL_INICIADOS,
  taxaOportunidadesParaExperimentos: SAMPLE_TAXA_OPORTUNIDADES,
  conversaoPiloto: SAMPLE_CONVERSAO_PILOTO,
  conversaoEscala: SAMPLE_CONVERSAO_ESCALA,
  semBeneficio: { count: 36, pct: pct(36, SAMPLE_TOTAL_EPICS) },
  semSponsor: { count: 29, pct: pct(29, SAMPLE_TOTAL_EPICS) },
  aprendizadosAcionaveis: SAMPLE_APRENDIZADOS,
  insightPrincipal: SAMPLE_INSIGHTS.principal,
  insightPositivo: SAMPLE_INSIGHTS.positivo,
}
