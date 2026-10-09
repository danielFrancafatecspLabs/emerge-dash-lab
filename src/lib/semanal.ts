import type { DashboardData, EpicDetail, Iniciativa } from './types'
import type { WeeklyData } from './weekly'
import { limparDescricao } from './report-utils'

/**
 * Aba "Semanal" — reproduz o deck do Comitê beOn Labs (V7) com dados do Jira.
 *
 * Reaproveita a classificação já usada na Weekly (buildWeeklyData) para que
 * os números das duas abas batam: as fases vêm de WeeklyData.stages e aqui
 * só buscamos de volta a Iniciativa/Epic de cada linha para montar os campos
 * ricos que o deck mostra (benefício numérico, diretor, ponto focal etc.).
 *
 * Mapeamento das 5 fatias do total de experimentos (slide "beOn Labs"):
 * - Em Exploração: Epics em Backlog/Refinamento do board de Experimentação.
 * - Em andamento: Epics em andamento + em validação.
 * - Hipóteses validadas: Iniciativas que seguiram para Aguardando Piloto,
 *   Em Piloto ou Em Escala (o experimento terminou e avançou).
 * - Cancelados: Epics cancelados.
 * - Hipóteses refutadas: o restante do total (experimentos concluídos que
 *   não avançaram) — assim as 5 fatias sempre somam o total.
 */

export type SemanalSecaoId = 'escala' | 'aguardando' | 'piloto' | 'andamento' | 'backlog'

export interface SemanalRow {
  key: string
  nome: string
  descricao: string
  situacao: string | null      // Sit. Atual / Observação
  pendencia: string | null     // Pendência
  lab: string | null           // Laboratório responsável
  diretor: string | null       // Sponsor
  pontoFocal: string | null    // Business Owner
  area: string | null          // Domínio
  beneficio: number | null     // R$
  estrategico: boolean
  previsao: string | null      // Data limite (duedate)
  fase: string                 // nome do status no Jira
}

export interface SemanalSecao {
  id: SemanalSecaoId
  titulo: string
  subtitulo?: string
  divisor: string[]            // texto do slide divisor (linhas)
  rows: SemanalRow[]
}

export interface SemanalFatia {
  id: 'exploracao' | 'andamento' | 'validadas' | 'refutadas' | 'cancelados'
  label: string
  quantidade: number
  pct: number
}

export interface SemanalMetrica {
  titulo: string
  descricao: string
  pct: number
}

export interface SemanalResumo {
  totalExperimentos: number
  fatias: SemanalFatia[]
  beneficioTotal: number
  exploracao: { oportunidades: number; ideiasNaoAvaliadas: number; beneficio: number }
  experimentacao: { experimentos: number; beneficio: number }
  piloto: {
    total: number
    aguardando: { quantidade: number; beneficio: number }
    execucao: {
      quantidade: number
      beneficio: number
      // Quando um único piloto concentra a maior parte do benefício, o deck o
      // destaca à parte para não distorcer a leitura dos demais.
      destaque: { nome: string; beneficio: number } | null
      demais: { quantidade: number; beneficio: number } | null
    }
  }
  escala: { experimentos: number; beneficio: number }
  metricas: SemanalMetrica[]
}

export interface SemanalData {
  geradoEm: string
  resumo: SemanalResumo
  secoes: SemanalSecao[]
  isSample: boolean
}

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

