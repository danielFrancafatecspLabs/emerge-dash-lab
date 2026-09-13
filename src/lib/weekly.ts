import { DashboardData, Iniciativa, EpicDetail } from './types'
import { getPipelineStage } from './mappers'

export interface WeeklyStage {
  id: string
  label: string
  descricao: string
  quantidade: number
}

export interface WeeklyData {
  geradoEm: string
  stages: WeeklyStage[]
  totalAtivo: number                // soma de todas as etapas do funil (oportunidades + experimentos)
  totalIniciados: number            // soma de tudo, exceto Backlog — experimentos que já saíram da ideação
  taxaOportunidadesParaExperimentos: number  // % Backlog (Iniciativas) -> Em andamento (Epics)
  conversaoPiloto: number           // % de TODAS as iniciativas que já chegaram a Piloto ou Escala (mesma lógica da aba Estratégia)
  conversaoEscala: number           // % de TODAS as iniciativas que já chegaram a Escala (mesma lógica da aba Estratégia)
  semBeneficio: { count: number; pct: number }  // agregado no funil inteiro
  semSponsor: { count: number; pct: number }    // agregado no funil inteiro
  aprendizadosAcionaveis: number
  insightPrincipal: string          // gargalo Piloto -> Escala, calculado a partir dos dados
  insightPositivo: string           // leitura executiva da conversão geral + aprendizados
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

interface RiscoItem {
  semBeneficio: boolean
  semSponsor: boolean
}

function iniciativaRisco(i: Iniciativa): RiscoItem {
  return {
    semBeneficio: (i.beneficioQuantitativoTotal ?? 0) <= 0,
    semSponsor: !i.sponsor && (!i.sponsors || i.sponsors.length === 0),
  }
}

function epicRisco(e: EpicDetail): RiscoItem {
  return {
    semBeneficio: (e.beneficioQuantitativo ?? 0) <= 0,
    semSponsor: !e.sponsor,
  }
}

/**
 * Mapeamento acordado com o time BeOn Labs para o slide Weekly:
 * - Backlog, Aguardando piloto, Piloto e Em escala vêm do board de Ideação
 *   (Iniciativas, board 2734) — cada um é uma coluna/status daquele board.
 * - Em andamento vem do board de Experimentação (Epics, board 2735) —
 *   soma de Em refinamento + Em andamento + Em validação (já unificados em
 *   "EM EXPERIMENTAÇÃO" por STATUS_PIPELINE em mappers.ts).
 * As duas taxas de conversão (Piloto e Escala) usam a mesma lógica da aba
 * Estratégia / Report: % de TODAS as iniciativas que já chegaram àquele
 * marco, usando data.pilotoStatusIds / data.escalaStatusIds.
 */
export function buildWeeklyData(data: DashboardData): WeeklyData {
  const backlogInis = data.iniciativas.filter(i => getPipelineStage(i.status) === 'BACKLOG')
  const aguardandoInis = data.iniciativas.filter(i => getPipelineStage(i.status) === 'AGUARDANDO PILOTO')
  const pilotoInis = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM PILOTO')
  const escalaInis = data.iniciativas.filter(i => getPipelineStage(i.status) === 'EM ESCALA')
  const andamentoEpics = data.allEpics.filter(e => getPipelineStage(e.status) === 'EM EXPERIMENTAÇÃO')

  const stages: WeeklyStage[] = [
    { id: 'backlog', label: 'Backlog', descricao: 'Ideias qualificadas para análise', quantidade: backlogInis.length },
    { id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: andamentoEpics.length },
    { id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: aguardandoInis.length },
    { id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: pilotoInis.length },
    { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: escalaInis.length },
  ]

  const totalAtivo = stages.reduce((s, st) => s + st.quantidade, 0)
  const totalIniciados = totalAtivo - stages[0].quantidade
  const taxaOportunidadesParaExperimentos = pct(stages[1].quantidade, stages[0].quantidade)

  // Mesma lógica da aba Estratégia / Report (ver src/app/report/page.tsx):
  // % de TODAS as iniciativas do board de Ideação que já chegaram a Piloto/Escala.
  const totalIniciativas = data.iniciativas.length
  const countEmPiloto = data.iniciativas.filter(i => data.pilotoStatusIds.includes(i.status.id)).length
  const countEmEscala = data.iniciativas.filter(i => data.escalaStatusIds.includes(i.status.id)).length
  const conversaoPiloto = pct(countEmPiloto + countEmEscala, totalIniciativas)
  const conversaoEscala = pct(countEmEscala, totalIniciativas)

  const riscos: RiscoItem[] = [
    ...backlogInis.map(iniciativaRisco),
    ...aguardandoInis.map(iniciativaRisco),
    ...pilotoInis.map(iniciativaRisco),
    ...escalaInis.map(iniciativaRisco),
    ...andamentoEpics.map(epicRisco),
  ]
  const semBeneficioCount = riscos.filter(r => r.semBeneficio).length
  const semSponsorCount = riscos.filter(r => r.semSponsor).length

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
    totalAtivo,
    totalIniciados,
    taxaOportunidadesParaExperimentos,
    conversaoPiloto,
    conversaoEscala,
    semBeneficio: { count: semBeneficioCount, pct: pct(semBeneficioCount, totalAtivo) },
    semSponsor: { count: semSponsorCount, pct: pct(semSponsorCount, totalAtivo) },
    aprendizadosAcionaveis,
    insightPrincipal: principal,
    insightPositivo: positivo,
  }
}

