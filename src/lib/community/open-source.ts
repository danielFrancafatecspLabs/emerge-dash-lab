// World Open Source: vitrine de ferramentas e repositórios open source da Comunidade. Qualquer pessoa publica e edita;
// só quem publicou (ou um admin) remove. Modelo e validação sem dependências de servidor (valem na tela e na API).

export const CATEGORIAS_OSS = ['IA e agentes', 'Voz e áudio', 'Vídeo e animação', 'Dados e analytics', 'Ferramentas de dev', 'Segurança', 'Outros'] as const
export type CategoriaOss = typeof CATEGORIAS_OSS[number]

/** Família da licença: define o cuidado para usar e distribuir na empresa. */
export type FamiliaLicenca = 'permissiva' | 'copyleft' | 'outra'

export const LICENCAS: { id: string; familia: FamiliaLicenca }[] = [
  { id: 'MIT', familia: 'permissiva' },
  { id: 'Apache-2.0', familia: 'permissiva' },
  { id: 'BSD-3-Clause', familia: 'permissiva' },
  { id: 'MPL-2.0', familia: 'copyleft' },
  { id: 'LGPL-3.0', familia: 'copyleft' },
  { id: 'GPL-3.0', familia: 'copyleft' },
  { id: 'AGPL-3.0', familia: 'copyleft' },
  { id: 'Outra / não informada', familia: 'outra' },
]

export const familiaDaLicenca = (licenca: string): FamiliaLicenca => LICENCAS.find(l => l.id === licenca)?.familia ?? 'outra'

export interface RepoOss {
  id: string
  /** owner/repo no GitHub (ou o caminho em outra forja). */
  slug: string
  url: string
  nome: string
  /** Uma frase: o que é. */
  resumo: string
  /** Para que serve, um uso por linha. */
  usos: string[]
  /** Como começar, um passo por linha. */
  comoComecar: string[]
  categoria: CategoriaOss
  licenca: string
  tags: string[]
  publicadoPor: { username: string; nome: string }
  publicadoEm: string
  editadoPor?: { username: string; nome: string }
  editadoEm?: string
}

export type RepoInput = Pick<RepoOss, 'url' | 'nome' | 'resumo' | 'usos' | 'comoComecar' | 'categoria' | 'licenca' | 'tags'>

const FORJA = /^https:\/\/(github\.com|gitlab\.com|codeberg\.org|bitbucket\.org)\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i

/** owner/repo a partir do link do repositório (só forjas conhecidas, só https). */
export function slugDoRepo(url: string): string | null {
  const m = FORJA.exec(url.trim())
  return m ? `${m[2]}/${m[3]}` : null
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const linhas = (v: unknown, max: number, maxItens: number) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [])
    .map(x => str(x, max).replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean).slice(0, maxItens)

export function parseRepoInput(body: unknown): { value: RepoInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Requisição inválida' }
  const b = body as Record<string, unknown>
  const url = str(b.url, 300).replace(/\/+$/, '')
  if (!slugDoRepo(url)) return { error: 'Informe o link do repositório (https://github.com/dono/repositorio)' }
  const nome = str(b.nome, 80) || (slugDoRepo(url) as string).split('/')[1]
  const resumo = str(b.resumo, 200)
  if (resumo.length < 10) return { error: 'Conte em uma frase o que é o projeto' }
  const usos = linhas(b.usos, 200, 8)
  if (!usos.length) return { error: 'Diga para que serve (ao menos um uso)' }
  const categoria = (CATEGORIAS_OSS as readonly string[]).includes(b.categoria as string) ? b.categoria as CategoriaOss : 'Outros'
  const licenca = LICENCAS.some(l => l.id === b.licenca) ? b.licenca as string : 'Outra / não informada'
  const tags = [...new Set(linhas(b.tags, 30, 8).flatMap(t => t.split(',')).map(t => t.trim().toLowerCase()).filter(Boolean))].slice(0, 8)
  return { value: { url, nome, resumo, usos, comoComecar: linhas(b.comoComecar, 300, 8), categoria, licenca, tags } }
}

/** Repositórios com que a vitrine começa (antes de qualquer publicação da comunidade). */
export const REPOS_INICIAIS: RepoOss[] = [
  {
    id: 'voicestudio',
    slug: 'debpalash/VoiceStudio',
    url: 'https://github.com/debpalash/VoiceStudio',
    nome: 'VoiceStudio',
    resumo: 'Estúdio de voz com IA que roda no seu próprio dispositivo: uma alternativa open source ao ElevenLabs.',
    usos: [
      'Clonar uma voz a partir de uma gravação de referência limpa',
      'Criar uma voz nova descrevendo-a em palavras (design de voz)',
      'Traduzir e dublar vídeos com a fala sincronizada ao original',
      'Ditar e transcrever áudio localmente',
      'Narrar histórias e audiolivros, com filas de geração',
      'Automatizar por API local, MCP, receitas e pastas monitoradas',
    ],
    comoComecar: [
      'Baixe o instalador para o seu sistema na página de releases (macOS, Windows, Linux; Android e iOS em prévia)',
      'Abra "Voice cloning", escolha uma voz ou adicione uma gravação de referência',
      'Digite o texto e gere: o app pergunta antes de baixar qualquer modelo',
      'Sem GPU também funciona, só que mais devagar',
    ],
    categoria: 'Voz e áudio',
    licenca: 'AGPL-3.0',
    tags: ['tts', 'clonagem de voz', 'dublagem', 'transcrição', '646 idiomas', 'offline'],
    publicadoPor: { username: 'beon-labs', nome: 'beOn Labs' },
    publicadoEm: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'animate',
    slug: 'cth9191/animate',
    url: 'https://github.com/cth9191/animate',
    nome: 'Animate',
    resumo: 'Skill do Claude Code que cria vídeos animados curtos inteiramente em código, em vários estilos visuais.',
    usos: [
      'Explicar um conceito ou produto em um vídeo curto (explainers)',
      'Contar uma história ou cronologia com transições animadas',
      'Fazer um vídeo de lançamento com as telas reais do produto',
      'Gerar o mesmo vídeo nos formatos 9:16, 1:1, 4:5 e 16:9',
      'Narrar com voz e sincronizar a imagem às palavras, ou cortar no ritmo de uma música',
    ],
    comoComecar: [
      'Tenha Claude Code, Node 18+, Playwright com Chromium e ffmpeg instalados',
      'No Claude Code: /plugin marketplace add cth9191/animate e depois /plugin install animate@animate',
      'Peça, por exemplo: /animate como funciona um hash map, no estilo math',
      'Aprove a história, o visual e o storyboard; o vídeo sai em MP4',
    ],
    categoria: 'Vídeo e animação',
    licenca: 'MIT',
    tags: ['claude code', 'animação', 'vídeo', 'motion design', 'explainer'],
    publicadoPor: { username: 'beon-labs', nome: 'beOn Labs' },
    publicadoEm: '2026-10-31T12:00:00.000Z',
  },
]
