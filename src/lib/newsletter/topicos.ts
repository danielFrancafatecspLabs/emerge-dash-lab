// Tópicos especiais do beOn Radar: trilhas temáticas de tecnologias emergentes e futuro que atravessam as seções
// (uma notícia de mercado sobre robotáxis entra em "Mercado e bolsa" e também no tópico "Carros autônomos").
// Cada tópico tem termos (português e inglês, minúsculos e sem acento) e buscas próprias no Google Notícias, para
// nunca ficar vazio mesmo quando as fontes gerais não falam dele no dia.

export interface TopicoEspecial {
  id: string
  nome: string
  descricao: string
  /** Termos que marcam a notícia com o tópico (com espaços nas pontas quando a palavra é curta). */
  termos: string[]
  /** Buscas dedicadas no Google Notícias. */
  buscas: { q: string; lingua: 'en' | 'pt' }[]
  /** Tópico de tecnologia: os termos também valem para a notícia ser considerada do tema da newsletter. */
  tecnologia: boolean
}

export const TOPICOS_ESPECIAIS: TopicoEspecial[] = [
  {
    id: 'carros-autonomos', nome: 'Carros autônomos', tecnologia: true,
    descricao: 'Robotáxis, condução autônoma, caminhões sem motorista e a regulação que vem junto.',
    termos: ['self-driving', 'driverless', 'autonomous vehicle', 'autonomous driving', 'autonomous car', 'robotaxi', 'robo-taxi', 'waymo', 'zoox',
      'tesla fsd', 'full self-driving', 'carro autonomo', 'carros autonomos', 'veiculo autonomo', 'veiculos autonomos', 'conducao autonoma',
      'caminhao autonomo', 'baidu apollo', 'pony.ai', 'wayve'],
    buscas: [
      { q: '"self-driving" OR robotaxi OR "autonomous vehicle" OR Waymo', lingua: 'en' },
      { q: '"carro autônomo" OR "veículo autônomo" OR robotáxi OR "condução autônoma"', lingua: 'pt' },
    ],
  },
  {
    id: 'quantica', nome: 'Computação quântica', tecnologia: true,
    descricao: 'Qubits, correção de erros, criptografia pós-quântica e a corrida pelo computador quântico útil.',
    termos: ['quantum', 'quantica', 'quantico', 'qubit', 'pos-quantica', 'post-quantum'],
    buscas: [
      { q: '"quantum computing" OR qubit OR "quantum computer"', lingua: 'en' },
      { q: '"computação quântica" OR "computador quântico" OR qubit', lingua: 'pt' },
    ],
  },
  {
    id: 'ia-agentes', nome: 'IA generativa e agentes', tecnologia: true,
    descricao: 'Modelos de linguagem, agentes autônomos e o que muda no trabalho e nos produtos.',
    termos: ['genai', 'generative ai', 'ia generativa', ' llm', 'large language model', 'modelo de linguagem', 'agentic', 'ai agent', 'agentes de ia',
      'agente de ia', 'chatgpt', 'google gemini', 'gemini ai', 'claude ai', 'openai', 'anthropic', 'copilot', 'deepseek', 'mistral ai'],
    buscas: [
      { q: '"AI agents" OR "agentic AI" OR "generative AI" OR LLM', lingua: 'en' },
      { q: '"agentes de IA" OR "IA generativa" OR "inteligência artificial generativa"', lingua: 'pt' },
    ],
  },
  {
    id: 'robotica', nome: 'Robótica e humanoides', tecnologia: true,
    descricao: 'Humanoides, robôs na indústria e na logística, e a IA que dá corpo às máquinas.',
    termos: ['humanoid', 'humanoide', 'robotics', 'robotica', ' robot ', ' robots ', ' robo ', ' robos ', 'boston dynamics', 'figure ai', 'tesla optimus', 'unitree',
      'embodied ai', 'ia incorporada'],
    buscas: [
      { q: 'humanoid robot OR robotics OR "embodied AI"', lingua: 'en' },
      { q: 'robô humanoide OR robótica', lingua: 'pt' },
    ],
  },
  {
    id: 'espaco', nome: 'Espaço e satélites', tecnologia: true,
    descricao: 'Constelações de satélites, conexão direto do satélite ao celular, foguetes e economia espacial.',
    termos: ['satellite', 'satelite', 'starlink', 'spacex', 'kuiper', 'low earth orbit', 'orbita baixa', 'nasa', 'rocket', 'foguete',
      'space economy', 'economia espacial', 'direct-to-cell', 'direct to cell', 'direct-to-device'],
    buscas: [
      { q: 'Starlink OR "direct-to-cell" OR "satellite internet" OR "space economy"', lingua: 'en' },
      { q: 'satélite OR Starlink OR "órbita baixa" OR "economia espacial"', lingua: 'pt' },
    ],
  },
  {
    id: 'chips', nome: 'Chips e semicondutores', tecnologia: true,
    descricao: 'Quem fabrica o hardware da IA, a disputa geopolítica e a nova geração de processadores.',
    termos: ['semiconductor', 'semicondutor', ' chip', ' chips', 'nvidia', 'tsmc', ' gpu', ' gpus', 'foundry', ' asml', 'processador', 'processor'],
    buscas: [{ q: 'semiconductor OR "AI chip" OR TSMC OR Nvidia GPU', lingua: 'en' }],
  },
  {
    id: 'redes-futuro', nome: '6G e redes do futuro', tecnologia: true,
    descricao: '6G, Open RAN, redes autônomas e tudo o que redesenha a conectividade das operadoras.',
    termos: [' 6g ', 'open ran', 'o-ran', 'terahertz', 'rede autonoma', 'redes autonomas', 'autonomous network', 'network slicing', '5g advanced',
      '5g sa', 'leilao de espectro', 'espectro de radiofrequencia', 'spectrum auction', 'radio spectrum'],
    buscas: [
      { q: '6G OR "Open RAN" OR "autonomous networks" OR "5G Advanced"', lingua: 'en' },
      { q: '6G OR "Open RAN" OR "redes autônomas" OR "5G SA"', lingua: 'pt' },
    ],
  },
  {
    id: 'energia', nome: 'Energia e clima', tecnologia: true,
    descricao: 'Fusão nuclear, baterias, data centers e a conta de energia da IA.',
    termos: ['fusion energy', 'nuclear fusion', 'fusao nuclear', 'small modular reactor', ' smr ', 'solid-state battery', 'bateria de estado solido',
      'battery storage', 'ev battery', 'lithium', 'litio', 'armazenamento de energia', 'hydrogen', 'hidrogenio', 'data center energy', 'energia dos data centers', 'clean energy', 'energia limpa'],
    buscas: [{ q: '"fusion energy" OR "solid-state battery" OR "small modular reactor" OR "data center power"', lingua: 'en' }],
  },
  {
    id: 'biotech', nome: 'Biotecnologia e saúde do futuro', tecnologia: true,
    descricao: 'Edição genética, longevidade, IA na descoberta de remédios e medicina personalizada.',
    termos: ['crispr', 'biotech', 'biotecnologia', 'gene editing', 'edicao genetica', 'longevity', 'longevidade', 'mrna', 'drug discovery',
      'descoberta de medicamentos', 'alphafold'],
    buscas: [{ q: 'CRISPR OR "gene editing" OR longevity OR "AI drug discovery"', lingua: 'en' }],
  },
  {
    id: 'interfaces', nome: 'Interfaces cérebro-máquina e realidade estendida', tecnologia: true,
    descricao: 'Neuralink, óculos inteligentes, realidade aumentada e as próximas formas de interagir com a tecnologia.',
    termos: ['brain-computer', 'brain computer interface', 'interface cerebro', 'neuralink', ' bci ', 'smart glasses', 'oculos inteligentes',
      'augmented reality', 'realidade aumentada', 'mixed reality', 'realidade mista', 'virtual reality', 'realidade virtual', 'vision pro', ' xr '],
    buscas: [{ q: '"brain-computer interface" OR Neuralink OR "smart glasses" OR "augmented reality"', lingua: 'en' }],
  },
  {
    id: 'futuros', nome: 'Futuros e tendências', tecnologia: false,
    descricao: 'Estudos de futuro, megatendências e previsões para os próximos anos.',
    termos: ['future of', 'futuro do', 'futuro da', 'foresight', 'megatrend', 'megatendencia', 'by 2030', 'ate 2030', 'by 2035', 'ate 2035',
      'next decade', 'proxima decada', 'trend report', 'relatorio de tendencias', 'hype cycle', 'tendencias para'],
    buscas: [
      { q: '"future of" technology OR "by 2030" technology OR megatrends OR "hype cycle"', lingua: 'en' },
      { q: '"futuro da tecnologia" OR "tendências tecnológicas" OR "até 2030" tecnologia', lingua: 'pt' },
    ],
  },
]

const normalizar = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `.replace(/[“”"‘’'(),:;!?]/g, ' ')

/** Os tópicos especiais que a notícia toca. */
export function topicosDe(titulo: string, resumo: string): string[] {
  const t = normalizar(`${titulo} ${resumo}`)
  return TOPICOS_ESPECIAIS.filter(tp => tp.termos.some(k => t.includes(k))).map(tp => tp.id)
}

/** Termos dos tópicos de tecnologia: entram no filtro de tema da newsletter. */
export const TERMOS_DOS_TOPICOS = TOPICOS_ESPECIAIS.filter(t => t.tecnologia).flatMap(t => t.termos)
