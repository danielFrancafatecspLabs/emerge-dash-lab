import fs from 'fs'
import path from 'path'
import { diretorioDoCache } from '@/lib/cache-dados'
import type { RelatorioConsistencia } from './consistencia'
import {
  conferirResposta, decidirGeracao, diaEmSaoPaulo, montarPedido, type Decisao, type LeituraGuardada, type Tentativas,
} from './leitura-ia'

/**
 * A leitura da IA no servidor: chama a IA (proxy LiteLLM, o mesmo das outras funções de IA do app) no máximo uma vez
 * por dia, depois da primeira auditoria do dia, e guarda o resultado em disco. Quem abre o Auditor lê o arquivo; a IA
 * não é chamada na abertura da página.
 */

const arquivoDaLeitura = () => path.join(diretorioDoCache(), 'auditor-leitura-ia.json')
const arquivoDasTentativas = () => path.join(diretorioDoCache(), 'auditor-leitura-ia-tentativas.json')
const G = globalThis as typeof globalThis & { __beonLeituraIA?: Promise<void> | null }

const ler = <T>(arq: string): T | null => {
  try { return JSON.parse(fs.readFileSync(arq, 'utf-8')) as T } catch { return null }
}
const gravar = (arq: string, valor: unknown) => {
  fs.mkdirSync(diretorioDoCache(), { recursive: true })
  fs.writeFileSync(arq, JSON.stringify(valor, null, 2), 'utf-8')
}

export const iaConfigurada = () => !!(process.env.LLM_API_KEY && process.env.LLM_API_BASE) && process.env.AUDITOR_IA !== '0'

export type EstadoDaLeitura =
  | { estado: 'pronta'; leitura: LeituraGuardada; deHoje: boolean }
  | { estado: 'gerando' }
  | { estado: 'sem-ia' }
  | { estado: 'aguardando'; motivo: Exclude<Decisao, { gerar: true }>['motivo'] | 'primeira-auditoria'; erro?: string; anterior?: LeituraGuardada }

/** O que a página mostra: a leitura guardada (a de hoje ou, enquanto a de hoje não sai, a de ontem) e o porquê. */
export function estadoDaLeitura(agora = new Date()): EstadoDaLeitura {
  if (!iaConfigurada()) return { estado: 'sem-ia' }
  if (G.__beonLeituraIA) return { estado: 'gerando' }
  const guardada = ler<LeituraGuardada>(arquivoDaLeitura())
  const deHoje = guardada?.dia === diaEmSaoPaulo(agora)
  if (guardada && deHoje) return { estado: 'pronta', leitura: guardada, deHoje: true }
  const tentativas = ler<Tentativas>(arquivoDasTentativas())
  const d = decidirGeracao({ agora, iaConfigurada: true, guardada, tentativas })
  const motivo = d.gerar ? 'primeira-auditoria' as const : d.motivo
  const erro = tentativas?.dia === diaEmSaoPaulo(agora) ? tentativas.erro : undefined
  // A de ontem continua visível (marcada como anterior) enquanto a de hoje não sai.
  if (guardada) return { estado: 'pronta', leitura: guardada, deHoje: false }
  return { estado: 'aguardando', motivo, ...(erro ? { erro } : {}) }
}

/** Chama a IA com o relatório e devolve o texto da resposta. Separado para os testes trocarem por uma IA de mentira. */
export type ChamarIA = (mensagens: ReturnType<typeof montarPedido>) => Promise<{ texto: string; modelo: string }>

const chamarLiteLLM: ChamarIA = async mensagens => {
  const { getLiteLLMClient, DEPLOYMENT_LLM } = await import('@/lib/llm')
  const res = await getLiteLLMClient().chat.completions.create({
    model: DEPLOYMENT_LLM,
    messages: mensagens,
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  }, { timeout: 60_000 })
  return { texto: res.choices[0]?.message?.content ?? '', modelo: res.model || DEPLOYMENT_LLM }
}

/**
 * Gera a leitura do dia se ainda não foi gerada (uma por dia; se falhar, até 3 tentativas no dia, com 2 horas entre
 * elas). Roda em segundo plano depois da auditoria e nunca derruba o Auditor.
 */
export async function gerarLeituraDoDia(rel: RelatorioConsistencia, o: { agora?: Date; chamar?: ChamarIA } = {}): Promise<LeituraGuardada | null> {
  const agora = o.agora ?? new Date()
  const hoje = diaEmSaoPaulo(agora)
  const guardada = ler<LeituraGuardada>(arquivoDaLeitura())
  const tentativas = ler<Tentativas>(arquivoDasTentativas())
  if (!decidirGeracao({ agora, iaConfigurada: !!o.chamar || iaConfigurada(), guardada, tentativas }).gerar) return null

  const vezes = (tentativas?.dia === hoje ? tentativas.vezes : 0) + 1
  try {
    const { texto, modelo } = await (o.chamar ?? chamarLiteLLM)(montarPedido(rel))
    const { leitura, descartados } = conferirResposta(texto, rel)
    const nova: LeituraGuardada = { dia: hoje, geradaEm: agora.toISOString(), modelo, auditoriaDe: rel.geradoEm, leitura, descartados }
    gravar(arquivoDaLeitura(), nova)
    gravar(arquivoDasTentativas(), { dia: hoje, vezes, ultimaEm: agora.toISOString() } satisfies Tentativas)
    console.log(`[auditor] leitura da IA gerada (${modelo}): ${leitura.pontos.length} pontos${descartados ? `, ${descartados} descartados na conferência` : ''}`)
    return nova
  } catch (err) {
    const erro = String(err instanceof Error ? err.message : err).slice(0, 200)
    try { gravar(arquivoDasTentativas(), { dia: hoje, vezes, ultimaEm: agora.toISOString(), erro } satisfies Tentativas) } catch { /* sem disco */ }
    console.warn(`[auditor] leitura da IA falhou (tentativa ${vezes}):`, erro)
    return null
  }
}

/** Dispara a geração em segundo plano, sem segurar quem chamou e sem rodar duas ao mesmo tempo. */
export function talvezGerarLeitura(rel: RelatorioConsistencia): void {
  if (G.__beonLeituraIA || !iaConfigurada()) return
  G.__beonLeituraIA = gerarLeituraDoDia(rel).then(() => undefined, () => undefined).finally(() => { G.__beonLeituraIA = null })
}
