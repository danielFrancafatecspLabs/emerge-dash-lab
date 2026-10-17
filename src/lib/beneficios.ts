import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'

export type StatusValidacao = 'nao_validado' | 'em_validacao' | 'validado' | 'rejeitado'

export interface HistoricoEntrada {
  data: string
  autor: string
  acao: string
  detalhe?: string
}

export interface ValidacaoBeneficio {
  epicKey: string
  statusValidacao: StatusValidacao
  beneficioValidado: number | null
  observacoes: string | null
  validadoPor: string | null
  dataValidacao: string | null
  historico: HistoricoEntrada[]
  atualizadoEm: string
}

export type ValidacoesMap = Record<string, ValidacaoBeneficio>

function getBeneficiosFilePath(): string {
  return jsonStorePath('BENEFICIOS_FILE_PATH', 'beneficios.json')
}

export function loadValidacoes(): ValidacoesMap {
  return readJsonStore<ValidacoesMap>(getBeneficiosFilePath(), {})
}

function saveValidacoes(map: ValidacoesMap): void {
  writeJsonStore(getBeneficiosFilePath(), map)
}

const STATUS_LABEL: Record<StatusValidacao, string> = {
  nao_validado: 'marcou como Não Validado',
  em_validacao: 'marcou como Em Validação',
  validado: 'validou o benefício',
  rejeitado: 'rejeitou o benefício',
}

export interface PatchValidacao {
  statusValidacao?: StatusValidacao
  beneficioValidado?: number | null
  observacoes?: string | null
}

/**
 * Aplica um patch parcial à validação de um Epic, criando o registro se não
 * existir, e anexando uma entrada no histórico de auditoria.
 */
export function upsertValidacao(epicKey: string, patch: PatchValidacao, autor: string): ValidacaoBeneficio {
  const map = loadValidacoes()
  const now = new Date().toISOString()

  const atual: ValidacaoBeneficio = map[epicKey] ?? {
    epicKey,
    statusValidacao: 'nao_validado',
    beneficioValidado: null,
    observacoes: null,
    validadoPor: null,
    dataValidacao: null,
    historico: [],
    atualizadoEm: now,
  }

  const historico = [...atual.historico]

  if (patch.statusValidacao !== undefined && patch.statusValidacao !== atual.statusValidacao) {
    historico.push({ data: now, autor, acao: STATUS_LABEL[patch.statusValidacao] })
  }
  if (patch.beneficioValidado !== undefined && patch.beneficioValidado !== atual.beneficioValidado) {
    historico.push({
      data: now, autor, acao: 'atualizou o valor validado',
      detalhe: patch.beneficioValidado === null ? 'removido' : `R$ ${patch.beneficioValidado.toLocaleString('pt-BR')}`,
    })
  }
  if (patch.observacoes !== undefined && patch.observacoes !== atual.observacoes) {
    historico.push({ data: now, autor, acao: 'atualizou as observações' })
  }

  const atualizado: ValidacaoBeneficio = {
    ...atual,
    ...patch,
    validadoPor: patch.statusValidacao === 'validado' ? autor : atual.validadoPor,
    dataValidacao: patch.statusValidacao === 'validado' ? now : atual.dataValidacao,
    historico,
    atualizadoEm: now,
  }

  map[epicKey] = atualizado
  saveValidacoes(map)
  return atualizado
}
