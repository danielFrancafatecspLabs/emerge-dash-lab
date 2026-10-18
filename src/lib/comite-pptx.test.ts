import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { SAMPLE_SEMANAL_DATA } from './semanal'
import { montarComiteResumo } from './comite-resumo'
import { gerarPptxComite } from './comite-pptx'

const textosDoSlide = (xml: string) => [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join('|')

async function abrir(buf: Buffer) {
  const zip = await JSZip.loadAsync(buf)
  return {
    slide: await zip.file('ppt/slides/slide3.xml')!.async('string'),
    rels: await zip.file('ppt/slides/_rels/slide3.xml.rels')!.async('string'),
  }
}

describe('PPTX editável do slide do Comitê', () => {
  const view = montarComiteResumo(SAMPLE_SEMANAL_DATA.resumo, '2026-10-18T10:00:00.000Z')

  it('preenche o modelo com os valores atuais, mantendo as formas do deck', async () => {
    const { slide, rels } = await abrir(await gerarPptxComite(view, 'https://portal.exemplo/jira'))
    const t = textosDoSlide(slide)
    expect(t).toContain('até out/26')
    expect(t).toContain(view.beneficioTotal)
    expect(t).toContain(view.piloto.aguardando)
    expect(t).toContain(view.metricas[2].descricao)
    expect(t).toContain('Integridade do Produto 254 milhões')
    expect(t).not.toContain('até set/26')
    expect(slide.match(/prst="blockArc"/g)).toHaveLength(12)
    expect(rels).toContain('https://portal.exemplo/jira/semanal#semanal-escala')
    expect(rels).not.toContain('beonlabs.invalid')
  })

  it('tira o destaque de outlier quando não há, e um arco vazio quando o percentual é zero', async () => {
    const semOutlier = { ...view, piloto: { ...view.piloto, outlier: null }, metricas: view.metricas.map((m, i) => (i === 0 ? { ...m, pct: 0, pctLabel: '0%' } : m)) }
    const { slide, rels } = await abrir(await gerarPptxComite(semOutlier, null))
    expect(textosDoSlide(slide)).not.toContain('Outlier')
    expect(slide.match(/prst="blockArc"/g)).toHaveLength(11)
    expect(slide).not.toContain('hlinkClick')
    expect(rels).not.toContain('hyperlink')
  })
})
