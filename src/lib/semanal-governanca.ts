import { epicBloqueado } from './bloqueio'
import type { EpicDetail, Iniciativa } from './types'

// Slide "Governança beOn Labs" do deck Semanal: uma linha por área (Domínio) e uma coluna por fase da jornada,
// cada item como uma bolinha colorida pela tecnologia, com o nome embaixo.
//
// - Exploração: Epics do board de Experimentação em Backlog ou Em refinamento.
// - Experimentos em andamento: Epics em "Em andamento" (Em desenvolvimento) e em "Em validação".
// - Experimentos concluídos: Epics concluídos.
// - Piloto: Iniciativas do board de Ideação em Aguardando piloto e em Piloto (Em execução).
// - Em escala: Iniciativas do board de Ideação em Escala.
//
// A estrela de prioridade só aparece nos experimentos em andamento com prioridade Highest no Jira; o cadeado,
// nos Epics abertos com algum sinal de bloqueio. A geometria (layoutGovernanca) é a mesma na tela e no PPTX.

export type TecnologiaGov = 'ia' | 'web3' | 'future' | 'outras'

export const TECNOLOGIAS_GOV: { id: TecnologiaGov; label: string; cor: string }[] = [
  { id: 'ia', label: 'IA e Analytics', cor: '#CC0000' },
  { id: 'web3', label: 'Web 3', cor: '#6B0000' },
  { id: 'future', label: 'Future Network', cor: '#F29200' },
  { id: 'outras', label: 'Outras tecnologias', cor: '#1F6FD1' },
]

export interface ItemGov {
  key: string
  nome: string
  tecnologia: TecnologiaGov
  prioridade: boolean
  bloqueio: boolean
}

export type ColunaGovId = 'exploracao' | 'desenvolvimento' | 'validacao' | 'concluidos' | 'aguardando' | 'execucao' | 'escala'

export interface GrupoGov {
  id: string
  label: string
  total: number
  colunas: { id: ColunaGovId; label: string | null; total: number }[]
}

export interface LinhaGov {
  area: string
  total: number
  celulas: Record<ColunaGovId, ItemGov[]>
}

export interface SemanalGovernanca {
  totalExperimentos: number
  grupos: GrupoGov[]
  linhas: LinhaGov[]
}

/** Cores do slide: degradê do cabeçalho (laranja → vermelho → vinho), grafite da coluna de áreas e das bolinhas
 * de Exploração (ainda não têm tecnologia definida em execução). */
export const GOV_DEGRADE = 'linear-gradient(110deg, #F0561D 0%, #DA1A1A 38%, #B5091B 70%, #6E0A1E 100%)'
export const GOV_GRAFITE = '#3A3D42'
export const GOV_BOLINHA_EXPLORACAO = '#4B4F56'

export const COLUNAS_GOV: ColunaGovId[] = ['exploracao', 'desenvolvimento', 'validacao', 'concluidos', 'aguardando', 'execucao', 'escala']

/** Áreas com linha própria (as que mais experimentam); as demais e os itens sem Domínio vão para "Outras frentes". */
const MAX_AREAS = 7
export const OUTRAS_FRENTES = 'Outras frentes'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Tipo de tecnologia pelo campo "Tecnologia" do Epic. Sem valor, conta como IA. */
export function tecnologiaGov(valor: string | null | undefined): TecnologiaGov {
  const t = norm(valor ?? '')
  if (!t) return 'ia'
  if (/web\s*3|blockchain/.test(t)) return 'web3'
  if (/future|network|5g|6g|rede/.test(t)) return 'future'
  if (/outra/.test(t)) return 'outras'
  if (/\bai\b|\bia\b|a\.i|analytic|intelig|machine|dados|data/.test(t)) return 'ia'
  return 'outras'
}

function maisFrequente<T>(valores: T[]): T | null {
  const n = new Map<T, number>()
  for (const v of valores) n.set(v, (n.get(v) ?? 0) + 1)
  let melhor: T | null = null, max = 0
  for (const [v, c] of n) if (c > max) { melhor = v; max = c }
  return melhor
}

const ehHighest = (p: string | null | undefined) => norm(p ?? '') === 'highest'

/** Um item do quadro antes de ir para a sua linha: a área decide a linha, a coluna vem de quem chama. */
export interface EntradaGov { area: string | null; item: ItemGov }

/** Epic do board de Experimentação. A prioridade só vale para os experimentos em andamento. */
export function entradaDeEpic(e: EpicDetail, comPrioridade: boolean): EntradaGov {
  return {
    area: e.dominio?.trim() || null,
    item: {
      key: e.key, nome: e.nome, tecnologia: tecnologiaGov(e.tecnologia),
      prioridade: comPrioridade && ehHighest(e.prioridade), bloqueio: epicBloqueado(e),
    },
  }
}

