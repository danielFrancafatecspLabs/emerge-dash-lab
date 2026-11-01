import { describe, expect, it } from 'vitest'
import { classificar, fontesConfiguradas, montarNoticias, MINIMO_POR_TOPICO } from './edicao'
import { TOPICOS_ESPECIAIS, topicosDe } from './topicos'

const AGORA = new Date('2026-11-01T12:00:00Z')
const item = (titulo: string, resumo = '', horas = 2) => ({
  titulo, link: `https://ex.com/${encodeURIComponent(titulo)}`, publicadoEm: new Date(AGORA.getTime() - horas * 3600_000).toISOString(), resumo, imagem: null,
})

describe('Tópicos especiais', () => {
  it('marca a notícia com os tópicos que ela toca (português e inglês)', () => {
    expect(topicosDe('Waymo expands robotaxi service to Miami', '')).toEqual(['carros-autonomos'])
    expect(topicosDe('Carro autônomo da BYD começa testes em São Paulo', '')).toEqual(['carros-autonomos'])
    expect(topicosDe('IBM mostra computador quântico com 1.000 qubits', '')).toEqual(['quantica'])
    expect(topicosDe('Humanoid robots from Figure AI start factory pilot', '')).toContain('robotica')
    expect(topicosDe('Anatel prepara leilão de espectro para o 6G', '')).toEqual(['redes-futuro'])
    expect(topicosDe('Nvidia unveils new AI chip for data centers', '')).toContain('chips')
  })

  it('não confunde palavras do dia a dia com os tópicos', () => {
    expect(topicosDe('Bateria da escola de samba é campeã', '')).toEqual([])
    expect(topicosDe('Leo Messi marca dois gols', '')).toEqual([])
    expect(topicosDe('Pesquisa sobre o espectro autista ganha prêmio', '')).toEqual([])
    expect(classificar('Bateria da escola de samba é campeã', '')).toBeNull()
  })

  it('cada tópico tem busca própria nas fontes e a edição garante um mínimo por tópico', () => {
    const fontes = fontesConfiguradas(undefined)
    for (const t of TOPICOS_ESPECIAIS) expect(fontes.some(f => f.nome.startsWith(`Tópico ${t.nome}`))).toBe(true)
    expect(new Set(fontes.map(f => f.nome)).size).toBe(fontes.length)

    // Uma fonte com muitas notícias de IA (que lotam a seção) e poucas de carros autônomos com peso baixo.
    const ia = Array.from({ length: 30 }, (_, i) => item(`OpenAI and Nvidia AI chip market rally stock deal number ${i} ${'x'.repeat(i)}`, 'shares revenue valuation', 1))
    const carros = [
      'Waymo expands robotaxi service to Miami', 'Zoox begins driverless rides in Las Vegas', 'Baidu Apollo scales autonomous driving in Wuhan',
      'Carro autônomo da BYD começa testes em São Paulo', 'Tesla FSD gets approval in Europe', 'Wayve raises funds for self-driving software',
    ].map(t => item(t, '', 60))
    const n = montarNoticias([{ fonte: { nome: 'A', url: 'x' }, itens: ia }, { fonte: { nome: 'B', url: 'x' }, itens: carros }], AGORA, 12)
    expect(n.filter(x => x.topicos?.includes('carros-autonomos')).length).toBeGreaterThanOrEqual(MINIMO_POR_TOPICO)
  })
})
