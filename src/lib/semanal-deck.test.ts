import { describe, expect, it } from 'vitest'
import { SAMPLE_SEMANAL_DATA } from './semanal'
import { ateLabel, fraseDestaque, LINHAS_POR_PAGINA, montarPaginas, pctUmaCasa, periodoLabel, sequenciasDeLab } from './semanal-deck'

describe('estrutura do deck da Semanal', () => {
  const data = { ...SAMPLE_SEMANAL_DATA, geradoEm: '2026-10-18T10:00:00.000Z' }
  const paginas = montarPaginas(data)

  it('segue a ordem do Comitê: capa, objetivo, visão geral, seções e encerramento', () => {
    expect(paginas.slice(0, 5).map(p => p.tipo)).toEqual(['capa', 'objetivo', 'resumo', 'governanca', 'cancelamento'])
    expect(paginas[5].tipo).toBe('divisor')
    expect(paginas[paginas.length - 1].tipo).toBe('obrigado')
    expect(periodoLabel(data.geradoEm)).toBe('Outubro de 2026')
    expect(ateLabel(data.geradoEm)).toBe('até out/26')
  })

  it('pagina cada lista e marca a primeira página de cada seção como destino dos DETALHES', () => {
    for (const secao of data.secoes) {
      const listas = paginas.filter(p => p.tipo === 'lista' && p.secao === secao.id)
      expect(listas).toHaveLength(Math.max(1, Math.ceil(secao.rows.length / LINHAS_POR_PAGINA[secao.id])))
      expect(listas[0].anchor).toBe(secao.id)
      expect(listas.slice(1).every(p => !p.anchor)).toBe(true)
    }
    expect(new Set(paginas.map(p => p.key)).size).toBe(paginas.length)
  })

  it('omite o slide de cancelamento quando não há cancelados', () => {
    const vazio = { ...data, cancelamento: { total: 0, motivos: [], destaque: null } }
    expect(montarPaginas(vazio).some(p => p.tipo === 'cancelamento')).toBe(false)
  })

  it('escreve o destaque dos cancelamentos como no deck', () => {
    expect(pctUmaCasa(86.4)).toBe('86,4%')
    expect(fraseDestaque(data.cancelamento)).toBe(
      'dos cancelamentos concentram-se em inatividade do ponto focal e direcionado para outra área')
  })

  it('agrupa linhas consecutivas do mesmo laboratório', () => {
    const rows = ['A', 'A', 'B', 'A'].map((lab, i) => ({ ...data.secoes[0].rows[0], key: `K-${i}`, lab }))
    expect(sequenciasDeLab(rows)).toEqual([{ lab: 'A', ini: 0, fim: 1 }, { lab: 'B', ini: 2, fim: 2 }, { lab: 'A', ini: 3, fim: 3 }])
  })
})
