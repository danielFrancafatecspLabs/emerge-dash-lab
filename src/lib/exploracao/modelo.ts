// Discovery Flow 2.0: o processo de exploração de oportunidades (etapas, Gate 1, rituais e papéis) e os indicadores do
// painel de Exploração. Todos os números saem de uma única lista de oportunidades (`resumirExploracao`), para o fluxo, o
// funil e os indicadores nunca se contradizerem.

export type EtapaId = 'identificar' | 'investigar' | 'explorar' | 'refinar' | 'direcionar' | 'gate' | 'handoff'
export type FaseId = 'exploracao' | 'decisao' | 'execucao'
export type DecisaoGate = 'aprovar' | 'ajustar' | 'pausar' | 'encerrar'
export type Origem = 'prospeccao' | 'recebimento'

export interface Etapa {
  id: EtapaId
  numero?: number
  nome: string
  fase: FaseId
  /** O que acontece na etapa, em uma linha. */
  resumo: string
}

export const FASES: { id: FaseId; nome: string }[] = [
  { id: 'exploracao', nome: 'Exploração e qualificação' },
  { id: 'decisao', nome: 'Decisão' },
  { id: 'execucao', nome: 'Execução' },
]

export const ETAPAS: Etapa[] = [
  { id: 'identificar', numero: 1, nome: 'Identificar', fase: 'exploracao', resumo: 'Prospectar desafios e oportunidades' },
  { id: 'investigar', numero: 2, nome: 'Investigar', fase: 'exploracao', resumo: 'Validar o problema com o negócio' },
  { id: 'explorar', numero: 3, nome: 'Explorar', fase: 'exploracao', resumo: 'Qualificar e estimar o valor' },
  { id: 'refinar', numero: 4, nome: 'Refinar', fase: 'exploracao', resumo: 'Escopo, hipóteses e métricas' },
  { id: 'direcionar', numero: 5, nome: 'Direcionar', fase: 'exploracao', resumo: 'Recomendar a esteira adequada' },
  { id: 'gate', nome: 'Gate 1', fase: 'decisao', resumo: 'Decisão formal' },
  { id: 'handoff', numero: 6, nome: 'Handoff', fase: 'execucao', resumo: 'Acompanhar na esteira' },
]

export const DECISOES: { id: DecisaoGate; nome: string; efeito: string }[] = [
  { id: 'aprovar', nome: 'Aprovar', efeito: 'segue para a esteira recomendada' },
  { id: 'ajustar', nome: 'Solicitar ajustes', efeito: 'volta ao Refinar' },
  { id: 'pausar', nome: 'Pausar', efeito: 'aguarda prioridade ou capacidade' },
  { id: 'encerrar', nome: 'Encerrar', efeito: 'sai do fluxo, com justificativa' },
]

export const PILARES = [
  { nome: 'Gestão de entradas e portfólio', resumo: 'Toda oportunidade registrada com origem, responsáveis e status.' },
  { nome: 'Qualidade da exploração', resumo: 'Problema investigado, hipóteses claras e potencial de valor estimado.' },
  { nome: 'Priorização e decisões', resumo: 'Relevância, benefício, urgência e capacidade pesados e decididos no Gate 1.' },
  { nome: 'Direcionamento e rastreabilidade', resumo: 'Esteira recomendada, justificativa e confirmação do encaminhamento registradas.' },
  { nome: 'Indicadores e melhoria contínua', resumo: 'Desempenho e resultados acompanhados para aprimorar o processo.' },
]

export const RITUAIS = [
  { nome: 'Planning de Oportunidades', cadencia: 'Semanal', pauta: 'Entradas, capacidade e prioridades' },
  { nome: 'Review de Exploração', cadencia: 'Semanal', pauta: 'Avanços, impedimentos e qualidade' },
  { nome: 'Gate 1', cadencia: 'Sob demanda', pauta: 'Decisões formais de direcionamento' },
  { nome: 'Review de Portfólio', cadencia: 'Mensal', pauta: 'Indicadores, gargalos e encaminhamentos' },
  { nome: 'Revisão Estratégica', cadencia: 'Trimestral', pauta: 'Resultados, benefícios e melhorias do processo' },
]

