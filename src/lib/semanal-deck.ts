import type { ProgressoPrazo, SemanalCancelamento, SemanalData, SemanalRow, SemanalSecaoId, SituacaoPrazo } from './semanal'

export { formatBeneficioMM } from './report-utils'

/**
 * Estrutura do deck da aba Semanal (Report do Comitê beOn Labs): a sequência de páginas, a paginação das
 * listas e a formatação dos valores. A tela (components/semanal) e o PPTX editável (lib/semanal-pptx) montam
 * o deck a partir daqui, então os dois sempre têm as mesmas páginas, na mesma ordem, com os mesmos números.
 */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** "Outubro de 2026" (capa). */
export function periodoLabel(iso: string): string {
  const d = new Date(iso)
  const mes = MESES[d.getMonth()]
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${d.getFullYear()}`
}

/** "até out/26" (visão geral). */
export function ateLabel(iso: string): string {
  const d = new Date(iso)
  return `até ${MESES[d.getMonth()].slice(0, 3)}/${String(d.getFullYear()).slice(2)}`
}

/** R$ em milhões, no formato do deck: "27,3 milhões" / "416 milhões". */
export function formatMilhoes(valor: number, sufixo = 'milhões', semDecimais = false): string {
  const mm = valor / 1_000_000
  const casas = semDecimais || Number.isInteger(Math.round(mm * 10) / 10) ? 0 : 1
  return `${mm.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} ${sufixo}`
}

export function formatData(iso: string | null): string {
  if (!iso) return 'TBD'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return d && m && a ? `${d}/${m}/${a}` : 'TBD'
}

export const LINHAS_POR_PAGINA: Record<SemanalSecaoId, number> = {
  escala: 8, aguardando: 8, piloto: 8, andamento: 10, backlog: 8,
}

/** Cor do laboratório responsável (mesma legenda do deck). */
export function corDoLab(lab: string | null): string {
  const l = (lab ?? '').toLowerCase()
  if (l.includes('hitss')) return '#0E9AA7'
  if (l.includes('engenharia')) return '#E8838A'
  if (l.includes('dados')) return '#E67E22'
  if (l.includes('coe')) return '#D4A017'
  if (l.includes('neg')) return '#8B0000'
  if (l.includes('beon')) return '#CC0000'
  return '#94A3B8'
}

/** Cores do selo de fase/pendência (Em andamento). */
export function chipCor(texto: string): { bg: string; fg: string } {
  const t = texto.toLowerCase()
  if (t.includes('suspens')) return { bg: '#EEF0F3', fg: '#4B5563' }
  if (t.includes('pendente') || t.includes('falta') || t.includes('bloque') || t.includes('aguard')) return { bg: '#FDF3D7', fg: '#7A5A00' }
  return { bg: '#DCEEF7', fg: '#1F4E66' }
}

export function diretorEPontoFocal(row: SemanalRow): string {
  return [row.diretor, row.pontoFocal].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ') || '—'
}

export interface ColunaLista { id: string; label: string; w: number }

/** Colunas de cada lista, com a largura em px no slide de 1280×720. */
export function colunasDa(secao: SemanalSecaoId): ColunaLista[] {
  const fim: ColunaLista[] = [
    { id: 'lab', label: 'Laboratório', w: 120 }, { id: 'diretor', label: 'Diretor/ Ponto focal', w: 122 },
    { id: 'area', label: 'Área', w: 86 }, { id: 'beneficio', label: 'Benefício potencial', w: 80 },
  ]
  if (secao === 'escala') {
    return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 }, { id: 'descricao', label: 'Descrição', w: 440 },
      { id: 'observacao', label: 'Observação', w: 140 }, ...fim]
  }
  if (secao === 'andamento') {
    return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 }, { id: 'descricao', label: 'Descrição', w: 254 },
      { id: 'fase', label: 'Fase / Pendências', w: 186 }, { id: 'previsao', label: 'Previsão e prazo', w: 140 }, ...fim]
  }
  return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 },
    { id: 'descricao', label: 'Descrição', w: 330 },
    { id: 'situacao', label: 'Sit. atual / Pendências', w: 250 }, ...fim]
}

/** Sequências de linhas consecutivas do mesmo laboratório (uma caixa por sequência, como no deck). */
export function sequenciasDeLab(rows: SemanalRow[]): { lab: string | null; ini: number; fim: number }[] {
  const runs: { lab: string | null; ini: number; fim: number }[] = []
  rows.forEach((r, i) => {
    const ult = runs[runs.length - 1]
    if (ult && (ult.lab ?? '') === (r.lab ?? '')) ult.fim = i
    else runs.push({ lab: r.lab, ini: i, fim: i })
  })
  return runs
}

/** Índices i em que a linha i e a seguinte são iniciativas conectadas (colchete na lista). */
export function paresConectados(rows: SemanalRow[]): number[] {
  return rows.slice(0, -1).flatMap((r, i) => (r.conectadas?.includes(rows[i + 1].key) ? [i] : []))
}

/** Quantidade de iniciativas por laboratório (legenda), da maior para a menor. */
export function contagemPorLab(rows: SemanalRow[]): [string, number][] {
  const porLab = new Map<string, number>()
  for (const r of rows) porLab.set(r.lab ?? 'Não definido', (porLab.get(r.lab ?? 'Não definido') ?? 0) + 1)
  return [...porLab.entries()].sort((a, b) => b[1] - a[1])
}

/** Cor da barra de progresso pela situação do prazo. */
export const COR_PRAZO: Record<SituacaoPrazo, string> = {
  'no-prazo': '#1E8E3E', atencao: '#E6A100', atrasado: '#CC0000', 'sem-previsao': '#B5BAC1',
}

/** Largura preenchida da barra (0–100): atrasado enche a barra. */
export const larguraPrazo = (p: ProgressoPrazo) => (p.pct === null ? 0 : Math.min(100, p.pct))

/** Texto embaixo da barra: "62% do prazo · faltam 12 dias", "Atrasado há 3 dias", "Sem previsão". */
export function legendaPrazo(p: ProgressoPrazo): string {
  if (p.situacao === 'sem-previsao' || p.diasRestantes === null) return 'Sem previsão de conclusão'
  const dias = (n: number) => `${n} dia${n === 1 ? '' : 's'}`
  if (p.diasRestantes < 0) return `Atrasado há ${dias(-p.diasRestantes)}`
  return `${p.pct}% do prazo · ${p.diasRestantes === 0 ? 'vence hoje' : `faltam ${dias(p.diasRestantes)}`}`
}

/** "1,1%" — percentuais com uma casa decimal, como no deck. */
export const pctUmaCasa = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

/** Frase ao lado do percentual de destaque. */
export function fraseDestaque(c: SemanalCancelamento): string {
  if (!c.destaque) return ''
  const [a, b] = c.destaque.motivos.map(m => m.toLocaleLowerCase('pt-BR'))
  return b ? `dos cancelamentos concentram-se em ${a} e ${b}` : `dos cancelamentos têm o mesmo motivo: ${a}`
}

export type PaginaDeck = { key: string; label: string; anchor?: string } & (
  | { tipo: 'capa'; periodo: string }
  | { tipo: 'objetivo' }
  | { tipo: 'resumo'; ateLabel: string; dataLabel: string }
  | { tipo: 'governanca' }
  | { tipo: 'cancelamento'; cancelamento: SemanalCancelamento; dataLabel: string }
  | { tipo: 'divisor'; linhas: string[]; icone: 'check' | 'flask' }
  | { tipo: 'lista'; secao: SemanalSecaoId; titulo: string; subtitulo?: string; rows: SemanalRow[]; todas: SemanalRow[] }
  | { tipo: 'obrigado' }
)

/** Todas as páginas do deck, na ordem do Comitê. `anchor` marca o destino dos botões DETALHES e "voltar". */
export function montarPaginas(data: SemanalData): PaginaDeck[] {
  const paginas: PaginaDeck[] = [
    { key: 'capa', label: 'Capa', tipo: 'capa', periodo: periodoLabel(data.geradoEm) },
    { key: 'objetivo', label: 'Objetivo', tipo: 'objetivo' },
    { key: 'resumo', label: 'beOn Labs — visão geral', anchor: 'resumo', tipo: 'resumo', ateLabel: ateLabel(data.geradoEm), dataLabel: dataDoPainel(data.geradoEm) },
  ]
  if (data.governanca) paginas.push({ key: 'governanca', label: 'Governança beOn Labs', tipo: 'governanca' })
  // Como no deck do Comitê, os motivos de cancelamento vêm logo depois da visão geral.
  if (data.cancelamento?.total) {
    paginas.push({ key: 'cancelamento', label: 'Principais motivos de cancelamento', anchor: 'cancelados', tipo: 'cancelamento', cancelamento: data.cancelamento, dataLabel: dataDoPainel(data.geradoEm) })
  }
  for (const secao of data.secoes) {
    paginas.push({
      key: `div-${secao.id}`, label: secao.divisor.join(' '), tipo: 'divisor',
      linhas: secao.divisor, icone: secao.id === 'andamento' ? 'flask' : 'check',
    })
    const porPagina = LINHAS_POR_PAGINA[secao.id]
    const total = Math.max(1, Math.ceil(secao.rows.length / porPagina))
    for (let p = 0; p < total; p++) {
      paginas.push({
        key: `${secao.id}-${p}`,
        label: `${secao.titulo}${total > 1 ? ` (${p + 1}/${total})` : ''}`,
        anchor: p === 0 ? secao.id : undefined,
        tipo: 'lista', secao: secao.id, titulo: secao.titulo, subtitulo: secao.subtitulo,
        rows: secao.rows.slice(p * porPagina, (p + 1) * porPagina), todas: secao.rows,
      })
    }
  }
  paginas.push({ key: 'obrigado', label: 'Obrigado', tipo: 'obrigado' })
  return paginas
}

// ── Painel de experimentos (visão geral) e motivos de cancelamento: layout de 2026-11 ─────────────────────

/** "16/11/2026": a data da leitura do Jira, no fuso de Brasília (selo do cabeçalho). */
export function dataDoPainel(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "R$ 26,5 mi" (valores do painel). */
export const reaisMi = (valor: number) => `R$ ${formatMilhoes(valor, 'mi')}`

/** Cores do painel (hex sem #, para a tela e o PPTX). */
export const PAINEL_COR = {
  fundo: 'F7F3F2', cartao: 'FFFFFF', tinta: '1C1B1B', apagado: '6E6767', linha: 'ECE6E5',
  vermelho: 'B3261E', vermelhoForte: 'C62828', bordo: '6B0E0E', escuro: '262626', rosa: 'FBE3E3', rosaMedio: 'F1C6C6',
  areia: 'F8E5D8', amarelo: 'F5C242', linhaRosa: 'FDF0F0',
}

/** Cores das cinco fatias do total de experimentos. */
export const PAINEL_FATIA: Record<string, string> = {
  exploracao: 'D9772B', andamento: 'E08A8A', validadas: 'C0282D', refutadas: 'C8C9D0', cancelados: '6B0E0E',
}

/** As quatro etapas do funil (setas) e o rodapé de cada cartão. */
export const PAINEL_ETAPAS = [
  { n: 1, t: 'Exploração', d: 'Entender e validar o problema e o benefício potencial', bg: 'FBE3E3', titulo: 'B3261E', texto: '5B4F4F', nbg: 'C62828', nfg: 'FFFFFF',
    rodape: 'Triagem e priorização', icone: 'alvo' },
  { n: 2, t: 'Experimentação', d: 'Testar hipóteses rápido para gerar evidências', bg: 'F1C6C6', titulo: '7A1414', texto: '3A2A2A', nbg: '5A0A0A', nfg: 'FFFFFF',
    rodape: 'Construção e validação', icone: 'frasco-vermelho' },
  { n: 3, t: 'Piloto', d: 'Validar em ambiente controlado e confirmar o potencial de escala', bg: 'C0282D', titulo: 'FFFFFF', texto: 'FFFFFF', nbg: 'FFFFFF', nfg: 'C0282D',
    rodape: 'Pilotos em ambiente real', icone: 'mira' },
  { n: 4, t: 'Em escala', d: 'Operar, evoluir e ampliar a adoção da solução', bg: '6B0E0E', titulo: 'FFFFFF', texto: 'FFFFFF', nbg: 'FFFFFF', nfg: '1C1B1B',
    rodape: 'Geração de valor', icone: 'foguete-vermelho' },
] as const

/** Geometria do painel (px no canvas de 1280×720). */
export const PAINEL = {
  margem: 58, direita: 1231,
  topoCartoes: 88, alturaTopo: 128,
  total: { x: 58, w: 843 }, beneficio: { x: 917, w: 314 },
  barra: { x: 383, w: 492, y: 112, h: 12, vao: 3, passoLegenda: 99 },
  setaTopo: 232, setaAltura: 73, ponta: 30,
  colunas: [58, 355, 652, 949], larguraColuna: 281,
  cartaoTopo: 305, cartaoAltura: 277,
  metricasTopo: 599, metricasAltura: 84, metricas: [{ x: 232, w: 490 }, { x: 739, w: 492 }],
}

/** Seta da etapa i: posição, largura e pontos (relativos) do polígono. As setas se encaixam sem vão. */
export function setaDoPainel(i: number): { x: number; w: number; pontos: [number, number][] } {
  const { colunas, ponta: p, setaAltura: h, direita, larguraColuna } = PAINEL
  const x = i === 0 ? colunas[0] : colunas[i] - p
  const fim = i === colunas.length - 1 ? Math.max(direita, colunas[i] + larguraColuna) : colunas[i + 1]
  const w = fim - x
  const ultima = i === colunas.length - 1
  const pontos: [number, number][] = [
    [0, 0], ultima ? [w, 0] : [w - p, 0], ultima ? [w, h] : [w, h / 2], ...(ultima ? [] : [[w - p, h] as [number, number]]), [0, h],
    ...(i === 0 ? [] : [[p, h / 2] as [number, number]]),
  ]
  return { x, w, pontos }
}

/** Larguras dos segmentos da barra do total (proporcionais, com vão entre eles; fatia vazia não aparece). */
export function segmentosDaBarra(quantidades: number[]): { x: number; w: number; i: number }[] {
  const { x, w, vao } = PAINEL.barra
  const visiveis = quantidades.map((q, i) => ({ q, i })).filter(s => s.q > 0)
  const total = visiveis.reduce((s, v) => s + v.q, 0)
  if (!total) return []
  const util = w - vao * (visiveis.length - 1)
  let cursor = x
  return visiveis.map(({ q, i }, k) => {
    const largura = k === visiveis.length - 1 ? x + w - cursor : Math.max(2, Math.round((q / total) * util))
    const seg = { x: cursor, w: largura, i }
    cursor += largura + vao
    return seg
  })
}

/** Geometria do slide de motivos de cancelamento no estilo do painel. */
export const CANCELAMENTO_PAINEL = {
  total: { x: 58, w: 560 }, destaque: { x: 634, w: 597 },
  tabela: { x: 58, y: 232, w: 1173, h: 451 },
  colMotivo: 120, colBarra: 700, barraMaxW: 330, colPct: 1205,
  topoLinhas: 300, alturaLinhas: 330,
}
