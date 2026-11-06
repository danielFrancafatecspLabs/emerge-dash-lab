import fs from 'fs'
import path from 'path'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { metasJaClassificadas } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import { montarPortfolio } from '@/lib/portfolio/dados'
import { buildWeeklyData, statusIdsDeExploracao } from '@/lib/weekly'
import { buildSemanalData } from '@/lib/semanal'
import { diretorioDoCache } from '@/lib/cache-dados'
import { experimentosDoSemanal, montarComparativo } from '@/lib/comparativo/montar'
import { verificarConsistencia, type RelatorioConsistencia } from './consistencia'

/**
 * Executa o agente de analytics no servidor: monta cada visão a partir da leitura do Jira, exatamente como as telas
 * montam, confere a consistência entre elas e guarda o último relatório. Não chama a IA (usa as metas já
 * classificadas) e não lê o Jira de novo: usa a leitura do dia.
 */

const arquivo = () => path.join(diretorioDoCache(), 'analytics-consistencia.json')
const INTERVALO_MS = 10 * 60 * 1000
const G = globalThis as typeof globalThis & { __beonAnalyticsEm?: number; __beonAnalyticsRodando?: Promise<RelatorioConsistencia> | null }

export async function rodarAgenteAnalitico(): Promise<RelatorioConsistencia> {
  const raw = await fetchDashboardRaw()
  const entradas = raw.epics.map(e => ({ key: e.key, summary: e.fields.summary, dominio: e.fields.customfield_11987?.value ?? null }))
  const segmentos = await classifySegmentos(entradas)
  // Como a Estratégia e o Portfólio montam:
  const data = buildDashboardData(raw.iniciativas, raw.epics, metasJaClassificadas(), segmentos, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
  // Como o Semanal monta:
  const dataSemanal = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
  const weekly = buildWeeklyData(dataSemanal, raw.epicChangelogs, raw.board2735Config)
  // Como o Comparativo monta:
  const dataComp = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
  const comparativo = montarComparativo({ ...raw, experimentos: experimentosDoSemanal(dataComp, buildWeeklyData(dataComp, raw.epicChangelogs, raw.board2735Config)) })
  const relatorio = verificarConsistencia({
    comparativo,
    data,
    dataSemanal,
    weekly,
    semanal: buildSemanalData(dataSemanal, weekly, raw.epicChangelogs),
    portfolio: montarPortfolio(data, { iniciativa: raw.board2734Config, experimento: raw.board2735Config }, null),
    exploracaoIds: statusIdsDeExploracao(raw.board2735Config),
    board2734Config: raw.board2734Config,
    board2735Config: raw.board2735Config,
  })

  for (const v of relatorio.verificacoes.filter(x => !x.ok)) {
    console.warn(`[analytics] Divergência em "${v.titulo}": ${Object.entries(v.valores).map(([k, n]) => `${k}=${n}`).join(', ')}`)
  }
  if (!relatorio.divergencias) console.log(`[analytics] ${relatorio.verificacoes.length} verificações, todas batem.`)
  try {
    fs.mkdirSync(diretorioDoCache(), { recursive: true })
    fs.writeFileSync(arquivo(), JSON.stringify(relatorio, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[analytics] relatório não gravado:', String(err))
  }
  return relatorio
}

/** O último relatório guardado (ou null). */
export function ultimoRelatorio(): RelatorioConsistencia | null {
  try {
    return JSON.parse(fs.readFileSync(arquivo(), 'utf-8')) as RelatorioConsistencia
  } catch {
    return null
  }
}

/** Roda em segundo plano, no máximo a cada 10 minutos, sem segurar quem chamou. Falhas não afetam as telas. */
export function talvezRodarAgenteAnalitico(agora = Date.now()): void {
  if (G.__beonAnalyticsRodando || agora - (G.__beonAnalyticsEm ?? 0) < INTERVALO_MS) return
  G.__beonAnalyticsEm = agora
  G.__beonAnalyticsRodando = rodarAgenteAnalitico()
  G.__beonAnalyticsRodando
    .catch(err => console.warn('[analytics] agente não rodou:', String(err)))
    .finally(() => { G.__beonAnalyticsRodando = null })
}

/** O relatório mais recente: o da rodada em andamento, o guardado, ou uma rodada nova. */
export async function relatorioAtual(): Promise<RelatorioConsistencia> {
  if (G.__beonAnalyticsRodando) return G.__beonAnalyticsRodando
  const guardado = ultimoRelatorio()
  if (guardado && Date.now() - Date.parse(guardado.geradoEm) < INTERVALO_MS) return guardado
  G.__beonAnalyticsEm = Date.now()
  G.__beonAnalyticsRodando = rodarAgenteAnalitico()
  try { return await G.__beonAnalyticsRodando } finally { G.__beonAnalyticsRodando = null }
}