// ── Dados de exemplo (usados quando o Jira está inacessível) ──
const SAMPLE_STAGES: WeeklyStage[] = [
  { id: 'backlog', label: 'Backlog', descricao: 'Ideias qualificadas para análise', quantidade: 82 },
  { id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: 56 },
  { id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: 28 },
  { id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: 18 },
  { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: 11 },
]
const SAMPLE_TOTAL = SAMPLE_STAGES.reduce((s, st) => s + st.quantidade, 0)
const SAMPLE_TOTAL_INICIADOS = SAMPLE_TOTAL - SAMPLE_STAGES[0].quantidade
const SAMPLE_TAXA_OPORTUNIDADES = pct(SAMPLE_STAGES[1].quantidade, SAMPLE_STAGES[0].quantidade)
const SAMPLE_CONVERSAO_PILOTO = 32
const SAMPLE_CONVERSAO_ESCALA = 13
const SAMPLE_APRENDIZADOS = 37
const SAMPLE_INSIGHTS = buildInsights(SAMPLE_CONVERSAO_PILOTO, SAMPLE_CONVERSAO_ESCALA, SAMPLE_TOTAL_INICIADOS, SAMPLE_TAXA_OPORTUNIDADES, SAMPLE_APRENDIZADOS)

export const SAMPLE_WEEKLY_DATA: WeeklyData = {
  geradoEm: new Date().toISOString(),
  isSample: true,
  stages: SAMPLE_STAGES,
  totalAtivo: SAMPLE_TOTAL,
  totalIniciados: SAMPLE_TOTAL_INICIADOS,
  taxaOportunidadesParaExperimentos: SAMPLE_TAXA_OPORTUNIDADES,
  conversaoPiloto: SAMPLE_CONVERSAO_PILOTO,
  conversaoEscala: SAMPLE_CONVERSAO_ESCALA,
  semBeneficio: { count: 36, pct: pct(36, SAMPLE_TOTAL) },
  semSponsor: { count: 29, pct: pct(29, SAMPLE_TOTAL) },
  aprendizadosAcionaveis: SAMPLE_APRENDIZADOS,
  insightPrincipal: SAMPLE_INSIGHTS.principal,
  insightPositivo: SAMPLE_INSIGHTS.positivo,
}
