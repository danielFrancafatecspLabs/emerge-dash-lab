/* ── Dados hardcoded do slide executivo "Bloqueios das Iniciativas por Problema" ── */

export interface BloqueioItem {
  nome: string
  status: string
  bo: string
  sponsor: string
  motivo?: string
  /** Tags dos OUTROS problemas em que esta iniciativa também se enquadra (nunca repete o problema do bloco atual) */
  outrosProblemas?: string[]
}

export interface BloqueioCategoria {
  id: string
  titulo: string
  descricao: string
  cor: string
  items: BloqueioItem[]
  footer: string
}

export interface ResumoIndicador {
  titulo: string
  quantidade: number
  descricao: string
  cor: string
}

/* ── Paleta beOn ── */
const RED = '#7A1212'

/* ── Labels dos indicadores ── */
const LABELS_INDICADORES: Record<string, { titulo: string; descricao: string; footer: string }> = {
  engajamento: {
    titulo: 'FALTA DE ENGAJAMENTO DA ÁREA DE NEGÓCIO',
    descricao: 'Baixo engajamento e participação das áreas de negócio, impactando decisões, validações e aprovações.',
    footer: 'Impacto: atrasos em validações, decisões e aprovações necessárias para evolução das iniciativas.',
  },
  'amostra-dados': {
    titulo: 'AMOSTRA DE DADOS',
    descricao: 'Pendência de amostras de dados ou acesso às fontes necessárias para testes e validações.',
    footer: 'Impacto: impossibilidade de executar testes ou validar hipóteses pela ausência de dados necessários.',
  },
  beneficios: {
    titulo: 'BENEFÍCIOS POTENCIAIS NÃO MAPEADOS',
    descricao: 'Iniciativas sem benefício qualitativo ou quantitativo mapeado ou validado.',
    footer: 'Impacto: dificuldade em mensurar e priorizar o valor potencial das iniciativas, aumentando o risco de decisões sem clareza de retorno.',
  },
  outras: {
    titulo: 'OUTRAS QUESTÕES ADVERSAS',
    descricao: 'Despriorizações, ajustes, alinhamentos ou outras dependências que impactam o avanço.',
    footer: 'Impacto: ajustes, despriorizações e dependências que prolongam o ciclo de entrega e atrasam a geração de valor.',
  },
  ambiente: {
    titulo: 'AGUARDANDO AMBIENTE',
    descricao: 'Dependência de ambiente para início ou continuidade dos testes e experimentações.',
    footer: 'Impacto: dependência de ambiente para continuidade dos testes.',
  },
}

/* ── Mapa de label para exibição nas tags ── */
const LABEL_MAP: Record<string, string> = {
  engajamento: 'Falta de engajamento',
  'amostra-dados': 'Amostra de dados',
  beneficios: 'Benefício não mapeado',
  outras: 'Outras questões',
  ambiente: 'Aguardando ambiente',
}

/* ── Catálogo completo de iniciativas ──
 *   Regra A6: uma iniciativa pode aparecer em MAIS DE UM bloco.
 *   Status, BO e Sponsor são idênticos em todas as ocorrências.
 *   outrosProblemas = problemas em que se enquadra EXCETO o do bloco atual.
 */
interface IniciativaCompleta {
  nome: string
  status: string
  bo: string
  sponsor: string
  motivo?: string
  problemas: string[]
}

