import { STATUS_PIPELINE } from '../mappers'
import type { PipelineCount } from '../types'

/**
 * Etapa de um status nos dois boards, para o Comparativo. A fonte de verdade é a coluna em que o status está hoje
 * na configuração do board (o Jira reaproveita ids de status entre boards, e a migração trocou ids e nomes). Status
 * que não estão mais em nenhuma coluna (os legados, que só aparecem no histórico) são lidos pelo nome que o
 * histórico guardou e, por último, pelo mapa fixo de ids.
 */

export type EtapaIniciativa = 'exploracao' | 'experimentacao' | 'aguardando' | 'piloto' | 'escala' | 'concluido' | 'cancelado'
export type EtapaEpic = 'backlog' | 'andamento' | 'validacao' | 'concluido' | 'cancelado'

/** Iniciativas com hipótese validada: seguiram para Aguardando piloto, Piloto ou Escala (inclui Finalizado). */
export const ETAPAS_VALIDADAS: EtapaIniciativa[] = ['aguardando', 'piloto', 'escala']
/** Etapas depois da Exploração no board de Ideação. */
export const DEPOIS_DA_EXPLORACAO: EtapaIniciativa[] = ['experimentacao', ...ETAPAS_VALIDADAS]

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Etapa de uma coluna ou status do board de Ideação pelo nome. */
export function etapaIniciativaPorNome(nome: string | null | undefined): EtapaIniciativa | undefined {
  const n = norm(nome)
  if (!n) return undefined
  if (/cancel/.test(n)) return 'cancelado'
  if (/aguard/.test(n) && /pilot/.test(n)) return 'aguardando'
  if (/pilot/.test(n)) return 'piloto'
  if (/escala|finaliz|adoca/.test(n)) return 'escala'
  if (/experiment|andamento|valida/.test(n)) return 'experimentacao'
  if (/conclu|^done$|^resolvid/.test(n)) return 'concluido'
  if (/backlog|refin|estrutur|consolid|pronto|ideia|ideacao|triagem|analise|prospec|to do|a fazer/.test(n)) return 'exploracao'
  return undefined
}

/** Etapa de uma coluna ou status do board de Experimentação pelo nome. */
export function etapaEpicPorNome(nome: string | null | undefined): EtapaEpic | undefined {
  const n = norm(nome)
  if (!n) return undefined
  if (/cancel/.test(n)) return 'cancelado'
  if (/valida/.test(n)) return 'validacao'
  if (/andamento|in progress|desenvolv|execu/.test(n)) return 'andamento'
  if (/conclu|^done$|finaliz|resolvid/.test(n)) return 'concluido'
  if (/backlog|refin|pronto|to do|a fazer/.test(n)) return 'backlog'
  return undefined
}

const DE_PIPELINE_INICIATIVA: Partial<Record<keyof PipelineCount, EtapaIniciativa>> = {
  BACKLOG: 'exploracao', 'EM REFINAMENTO': 'exploracao', 'PRONTO PARA EXECUÇÃO': 'exploracao',
  'EM EXPERIMENTAÇÃO': 'experimentacao', 'AGUARDANDO PILOTO': 'aguardando', 'EM PILOTO': 'piloto', 'EM ESCALA': 'escala',
  FINALIZADO: 'concluido', CANCELADO: 'cancelado',
}

const EPIC_CONCLUIDO = new Set(['10003', '10019'])
const EPIC_ANDAMENTO = new Set(['3'])
const EPIC_VALIDACAO = new Set(['10204', '11201'])

interface ConfigBoard { columnConfig?: { columns?: { name?: string; statuses?: { id?: string }[] }[] } }

/** Mapa status → nome da coluna do board, a partir de GET /board/{id}/configuration. */
function colunasDoBoard(config: unknown): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const col of (config as ConfigBoard | undefined)?.columnConfig?.columns ?? []) {
    for (const s of col.statuses ?? []) if (s.id && col.name) mapa.set(s.id, col.name)
  }
  return mapa
}

export interface Classificador {
  iniciativa: (id: string | null | undefined, nome: string | null | undefined) => EtapaIniciativa | undefined
  epic: (id: string | null | undefined, nome: string | null | undefined) => EtapaEpic | undefined
}

export function criarClassificador(configIdeacao?: unknown, configExperimentacao?: unknown): Classificador {
  const colIni = colunasDoBoard(configIdeacao)
  const colEpic = colunasDoBoard(configExperimentacao)
  return {
    iniciativa: (id, nome) => {
      const coluna = id ? colIni.get(id) : undefined
      return etapaIniciativaPorNome(coluna)
        ?? etapaIniciativaPorNome(nome)
        ?? (id && STATUS_PIPELINE[id] ? DE_PIPELINE_INICIATIVA[STATUS_PIPELINE[id]] : undefined)
    },
    epic: (id, nome) => {
      const coluna = id ? colEpic.get(id) : undefined
      return etapaEpicPorNome(coluna)
        ?? etapaEpicPorNome(nome)
        ?? (id && EPIC_CONCLUIDO.has(id) ? 'concluido' : id && EPIC_VALIDACAO.has(id) ? 'validacao' : id && EPIC_ANDAMENTO.has(id) ? 'andamento' : undefined)
    },
  }
}
