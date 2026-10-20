import {
  SITUACAO_LABEL, SITUACOES,
  type ColunaBoard, type Entidade, type ExperimentoItem, type IniciativaItem, type ItemPortfolio, type PortfolioDados, type Situacao,
} from './tipos'
import { categoriaDoSinal } from '../bloqueio'

/**
 * Motor da aba Portfólio (puro, roda na tela): os campos filtráveis dos dois boards, a busca, as facetas
 * com contagem, a ordenação, o agrupamento, os indicadores e o estado da visão (que vai para a URL e para
 * as visões salvas). Iniciativas e Experimentos compartilham os campos: na visão de Iniciativas, um campo do
 * Experimento considera os Experimentos vinculados; na de Experimentos, os campos da Iniciativa olham a mãe.
 */

export const NAO_INFORMADO = 'Não informado'
export const SEM_EXPERIMENTO = 'Sem experimento'
export const SEM_INICIATIVA = 'Sem iniciativa-mãe'

export const IMPACTO_LABEL: Record<string, string> = {
  EBITDA: 'Eficiência operacional',
  Receita: 'Receita',
  NPS: 'Experiência do cliente',
}

// ── Formatação ────────────────────────────────────────────────────────────────────────────────

/** "R$ 12,3 mi", "R$ 850 mil", "—". */
export function formatarValor(v: number | null | undefined): string {
  if (!v) return '—'
  if (v >= 1_000_000) {
    const mi = v / 1_000_000
    return `R$ ${mi.toLocaleString('pt-BR', { maximumFractionDigits: mi >= 100 ? 0 : 1 })} mi`
  }
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000).toLocaleString('pt-BR')} mil`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}

/** Dia (UTC) de uma data do Jira, em ms — "2026-10-18" e "2026-10-18T13:00:00.000-0300" viram o mesmo dia. */
function diaUTC(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null
}

export function formatarData(iso: string | null | undefined): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—'
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Contexto ──────────────────────────────────────────────────────────────────────────────────

export interface Contexto {
  iniciativas: Map<string, IniciativaItem>
  experimentos: Map<string, ExperimentoItem>
  /** Colunas dos dois boards, por id. */
  colunas: Map<string, ColunaBoard>
  /** Dia de referência (UTC) para os prazos: o da leitura dos dados, igual no servidor e no navegador. */
  hoje: number
  busca: Map<string, string>
}

export function criarContexto(d: PortfolioDados): Contexto {
  return {
    iniciativas: new Map(d.iniciativas.map(i => [i.key, i])),
    experimentos: new Map(d.experimentos.map(e => [e.key, e])),
    colunas: new Map([...d.boards.iniciativa.colunas, ...d.boards.experimento.colunas].map(c => [c.id, c])),
    hoje: diaUTC(d.geradoEm) ?? Date.UTC(2026, 0, 1),
    busca: new Map(),
  }
}

export const filhosDe = (i: IniciativaItem, ctx: Contexto) =>
  i.experimentos.map(k => ctx.experimentos.get(k)).filter((e): e is ExperimentoItem => !!e)

export const maeDe = (e: ExperimentoItem, ctx: Contexto) => (e.iniciativaKey ? ctx.iniciativas.get(e.iniciativaKey) : undefined)

export const nomeDaColuna = (id: string, ctx: Contexto) => ctx.colunas.get(id)?.nome ?? NAO_INFORMADO

// ── Faixas ────────────────────────────────────────────────────────────────────────────────────

export const FAIXAS_BENEFICIO = ['Acima de R$ 50 mi', 'R$ 10 a 50 mi', 'R$ 1 a 10 mi', 'Até R$ 1 mi', 'Sem benefício mapeado']
export function faixaBeneficio(v: number | null): string {
  if (!v) return FAIXAS_BENEFICIO[4]
  if (v > 50_000_000) return FAIXAS_BENEFICIO[0]
  if (v > 10_000_000) return FAIXAS_BENEFICIO[1]
  if (v > 1_000_000) return FAIXAS_BENEFICIO[2]
  return FAIXAS_BENEFICIO[3]
}

export const FAIXAS_CUSTO = ['Acima de R$ 1 mi', 'R$ 500 mil a 1 mi', 'R$ 100 a 500 mil', 'Até R$ 100 mil', 'Sem custo estimado']
export function faixaCusto(v: number | null): string {
  if (!v) return FAIXAS_CUSTO[4]
  if (v > 1_000_000) return FAIXAS_CUSTO[0]
  if (v > 500_000) return FAIXAS_CUSTO[1]
  if (v > 100_000) return FAIXAS_CUSTO[2]
  return FAIXAS_CUSTO[3]
}

export const FAIXAS_PRAZO = ['Vencido', 'Nos próximos 30 dias', 'Em 31 a 90 dias', 'Depois de 90 dias', 'Sem data limite', 'Encerrado']
export function faixaPrazo(prazo: string | null, situacao: Situacao, hoje: number): string {
  if (situacao === 'concluido' || situacao === 'cancelado') return FAIXAS_PRAZO[5]
  const dia = diaUTC(prazo)
  if (dia === null) return FAIXAS_PRAZO[4]
  const dias = Math.round((dia - hoje) / 86_400_000)
  if (dias < 0) return FAIXAS_PRAZO[0]
  if (dias <= 30) return FAIXAS_PRAZO[1]
  if (dias <= 90) return FAIXAS_PRAZO[2]
  return FAIXAS_PRAZO[3]
}

export const FAIXAS_CICLOS = ['2 ou mais ciclos', '1 experimento', SEM_EXPERIMENTO]
const faixaCiclos = (n: number) => (n >= 2 ? FAIXAS_CICLOS[0] : n === 1 ? FAIXAS_CICLOS[1] : FAIXAS_CICLOS[2])

export const PENDENCIAS = ['Sem sponsor', 'Sem lab', 'Sem domínio', 'Sem benefício']
export const CADASTRO_COMPLETO = 'Cadastro completo'
export function pendenciasDe(item: ItemPortfolio): string[] {
  const p = [
    !item.sponsor && PENDENCIAS[0], !item.lab && PENDENCIAS[1], !item.dominio && PENDENCIAS[2], !item.beneficio && PENDENCIAS[3],
  ].filter((v): v is string => !!v)
  return p.length ? p : [CADASTRO_COMPLETO]
}

/**
 * Hipótese validada: o experimento tem iniciativa-mãe em Aguardando piloto, Em piloto ou Em escala no board
 * de Ideação. Refutada: todos os outros (inclusive os sem iniciativa-mãe).
 */
export const HIPOTESES = ['Validada', 'Refutada'] as const

export function iniciativaValidada(i: IniciativaItem, ctx: Contexto): boolean {
  const n = norm(nomeDaColuna(i.coluna, ctx))
  return n.includes('piloto') || n.includes('escala')
}

export function hipoteseDe(e: ExperimentoItem, ctx: Contexto): (typeof HIPOTESES)[number] {
  const mae = maeDe(e, ctx)
  return mae && iniciativaValidada(mae, ctx) ? HIPOTESES[0] : HIPOTESES[1]
}

// ── Campos ────────────────────────────────────────────────────────────────────────────────────

export type GrupoCampo = 'Board' | 'Responsáveis' | 'Negócio' | 'Execução' | 'Cadastro'
export const GRUPOS: GrupoCampo[] = ['Board', 'Responsáveis', 'Negócio', 'Execução', 'Cadastro']

export interface CampoFiltro {
  id: string
  label: string
  grupo: GrupoCampo
  /** Ordem fixa das opções (faixas). Sem ela, as opções vêm da mais frequente para a menos. */
  ordem?: string[]
  /** Na visão de Iniciativas, o valor vem dos Experimentos vinculados. */
  viaExperimentos?: boolean
  /** Na visão de Experimentos, o valor vem da Iniciativa-mãe. */
  viaIniciativa?: boolean
  iniciativa?: (i: IniciativaItem, ctx: Contexto) => string[]
  experimento?: (e: ExperimentoItem, ctx: Contexto) => string[]
}

const um = (v: string | null | undefined) => (v && v.trim() ? [v.trim()] : [NAO_INFORMADO])

function uniao(vals: (string | null | undefined)[]): string[] {
  const s = [...new Set(vals.filter((v): v is string => !!v && !!v.trim()).map(v => v.trim()))]
  return s.length ? s : [NAO_INFORMADO]
}

/** Campo do Experimento visto na Iniciativa: união dos valores dos Experimentos vinculados. */
function dosFilhos(f: (e: ExperimentoItem, ctx: Contexto) => string[]) {
  return (i: IniciativaItem, ctx: Contexto) => {
    const filhos = filhosDe(i, ctx)
    return filhos.length ? [...new Set(filhos.flatMap(e => f(e, ctx)))] : [SEM_EXPERIMENTO]
  }
}

/** Campo da Iniciativa visto no Experimento: o valor da Iniciativa-mãe. */
function daMae(f: (i: IniciativaItem, ctx: Contexto) => string[]) {
  return (e: ExperimentoItem, ctx: Contexto) => {
    const mae = maeDe(e, ctx)
    return mae ? f(mae, ctx) : [SEM_INICIATIVA]
  }
}

const situacao = (x: ItemPortfolio) => [SITUACAO_LABEL[x.situacao]]
const origemBloqueio = (e: ExperimentoItem) => (e.bloqueado
  ? [...new Set(e.sinaisBloqueio.length ? e.sinaisBloqueio.map(categoriaDoSinal) : ['Motivo de bloqueio'])]
  : ['Sem bloqueio'])
const impacto = (x: ItemPortfolio) => [x.impacto ? IMPACTO_LABEL[x.impacto] ?? x.impacto : NAO_INFORMADO]
const bloqueio = (x: ItemPortfolio) => [x.bloqueado ? 'Bloqueado' : 'Sem bloqueio']
const ano = (x: ItemPortfolio) => [x.criadoEm?.slice(0, 4) || NAO_INFORMADO]

const colunaIni = (i: IniciativaItem, ctx: Contexto) => [nomeDaColuna(i.coluna, ctx)]
const statusIni = (i: IniciativaItem) => um(i.status)
const colunaExp = (e: ExperimentoItem, ctx: Contexto) => [nomeDaColuna(e.coluna, ctx)]
const statusExp = (e: ExperimentoItem) => um(e.status)
const ciclosIni = (i: IniciativaItem) => [faixaCiclos(i.experimentos.length)]

export const CAMPOS: CampoFiltro[] = [
  // Board
  { id: 'situacao', label: 'Situação', grupo: 'Board', ordem: SITUACOES.map(s => SITUACAO_LABEL[s]), iniciativa: situacao, experimento: situacao },
  { id: 'colunaIni', label: 'Coluna da iniciativa', grupo: 'Board', viaIniciativa: true, iniciativa: colunaIni, experimento: daMae(colunaIni) },
  { id: 'statusIni', label: 'Status da iniciativa', grupo: 'Board', viaIniciativa: true, iniciativa: statusIni, experimento: daMae(statusIni) },
  { id: 'colunaExp', label: 'Coluna do experimento', grupo: 'Board', viaExperimentos: true, experimento: colunaExp, iniciativa: dosFilhos(colunaExp) },
  { id: 'statusExp', label: 'Status do experimento', grupo: 'Board', viaExperimentos: true, experimento: statusExp, iniciativa: dosFilhos(statusExp) },
  {
    id: 'hipotese', label: 'Hipótese', grupo: 'Board', ordem: [...HIPOTESES, SEM_EXPERIMENTO],
    experimento: (e, ctx) => [hipoteseDe(e, ctx)],
    iniciativa: (i, ctx) => (i.experimentos.length ? [iniciativaValidada(i, ctx) ? HIPOTESES[0] : HIPOTESES[1]] : [SEM_EXPERIMENTO]),
  },
  { id: 'bloqueio', label: 'Bloqueio', grupo: 'Board', ordem: ['Bloqueado', 'Sem bloqueio'], iniciativa: bloqueio, experimento: bloqueio },
  {
    id: 'prazo', label: 'Data limite', grupo: 'Board', ordem: FAIXAS_PRAZO,
    iniciativa: (i, ctx) => [faixaPrazo(i.prazo, i.situacao, ctx.hoje)], experimento: (e, ctx) => [faixaPrazo(e.prazo, e.situacao, ctx.hoje)],
  },
  // Responsáveis
  { id: 'lab', label: 'Lab responsável', grupo: 'Responsáveis', iniciativa: i => um(i.lab), experimento: e => um(e.lab) },
  {
    id: 'sponsor', label: 'Sponsor', grupo: 'Responsáveis',
    iniciativa: (i, ctx) => uniao([i.sponsor, ...filhosDe(i, ctx).map(e => e.sponsor)]), experimento: e => um(e.sponsor),
  },
  { id: 'bo', label: 'Business Owner', grupo: 'Responsáveis', viaExperimentos: true, experimento: e => um(e.bo), iniciativa: dosFilhos(e => um(e.bo)) },
  { id: 'diretoria', label: 'Diretoria', grupo: 'Responsáveis', viaExperimentos: true, experimento: e => um(e.diretoria), iniciativa: dosFilhos(e => um(e.diretoria)) },
  // Negócio
  { id: 'impacto', label: 'Impacto na meta', grupo: 'Negócio', iniciativa: impacto, experimento: impacto },
  { id: 'beneficio', label: 'Benefício potencial', grupo: 'Negócio', ordem: FAIXAS_BENEFICIO, iniciativa: i => [faixaBeneficio(i.beneficio)], experimento: e => [faixaBeneficio(e.beneficio)] },
  { id: 'custo', label: 'Custo estimado', grupo: 'Negócio', ordem: FAIXAS_CUSTO, viaExperimentos: true, experimento: e => [faixaCusto(e.custoEstimado)], iniciativa: dosFilhos(e => [faixaCusto(e.custoEstimado)]) },
  {
    id: 'dominio', label: 'Domínio', grupo: 'Negócio',
    iniciativa: (i, ctx) => uniao([i.dominio, ...filhosDe(i, ctx).map(e => e.dominio)]), experimento: e => um(e.dominio),
  },
  { id: 'segmento', label: 'Segmento', grupo: 'Negócio', viaExperimentos: true, experimento: e => um(e.segmento), iniciativa: dosFilhos(e => um(e.segmento)) },
  { id: 'mercado', label: 'Mercado', grupo: 'Negócio', viaExperimentos: true, experimento: e => um(e.mercado), iniciativa: dosFilhos(e => um(e.mercado)) },
  { id: 'portfolio', label: 'Portfólio', grupo: 'Negócio', viaExperimentos: true, experimento: e => um(e.portfolio), iniciativa: dosFilhos(e => um(e.portfolio)) },
  // Execução
  { id: 'complexidade', label: 'Complexidade', grupo: 'Execução', viaExperimentos: true, experimento: e => um(e.complexidade), iniciativa: dosFilhos(e => um(e.complexidade)) },
  { id: 'tecnologia', label: 'Tecnologia', grupo: 'Execução', viaExperimentos: true, experimento: e => um(e.tecnologia), iniciativa: dosFilhos(e => um(e.tecnologia)) },
  { id: 'prioridade', label: 'Prioridade', grupo: 'Execução', viaExperimentos: true, experimento: e => um(e.prioridade), iniciativa: dosFilhos(e => um(e.prioridade)) },
  {
    id: 'origemBloqueio', label: 'Origem do bloqueio', grupo: 'Execução', viaExperimentos: true,
    experimento: origemBloqueio, iniciativa: dosFilhos(origemBloqueio),
  },
  { id: 'motivoBloqueio', label: 'Motivo de bloqueio', grupo: 'Execução', viaExperimentos: true, experimento: e => um(e.motivoBloqueio), iniciativa: dosFilhos(e => um(e.motivoBloqueio)) },
  { id: 'tipoImpedimento', label: 'Tipo de impedimento', grupo: 'Execução', viaExperimentos: true, experimento: e => um(e.tipoImpedimento), iniciativa: dosFilhos(e => um(e.tipoImpedimento)) },
  { id: 'ciclos', label: 'Experimentos da iniciativa', grupo: 'Execução', ordem: FAIXAS_CICLOS, viaIniciativa: true, iniciativa: ciclosIni, experimento: daMae(ciclosIni) },
  { id: 'vinculo', label: 'Vínculo com iniciativa', grupo: 'Execução', ordem: ['Com iniciativa-mãe', SEM_INICIATIVA], experimento: e => [e.iniciativaKey ? 'Com iniciativa-mãe' : SEM_INICIATIVA] },
  // Cadastro
  { id: 'pendencias', label: 'Pendências de cadastro', grupo: 'Cadastro', ordem: [...PENDENCIAS, CADASTRO_COMPLETO], iniciativa: pendenciasDe, experimento: pendenciasDe },
  { id: 'criado', label: 'Ano de criação', grupo: 'Cadastro', iniciativa: ano, experimento: ano },
]

export const CAMPO = new Map(CAMPOS.map(c => [c.id, c]))

/** Filtros da barra principal; os demais ficam em "Todos os filtros". */
export const FILTROS_RAPIDOS = ['situacao', 'lab', 'sponsor', 'dominio', 'impacto', 'beneficio']

/** Campos que servem de raia (Kanban) ou de grupo (Lista). */
export const AGRUPAVEIS = ['lab', 'sponsor', 'dominio', 'impacto', 'situacao', 'beneficio', 'segmento', 'diretoria', 'complexidade', 'prioridade', 'prazo']

export const aplicaA = (campo: CampoFiltro, entidade: Entidade) => !!campo[entidade]

export function valoresDe(campo: CampoFiltro, item: ItemPortfolio, ctx: Contexto): string[] {
  return item.tipo === 'iniciativa' ? campo.iniciativa?.(item, ctx) ?? [] : campo.experimento?.(item, ctx) ?? []
}

// ── Estado da visão ───────────────────────────────────────────────────────────────────────────

export type VisaoId = 'iniciativas' | 'experimentos' | 'lista'
export type OrdemId = 'beneficio' | 'nome' | 'recentes' | 'prazo' | 'chave'

export const ORDENS: { id: OrdemId; label: string }[] = [
  { id: 'beneficio', label: 'Maior benefício' },
  { id: 'prazo', label: 'Prazo mais próximo' },
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'nome', label: 'Nome (A–Z)' },
  { id: 'chave', label: 'Chave do Jira' },
]

export interface EstadoPortfolio {
  visao: VisaoId
  /** Entidade mostrada na Lista. */
  lista: Entidade
  busca: string
  /** Valores marcados por campo (OU dentro do campo, E entre campos). */
  filtros: Record<string, string[]>
  /** Campo das raias (Kanban) ou dos grupos (Lista). */
  agrupar: string | null
  ordem: OrdemId
  /** Colunas do Kanban com o recolhimento trocado em relação ao padrão (Cancelado começa recolhida). */
  alternadas: string[]
  /** Colunas da Lista escolhidas, por entidade (null = as padrão). */
  colunas: Record<Entidade, string[] | null>
}

export const ESTADO_PADRAO: EstadoPortfolio = {
  visao: 'iniciativas', lista: 'experimento', busca: '', filtros: {}, agrupar: null, ordem: 'beneficio',
  alternadas: [], colunas: { iniciativa: null, experimento: null },
}

export function entidadeDa(e: Pick<EstadoPortfolio, 'visao' | 'lista'>): Entidade {
  return e.visao === 'iniciativas' ? 'iniciativa' : e.visao === 'experimentos' ? 'experimento' : e.lista
}

export const totalDeFiltros = (e: EstadoPortfolio) => Object.values(e.filtros).reduce((s, v) => s + v.length, 0)

export function alternarValor(e: EstadoPortfolio, campo: string, valor: string): EstadoPortfolio {
  const atuais = e.filtros[campo] ?? []
  const novos = atuais.includes(valor) ? atuais.filter(v => v !== valor) : [...atuais, valor]
  const filtros = { ...e.filtros, [campo]: novos }
  if (!novos.length) delete filtros[campo]
  return { ...e, filtros }
}

const VISOES: VisaoId[] = ['iniciativas', 'experimentos', 'lista']
const ORDEM_IDS = ORDENS.map(o => o.id)

/** Estado → query string (sem "?"), só com o que difere do padrão. */
export function estadoParaQuery(e: EstadoPortfolio): string {
  const q = new URLSearchParams()
  if (e.visao !== ESTADO_PADRAO.visao) q.set('v', e.visao)
  if (e.visao === 'lista' && e.lista !== ESTADO_PADRAO.lista) q.set('l', e.lista)
  if (e.busca.trim()) q.set('q', e.busca.trim())
  for (const [campo, valores] of Object.entries(e.filtros)) for (const v of valores) q.append('f', `${campo}:${v}`)
  if (e.agrupar) q.set('g', e.agrupar)
  if (e.ordem !== ESTADO_PADRAO.ordem) q.set('o', e.ordem)
  for (const c of e.alternadas) q.append('c', c)
  if (e.colunas.iniciativa) q.set('ci', e.colunas.iniciativa.join(','))
  if (e.colunas.experimento) q.set('ce', e.colunas.experimento.join(','))
  return q.toString()
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>

function doParam(p: Params, k: string): string[] {
  if (p instanceof URLSearchParams) return p.getAll(k)
  const v = p[k]
  return v === undefined ? [] : Array.isArray(v) ? v : [v]
}

/** Query string → estado, ignorando o que não for válido. */
export function estadoDaQuery(p: Params): EstadoPortfolio {
  const um1 = (k: string) => doParam(p, k)[0]
  const filtros: Record<string, string[]> = {}
  for (const f of doParam(p, 'f')) {
    const i = f.indexOf(':')
    const campo = f.slice(0, i), valor = f.slice(i + 1)
    if (i > 0 && CAMPO.has(campo) && valor && !(filtros[campo] ?? []).includes(valor)) filtros[campo] = [...(filtros[campo] ?? []), valor]
  }
  const v = um1('v') as VisaoId, o = um1('o') as OrdemId, g = um1('g'), l = um1('l')
  const cols = (k: string) => { const s = um1(k); return s ? s.split(',').filter(Boolean) : null }
  return {
    visao: VISOES.includes(v) ? v : ESTADO_PADRAO.visao,
    lista: l === 'iniciativa' ? 'iniciativa' : 'experimento',
    busca: um1('q') ?? '',
    filtros,
    agrupar: g && AGRUPAVEIS.includes(g) ? g : null,
    ordem: ORDEM_IDS.includes(o) ? o : ESTADO_PADRAO.ordem,
    alternadas: doParam(p, 'c'),
    colunas: { iniciativa: cols('ci'), experimento: cols('ce') },
  }
}

// ── Filtrar, facetas, ordenar e agrupar ───────────────────────────────────────────────────────

function textoDeBusca(item: ItemPortfolio, ctx: Contexto): string {
  const cache = ctx.busca.get(`${item.tipo}:${item.key}`)
  if (cache !== undefined) return cache
  const partes: (string | null | undefined)[] = [item.key, item.nome, item.lab, item.sponsor, item.dominio, item.status, item.descricao]
  if (item.tipo === 'iniciativa') for (const e of filhosDe(item, ctx)) partes.push(e.key, e.nome, e.sponsor, e.bo, e.diretoria)
  else {
    const mae = maeDe(item, ctx)
    partes.push(item.bo, item.diretoria, item.segmento, item.tecnologia, mae?.key, mae?.nome)
  }
  const t = norm(partes.filter(Boolean).join(' '))
  ctx.busca.set(`${item.tipo}:${item.key}`, t)
  return t
}

export function filtrar<T extends ItemPortfolio>(itens: T[], entidade: Entidade, e: EstadoPortfolio, ctx: Contexto, ignorar?: string): T[] {
  const termos = norm(e.busca).split(/\s+/).filter(Boolean)
  const ativos = Object.entries(e.filtros)
    .filter(([id, vs]) => vs.length > 0 && id !== ignorar)
    .map(([id, vs]) => [CAMPO.get(id), new Set(vs)] as const)
    .filter((par): par is readonly [CampoFiltro, Set<string>] => !!par[0] && aplicaA(par[0], entidade))
  return itens.filter(item => {
    if (termos.length) {
      const t = textoDeBusca(item, ctx)
      if (!termos.every(termo => t.includes(termo))) return false
    }
    return ativos.every(([campo, marcados]) => valoresDe(campo, item, ctx).some(v => marcados.has(v)))
  })
}

const POR_ULTIMO = new Set([NAO_INFORMADO, SEM_EXPERIMENTO, SEM_INICIATIVA])

export interface Faceta { valor: string; n: number }

/** Opções de um campo com a contagem de itens, considerando a busca e os outros filtros ativos. */
export function facetas(itens: ItemPortfolio[], entidade: Entidade, e: EstadoPortfolio, ctx: Contexto, campoId: string): Faceta[] {
  const campo = CAMPO.get(campoId)
  if (!campo || !aplicaA(campo, entidade)) return []
  const n = new Map<string, number>()
  for (const item of filtrar(itens, entidade, e, ctx, campoId)) {
    for (const v of new Set(valoresDe(campo, item, ctx))) n.set(v, (n.get(v) ?? 0) + 1)
  }
  for (const v of e.filtros[campoId] ?? []) if (!n.has(v)) n.set(v, 0)
  const lista = [...n.entries()].map(([valor, q]) => ({ valor, n: q }))
  if (campo.ordem) {
    const pos = (v: string) => { const i = campo.ordem!.indexOf(v); return i < 0 ? 999 : i }
    return lista.sort((a, b) => pos(a.valor) - pos(b.valor) || a.valor.localeCompare(b.valor, 'pt-BR'))
  }
  if (campoId === 'criado') return lista.sort((a, b) => b.valor.localeCompare(a.valor))
  return lista.sort((a, b) =>
    Number(POR_ULTIMO.has(a.valor)) - Number(POR_ULTIMO.has(b.valor)) || b.n - a.n || a.valor.localeCompare(b.valor, 'pt-BR'))
}

const numeroDaChave = (k: string) => Number(k.replace(/\D+/g, '')) || 0

export function ordenar<T extends ItemPortfolio>(itens: T[], ordem: OrdemId): T[] {
  const porNome = (a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR')
  const copia = [...itens]
  switch (ordem) {
    case 'nome': return copia.sort(porNome)
    case 'chave': return copia.sort((a, b) => numeroDaChave(a.key) - numeroDaChave(b.key))
    case 'recentes': return copia.sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '') || porNome(a, b))
    case 'prazo': return copia.sort((a, b) =>
      (a.prazo ? 0 : 1) - (b.prazo ? 0 : 1) || (a.prazo ?? '').localeCompare(b.prazo ?? '') || porNome(a, b))
    default: return copia.sort((a, b) => (b.beneficio ?? -1) - (a.beneficio ?? -1) || porNome(a, b))
  }
}

export interface Grupo<T> { valor: string; itens: T[] }

/** Agrupa pelo primeiro valor do campo (cada item aparece em um grupo só). */
export function agrupar<T extends ItemPortfolio>(itens: T[], campoId: string, ctx: Contexto): Grupo<T>[] {
  const campo = CAMPO.get(campoId)
  if (!campo) return [{ valor: '', itens }]
  const grupos = new Map<string, T[]>()
  for (const item of itens) {
    const v = valoresDe(campo, item, ctx)[0] ?? NAO_INFORMADO
    grupos.set(v, [...(grupos.get(v) ?? []), item])
  }
  const lista = [...grupos.entries()].map(([valor, its]) => ({ valor, itens: its }))
  if (campo.ordem) {
    const pos = (v: string) => { const i = campo.ordem!.indexOf(v); return i < 0 ? 999 : i }
    return lista.sort((a, b) => pos(a.valor) - pos(b.valor))
  }
  return lista.sort((a, b) =>
    Number(POR_ULTIMO.has(a.valor)) - Number(POR_ULTIMO.has(b.valor)) || b.itens.length - a.itens.length || a.valor.localeCompare(b.valor, 'pt-BR'))
}

// ── Indicadores ───────────────────────────────────────────────────────────────────────────────

export interface Resumo {
  total: number
  /** Itens fora da coluna Cancelado: a base do percentual em execução. */
  ativos: number
  emExecucao: number
  bloqueados: number
  beneficio: number
  /** Experimentos das Iniciativas mostradas, ou Iniciativas-mãe dos Experimentos mostrados. */
  relacionados: number
  /** Experimentos considerados nas hipóteses: os mostrados, ou os das Iniciativas mostradas. */
  experimentos: number
  validadas: number
  refutadas: number
}

export function resumir(itens: ItemPortfolio[], ctx: Contexto): Resumo {
  const relacionados = new Set<string>()
  const experimentos = new Map<string, ExperimentoItem>()
  for (const i of itens) {
    if (i.tipo === 'iniciativa') {
      i.experimentos.forEach(k => relacionados.add(k))
      filhosDe(i, ctx).forEach(e => experimentos.set(e.key, e))
    } else {
      if (i.iniciativaKey) relacionados.add(i.iniciativaKey)
      experimentos.set(i.key, i)
    }
  }
  const validadas = [...experimentos.values()].filter(e => hipoteseDe(e, ctx) === 'Validada').length
  return {
    total: itens.length,
    ativos: itens.filter(i => i.situacao !== 'cancelado').length,
    emExecucao: itens.filter(i => i.situacao === 'em-execucao').length,
    bloqueados: itens.filter(i => i.bloqueado).length,
    beneficio: itens.reduce((s, i) => s + (i.beneficio ?? 0), 0),
    relacionados: relacionados.size,
    experimentos: experimentos.size,
    validadas,
    refutadas: experimentos.size - validadas,
  }
}

// ── Visões prontas ────────────────────────────────────────────────────────────────────────────

export interface VisaoPronta { id: string; nome: string; descricao: string; estado: Partial<EstadoPortfolio> }

export const VISOES_PRONTAS: VisaoPronta[] = [
  { id: 'funil', nome: 'Funil de iniciativas', descricao: 'Todas as iniciativas nas colunas do board de Ideação.', estado: { visao: 'iniciativas' } },
  { id: 'quadro', nome: 'Quadro de experimentos', descricao: 'Todos os experimentos nas colunas do board de Experimentação.', estado: { visao: 'experimentos' } },
  {
    id: 'execucao', nome: 'Em execução por lab', descricao: 'Experimentos ativos, com uma raia por laboratório.',
    estado: { visao: 'experimentos', filtros: { situacao: ['Em execução'] }, agrupar: 'lab' },
  },
  { id: 'bloqueios', nome: 'Bloqueios', descricao: 'Experimentos bloqueados, com o motivo.', estado: { visao: 'experimentos', filtros: { bloqueio: ['Bloqueado'] } } },
  {
    id: 'valor', nome: 'Maior valor em jogo', descricao: 'Experimentos abertos do maior para o menor benefício potencial.',
    estado: { visao: 'lista', lista: 'experimento', filtros: { situacao: ['Não iniciado', 'Em execução'] }, ordem: 'beneficio' },
  },
  {
    id: 'prazos', nome: 'Prazos vencidos', descricao: 'Experimentos abertos com a data limite no passado.',
    estado: { visao: 'lista', lista: 'experimento', filtros: { prazo: ['Vencido'] }, ordem: 'prazo' },
  },
  {
    id: 'sem-experimento', nome: 'Iniciativas sem experimento', descricao: 'Ideias que ainda não viraram experimento no Jira.',
    estado: { visao: 'lista', lista: 'iniciativa', filtros: { ciclos: [SEM_EXPERIMENTO] } },
  },
  {
    id: 'validadas', nome: 'Hipóteses validadas', descricao: 'Experimentos cuja iniciativa chegou a aguardando piloto, piloto ou escala.',
    estado: { visao: 'experimentos', filtros: { hipotese: ['Validada'] } },
  },
]

export function aplicarVisao(v: Partial<EstadoPortfolio>): EstadoPortfolio {
  return { ...ESTADO_PADRAO, ...v, colunas: { ...ESTADO_PADRAO.colunas, ...v.colunas } }
}

// ── Lista e CSV ───────────────────────────────────────────────────────────────────────────────

export interface ColunaLista {
  id: string
  label: string
  /** Ordenação acionada ao clicar no cabeçalho. */
  ordem?: OrdemId
  valor: (item: ItemPortfolio, ctx: Contexto) => string
}

const comum = (f: (i: ItemPortfolio, ctx: Contexto) => string | null | undefined) => (i: ItemPortfolio, ctx: Contexto) => f(i, ctx) || '—'
const doExp = (f: (e: ExperimentoItem, ctx: Contexto) => string | null | undefined) =>
  (i: ItemPortfolio, ctx: Contexto) => (i.tipo === 'experimento' ? f(i, ctx) || '—' : '—')

const COLUNAS_TODAS: Record<string, ColunaLista> = {
  key: { id: 'key', label: 'Chave', ordem: 'chave', valor: i => i.key },
  nome: { id: 'nome', label: 'Nome', ordem: 'nome', valor: i => i.nome },
  iniciativa: { id: 'iniciativa', label: 'Iniciativa-mãe', valor: doExp((e, ctx) => maeDe(e, ctx)?.nome) },
  experimentos: { id: 'experimentos', label: 'Experimentos', valor: i => (i.tipo === 'iniciativa' ? String(i.experimentos.length) : '—') },
  coluna: { id: 'coluna', label: 'Coluna', valor: (i, ctx) => nomeDaColuna(i.coluna, ctx) },
  status: { id: 'status', label: 'Status', valor: i => i.status },
  situacao: { id: 'situacao', label: 'Situação', valor: i => SITUACAO_LABEL[i.situacao] },
  lab: { id: 'lab', label: 'Lab', valor: comum(i => i.lab) },
  sponsor: { id: 'sponsor', label: 'Sponsor', valor: comum(i => i.sponsor) },
  bo: { id: 'bo', label: 'Business Owner', valor: doExp(e => e.bo) },
  diretoria: { id: 'diretoria', label: 'Diretoria', valor: doExp(e => e.diretoria) },
  dominio: { id: 'dominio', label: 'Domínio', valor: comum(i => i.dominio) },
  segmento: { id: 'segmento', label: 'Segmento', valor: doExp(e => e.segmento) },
  mercado: { id: 'mercado', label: 'Mercado', valor: doExp(e => e.mercado) },
  portfolio: { id: 'portfolio', label: 'Portfólio', valor: doExp(e => e.portfolio) },
  impacto: { id: 'impacto', label: 'Impacto', valor: comum(i => (i.impacto ? IMPACTO_LABEL[i.impacto] ?? i.impacto : null)) },
  beneficio: { id: 'beneficio', label: 'Benefício potencial', ordem: 'beneficio', valor: i => formatarValor(i.beneficio) },
  custo: { id: 'custo', label: 'Custo estimado', valor: doExp(e => (e.custoEstimado ? formatarValor(e.custoEstimado) : null)) },
  complexidade: { id: 'complexidade', label: 'Complexidade', valor: doExp(e => e.complexidade) },
  tecnologia: { id: 'tecnologia', label: 'Tecnologia', valor: doExp(e => e.tecnologia) },
  prioridade: { id: 'prioridade', label: 'Prioridade', valor: doExp(e => e.prioridade) },
  prazo: { id: 'prazo', label: 'Data limite', ordem: 'prazo', valor: i => formatarData(i.prazo) },
  bloqueio: { id: 'bloqueio', label: 'Bloqueio', valor: i => (i.bloqueado ? (i.tipo === 'experimento' && i.motivoBloqueio) || 'Bloqueado' : '—') },
  criado: { id: 'criado', label: 'Criado em', ordem: 'recentes', valor: i => formatarData(i.criadoEm) },
}

export const COLUNAS_LISTA: Record<Entidade, ColunaLista[]> = {
  experimento: ['nome', 'iniciativa', 'coluna', 'situacao', 'status', 'lab', 'sponsor', 'bo', 'diretoria', 'dominio', 'segmento', 'mercado',
    'portfolio', 'impacto', 'beneficio', 'custo', 'complexidade', 'tecnologia', 'prioridade', 'prazo', 'bloqueio', 'criado', 'key'].map(id => COLUNAS_TODAS[id]),
  iniciativa: ['nome', 'experimentos', 'coluna', 'situacao', 'status', 'lab', 'sponsor', 'dominio', 'impacto', 'beneficio', 'prazo', 'bloqueio',
    'criado', 'key'].map(id => COLUNAS_TODAS[id]),
}

export const COLUNAS_PADRAO: Record<Entidade, string[]> = {
  experimento: ['nome', 'iniciativa', 'coluna', 'lab', 'sponsor', 'impacto', 'beneficio', 'prazo', 'bloqueio'],
  iniciativa: ['nome', 'experimentos', 'coluna', 'lab', 'sponsor', 'dominio', 'impacto', 'beneficio', 'bloqueio'],
}

export function colunasVisiveis(e: EstadoPortfolio, entidade: Entidade): ColunaLista[] {
  const escolhidas = e.colunas[entidade] ?? COLUNAS_PADRAO[entidade]
  // "nome" sempre aparece; a ordem é a do catálogo.
  return COLUNAS_LISTA[entidade].filter(c => c.id === 'nome' || escolhidas.includes(c.id))
}

/** CSV (separado por ";", como o Excel em português espera) com todas as colunas da entidade. */
export function paraCsv(itens: ItemPortfolio[], entidade: Entidade, ctx: Contexto): string {
  const cols = COLUNAS_LISTA[entidade]
  const esc = (s: string) => (/[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const linhas = [
    cols.map(c => c.label),
    ...itens.map(i => cols.map(c => {
      if (c.id === 'beneficio') return String(i.beneficio ?? '')
      const v = c.valor(i, ctx)
      return v === '—' ? '' : v
    })),
  ]
  return linhas.map(l => l.map(esc).join(';')).join('\n')
}
