import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChangelogEntry } from './jira'
import { buildDashboardData, buildMonitoramentoData } from './mappers'
import type { JiraIssue } from './types'
import { buildWeeklyData } from './weekly'

const epic = (key: string, status: [string, string], created: string): JiraIssue =>
  ({ key, fields: { summary: `Experimento ${key}`, status: { id: status[0], name: status[1] }, issuetype: { name: 'Epic' }, created } }) as unknown as JiraIssue
const concluiu = (data: string): ChangelogEntry[] => [{
  created: `${data}T12:00:00.000-0300`,
  items: [{ field: 'status', fieldId: 'status', fromString: 'EM VALIDAÇÃO', toString: 'Concluído', to: '10019' } as ChangelogEntry['items'][number]],
}]

const CONCLUIDO: [string, string] = ['10019', 'Concluído']

describe('Crescimento da Experimentação (aba Estratégia)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-24T12:00:00Z')) })
  afterEach(() => vi.useRealTimers())

  it('termina no mesmo total de concluídos do Semanal, mesmo com experimentos criados antes do período', () => {
    const epics = [
      epic('GL-1', CONCLUIDO, '2024-06-01T10:00:00.000-0300'),       // concluído antes dos últimos 12 meses
      epic('GL-2', CONCLUIDO, '2026-01-10T10:00:00.000-0300'),
      epic('GL-3', CONCLUIDO, '2023-05-01T10:00:00.000-0300'),       // criado há anos, concluído no período
      epic('GL-4', ['10003', 'FINALIZADO'], '2026-02-01T10:00:00.000-0300'), // fora da regra do Semanal
      epic('GL-5', ['10015', 'Cancelado'], '2026-03-01T10:00:00.000-0300'),
    ]
    const logs = { 'GL-1': concluiu('2025-03-10'), 'GL-2': concluiu('2026-09-05'), 'GL-3': concluiu('2026-08-20') }
    const data = buildDashboardData([], epics, {}, {}, undefined, logs)
    const semanal = buildWeeklyData(data, logs).experimentosConcluidos

    const m = buildMonitoramentoData(data, { tipo: 'ultimos12' }, data.allEpics)
    expect(semanal).toBe(3)
    expect(m.burnup.realizado[m.burnup.realizado.length - 1].valor).toBe(semanal)
    expect(m.burnup.anteriores).toBe(1)
    expect(m.burnup.noPeriodo).toBe(2)
    expect(m.experimentosConcluidos).toBe(2)
    // GL-3 entra em agosto/2026, pela data de conclusão (não pela de criação).
    const ago = m.burnup.realizado.find(p => p.ano === 2026 && p.mes.toLowerCase().startsWith('ago'))!
    expect(ago.epics!.map(e => e.key)).toContain('GL-3')
  })
})