/** Percentuais inteiros que somam exatamente 100 (maior resto). */
export function percentuaisInteiros(valores: number[]): number[] {
  const total = valores.reduce((a, b) => a + b, 0)
  if (total <= 0) return valores.map(() => 0)
  const brutos = valores.map(v => (v / total) * 100)
  const base = brutos.map(Math.floor)
  let falta = 100 - base.reduce((a, b) => a + b, 0)
  const ordem = brutos.map((b, i) => [b - Math.floor(b), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of ordem) {
    if (falta <= 0) break
    base[i]++
    falta--
  }
  return base
}

const soma = (rows: SemanalRow[]) => rows.reduce((acc, r) => acc + (r.beneficio ?? 0), 0)

/** Estratégicos primeiro, depois maior benefício potencial, depois nome. */
export function ordenarRows(rows: SemanalRow[]): SemanalRow[] {
  return [...rows].sort((a, b) =>
    Number(b.estrategico) - Number(a.estrategico) ||
    (b.beneficio ?? -1) - (a.beneficio ?? -1) ||
    a.nome.localeCompare(b.nome, 'pt-BR'))
}

function texto(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t ? t : null
}

// Prioridade "Highest" no Jira = iniciativa estratégica (estrela no deck).
const ehEstrategico = (e: EpicDetail) => e.prioridade === 'Highest'

function rowFromEpic(e: EpicDetail, labDaIniciativa: Map<string, string | null>): SemanalRow {
  return {
    key: e.key,
    nome: e.nome,
    descricao: limparDescricao(e.descricao),
    situacao: texto(e.statusDetalhado),
    pendencia: texto(e.motivoBloqueio),
    lab: texto(labDaIniciativa.get(e.parentKey ?? '') ?? e.timeResponsavel),
    diretor: texto(e.sponsor),
    pontoFocal: texto(e.bo),
    area: texto(e.dominio),
    beneficio: e.beneficioQuantitativo && e.beneficioQuantitativo > 0 ? e.beneficioQuantitativo : null,
    estrategico: ehEstrategico(e),
    previsao: e.duedate ?? null,
    fase: e.status.name,
  }
}

function rowFromIniciativa(i: Iniciativa): SemanalRow {
  // Situação/pendência: a do Epic filho mais recente (a Iniciativa em si não
  // tem esses campos no board de Ideação).
  const epicsRecentes = [...i.epics].sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? ''))
  const beneficio = i.beneficioQuantitativo && i.beneficioQuantitativo > 0
    ? i.beneficioQuantitativo
    : i.beneficioQuantitativoTotal > 0 ? i.beneficioQuantitativoTotal : null
  return {
    key: i.key,
    nome: i.nome,
    descricao: limparDescricao(i.descricao ?? epicsRecentes[0]?.descricao ?? null),
    situacao: texto(epicsRecentes.find(e => texto(e.statusDetalhado))?.statusDetalhado),
    pendencia: texto(epicsRecentes.find(e => texto(e.motivoBloqueio))?.motivoBloqueio),
    lab: texto(i.timeResponsavel),
    diretor: texto(i.sponsor ?? i.sponsors[0]),
    pontoFocal: texto(i.bo ?? epicsRecentes.find(e => texto(e.bo))?.bo),
    area: texto(i.dominio ?? i.dominios[0]),
    beneficio,
    estrategico: i.epics.some(ehEstrategico),
    previsao: null,
    fase: i.status.name,
  }
}

export function buildSemanalData(data: DashboardData, weekly: WeeklyData): SemanalData {
  const iniByKey = new Map(data.iniciativas.map(i => [i.key, i]))
  const epicByKey = new Map(data.allEpics.map(e => [e.key, e]))
  const labDaIniciativa = new Map(data.iniciativas.map(i => [i.key, i.timeResponsavel ?? null]))
  const stage = (id: string) => weekly.stages.find(s => s.id === id)

  const epicRows = (id: string) => (stage(id)?.experimentos ?? [])
    .map(r => epicByKey.get(r.key)).filter((e): e is EpicDetail => !!e)
    .map(e => rowFromEpic(e, labDaIniciativa))
  const iniRows = (id: string) => (stage(id)?.experimentos ?? [])
    .map(r => iniByKey.get(r.key)).filter((i): i is Iniciativa => !!i)
    .map(rowFromIniciativa)

  const backlog = ordenarRows(epicRows('backlog'))
  const andamento = ordenarRows(epicRows('andamento'))
  const aguardando = ordenarRows(iniRows('aguardando'))
  const piloto = ordenarRows(iniRows('piloto'))
  const escala = ordenarRows(iniRows('escala'))
  const cancelados = stage('cancelados')?.quantidade ?? 0

  const total = weekly.experimentosAprovados
  const validadas = aguardando.length + piloto.length + escala.length
  const refutadas = Math.max(0, total - (backlog.length + andamento.length + validadas + cancelados))

  return {
    geradoEm: weekly.geradoEm,
    isSample: weekly.isSample,
    resumo: montarResumo({
      total, backlog, andamento, aguardando, piloto, escala, cancelados, refutadas,
      ideiasNaoAvaliadas: weekly.pendenteAnalise.quantidade,
      beneficioTotal: data.beneficioTotal,
      semBeneficio: weekly.semBeneficio.count,
      semSponsor: weekly.semSponsor.count,
    }),
    secoes: montarSecoes({ escala, aguardando, piloto, andamento, backlog }),
  }
}

