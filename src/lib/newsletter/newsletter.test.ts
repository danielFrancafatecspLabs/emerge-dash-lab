import { describe, expect, it } from 'vitest'
import { classificar, fontesConfiguradas, idiomaDe, montarNoticias, numeroDaEdicao } from './edicao'
import { imagemDaPagina, lerFeed } from './rss'

const RSS = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel>
<item><title><![CDATA[Nvidia stock jumps as AI chip demand soars]]></title><link>https://ex.com/nvidia</link>
<pubDate>Thu, 30 Oct 2026 14:00:00 GMT</pubDate><description>&lt;p&gt;Shares of &amp;quot;Nvidia&amp;quot; rose&lt;/p&gt;</description>
<media:content url="https://img.ex.com/n.jpg" medium="image"/></item>
<item><title>Is the AI bubble about to burst? Investors fear a dot-com repeat</title><link>https://ex.com/bolha</link>
<pubDate>Fri, 31 Oct 2026 08:00:00 GMT</pubDate><enclosure url="http://img.ex.com/b.png" type="image/png"/></item>
<item><title>Receita de bolo de cenoura</title><link>https://ex.com/bolo</link><pubDate>Fri, 31 Oct 2026 09:00:00 GMT</pubDate></item>
<item><title>Old quantum computing record</title><link>https://ex.com/velha</link><pubDate>Mon, 20 Oct 2026 09:00:00 GMT</pubDate></item>
<item><title>Sem link</title></item>
</channel></rss>`

const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Computação quântica: IBM apresenta novo chip</title>
<link rel="alternate" href="https://ex.br/quantica"/><published>2026-10-31T10:00:00Z</published>
<summary type="html">&lt;img src="https://img.ex.br/q.webp"&gt; Novo processador</summary></entry></feed>`

describe('newsletter', () => {
  it('lê RSS e Atom: título, link, data, resumo em texto e imagem (só http/https)', () => {
    const rss = lerFeed(RSS)
    expect(rss).toHaveLength(4)
    expect(rss[0]).toMatchObject({ titulo: 'Nvidia stock jumps as AI chip demand soars', link: 'https://ex.com/nvidia', imagem: 'https://img.ex.com/n.jpg', resumo: 'Shares of "Nvidia" rose', publicadoEm: '2026-10-30T14:00:00.000Z' })
    expect(rss[1].imagem).toBe('http://img.ex.com/b.png')
    expect(lerFeed(ATOM)[0]).toMatchObject({ link: 'https://ex.br/quantica', imagem: 'https://img.ex.br/q.webp', resumo: 'Novo processador' })
    expect(imagemDaPagina('<meta property="og:image" content="https://ex.com/og.jpg">')).toBe('https://ex.com/og.jpg')
    expect(imagemDaPagina('<meta property="og:image" content="javascript:alert(1)">')).toBeNull()
  })

  it('classifica por seção e deixa de fora o que não é do tema', () => {
    expect(classificar('Nvidia stock jumps as AI chip demand soars', 'shares rose, market cap')).toBe('mercado')
    expect(classificar('Is the AI bubble about to burst?', 'investors fear a dot-com repeat')).toBe('bolhas')
    expect(classificar('Computação quântica: IBM apresenta novo chip', '')).toBe('emergentes')
    expect(classificar('AI data centers strain the power grid and water supply', 'energy impact on communities')).toBe('impactos')
    expect(classificar('IBM unveils quantum processor with error correction milestone', '')).toBe('emergentes')
    expect(classificar('Nvidia stock hits record as AI chip demand explodes', 'hyperscalers raised capex guidance; market cap tops $5 trillion')).toBe('mercado')
    expect(classificar('Receita de bolo de cenoura', '')).toBeNull()
    expect(classificar('Ibovespa fecha em alta com bancos', 'ações de bancos sobem')).toBeNull()
    expect(classificar('Anatel prepara leilão de espectro para Open RAN', 'teste de conectividade em redes móveis')).toBe('emergentes')
  })

  it('monta a edição: recentes, sem duplicatas, só do tema', () => {
    const agora = new Date('2026-10-31T12:00:00Z')
    const fonte = { nome: 'Ex', url: 'https://ex.com/feed' }
    const itens = [...lerFeed(RSS), ...lerFeed(RSS)]
    const n = montarNoticias([{ fonte, itens }, { fonte: { nome: 'Br', url: 'https://ex.br' }, itens: lerFeed(ATOM) }], agora)
    expect(n.map(x => x.link).sort()).toEqual(['https://ex.br/quantica', 'https://ex.com/bolha', 'https://ex.com/nvidia'])
    expect(n.find(x => x.link === 'https://ex.com/bolha')?.secao).toBe('bolhas')
  })

  it('reconhece o idioma da notícia', () => {
    expect(idiomaDe('Big techs perdem US$ 800 bilhões em valor de mercado em dia de correção')).toBe('pt')
    expect(idiomaDe('Is the AI bubble about to burst? Investors draw dot-com comparisons')).toBe('en')
    expect(idiomaDe('Computação quântica: IBM apresenta novo chip')).toBe('pt')
  })

  it('fontes configuráveis e número da edição', () => {
    expect(fontesConfiguradas('A|https://a.com/rss, B|https://b.com/feed,lixo')).toEqual([{ nome: 'A', url: 'https://a.com/rss' }, { nome: 'B', url: 'https://b.com/feed' }])
    const padrao = fontesConfiguradas(undefined)
    expect(padrao.length).toBeGreaterThanOrEqual(50)
    expect(new Set(padrao.map(f => f.nome)).size).toBe(padrao.length)
    expect(new Set(padrao.map(f => f.url)).size).toBe(padrao.length)
    expect(padrao.every(f => f.url.startsWith('https://'))).toBe(true)
    expect(padrao.map(f => f.nome)).toEqual(expect.arrayContaining(['Agência Brasil (via Google Notícias)', 'Valor Econômico (via Google Notícias)', 'Teletime', 'Revista Pesquisa FAPESP']))
    expect(numeroDaEdicao(new Date('2026-10-31T10:00:00Z'))).toBe(1)
    expect(numeroDaEdicao(new Date('2026-11-02T10:00:00Z'))).toBe(3)
  })
})
