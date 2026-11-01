import { fetchDashboardRaw } from './jira'
import { buildDashboardData } from './mappers'
import { buildWeeklyData } from './weekly'
import { buildSemanalData, type SemanalData } from './semanal'

/** Dados do deck do Comitê, da leitura diária do Jira. Sem o Jira (e sem leitura guardada), o erro sobe. */
export async function carregarSemanal(): Promise<SemanalData> {
  const raw = await fetchDashboardRaw()
  const data = buildDashboardData(raw.iniciativas, raw.epics, {}, {}, raw.board2734Config)
  const weekly = buildWeeklyData(data, raw.epicChangelogs, raw.board2735Config)
  return buildSemanalData(data, weekly, raw.epicChangelogs)
}