interface ResumoInput {
  total: number
  backlog: SemanalRow[]
  andamento: SemanalRow[]
  aguardando: SemanalRow[]
  piloto: SemanalRow[]
  escala: SemanalRow[]
  cancelados: number
  refutadas: number
  ideiasNaoAvaliadas: number
  beneficioTotal: number
  semBeneficio: number
  semSponsor: number
}

function montarResumo(i: ResumoInput): SemanalResumo {
  const validadas = i.aguardando.length + i.piloto.length + i.escala.length
  const qtds = [i.backlog.length, i.andamento.length, validadas, i.refutadas, i.cancelados]
  const pcts = percentuaisInteiros(qtds)
  const labels: [SemanalFatia['id'], string][] = [
    ['exploracao', 'Em Exploração'], ['andamento', 'Em andamento'], ['validadas', 'Hipóteses validadas'],
    ['refutadas', 'Hipóteses refutadas'], ['cancelados', 'Cancelados'],
  ]
  const totalFatias = qtds.reduce((a, b) => a + b, 0)

  const execBeneficio = soma(i.piloto)
  const topo = [...i.piloto].sort((a, b) => (b.beneficio ?? 0) - (a.beneficio ?? 0))[0]
  const temDestaque = i.piloto.length > 1 && !!topo?.beneficio && topo.beneficio > execBeneficio / 2
  const pilotoTotal = i.aguardando.length + i.piloto.length

  return {
    totalExperimentos: totalFatias,
    fatias: labels.map(([id, label], k) => ({ id, label, quantidade: qtds[k], pct: pcts[k] })),
    beneficioTotal: i.beneficioTotal,
    exploracao: { oportunidades: i.backlog.length, ideiasNaoAvaliadas: i.ideiasNaoAvaliadas, beneficio: soma(i.backlog) },
    experimentacao: { experimentos: i.andamento.length, beneficio: soma(i.andamento) },
    piloto: {
      total: pilotoTotal,
      aguardando: { quantidade: i.aguardando.length, beneficio: soma(i.aguardando) },
      execucao: {
        quantidade: i.piloto.length,
        beneficio: execBeneficio,
        destaque: temDestaque ? { nome: topo.nome, beneficio: topo.beneficio ?? 0 } : null,
        demais: temDestaque ? { quantidade: i.piloto.length - 1, beneficio: execBeneficio - (topo.beneficio ?? 0) } : null,
      },
    },
    escala: { experimentos: i.escala.length, beneficio: soma(i.escala) },
    metricas: [
      { titulo: 'Conversão para piloto', pct: pct(i.piloto.length + i.escala.length, totalFatias),
        descricao: `${i.piloto.length + i.escala.length} de ${totalFatias} experimentos aprovados já realizaram piloto` },
      { titulo: 'Conversão para escala', pct: pct(i.escala.length, totalFatias),
        descricao: `${i.escala.length} de ${totalFatias} experimentos aprovados já em escala` },
      { titulo: 'Sem benefício potencial', pct: pct(i.semBeneficio, totalFatias),
        descricao: `${i.semBeneficio} experimentos sem registro de benefício potencial` },
      { titulo: 'Sem patrocínio formal', pct: pct(i.semSponsor, totalFatias),
        descricao: `${i.semSponsor} experimentos sem patrocínio formal da diretoria` },
    ],
  }
}

function montarSecoes(s: Record<SemanalSecaoId, SemanalRow[]>): SemanalSecao[] {
  return [
    { id: 'escala', titulo: 'Em escala', divisor: ['Experimentos', 'Em Escala'], rows: s.escala },
    { id: 'aguardando', titulo: 'Aguardando Piloto', divisor: ['Experimentos', 'Aguardando', 'Piloto'], rows: s.aguardando },
    { id: 'piloto', titulo: 'Em Piloto', divisor: ['Experimentos', 'Em Piloto'], rows: s.piloto },
    { id: 'andamento', titulo: 'Em andamento', subtitulo: 'Experimentos com Execução do beOn Labs e Áreas de Negócio', divisor: ['Experimentos', 'Em Andamento'], rows: s.andamento },
    { id: 'backlog', titulo: 'Backlog – Ideias já Avaliadas como Experimento', divisor: ['Iniciativas', 'Em Backlog'], rows: s.backlog },
  ]
}

