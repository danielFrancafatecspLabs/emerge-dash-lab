import { describe, expect, it } from 'vitest'
import type { JiraIssue } from './types'
import { semArquivadas } from './jira'

const issue = (key: string, archiveddate?: string) => ({ key, fields: { summary: key, ...(archiveddate ? { archiveddate } : {}) } }) as unknown as JiraIssue
const board = Array.from({ length: 20 }, (_, i) => issue(`GL-${i + 1}`))

describe('issues arquivadas no Jira', () => {
  it('saem as que a busca do Jira não acha mais (arquivada não aparece em busca)', () => {
    const naBusca = new Set(board.map(i => i.key).filter(k => k !== 'GL-3' && k !== 'GL-7'))
    const r = semArquivadas(board, naBusca)
    expect(r.arquivadas).toEqual(['GL-3', 'GL-7'])
    expect(r.issues).toHaveLength(18)
  })

  it('saem as que trazem a data de arquivamento', () => {
    const r = semArquivadas([...board, issue('GL-99', '2026-11-05T10:00:00.000-0300')], null)
    expect(r.arquivadas).toEqual(['GL-99'])
  })

  it('sem busca, ou com uma busca que discorda demais do board, nada é descartado', () => {
    expect(semArquivadas(board, null).issues).toHaveLength(20)
    expect(semArquivadas(board, new Set(['GL-1', 'GL-2'])).issues).toHaveLength(20)
    expect(semArquivadas(board, new Set()).issues).toHaveLength(20)
  })
})