export const PAPEIS = [
  { nome: 'Discovery Flow', responsabilidade: 'Prospecta, explora, qualifica, recomenda e registra' },
  { nome: 'Área de negócio', responsabilidade: 'Valida o problema, a necessidade e o benefício esperado' },
  { nome: 'Patrocinador', responsabilidade: 'Apoia a priorização e as decisões de negócio' },
  { nome: 'Gate 1 (alçada definida)', responsabilidade: 'Aprova, ajusta, pausa ou encerra o direcionamento' },
  { nome: 'Esteira de destino', responsabilidade: 'Avalia o recebimento, assume a evolução e reporta resultados' },
]

export interface Oportunidade {
  key: string
  nome: string
  area: string
  origem: Origem
  /** Onde está hoje. Depois de "Solicitar ajustes" volta a `refinar`; pausadas e encerradas ficam em `gate`. */
  etapa: EtapaId
  identificadaEm: string
  naEtapaDesde: string
  /** Decisões do Gate 1, em ordem (mais de uma quando houve "Solicitar ajustes"). */
  decisoes?: { tipo: DecisaoGate; em: string }[]
  esteira?: string
  /** Resposta da esteira ao encaminhamento (indefinida enquanto ela avalia). */
  aceitaPelaEsteira?: boolean
  beneficioEstimado?: number
}

export type Situacao = 'ativa' | 'pausada' | 'encerrada'

export const ultimaDecisao = (o: Oportunidade) => o.decisoes?.[o.decisoes.length - 1]

export function situacao(o: Oportunidade): Situacao {
  const d = ultimaDecisao(o)?.tipo
  if (o.etapa === 'gate' && d === 'pausar') return 'pausada'
  if (o.etapa === 'gate' && d === 'encerrar') return 'encerrada'
  return 'ativa'
}

const DIA = 86_400_000
export const DIAS_PARA_ALERTA = 30
export const JANELA_DIAS = 90

export const diasEntre = (de: string, ate: Date) => Math.max(0, Math.floor((ate.getTime() - new Date(de).getTime()) / DIA))
const naJanela = (iso: string | undefined, inicio: Date, fim: Date) => !!iso && new Date(iso) >= inicio && new Date(iso) < fim

function mediana(valores: number[]): number | null {
  if (!valores.length) return null
  const v = [...valores].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2)
}

const indice = (e: EtapaId) => ETAPAS.findIndex(x => x.id === e)
/** Até onde a oportunidade chegou: quem já teve decisão passou pelo Gate 1, mesmo tendo voltado ao Refinar. */
function alcancou(o: Oportunidade, etapa: EtapaId): boolean {
  if (o.decisoes?.length && indice(etapa) <= indice('gate')) return true
  return indice(o.etapa) >= indice(etapa)
}

export interface Indicador {
  atual: number | null
  anterior: number | null
}

export interface ResumoExploracao {
  janela: { inicio: string; fim: string; dias: number }
  /** Ativas hoje em cada etapa (pausadas e encerradas à parte). */
  porEtapa: Record<EtapaId, { quantidade: number; paradas: number; medianaDias: number | null }>
  pausadas: number
  /** Identificadas na janela: até onde cada uma chegou (cada degrau inclui os seguintes). */
  funil: { id: string; nome: string; detalhe: string; quantidade: number }[]
  decisoes: Record<DecisaoGate, number>
  indicadores: {
    identificadas: Indicador
    medianaDiasAteGate: Indicador
    aprovacaoGate: Indicador
    aceitasEsteira: Indicador
  }
  origem: Record<Origem, number>
  comBeneficio: { quantidade: number; total: number }
  valorPotencial: number
}