// ── Dados de exemplo (Jira inacessível) — espelham o Comitê V7 ──────────
type SampleTuple = [nome: string, key: string, descricao: string, situacao: string | null, lab: string, diretor: string, area: string, mm: number | null, estrategico?: boolean]

// "Pendência: X" vira pendência; em andamento, o texto do chip (≠ "Em andamento") também é pendência.
function sampleRows(tuples: SampleTuple[], fase: string, previsoes: (string | null)[] = []): SemanalRow[] {
  return tuples.map(([nome, key, descricao, sit, lab, diretor, area, mm, estrategico], k) => {
    const [d, p] = diretor.split(' / ')
    const ehPendencia = !!sit && (sit.startsWith('Pendência: ') || (fase === 'Em andamento' && sit !== 'Em andamento'))
    const situacao = ehPendencia || fase === 'Em andamento' ? null : sit
    const pendencia = ehPendencia ? sit!.replace(/^Pendência: /, '') : null
    return {
      key, nome, descricao, situacao, pendencia, lab, diretor: d ?? null, pontoFocal: p ?? null, area,
      beneficio: mm === null ? null : mm * 1_000_000, estrategico: !!estrategico, previsao: previsoes[k] ?? null, fase,
    }
  })
}

const SAMPLE_ESCALA = sampleRows([
  ['Copilot Atendimento', 'GL-420', 'Experimento que utiliza IA para auxiliar os atendentes a localizar informações e gerar respostas adequadas para os clientes.', 'Sem acompanhamento Pós-Produção', 'Beon Labs', 'Fernanda Delsoto', 'Atendimento', 26],
  ['URA e Call Center Cognitivo', 'GL-475', 'Entendimento de intenção e direcionamento mais rápido na URA para oferta de Auto Serviço ou atendimento especializado.', 'Sem acompanhamento Pós-Produção', 'Beon Labs', 'Fernanda Delsoto', 'Atendimento', 12],
  ['Agente Filtro de VT', 'GL-805', 'Experimento que utiliza IA para realizar o primeiro atendimento técnico ao cliente, com orientações rápidas e assertivas.', 'Sem acompanhamento Pós-Produção', 'Área de Negócio', 'Rogério Estrela / Daiane Soares', 'Digital', 12],
  ['Coach Televendas Ativo Movel', 'GL-626', 'Identificar quais argumentos impactam a conversão de vendas, distinguindo os argumentos utilizados pelos vendedores.', 'Sem acompanhamento Pós-Produção', 'Beon Labs', 'Cristiano José / Simone Lacerda', 'Comercial', 5],
  ['ISA - Analista de Rede B2B', 'GL-830', 'Apoiar equipes N1 e N2 com um assistente de IA para acelerar diagnósticos e recomendar ações corretivas.', 'Aprovado para escalar sem time de delivery', 'Área de Negócio', 'Carlos Souza / Victor Falcão', 'Operações Técnicas', 3.6],
  ['Livia BCC', 'GL-366', 'Avaliar um assistente virtual capaz de consolidar indicadores de produtividade e apoiar gestores na geração de insights.', 'Sem visibilidade', 'Área de Negócio', 'Alexandre Rampinelli', 'Atendimento', 0.6],
  ['Alarme situacional - Speech analitycs (Televendas)', 'GL-640', 'Experimento que usa IA para analisar as interações de televendas, identificando oportunidades de melhoria.', 'Sem visibilidade', 'Beon Labs', 'Simone Lacerda / Daniel Pacchini', 'Televendas', null],
  ['Gen Ia Formulários (Onboarding / Offboarding)', 'GL-474', 'Avaliar o uso de IA na análise de dados de desligamento e desenvolvimento de colaboradores.', 'Em produção', 'Beon Labs', 'Vainer Picollo / Carlos Mendes', 'RH', null],
  ['Evolução Whisper - Benchmark Características dos Áudios', 'GL-378', 'Avaliar se diferentes perfis de áudio impactam a eficiência e a qualidade das transcrições realizadas pelo Whisper.', 'Sem acompanhamento Pós-Produção', 'Beon Labs', 'Luciano Diettrich / Sérgio Gaiotto', 'Dados & IA', null],
  ['STT – Whisper', 'GL-478', 'Avaliar se a ferramenta de Speech-To-Text OpenAI Whisper tem um nível de maturidade que permita ser alternativa a outras ferramentas.', 'Sem acompanhamento Pós-Produção', 'Beon Labs', 'Luciano Diettrich / Sérgio Gaiotto', 'Dados & IA', null],
  ['IA Insight', 'GL-616', 'Assistente virtual baseado em IA, integrado à base de conhecimento do cliente, para respostas rápidas e confiáveis.', 'Sem visibilidade', 'beOn Labs / Hitss', 'Andreia Mannarino', 'Global Hitss', null],
  ['IA ClientFlow', 'GL-617', 'Análise de Contatos Call Center - Speech Analytics.', 'Sem visibilidade', 'beOn Labs / Hitss', 'Andreia Mannarino', 'Global Hitss', null],
  ['Análise de comentários das lojas de apps (IA Otimiza App)', 'GL-532', 'Utilização de IA para avaliar e ranquear aplicativos disponíveis na Play Store e Apple Store.', 'Sem visibilidade', 'beOn Labs / Hitss', 'Andreia Mannarino / Felipe Moraes', 'Global Hitss', null],
  ['Copilot de Desenvolvimento', 'GL-405', 'Uso de uma ferramenta de geração de código Copilot para aumentar a produtividade do desenvolvedor.', 'Sem visibilidade', 'Dados IA', 'Cesar Santos / Sérgio Gaiotto', 'TI', null],
  ['Busca Avançada Site', 'GL-845', 'Utilizar IA para melhorar a busca atual do site claro.com.br.', 'Sem visibilidade', 'beOn Labs / Digital', 'Rodrigo Duclos', 'Digital', null],
  ['Otimização de Baterias', 'GL-477', 'Modelo de análise para identificar oportunidades de redistribuição de recursos de infraestrutura entre unidades operacionais.', 'Em desenvolvimento, sem acompanhamento', 'Beon Labs', 'Carlos Souza / Jonas Resende', 'Operações Técnicas', null],
], 'Em escala')