/** Iniciativa do board de Ideação: área e tecnologia vêm dela ou, na falta, dos seus Epics. */
export function entradaDeIniciativa(ini: Iniciativa): EntradaGov {
  return {
    area: ini.dominio?.trim() || maisFrequente(ini.epics.map(e => e.dominio?.trim()).filter((d): d is string => !!d)),
    item: {
      key: ini.key, nome: ini.nome, prioridade: false, bloqueio: false,
      tecnologia: maisFrequente(ini.epics.map(e => e.tecnologia).filter(Boolean).map(tecnologiaGov)) ?? 'ia',
    },
  }
}

export function montarGovernanca(totalExperimentos: number, porColuna: Record<ColunaGovId, EntradaGov[]>): SemanalGovernanca {
  // Áreas que mais experimentam ganham linha própria.
  const contagem = new Map<string, number>()
  for (const c of COLUNAS_GOV) for (const { area } of porColuna[c]) if (area) contagem.set(area, (contagem.get(area) ?? 0) + 1)
  const ordenadas = [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).map(([a]) => a)
  const comLinha = new Set(ordenadas.slice(0, MAX_AREAS))

  const vazia = (): Record<ColunaGovId, ItemGov[]> => Object.fromEntries(COLUNAS_GOV.map(c => [c, []])) as unknown as Record<ColunaGovId, ItemGov[]>
  const linhas = new Map<string, LinhaGov>()
  for (const area of [...comLinha, OUTRAS_FRENTES]) linhas.set(area, { area, total: 0, celulas: vazia() })
  for (const c of COLUNAS_GOV) {
    for (const { area, item } of porColuna[c]) {
      const linha = linhas.get(area && comLinha.has(area) ? area : OUTRAS_FRENTES)!
      linha.celulas[c].push(item)
      linha.total++
    }
  }
  // Prioridades e bloqueios primeiro, para não ficarem escondidos no "+N".
  const peso = (it: ItemGov) => (it.prioridade ? 0 : it.bloqueio ? 1 : 2)
  for (const l of linhas.values()) for (const c of COLUNAS_GOV) l.celulas[c].sort((a, b) => peso(a) - peso(b) || a.nome.localeCompare(b.nome, 'pt-BR'))

  const total = (c: ColunaGovId) => porColuna[c].length
  return {
    totalExperimentos,
    grupos: [
      { id: 'exploracao', label: 'Exploração', total: total('exploracao'), colunas: [{ id: 'exploracao', label: null, total: total('exploracao') }] },
      {
        id: 'andamento', label: 'Experimentos em andamento', total: total('desenvolvimento') + total('validacao'),
        colunas: [{ id: 'desenvolvimento', label: 'Em desenvolvimento', total: total('desenvolvimento') }, { id: 'validacao', label: 'Em validação', total: total('validacao') }],
      },
      { id: 'concluidos', label: 'Experimentos concluídos', total: total('concluidos'), colunas: [{ id: 'concluidos', label: null, total: total('concluidos') }] },
      {
        id: 'piloto', label: 'Piloto', total: total('aguardando') + total('execucao'),
        colunas: [{ id: 'aguardando', label: 'Aguardando piloto', total: total('aguardando') }, { id: 'execucao', label: 'Em execução', total: total('execucao') }],
      },
      { id: 'escala', label: 'Em escala', total: total('escala'), colunas: [{ id: 'escala', label: null, total: total('escala') }] },
    ],
    linhas: [...linhas.values()].filter(l => l.total > 0),
  }
}

// ── Geometria (px no canvas de 1280×720), usada pela tela e pelo PPTX ─────────────────────────────────

export const GOV_LAYOUT = {
  margem: 16,
  areaW: 112,
  faixaY: 74, faixaH: 26,          // "N EXPERIMENTOS"
  grupoY: 104, grupoH: 44,         // cabeçalho vermelho das fases
  subY: 148, subH: 20,             // subtítulos (Em desenvolvimento, Em validação…)
  gradeY: 170, gradeFim: 712,
  itemW: 48, itemGap: 5, linhaH: 40, padLinha: 10,
  bolinha: 13, fonteNome: 8.5, caracteresPorLinha: 12,
}

export interface ItemPosicionado { x: number; y: number; item: ItemGov; linhasNome: string[] }
export interface CelulaLayout { coluna: ColunaGovId; x: number; w: number; itens: ItemPosicionado[]; mais: { x: number; y: number; n: number } | null }
export interface LinhaLayout { area: string; y: number; h: number; celulas: CelulaLayout[] }
export interface GovLayout {
  colunas: { id: ColunaGovId; x: number; w: number }[]
  grupos: { grupo: GrupoGov; x: number; w: number }[]
  linhas: LinhaLayout[]
}

