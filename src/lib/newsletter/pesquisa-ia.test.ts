import { describe, expect, it } from 'vitest'
import type { Edicao, Noticia } from './edicao'
import {
  PESQUISADORES, citaPesquisador, compartilhamentosDe, consultaDosPesquisadores, ehAutor, fotoDaWikipedia, lerArxiv, montarPainel,
  normalizarNome, papersDoHuggingFace, papersPorPesquisador, type DadosDePesquisa, type Paper,
} from './pesquisa-ia'

const AGORA = Date.parse('2026-11-01T12:00:00Z')
const dias = (n: number) => new Date(AGORA - n * 86_400_000).toISOString()
const pq = (id: string) => PESQUISADORES.find(p => p.id === id)!

const entrada = (id: string, titulo: string, autores: string[], publicado: string) => `
  <entry>
    <id>http://arxiv.org/abs/${id}v2</id>
    <published>${publicado}</published>
    <title>${titulo}</title>
    <summary>  Resumo de ${titulo}.  </summary>
    ${autores.map(a => `<author><name>${a}</name></author>`).join('')}
    <link href="http://arxiv.org/abs/${id}v2" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/${id}v2" rel="related" type="application/pdf"/>
    <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.LG" scheme="http://arxiv.org/schemas/atom"/>
  </entry>`

const paper = (id: string, autores: string[], publicadoEm: string | null, extra: Partial<Paper> = {}): Paper => ({
  id, titulo: `Paper ${id}`, resumo: '', autores, link: `https://arxiv.org/abs/${id}`, pdf: null, publicadoEm, categoria: null, ...extra,
})

const noticia = (titulo: string, resumo = ''): Noticia => ({
  id: titulo, titulo, resumo, link: `https://ex.com/${encodeURIComponent(titulo)}`, fonte: 'BBC', publicadoEm: dias(0.2), imagem: null, secao: 'emergentes',
})

const dados = (over: Partial<DadosDePesquisa> = {}): DadosDePesquisa => ({
  papers: {}, arxivDesde: dias(60), destaques: [], destaquesFonte: 'huggingface', fotos: {}, fotosEm: dias(1),
  atualizadoEm: dias(0), fontes: [], ...over,
})

describe('Pesquisa em IA: nomes', () => {
  it('reconhece o autor com ou sem a inicial do meio e sem diferenciar acentos', () => {
    expect(normalizarNome('Geoffrey E. Hinton')).toBe('geoffrey hinton')
    expect(ehAutor(pq('hinton'), 'Geoffrey E. Hinton')).toBe(true)
    expect(ehAutor(pq('ng'), 'Andrew Y. Ng')).toBe(true)
    expect(ehAutor(pq('lecun'), 'Yann Lecun')).toBe(true)
    expect(ehAutor(pq('feifei'), 'Li Fei-Fei')).toBe(true)
  })

  it('não confunde homônimos parciais', () => {
    expect(ehAutor(pq('hinton'), 'Geoffrey Hinton-Smith')).toBe(false)
    expect(ehAutor(pq('ng'), 'Andrew Ngo')).toBe(false)
    expect(ehAutor(pq('feifei'), 'Fei Li')).toBe(false)
  })

  it('acha o pesquisador citado na notícia pelo nome (ou pelo sobrenome inconfundível)', () => {
    expect(citaPesquisador(pq('hinton'), 'Hinton alerta para riscos da IA')).toBe(true)
    expect(citaPesquisador(pq('lecun'), 'Yann LeCun deixa a Meta e funda startup')).toBe(true)
    expect(citaPesquisador(pq('ng'), 'A DeepLearning.AI, de Andrew Ng, lança curso')).toBe(true)
    expect(citaPesquisador(pq('ng'), 'Ng é a sigla de gás natural')).toBe(false)
    expect(citaPesquisador(pq('dean'), 'James Dean ganha nova biografia')).toBe(false)
  })

  it('consulta todos os nomes de uma vez no arXiv', () => {
    const q = consultaDosPesquisadores()
    for (const p of PESQUISADORES) for (const n of p.nomesNoArxiv) expect(q).toContain(`au:"${n}"`)
  })
})

