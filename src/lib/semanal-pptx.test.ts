import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { SAMPLE_SEMANAL_DATA } from './semanal'
import { montarPaginas } from './semanal-deck'
import { gerarPptxSemanal } from './semanal-pptx'

describe('PPTX editável da Semanal', () => {
  it('gera um slide por página do deck, com textos editáveis e links internos', async () => {
    const data = { ...SAMPLE_SEMANAL_DATA, geradoEm: '2026-10-18T10:00:00.000Z' }
    const zip = await JSZip.loadAsync(await gerarPptxSemanal(data))
    const slides = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    expect(slides).toHaveLength(montarPaginas(data).length)

    const xml = (n: number) => zip.file(`ppt/slides/slide${n}.xml`)!.async('string')
    expect(await xml(1)).toContain('Outubro de 2026')
    const resumo = await xml(3)
    expect(resumo).toContain(String(data.resumo.totalExperimentos))
    expect(resumo).toContain('DETALHES')
    expect(resumo).toContain('ppaction://hlinksldjump')
    // Logo depois da visão geral, os motivos de cancelamento.
    const cancelamento = await xml(4)
    expect(cancelamento).toContain('Principais motivos de cancelamento dos Experimentos')
    expect(cancelamento).toContain(data.cancelamento.motivos[0].motivo)
    const primeiraLista = montarPaginas(data).findIndex(p => p.tipo === 'lista') + 1
    const lista = await xml(primeiraLista)
    expect(lista).toContain(data.secoes[0].rows[0].nome)
    // A seta de voltar de cada lista aponta para a visão geral (slide 3).
    const rels = await zip.file(`ppt/slides/_rels/slide${primeiraLista}.xml.rels`)!.async('string')
    expect(rels).toContain('slide3.xml')
  }, 60000)
})