const SAMPLE_AGUARDANDO = sampleRows([
  ['Logoff Whatsapp', 'GL-900', 'Desenvolver solução que permita realizar o logoff de contas do WhatsApp após cancelamento do número pré-pago na Claro.', 'Pendência: Planejamento de alocação de recursos', 'Beon Labs', 'Julio Cezar Moreira', 'Segurança', null, true],
  ['Identificação de Chamadas de Spam', 'GL-901', 'Analisar os dados das chamadas dos clientes para identificar possíveis regras que permitam classificar uma ligação como spam.', 'Pendência: Aguardando Alocação de Delivery', 'Beon Labs', 'Carlos Araujo / Gabriel Portugal', 'SVA', null, true],
  ['Validação Inteligente de Endereços (Match HP)', 'GL-902', 'Utilizar IA para identificar e padronizar dados do endereço do cliente.', 'Pendência: Atualização Pendente', 'CoE Digital', 'Rodrigo Duclos / Salvo Alves', 'Digital', 7.5],
  ['Autoinspeção', 'GL-903', 'Solução de reconhecimento de imagem IA que analisa as imagens de serviços de instalação técnica.', 'Encaminhado a Hitss para Orçamento', 'Beon Labs', 'Carlos Souza / Pietro Mordegane', 'Operações Técnicas', 3.6],
  ['Smart Sales - Buscador de produtos', 'GL-904', 'Sugerir o melhor produto para o cliente com base no CEP, CPF ou fatura do concorrente no site Claro.com.br através de IA.', 'Pendência: Atualização Pendente', 'CoE Digital', 'Rodrigo Duclos', 'Digital', 2.4],
  ['Reajuste Telmex', 'GL-905', 'Dashboard para consolidar e monitorar os contratos da Telmex, sinalizando vencimentos e informações críticas.', 'Pendência: Aguardando Alocação de Time de Delivery', 'Beon Labs', 'Gustavo Silbert / Carla Tiemi', 'GE', 2],
  ['Chatbot App Conectado', 'GL-906', 'Chatbot com IA integrado ao App Conectado, para apoiar o técnico de campo no momento da execução do atendimento.', 'Em avaliação Esteira Dados & IA', 'Área de Negócio', 'Carlos Souza / Paulo Damasceno', 'Operações Técnicas', 1.7],
  ['Smart Capex - Análise de Imagem de Satelite', 'GL-907', 'Apoiar a priorização de investimentos em áreas brownfield por meio da análise de imagens de satélite com visão computacional.', 'Pendência: Aguardando Alocação de Delivery', 'Beon Labs', 'André Guerreiro / Heloisa Ubng', 'Estratégia', 1.6],
  ['Assistente de Inteligência Técnica (Claro Ajuda)', 'GL-908', 'Assistente de IA Generativa para apoiar técnicos em atendimento, fornecendo resumos técnicos e acesso rápido a informações.', 'Será desenvolvido pelo App Meu Técnico Nota 10', 'Área de Negócio', 'Carlos Souza / Jana Del Prado', 'Operações Técnicas', 1.3],
  ['CORI - Centro de Operações de Rede Inteligente', 'GL-909', 'Agente inteligente para avaliar tentativas de fechamento de ordens de serviço relacionadas ao tratamento de rede externa.', 'Será desenvolvido pelo App Meu Técnico Nota 10', 'Beon Labs', 'Carlos Souza / Wilson Luiz Vieira', 'Operações Técnicas', 1.1],
  ['Processamento de Manifestos', 'GL-910', 'Avaliar se um modelo LLM é capaz de classificar causas de reclamações de maneira mais assertiva que um Analista/Ouvidor.', 'Apresentação da Ficha Financeira para Dados & IA', 'Beon Labs', 'Vera Marelim / Fabio Arioza', 'Ouvidoria', 0.9],
  ['Gestão de Incidentes', 'GL-911', 'IA para automatizar a gestão de incidentes no Data Center, priorizando alertas e apoiando a análise de causa raiz.', 'Fazendo ajustes sugeridos por arquitetura corporativa', 'Área de Negócio', 'Operações Técnicas', 'Operações Técnicas', 0.5],
  ['OCR do Solar', 'GL-912', 'Substituir OCR atual pela IA para aumentar a precisão na leitura e captura de dados de produtos e número de série no NETSMS.', 'Apresentação da Ficha Financeira Dados & IA', 'Beon Labs', 'Almir de Jesus / Marlon Colombo', 'TI', 0.2],
  ['EditAI - Automação de Editais', 'GL-913', 'Automatizar a resposta a editais com IA Generativa, utilizando documentos técnicos como base.', 'Pendência: Aguardando Alocação de Delivery', 'Beon Labs', 'Marcio Nunes / Heloisa Carneiro', 'Engenharia', null],
  ['Check AI', 'GL-914', 'Automatizar e ampliar a capacidade de health-check e monitoramento preditivo dos produtos e serviços da mesa QOD.', 'beOn Labs apoiando no benefício potencial', 'Área de Negócio', 'Cesar Santos / Felipe da Silva', 'TI', null],
  ['ARI Jurídico', 'GL-915', 'Análise de base processual pública para identificar oportunidades jurídicas e melhorar estratégias processuais.', 'Dados & IA apoiando no benefício potencial', 'beOn Labs / Hitss', 'Maria Isabela de Melo / Wilson Bolcchi', 'Jurídico', null],
  ['Qualificações de Segurança', 'GL-916', 'Automatizar a qualificação de APIs de Segurança, extraindo informações dos documentos para preenchimento automático.', 'Aguardando apoio Dados & IA', 'Beon Labs', 'Julio Cezar Moreira / Michel Soller', 'Segurança', null],
  ['Tabulação Automática em Leitura de Contexto', 'GL-917', 'Serviço capaz de analisar interações entre clientes e vendedores dos canais Televendas, por recursos de IA.', 'Em desenvolvimento na Esteira de Dados & IA', 'Beon Labs', 'Leandro Bueno / Sidney Neves', 'Comercial', null],
], 'Aguardando Piloto')