const TODAS_INICIATIVAS: IniciativaCompleta[] = [
  // ── Engajamento ──
  { nome: 'VOC - Correlação de Alarmes',           status: 'Em validação',      bo: 'Luiz Saturnino',            sponsor: 'Marcelo Pucci Bessa',     problemas: ['engajamento', 'beneficios', 'amostra-dados'] },
  { nome: 'IA para Entrantes RRE',                 status: 'Em desenvolvimento', bo: 'Marina Cortez Ramos Perez', sponsor: 'Marina Cortez Ramos Perez', problemas: ['engajamento', 'beneficios', 'amostra-dados'] },
  { nome: 'Validação de SD',                       status: 'Em desenvolvimento', bo: 'Não informado',             sponsor: 'Marco Asterito',          problemas: ['engajamento', 'amostra-dados'] },
  { nome: 'Leads PME - 2º Ciclo',                  status: 'Em validação',      bo: 'Roberta Buzar',             sponsor: 'Roberta Buzar',           problemas: ['engajamento', 'beneficios'] },
  { nome: 'Quebra de Agenda',                      status: 'Em prospecção',     bo: 'Wellington Cobiaki',        sponsor: 'Carlos Souza',            problemas: ['engajamento'] },

  // ── Amostra de Dados ──
  { nome: 'Aprendizado por Tamanho de Domicílios',    status: 'Em desenvolvimento', bo: 'Marcos Roberto Turri', sponsor: 'Carlos Souza',     problemas: ['amostra-dados', 'beneficios'] },
  { nome: 'Agente para Solução de Tickets da Rede Móvel', status: 'Em desenvolvimento', bo: 'Marcos Turri', sponsor: 'Carlos Souza', problemas: ['amostra-dados'] },

  // ── Benefícios Não Mapeados ──
  { nome: 'Personas Sintéticas',     status: 'Em validação',      bo: 'Marcelo Barbosa',  sponsor: 'Rafael Brandão',     problemas: ['beneficios'] },
  { nome: 'Check IA',                status: 'Em validação',      bo: 'Marcelo Hitaka',   sponsor: 'Almir',              problemas: ['beneficios'] },
  { nome: 'Agente Criador de SD',    status: 'Em desenvolvimento', bo: 'Bruno Marinho',    sponsor: 'Marco Asterito',     problemas: ['beneficios', 'outras'] },
  { nome: 'Claro Box x OTTs',        status: 'Em desenvolvimento', bo: 'Não informado',    sponsor: 'Rodrigo Assad',      problemas: ['beneficios', 'ambiente'] },
  { nome: 'Meta Experimento',        status: 'Em desenvolvimento', bo: 'Marco Asterito',   sponsor: 'Gustavo Leite',      problemas: ['beneficios'] },
  { nome: 'Reputação Orgânica',      status: 'Em desenvolvimento', bo: 'Marcello Barbosa', sponsor: 'Rafael Brandão',     problemas: ['beneficios'] },
  { nome: 'Clio IA',                 status: 'Em desenvolvimento', bo: 'Não informado',    sponsor: 'Não informado',      problemas: ['beneficios'] },

  // ── Outras Questões ──
  { nome: 'Agente para Treinamento Comercial',  status: 'Em desenvolvimento', bo: 'Nadiane Cabral',            sponsor: 'Ronaldo Domingues', problemas: ['outras', 'beneficios'], motivo: 'Alinhamentos pendentes' },
  { nome: 'Explicação de Faturas',              status: 'Em desenvolvimento', bo: 'Não informado',             sponsor: 'Rodrigo Duclos',  problemas: ['outras'], motivo: 'Despriorização beOn Labs' },
  { nome: 'Voice AI',                           status: 'Em desenvolvimento', bo: 'Anderson Clayton Martins',  sponsor: 'Não informado',   problemas: ['outras'], motivo: 'Pendente planejamento com Maria Dolores' },
  { nome: 'Novobot',                            status: 'Em desenvolvimento', bo: 'Não informado',             sponsor: 'Não informado',   problemas: ['outras'], motivo: 'Bloqueio técnico' },
  { nome: 'Buscador de Produtos Smartsales',     status: 'Em desenvolvimento', bo: 'Não informado',             sponsor: 'Não informado',   problemas: ['outras'], motivo: 'Bloqueio técnico' },

  // ── Aguardando Ambiente ──
]

/* ── Gera as categorias: cada iniciativa aparece em TODOS os seus problemas ── */
function gerarCategorias(): { categorias: BloqueioCategoria[]; indicadores: ResumoIndicador[] } {
  const ordem = ['engajamento', 'beneficios', 'amostra-dados', 'outras', 'ambiente']

  // Mapa: problemaId → items
  const mapa: Record<string, BloqueioItem[]> = {}
  for (const id of ordem) mapa[id] = []

  // Alocar cada iniciativa em CADA problema que ela tem (regra A6)
  for (const inc of TODAS_INICIATIVAS) {
    for (const probId of inc.problemas) {
      const outrosProblemas = inc.problemas.filter(p => p !== probId)
      mapa[probId].push({
        nome: inc.nome,
        status: inc.status,
        bo: inc.bo,
        sponsor: inc.sponsor,
        motivo: inc.motivo,
        outrosProblemas: outrosProblemas.map(p => LABEL_MAP[p]),
      })
    }
  }

  // Validação: mesma iniciativa com mesmo status em blocos diferentes
  const ocorrencias = new Map<string, Set<string>>()
  for (const [probId, items] of Object.entries(mapa)) {
    for (const item of items) {
      if (!ocorrencias.has(item.nome)) ocorrencias.set(item.nome, new Set())
      ocorrencias.get(item.nome)!.add(probId)
    }
  }
  if (typeof window !== 'undefined') {
    const totalOcorrencias = Object.values(mapa).flat().length
    console.info(`[bloqueios-data] ${ocorrencias.size} iniciativas únicas, ${totalOcorrencias} ocorrências totais`)
  }

  const categorias: BloqueioCategoria[] = ordem.map(id => ({
    id,
    titulo: LABELS_INDICADORES[id].titulo,
    descricao: LABELS_INDICADORES[id].descricao,
    cor: RED,
    items: mapa[id],
    footer: LABELS_INDICADORES[id].footer,
  }))

  // Indicadores calculados dos dados pós-correção
  const indicadores: ResumoIndicador[] = ordem.map(id => ({
    titulo: LABELS_INDICADORES[id].titulo,
    quantidade: mapa[id].length,
    descricao: LABELS_INDICADORES[id].descricao,
    cor: RED,
  }))

  return { categorias, indicadores }
}

const resultado = gerarCategorias()
export const CATEGORIAS: BloqueioCategoria[] = resultado.categorias
export const RESUMO_INDICADORES: ResumoIndicador[] = resultado.indicadores

/* ── Badges de status ── */
export const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  'Em validação':      { bg: '#FEF2F2', text: '#7A1212', border: '#FECACA' },
  'Em desenvolvimento': { bg: '#F9FAFB', text: '#374151', border: '#D1D5DB' },
  'Em prospecção':     { bg: '#F9FAFB', text: '#374151', border: '#D1D5DB' },
  'Em refinamento':    { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
  'Backlog':           { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}