/** Indicadores da janela (últimos `JANELA_DIAS` dias) e da janela anterior, do mesmo tamanho. */
export function resumirExploracao(lista: Oportunidade[], hoje = new Date()): ResumoExploracao {
  const fim = hoje
  const inicio = new Date(fim.getTime() - JANELA_DIAS * DIA)
  const inicioAnterior = new Date(inicio.getTime() - JANELA_DIAS * DIA)

  const porEtapa = Object.fromEntries(ETAPAS.map(e => {
    const ativas = lista.filter(o => o.etapa === e.id && situacao(o) === 'ativa')
    const dias = ativas.map(o => diasEntre(o.naEtapaDesde, hoje))
    return [e.id, { quantidade: ativas.length, paradas: e.id === 'handoff' ? 0 : dias.filter(d => d > DIAS_PARA_ALERTA).length, medianaDias: mediana(dias) }]
  })) as ResumoExploracao['porEtapa']

  const identificadas = (i: Date, f: Date) => lista.filter(o => naJanela(o.identificadaEm, i, f))
  /** Todas as decisões tomadas na janela (uma oportunidade pode ter mais de uma). */
  const decisoesDa = (i: Date, f: Date) => lista.flatMap(o => (o.decisoes ?? []).filter(d => naJanela(d.em, i, f)).map(d => ({ o, d })))

  const indicadoresDa = (i: Date, f: Date) => {
    const d = decisoesDa(i, f)
    const aprovadas = d.filter(x => x.d.tipo === 'aprovar').map(x => x.o)
    const respondidas = aprovadas.filter(o => o.aceitaPelaEsteira !== undefined)
    // Tempo até o Gate: da identificação à primeira decisão.
    const primeiras = lista.filter(o => naJanela(o.decisoes?.[0]?.em, i, f))
    return {
      identificadas: identificadas(i, f).length,
      mediana: mediana(primeiras.map(o => diasEntre(o.identificadaEm, new Date(o.decisoes![0].em)))),
      aprovacao: d.length ? Math.round((aprovadas.length / d.length) * 100) : null,
      aceitas: respondidas.length ? Math.round((respondidas.filter(o => o.aceitaPelaEsteira).length / respondidas.length) * 100) : null,
    }
  }
  const agora = indicadoresDa(inicio, fim)
  const antes = indicadoresDa(inicioAnterior, inicio)

  const safra = identificadas(inicio, fim)
  const funil = [
    { id: 'identificadas', nome: 'Identificadas', detalhe: 'registradas na janela', quantidade: safra.length },
    { id: 'exploradas', nome: 'Em exploração', detalhe: 'chegaram ao Explorar', quantidade: safra.filter(o => alcancou(o, 'explorar')).length },
    { id: 'gate', nome: 'Levadas ao Gate 1', detalhe: 'com recomendação pronta', quantidade: safra.filter(o => alcancou(o, 'gate')).length },
    { id: 'aprovadas', nome: 'Aprovadas', detalhe: 'direcionadas a uma esteira', quantidade: safra.filter(o => ultimaDecisao(o)?.tipo === 'aprovar').length },
    { id: 'aceitas', nome: 'Aceitas pela esteira', detalhe: 'em execução', quantidade: safra.filter(o => o.aceitaPelaEsteira).length },
  ]

  const decisoes = Object.fromEntries(DECISOES.map(d => [d.id, 0])) as Record<DecisaoGate, number>
  for (const { d } of decisoesDa(inicio, fim)) decisoes[d.tipo]++

  const ativas = lista.filter(o => situacao(o) === 'ativa')
  return {
    janela: { inicio: inicio.toISOString(), fim: fim.toISOString(), dias: JANELA_DIAS },
    porEtapa,
    pausadas: lista.filter(o => situacao(o) === 'pausada').length,
    funil,
    decisoes,
    indicadores: {
      identificadas: { atual: agora.identificadas, anterior: antes.identificadas },
      medianaDiasAteGate: { atual: agora.mediana, anterior: antes.mediana },
      aprovacaoGate: { atual: agora.aprovacao, anterior: antes.aprovacao },
      aceitasEsteira: { atual: agora.aceitas, anterior: antes.aceitas },
    },
    origem: {
      prospeccao: safra.filter(o => o.origem === 'prospeccao').length,
      recebimento: safra.filter(o => o.origem === 'recebimento').length,
    },
    comBeneficio: { quantidade: ativas.filter(o => o.beneficioEstimado).length, total: ativas.length },
    valorPotencial: ativas.reduce((s, o) => s + (o.beneficioEstimado ?? 0), 0),
  }
}