const SAMPLE_PILOTO = sampleRows([
  ['Integridade do Produto', 'GL-920', 'Identificar e explicar divergências nas faturas para prevenir erros de faturamento e reduzir o risco de multas.', 'Pendência: Planejamento de alocação de recursos', 'Beon Labs', 'Patricia Mofato / Kamila Tairine', 'Financeiro', 254, true],
  ['Explicação de fatura', 'GL-921', 'Digitalizar e simplificar a explicação de faturas ao cliente final, reduzindo o volume de chamadas à central.', 'Pendência: Sem visibilidade', 'CoE Digital', 'Rogério Estrela / Amirah Abdallah', 'Digital', 12],
  ['Busca Avançada TV', 'GL-922', 'Mecanismo de busca de conteúdo otimizado, capaz de identificar conteúdos mesmo com ortografia incorreta.', 'Pendência: Sem visibilidade', 'CoE Digital', 'André Nava / Felipe Torres', 'TV', 0.6],
  ['Analise de chamadas call center - Speech do futuro', 'GL-923', 'Radar inteligente que identifique e classifique automaticamente motivos de contato e cancelamento.', 'Pendência: Sem visibilidade', 'Beon Labs', 'Luiz Medici / Rosana Evaristo', 'Atendimento', null],
  ['Cientista beOn Labs', 'GL-924', 'Assistente para apoiar as áreas na construção de experimentos, validação de hipóteses e métricas.', 'Pendência: Direcionado Go Wide Dados & IA', 'Beon Labs', 'Gustavo Leite / Daniel Frauches', 'beOn Labs', null],
], 'Em Piloto')