describe('Pesquisa em IA: fontes', () => {
  it('lê o Atom do arXiv: id sem versão, https, autores, PDF e categoria', () => {
    const xml = `<feed>${entrada('2410.01234', 'World models &amp; planning', ['Yann LeCun', 'Ana Souza'], '2026-10-28T10:00:00Z')}</feed>`
    const [p] = lerArxiv(xml)
    expect(p).toMatchObject({
      id: '2410.01234', titulo: 'World models & planning', autores: ['Yann LeCun', 'Ana Souza'], link: 'https://arxiv.org/abs/2410.01234',
      pdf: 'https://arxiv.org/pdf/2410.01234v2', publicadoEm: '2026-10-28T10:00:00.000Z', categoria: 'cs.LG', resumo: 'Resumo de World models & planning.',
    })
  })

  it('distribui os papers por pesquisador, do mais novo ao mais antigo', () => {
    const papers = [paper('1', ['Yoshua Bengio'], dias(30)), paper('2', ['Yoshua Bengio', 'Geoffrey Hinton'], dias(2)), paper('3', ['Outra Pessoa'], dias(1))]
    const r = papersPorPesquisador(papers)
    expect(r.bengio.map(p => p.id)).toEqual(['2', '1'])
    expect(r.hinton.map(p => p.id)).toEqual(['2'])
    expect(r.lecun).toEqual([])
  })

  it('lê o Daily Papers do Hugging Face, do mais votado ao menos votado, e ignora itens quebrados', () => {
    const json = [
      { paper: { id: '2510.00001', title: 'Pouco votado', authors: [{ name: 'A' }], upvotes: 3, publishedAt: dias(1) }, numComments: 1 },
      { paper: { id: '2510.00002', title: 'Mais votado', summary: 'Resumo', authors: [{ name: 'Chelsea Finn' }], upvotes: 120 }, thumbnail: 'https://cdn.hf.co/t.png' },
      { paper: { title: 'Sem id' } },
      'lixo',
    ]
    const r = papersDoHuggingFace(json)
    expect(r.map(p => p.id)).toEqual(['2510.00002', '2510.00001'])
    expect(r[0]).toMatchObject({ votos: 120, link: 'https://arxiv.org/abs/2510.00002', imagem: 'https://cdn.hf.co/t.png', autores: ['Chelsea Finn'] })
    expect(papersDoHuggingFace({ erro: true })).toEqual([])
  })

  it('pega a foto do resumo da Wikipedia (e nada quando a página não tem imagem)', () => {
    expect(fotoDaWikipedia({ thumbnail: { source: 'https://upload.wikimedia.org/x.jpg' }, content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/X' } } }))
      .toEqual({ url: 'https://upload.wikimedia.org/x.jpg', pagina: 'https://en.wikipedia.org/wiki/X' })
    expect(fotoDaWikipedia({ title: 'Sem foto' })).toBeNull()
    expect(fotoDaWikipedia({ thumbnail: { source: 'javascript:alert(1)' } })).toBeNull()
  })
})

describe('Pesquisa em IA: novidades', () => {
  const edicao = { noticias: [noticia('Bengio pede regras globais para a IA')] } as Edicao

  it('marca paper novo (até 14 dias), paper em destaque e citação nas notícias; quem tem novidade sobe', () => {
    const painel = montarPainel(dados({
      papers: { lecun: [paper('a', ['Yann LeCun'], dias(3))], hinton: [paper('b', ['Geoffrey Hinton'], dias(40))] },
      destaques: [paper('c', ['Chelsea Finn', 'X'], dias(1), { votos: 80 })],
    }), edicao, AGORA)

    const de = (id: string) => painel.pesquisadores.find(p => p.id === id)!
    expect(de('lecun').novidades.map(n => n.tipo)).toEqual(['paper'])
    expect(de('finn').novidades.map(n => n.tipo)).toEqual(['destaque'])
    expect(de('bengio').novidades.map(n => n.tipo)).toEqual(['noticia'])
    expect(de('bengio').noticias[0].fonte).toBe('BBC')
    expect(de('hinton').novidades).toEqual([])
    expect(de('hinton').papers).toHaveLength(1)

    const ordem = painel.pesquisadores.map(p => p.id)
    expect(ordem.slice(0, 3).sort()).toEqual(['bengio', 'finn', 'lecun'])
    expect(ordem.indexOf('hinton')).toBeGreaterThan(2)
    expect(painel.diasDeNovidade).toBe(14)
  })

  it('um paper novo que também está nos destaques conta uma vez só', () => {
    const p = paper('a', ['Yann LeCun'], dias(1), { votos: 10 })
    const painel = montarPainel(dados({ papers: { lecun: [p] }, destaques: [p] }), null, AGORA)
    expect(painel.pesquisadores.find(x => x.id === 'lecun')!.novidades.map(n => n.tipo)).toEqual(['paper'])
  })

  it('sem a edição, segue só com o arXiv e os destaques', () => {
    const painel = montarPainel(dados(), null, AGORA)
    expect(painel.pesquisadores).toHaveLength(PESQUISADORES.length)
    expect(painel.pesquisadores.every(p => p.novidades.length === 0 && p.foto === null)).toBe(true)
  })

  it('acha os papers do pesquisador compartilhados na comunidade nos últimos 14 dias', () => {
    const p = { ...pq('lecun'), papers: [paper('2410.01234', ['Yann LeCun'], dias(20))] }
    const posts = [
      { id: 'p1', authorName: 'Ana', title: 'Olhem isso', content: '', linkUrl: 'https://arxiv.org/abs/2410.01234', createdAt: dias(2) },
      { id: 'p2', authorName: 'Bia', title: 'Antigo', content: 'arXiv 2410.01234', linkUrl: '', createdAt: dias(30) },
      { id: 'p3', authorName: 'Caio', title: 'Outro', content: 'https://arxiv.org/abs/2410.012345', linkUrl: '', createdAt: dias(1) },
      { id: 'p4', authorName: 'Davi', title: 'Destaque', content: 'Vejam o 2510.00002', linkUrl: '', createdAt: dias(1) },
    ]
    const destaques = [paper('2510.00002', ['Yann LeCun'], dias(1))]
    expect(compartilhamentosDe(p, destaques, posts, AGORA).map(c => c.postId)).toEqual(['p4', 'p1'])
  })
})
