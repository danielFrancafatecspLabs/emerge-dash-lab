import { describe, expect, it } from 'vitest'
import { resolveMotivoBloqueio } from './weekly'

describe('resolveMotivoBloqueio', () => {
  it('prefers the mapped CSV reason for cancelled epics by title match', () => {
    expect(resolveMotivoBloqueio('Agente para Treinamento Comercial', null)).toContain('Dados & IA')
    expect(resolveMotivoBloqueio('Leads PME - 2º Ciclo', null)).toContain('Neoway')
  })

  it('falls back to the Jira reason when there is no CSV match', () => {
    expect(resolveMotivoBloqueio('Experimento sem csv', 'Falta de engajamento do BO')).toBe('Falta de engajamento do BO')
  })
})