const SAMPLE_ANDAMENTO = sampleRows([
  ['Claro Box x OTTs', 'GL-930', 'Identificar padrões de consumo e mitigar desvios/mau uso no serviço Claro Box em correlação com aplicativos OTT.', 'Pendente Data de Conclusão', 'beOn Labs', 'Alessandro Solon / Edson Ferreira', 'Marketing', null, true],
  ['NovoBot Claro', 'GL-931', 'Evoluir a inteligência do NovoBot de regras/NLP para LLM, preparando a plataforma para alta volumetria no WhatsApp.', 'Pendente Status', 'beOn Labs / CoE Digital', 'Rogério Estrela / Amira Abdallah Araujo', 'Digital', 16],
  ['Alarmes Garantia da Receita', 'GL-932', 'Automatizar a detecção de inconsistências de faturamento e eventos com risco de evasão de receita.', 'Em andamento', 'beOn Labs', 'Patricia Mofato / Bianca Valtkunas', 'Financeiro', 6],
  ['Aceitação Remota de Elementos de Rede com Visão Computacional', 'GL-933', 'Automatizar a homologação e aceite de instalações de elementos de rede através de imagens por visão computacional.', 'Em andamento', 'beOn Labs', 'Carlos Souza / Marcos Turri', 'Operações Técnicas', 3],
  ['BKO Multi', 'GL-934', 'Aplicação de solução de IA para reduzir/eliminar atividade do BKO do cadastro multi.', 'Em andamento', 'beOn Labs', 'Leandro Bueno / Maria Clara Montenegro', 'Comercial', 2],
  ['Clio IA', 'GL-935', 'Assistente inteligente focado na otimização da gestão de conhecimento e suporte operacional das equipes.', 'Em andamento', 'Área de Negócio', 'Caissar Santos / Aldenir Almeida', 'TI', 0.2],
  ['DEVEX: Agente de Discovery de Requisitos', 'GL-936', 'Acelerar o ciclo de refinamento técnico de demandas por meio de um Agente de IA.', 'Em andamento', 'Área de Negócio', 'Cesar Santos / Alexandre Teles', 'TI', 0.1],
  ['IA para Entrantes RRE', 'GL-937', 'Automatizar a pré-classificação e resposta inicial de contratos entrantes no fluxo de Recusa de Restabelecimento Especial.', 'Falta Engajamento da Área Solicitante', 'beOn Labs', 'Paulo Viveiros / Marina Cortez', 'Jurídico', null],
  ['Personas Sintéticas', 'GL-938', 'Construir personas sintéticas baseadas em dados reais para antecipar pontos de atrito em jornadas digitais.', 'Pendente testes com áreas interessadas', 'beOn Labs', 'Rodrigo Duclos / Rafael Brandão', 'Digital', null],
  ['Reputação Orgânica', 'GL-939', 'Utilizar IA para gerar indicadores de reputação de sites a partir de métricas do mercado e de plataformas públicas.', 'Em andamento', 'beOn Labs', 'Rodrigo Duclos / Rafael Brandão', 'Digital', null],
  ['VOC - Correlação de Alarmes', 'GL-940', 'Reduzir o ruído operacional na infraestrutura de vídeo através da correlação inteligente de alarmes.', 'Em andamento', 'beOn Labs', 'Marcelo Pucci Bessa / Luiz Saturnino', 'Rede', null],
  ['Agente Criador de SD', 'GL-941', 'Reduzir em 50% o tempo necessário entre a ideação e o cadastro formal de uma Solicitação de Demanda (SD).', 'Suspenso Temporariamente', 'beOn Labs', 'Gustavo Leite', 'beOn Labs', null],
  ['Validação de SD', 'GL-942', 'Elevar a qualidade técnica dos documentos de Solicitação de Demanda para reduzir idas e vindas entre TI e Negócio.', 'Suspenso Temporariamente', 'beOn Labs', 'Gustavo Leite', 'beOn Labs', null],
  ['Métricas da Rede com Crowdsourcing', 'GL-943', 'Comprovar a viabilidade de construir um componente para coletar e transmitir métricas sobre qualidade da rede móvel.', 'Em andamento', 'beOn Labs / Engenharia', 'Luiz Bourdot / Karen Bourdot', 'Engenharia', null],
  ['Voice AI', 'GL-944', 'Implantar motor conversacional de voz com baixa latência para atendimento e automação de interações por áudio.', 'Pendente Status', 'CoE Digital', 'Julie Schaffer / Adriana Neves', 'Digital', null],
  ['IA para BD', 'GL-945', 'Ingestão de relatórios AWR em LLM para geração de insights e recomendações automatizadas.', 'Em andamento', 'Área de Negócio', 'Fernando Navarro / Fernando Cavalcanti', 'Infraestrutura', null],
  ['IA para Troubleshooting - Arquitetura', 'GL-946', 'Diminuir tempo de resolução de um incidente em um sistema com o auxílio de uma IA.', 'Em andamento', 'beOn Labs', 'Almir / Daniela Sacramento', 'Infraestrutura', null],
  ['Meta Experimento', 'GL-947', 'Estruturar um framework quantitativo para avaliação contínua do retorno e taxa de sucesso dos experimentos.', 'Em andamento', 'beOn Labs', 'Gustavo Leite', 'beOn Labs', null],
  ['Controle do Voluntariado', 'GL-948', 'Automatizar e auditar a gestão de horas dedicadas e doações em ações de voluntariado corporativo.', 'Em andamento', 'beOn Labs', 'Daniely Gomiero / Flavio Januário', 'Sustentabilidade', null],
], 'Em andamento', [null, null, '2026-10-09', '2026-10-23', null, '2026-10-30', '2026-10-30', '2026-10-02', null, '2026-10-09', '2026-09-15'])

