import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import StageDetalhesSlides from '@/components/weekly/StageDetalhesSlides'
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

describe('StageDetalhesSlides', () => {
  it('renders the blocked reason column for cancelled stages even when the stage id is normalized', () => {
    const html = renderToStaticMarkup(
      createElement(StageDetalhesSlides, {
        stageId: 'cancelado',
        stageLabel: 'Cancelados',
        rows: [
          {
            key: 'GL-123',
            nome: 'Experimento cancelado',
            objetivo: 'Objetivo de teste',
            fase: 'Cancelado',
            statusId: '10015',
            statusNome: 'Cancelado',
            sponsor: 'Sponsor A',
            dominio: 'Digital',
            beneficioLabel: 'R$ 0,0 MM',
            prioridade: null,
            timeResponsavel: 'BeOn Labs',
            duedate: null,
            motivoBloqueio: 'Falta de engajamento do BO',
          },
        ],
      })
    )

    expect(html).toContain('Motivo de bloqueio')
    expect(html).toContain('Falta de engajamento do BO')
  })
})
