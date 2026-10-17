// Taxonomia de tópicos da Comunidade beOn Labs. Usada em publicações, interesses e filtros.

export interface CommunityTopic {
  id: string
  label: string
  descricao: string
}

export const COMMUNITY_TOPICS: CommunityTopic[] = [
  { id: 'ia', label: 'Inteligência Artificial', descricao: 'Modelos, aprendizado de máquina e aplicações de IA' },
  { id: 'ia-generativa', label: 'IA Generativa', descricao: 'LLMs, agentes, RAG e geração de conteúdo' },
  { id: 'agentes', label: 'Agentes e Automação', descricao: 'Agentes autônomos e automação de processos' },
  { id: 'future-network', label: 'Future Network', descricao: '5G, 6G, Open RAN e redes autônomas' },
  { id: 'visao-computacional', label: 'Visão Computacional', descricao: 'Imagem, vídeo e inspeção automatizada' },
  { id: 'ciencia-de-dados', label: 'Ciência de Dados', descricao: 'Análise, estatística e modelos preditivos' },
  { id: 'experimentacao', label: 'Experimentação', descricao: 'Método, hipóteses, métricas e aprendizados' },
  { id: 'novas-interfaces', label: 'Novas Interfaces', descricao: 'Voz, multimodalidade, XR e novas formas de interação' },
  { id: 'web3', label: 'Web3', descricao: 'Blockchain, identidade digital e ativos tokenizados' },
  { id: 'quantica', label: 'Computação Quântica', descricao: 'Algoritmos e criptografia pós-quântica' },
  { id: 'ciberseguranca', label: 'Cibersegurança', descricao: 'Fraude, identidade e proteção de dados' },
  { id: 'sustentabilidade', label: 'Sustentabilidade', descricao: 'Eficiência energética, clima e ESG' },
]

const TOPIC_BY_ID = new Map(COMMUNITY_TOPICS.map(t => [t.id, t]))

export function topicLabel(id: string): string {
  return TOPIC_BY_ID.get(id)?.label ?? id
}

export function isKnownTopic(id: string): boolean {
  return TOPIC_BY_ID.has(id)
}
