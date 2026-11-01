import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _limparMemoria } from '@/lib/cache-dados'
import { fotoGuardada, lerFontes, papersDaArea } from './pesquisa-ia-fontes'

let dir: string
let chamadas: string[]

const FOTO = 'https://upload.wikimedia.org/hinton.jpg'
const BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])

function fonteFalsa({ tipoDaFoto = 'image/jpeg', wikiFora = false } = {}) {
  return vi.fn(async (url: string) => {
    chamadas.push(url)
    if (url.includes('/api/query')) {
      return new Response(url.includes('quant-ph')
        ? '<feed><entry><id>http://arxiv.org/abs/2511.00042v1</id><title>Logical qubits</title><author><name>A</name></author><published>2026-10-30T00:00:00Z</published></entry></feed>'
        : '<feed></feed>')
    }
    if (url.includes('/api/daily_papers')) {
      return new Response(JSON.stringify([{ paper: { id: '2510.00001', title: 'Paper', authors: [{ name: 'Geoffrey Hinton' }], upvotes: 9 } }]))
    }
    if (url.includes('/page/summary/')) {
      if (wikiFora) return new Response('', { status: 503 })
      return url.endsWith('Geoffrey_Hinton')
        ? new Response(JSON.stringify({ thumbnail: { source: FOTO }, content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Geoffrey_Hinton' } } }))
        : new Response(JSON.stringify({ title: 'sem foto' }))
    }
    if (url === FOTO) return new Response(BYTES, { headers: { 'content-type': tipoDaFoto } })
    return new Response('', { status: 404 })
  })
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pesquisa-ia-'))
  process.env.JIRA_CACHE_DIR = dir
  process.env.RADAR_ARXIV_INTERVALO_MS = '0'
  chamadas = []
  _limparMemoria()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fs.rmSync(dir, { recursive: true, force: true })
  delete process.env.JIRA_CACHE_DIR
})

describe('Pesquisa em IA: leitura das fontes', () => {
  it('lê destaques e fotos; sem foto na Wikipedia, fica sem foto', async () => {
    vi.stubGlobal('fetch', fonteFalsa())
    const d = await lerFontes()
    expect(d.destaques.map(p => p.id)).toEqual(['2510.00001'])
    expect(d.fotos.hinton?.url).toBe(FOTO)
    expect(d.fotos.lecun).toBeNull()
    expect(d.fontes.find(f => f.nome === 'Wikipedia')?.ok).toBe(true)
  })

  it('com a Wikipedia fora do ar, não grava "sem foto" e tenta de novo na próxima leitura', async () => {
    vi.stubGlobal('fetch', fonteFalsa({ wikiFora: true }))
    const d = await lerFontes()
    expect(d.fotos).toEqual({})
    expect(d.fotosEm).toBeNull()
    vi.stubGlobal('fetch', fonteFalsa())
    const d2 = await lerFontes(d)
    expect(d2.fotos.hinton?.url).toBe(FOTO)
  })
})

describe('Pesquisa em IA: foto servida pelo app', () => {
  it('baixa a foto uma vez, guarda em disco e serve dali', async () => {
    vi.stubGlobal('fetch', fonteFalsa())
    const f = await fotoGuardada('hinton')
    expect(f?.tipo).toBe('image/jpeg')
    expect(Buffer.compare(f!.bytes, BYTES)).toBe(0)
    const baixadas = chamadas.filter(u => u === FOTO).length
    const de_novo = await fotoGuardada('hinton')
    expect(Buffer.compare(de_novo!.bytes, BYTES)).toBe(0)
    expect(chamadas.filter(u => u === FOTO).length).toBe(baixadas)
    expect(fs.existsSync(path.join(dir, 'pesquisadores', 'hinton.img'))).toBe(true)
  })

  it('recusa o que não é imagem, pesquisador desconhecido e quem não tem foto', async () => {
    vi.stubGlobal('fetch', fonteFalsa({ tipoDaFoto: 'text/html' }))
    expect(await fotoGuardada('hinton')).toBeNull()
    expect(await fotoGuardada('../../etc/passwd')).toBeNull()
    expect(await fotoGuardada('lecun')).toBeNull()
  })
})

describe('Fronteira: papers de cada área', () => {
  it('lê o arXiv da área uma vez e guarda; IA e Futuros não consultam o arXiv por aqui', async () => {
    vi.stubGlobal('fetch', fonteFalsa())
    const r = await papersDaArea('quantica')
    expect(r.papers.map(p => p.id)).toEqual(['2511.00042'])
    expect(chamadas.some(u => decodeURIComponent(u).includes('cat:quant-ph'))).toBe(true)
    const antes = chamadas.length
    await papersDaArea('quantica')
    expect(chamadas.length).toBe(antes)
    expect((await papersDaArea('futuros')).papers).toEqual([])
    expect(chamadas.length).toBe(antes)
  })
})
