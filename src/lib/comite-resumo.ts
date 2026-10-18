import type { SemanalResumo } from './semanal'

/**
 * Slide "beOn Labs — visão geral" do Comitê (deck V6), pronto para exibir: números e textos já no formato
 * do slide ("08", "R$ 416 milhões", "05 em execução"…). A tela da Weekly e o PPTX editável usam este mesmo
 * objeto, então os dois mostram sempre os mesmos valores. Os cálculos vêm de buildSemanalData (lib/semanal).
 */

export interface ComiteFatiaView {
  id: 'exploracao' | 'andamento' | 'validadas' | 'refutadas' | 'cancelados'
  numero: string
  pct: string
  label: string
}

export interface ComiteMetricaView {
  pct: number
  pctLabel: string
  titulo: string
  descricao: string
}

export interface ComiteResumoView {
  ateLabel: string
  total: string
  fatias: ComiteFatiaView[]
  beneficioTotal: string
  beneficioTotalNota: string
  exploracao: { ideiasNaoAvaliadas: string; oportunidades: string; oportunidadesLabel: string; beneficio: string }
  experimentacao: { experimentos: string; experimentosLabel: string; beneficio: string }
  piloto: {
    experimentos: string
    experimentosLabel: string
    aguardando: string
    aguardandoBeneficio: string
    execucao: string
    execucaoBeneficio: string
    /** Piloto que concentra a maior parte do benefício, mostrado à parte ("Integridade do Produto 254 milhões"). */
    outlier: string | null
  }
  escala: { experimentos: string; experimentosLabel: string; beneficio: string }
  metricas: ComiteMetricaView[]
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Contagens pequenas com dois dígitos, como no deck ("08", "05"). */
export function doisDigitos(n: number): string {
  return String(Math.max(0, Math.round(n))).padStart(2, '0')
}

/** Valor em milhões no formato do deck: "416 milhões", "5,6 milhões", "1,5 milhão". */
export function milhoes(valor: number): string {
  const mm = Math.max(0, valor) / 1_000_000
  if (mm === 0) return '0'
  const casas = mm >= 100 || Number.isInteger(Math.round(mm * 10) / 10) ? 0 : 1
  const numero = mm.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
  return `${numero} ${mm < 2 ? 'milhão' : 'milhões'}`
}

export const reais = (valor: number) => (valor > 0 ? `R$ ${milhoes(valor)}` : 'R$ 0')

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios)

/** "até out/26" a partir da data em que os dados foram lidos. */
export function ateLabel(iso: string): string {
  const d = new Date(iso)
  return `até ${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

/**
 * Fim do arco vermelho de um anel de percentual (`adj2` do blockArc no PowerPoint, em 60 000 avos de grau).
 * O arco começa no topo (270°) e anda no sentido horário.
 */
export function fimDoArco(pct: number): number {
  const p = Math.min(100, Math.max(0, pct))
  if (p >= 100) return 16_199_999
  return (16_200_000 + Math.round(p * 216_000)) % 21_600_000
}

export function montarComiteResumo(resumo: SemanalResumo, geradoEm: string): ComiteResumoView {
  const total = resumo.totalExperimentos
  const { execucao } = resumo.piloto
  const execBeneficio = execucao.destaque && execucao.demais ? execucao.demais.beneficio : execucao.beneficio
  return {
    ateLabel: ateLabel(geradoEm),
    total: String(total),
    fatias: resumo.fatias.map(f => ({ id: f.id, numero: doisDigitos(f.quantidade), pct: `${f.pct}%`, label: f.label })),
    beneficioTotal: reais(resumo.beneficioTotal),
    beneficioTotalNota: `Concedido pelas áreas de negócio para os ${total} experimentos`,
    exploracao: {
      ideiasNaoAvaliadas: `${resumo.exploracao.ideiasNaoAvaliadas} ${plural(resumo.exploracao.ideiasNaoAvaliadas, 'ideia não avaliada', 'ideias não avaliadas')}`,
      oportunidades: String(resumo.exploracao.oportunidades),
      oportunidadesLabel: plural(resumo.exploracao.oportunidades, 'Oportunidade', 'Oportunidades'),
      beneficio: reais(resumo.exploracao.beneficio),
    },
    experimentacao: {
      experimentos: String(resumo.experimentacao.experimentos),
      experimentosLabel: plural(resumo.experimentacao.experimentos, 'experimento', 'experimentos'),
      beneficio: reais(resumo.experimentacao.beneficio),
    },
    piloto: {
      experimentos: String(resumo.piloto.total),
      experimentosLabel: plural(resumo.piloto.total, 'experimento', 'experimentos'),
      aguardando: `${doisDigitos(resumo.piloto.aguardando.quantidade)} aguardando piloto`,
      aguardandoBeneficio: reais(resumo.piloto.aguardando.beneficio),
      execucao: `${doisDigitos(execucao.quantidade)} em execução`,
      execucaoBeneficio: reais(execBeneficio),
      outlier: execucao.destaque ? `${execucao.destaque.nome} ${milhoes(execucao.destaque.beneficio)}` : null,
    },
    escala: {
      experimentos: String(resumo.escala.experimentos),
      experimentosLabel: plural(resumo.escala.experimentos, 'experimento', 'experimentos'),
      beneficio: reais(resumo.escala.beneficio),
    },
    metricas: resumo.metricas.map(m => ({ pct: m.pct, pctLabel: `${m.pct}%`, titulo: m.titulo, descricao: m.descricao })),
  }
}
