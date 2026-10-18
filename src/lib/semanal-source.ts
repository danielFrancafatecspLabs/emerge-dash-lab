import { fetchDashboardRaw } from './jira'
import { buildDashboardData } from './mappers'
import { buildWeeklyData } from './weekly'
import { buildSemanalData, SAMPLE_SEMANAL_DATA, type SemanalData } from './semanal'

/** Dados do deck do Comitê lidos do Jira; sem o Jira, devolve os dados de exemplo (marcados com isSample). */
export async function carregarSemanal(): Promise<SemanalData> {
  try {
    const raw = await fetchDashboardRaw()
    const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
    const weekly = buildWeeklyData(data, raw.epicChangelogs, raw.board2735Config)
    return buildSemanalData(data, weekly)
  } catch (err) {
    console.error('[semanal] usando dados de exemplo — Jira indisponível:', err)
    return { ...SAMPLE_SEMANAL_DATA, geradoEm: new Date().toISOString() }
  }
}
