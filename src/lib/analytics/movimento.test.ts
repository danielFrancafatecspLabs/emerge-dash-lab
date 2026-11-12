import { describe, expect, it } from 'vitest'
import { avancarFotos, compararFotos, type Foto } from './movimento'

const item = (nome: string, status: string, beneficio = 0, cancelado = false) => ({ nome, status, beneficio, cancelado })
const antes: Foto = {
  lidoEm: '2026-11-10T09:00:00.000Z',
  experimentos: { 'GL-1': item('Um', 'Em andamento', 5_000_000), 'GL-2': item('Dois', 'Cancelado', 9_000_000, true), 'GL-3': item('Três', 'BACKLOG', 1_000_000) },
  iniciativas: { 'GL-100': item('Ideia', 'EM PILOTO') },
}
const depois: Foto = {
  lidoEm: '2026-11-11T09:00:00.000Z',
  // GL-1 concluiu e teve o benefício revisto; GL-2 (cancelado) foi arquivado; GL-4 é novo.
  experimentos: { 'GL-1': item('Um', 'Concluído', 7_000_000), 'GL-3': item('Três', 'BACKLOG', 1_000_000), 'GL-4': item('Quatro', 'BACKLOG', 2_000_000) },
  iniciativas: { 'GL-100': item('Ideia', 'Finalizado') },
}

describe('o que mudou entre duas leituras do Jira', () => {
  it('lista quem entrou, quem saiu e quem mudou de status ou de benefício', () => {
    const m = compararFotos(antes, depois)
    expect(m.mudancas).toEqual([
      { tipo: 'status', entidade: 'experimento', key: 'GL-1', nome: 'Um', de: 'Em andamento', para: 'Concluído' },
      { tipo: 'beneficio', entidade: 'experimento', key: 'GL-1', nome: 'Um', de: 'R$ 5 mi', para: 'R$ 7 mi' },
      { tipo: 'entrou', entidade: 'experimento', key: 'GL-4', nome: 'Quatro', para: 'BACKLOG' },
      { tipo: 'saiu', entidade: 'experimento', key: 'GL-2', nome: 'Dois', de: 'Cancelado' },
      { tipo: 'status', entidade: 'iniciativa', key: 'GL-100', nome: 'Ideia', de: 'EM PILOTO', para: 'Finalizado' },
    ])
  })

  it('o saldo do benefício ignora os cancelados, como o benefício potencial', () => {
    // Antes: 5 + 1 (o cancelado de 9 não conta). Depois: 7 + 1 + 2.
    expect(compararFotos(antes, depois).saldo).toEqual({ experimentos: 0, iniciativas: 0, beneficio: 4_000_000 })
  })

  it('só avança quando a leitura é mais nova: rodar de novo na mesma leitura não perde a anterior', () => {
    const primeira = avancarFotos(null, antes)
    expect(primeira).toEqual({ atual: antes, anterior: null })
    const segunda = avancarFotos(primeira, depois)
    expect(segunda).toEqual({ atual: depois, anterior: antes })
    expect(avancarFotos(segunda, depois)).toBe(segunda)
  })
})
