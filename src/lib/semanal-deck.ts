import type { SemanalCancelamento, SemanalData, SemanalRow, SemanalSecaoId } from './semanal'

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
    return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 }, { id: 'descricao', label: 'Descrição', w: 284 },
      { id: 'fase', label: 'Fase / Pendências', w: 186 }, { id: 'previsao', label: 'Previsão de conclusão', w: 110 }, ...fim]
  }
  return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 },
    { id: 'descricao', label: secao === 'backlog' ? 'Objetivo' : 'Descrição', w: 330 },
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

/** Quantidade de iniciativas por laboratório (legenda), da maior para a menor. */
export function contagemPorLab(rows: SemanalRow[]): [string, number][] {
  const porLab = new Map<string, number>()
  for (const r of rows) porLab.set(r.lab ?? 'Não definido', (porLab.get(r.lab ?? 'Não definido') ?? 0) + 1)
  return [...porLab.entries()].sort((a, b) => b[1] - a[1])
}

/** Geometria do slide de motivos de cancelamento (px no canvas de 1280×720), usada pela tela e pelo PPTX. */
export const CANCELAMENTO_LAYOUT = {
  linhaTopo: 284, pctDireita: 758, barraX: 796, barraMaxW: 356, barraH: 36,
  /** Distância entre as linhas: 74 px até 5 motivos; com a linha extra de "sem motivo", 62 px. */
  passo: (linhas: number) => (linhas > 5 ? 62 : 74),
}

/**
 * Colunas do funil no slide "beOn Labs" (px no canvas de 1280×720): cada quadro fica exatamente debaixo da sua
 * seta. A seta ocupa a largura do quadro e a ponta avança sobre o vão até o entalhe da seta seguinte.
 */
export const RESUMO_FUNIL = {
  topoSeta: 214, alturaSeta: 86, ponta: 28, vao: 12, folgaSetas: 14,
  colunas: [{ x: 44, w: 260 }, { x: 316, w: 260 }, { x: 588, w: 376 }, { x: 976, w: 260 }],
}

/** Posição e largura da seta da etapa i (a última termina no quadro, sem avançar sobre a margem). */
export function setaDoFunil(i: number): { x: number; w: number } {
  const { colunas, vao, ponta, folgaSetas } = RESUMO_FUNIL
  const c = colunas[i]
  return { x: c.x, w: i === colunas.length - 1 ? c.w : c.w + vao + ponta - folgaSetas }
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
  | { tipo: 'resumo'; ateLabel: string }
  | { tipo: 'governanca' }
  | { tipo: 'cancelamento'; cancelamento: SemanalCancelamento }
  | { tipo: 'divisor'; linhas: string[]; icone: 'check' | 'flask' }
  | { tipo: 'lista'; secao: SemanalSecaoId; titulo: string; subtitulo?: string; rows: SemanalRow[]; todas: SemanalRow[] }
  | { tipo: 'obrigado' }
)

/** Todas as páginas do deck, na ordem do Comitê. `anchor` marca o destino dos botões DETALHES e "voltar". */
export function montarPaginas(data: SemanalData): PaginaDeck[] {
  const paginas: PaginaDeck[] = [
    { key: 'capa', label: 'Capa', tipo: 'capa', periodo: periodoLabel(data.geradoEm) },
    { key: 'objetivo', label: 'Objetivo', tipo: 'objetivo' },
    { key: 'resumo', label: 'beOn Labs — visão geral', anchor: 'resumo', tipo: 'resumo', ateLabel: ateLabel(data.geradoEm) },
  ]
  if (data.governanca) paginas.push({ key: 'governanca', label: 'Governança beOn Labs', tipo: 'governanca' })
  // Como no deck do Comitê, os motivos de cancelamento vêm logo depois da visão geral.
  if (data.cancelamento?.total) {
    paginas.push({ key: 'cancelamento', label: 'Principais motivos de cancelamento', anchor: 'cancelados', tipo: 'cancelamento', cancelamento: data.cancelamento })
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