const SAMPLE_BACKLOG = sampleRows([
  ['Explica+', 'GL-950', 'Implementação do Explica+, uma plataforma de simulação consultiva com IA multimodal para capacitação de técnicos.', 'Pendência: Pendente Ficha', 'beOn Labs', 'Carlos Souza', 'Operações Técnicas', 3.6],
  ['Coach de Televendas – Dicas', 'GL-951', 'Pendente planejamento e definição de hipótese.', 'Pendência: Pendente Priorização Área de Negócio', 'beOn Labs', 'Leandro Bueno / Simone Lacerda', 'Canais Remotos', null],
  ['IA Revisão Proativa', 'GL-952', 'Monitorar continuamente mudanças organizacionais para identificar documentos desatualizados e reduzir riscos operacionais.', 'Pendência: Pendente Amostra', 'beOn Labs', 'Alexandre Gomes / Gisele Marques', 'GE', null],
  ['Leads AI Hunter', 'GL-953', 'Automatizar a identificação, qualificação e priorização de oportunidades comerciais por meio de IA.', 'Pendência: Pendente Amostra', 'beOn Labs', 'Alexandre Gomes / André Haical', 'GE', null],
], 'Backlog')

export const SAMPLE_SEMANAL_DATA: SemanalData = (() => {
  const secoes = montarSecoes({
    escala: SAMPLE_ESCALA, aguardando: ordenarRows(SAMPLE_AGUARDANDO), piloto: ordenarRows(SAMPLE_PILOTO),
    andamento: ordenarRows(SAMPLE_ANDAMENTO), backlog: SAMPLE_BACKLOG,
  })
  const sec = (id: SemanalSecaoId) => secoes.find(s => s.id === id)!.rows
  return {
    geradoEm: new Date().toISOString(),
    isSample: true,
    secoes,
    resumo: montarResumo({
      total: 210, backlog: sec('backlog'), andamento: sec('andamento'), aguardando: sec('aguardando'),
      piloto: sec('piloto'), escala: sec('escala'), cancelados: 88, refutadas: 60, ideiasNaoAvaliadas: 45,
      beneficioTotal: 416_000_000, semBeneficio: 157, semSponsor: 45,
    }),
  }
})()