/** Nome em até `max` linhas de ~n caracteres, quebrando por palavra e com reticências no fim. */
export function quebrarNome(nome: string, n = GOV_LAYOUT.caracteresPorLinha, max = 2): string[] {
  const palavras = nome.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const linhas: string[] = []
  let k = 0
  while (k < palavras.length && linhas.length < max) {
    let atual = ''
    while (k < palavras.length) {
      const p = palavras[k]
      // Palavra maior que a linha: corta ela mesma.
      if (!atual && p.length > n) { atual = `${p.slice(0, n - 1)}…`; k++; break }
      const tentativa = atual ? `${atual} ${p}` : p
      if (tentativa.length > n) break
      atual = tentativa
      k++
    }
    linhas.push(atual)
  }
  if (k < palavras.length) {
    const u = linhas.length - 1
    linhas[u] = `${linhas[u].replace(/…$/, '').slice(0, n - 1).trimEnd()}…`
  }
  return linhas
}

export function layoutGovernanca(g: SemanalGovernanca): GovLayout {
  const L = GOV_LAYOUT
  const x0 = L.margem + L.areaW
  const largura = (1280 - L.margem - x0) / COLUNAS_GOV.length
  const colunas = COLUNAS_GOV.map((id, k) => ({ id, x: x0 + k * largura, w: largura }))
  const grupos = g.grupos.map(grupo => {
    const cs = colunas.filter(c => grupo.colunas.some(gc => gc.id === c.id))
    return { grupo, x: cs[0].x, w: cs.reduce((s, c) => s + c.w, 0) }
  })

  const porLinha = Math.max(1, Math.floor((largura - 4 + L.itemGap) / (L.itemW + L.itemGap)))
  const alturaTotal = L.gradeFim - L.gradeY
  const nLinhas = g.linhas.length
  const disponiveis = Math.max(nLinhas, Math.floor((alturaTotal - nLinhas * L.padLinha) / L.linhaH))

  // Cada área começa com uma linha de bolinhas; as linhas que sobram vão, uma a uma, para a área com mais
  // itens ainda sem lugar.
  const linhasDe = g.linhas.map(() => 1)
  const semLugar = (r: number) => COLUNAS_GOV.reduce((s, c) => s + Math.max(0, g.linhas[r].celulas[c].length - linhasDe[r] * porLinha), 0)
  for (let resto = disponiveis - nLinhas; resto > 0; resto--) {
    let melhor = -1, max = 0
    g.linhas.forEach((_, r) => { const f = semLugar(r); if (f > max) { max = f; melhor = r } })
    if (melhor < 0) break
    linhasDe[melhor]++
  }
  const usado = linhasDe.reduce((s, n) => s + n * L.linhaH + L.padLinha, 0)
  const folga = nLinhas ? (alturaTotal - usado) / nLinhas : 0

  let y = L.gradeY
  const linhas: LinhaLayout[] = g.linhas.map((linha, r) => {
    const h = linhasDe[r] * L.linhaH + L.padLinha + folga
    const capacidade = linhasDe[r] * porLinha
    const celulas: CelulaLayout[] = colunas.map(col => {
      const todos = linha.celulas[col.id]
      const cabe = todos.length > capacidade ? capacidade - 1 : todos.length
      const slots = todos.length > capacidade ? capacidade : todos.length
      const usadas = Math.ceil(slots / porLinha)
      const topo = y + (h - usadas * L.linhaH) / 2
      const naLinha = (k: number) => Math.min(porLinha, slots - Math.floor(k / porLinha) * porLinha)
      const pos = (k: number) => {
        const n = naLinha(k)
        const larguraBloco = n * L.itemW + (n - 1) * L.itemGap
        return { x: col.x + (col.w - larguraBloco) / 2 + (k % porLinha) * (L.itemW + L.itemGap), y: topo + Math.floor(k / porLinha) * L.linhaH }
      }
      return {
        coluna: col.id, x: col.x, w: col.w,
        itens: todos.slice(0, cabe).map((item, k) => ({ ...pos(k), item, linhasNome: quebrarNome(item.nome) })),
        mais: todos.length > capacidade ? { ...pos(cabe), n: todos.length - cabe } : null,
      }
    })
    const saida = { area: linha.area, y, h, celulas }
    y += h
    return saida
  })

  return { colunas, grupos, linhas }
}

/** "21/10/2026" — data de atualização do slide. */
export function dataAtualizacao(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}
