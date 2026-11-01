import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Edicao, Noticia } from '@/lib/newsletter/edicao'
import { normalizePost } from './model'
import { discussaoDaNoticia } from './noticias-radar'
import { chavesVapid, conteudoDoPush, entrada, inscrever, inscricoesDe, noticiaDaEntrada, validarInscricao, type Inscricao } from './push'

const noticia = (id: string, extra: Partial<Noticia> = {}): Noticia => ({
  id, titulo: `Notícia ${id}`, link: `https://ex.com/${id}`, fonte: 'NYT', publicadoEm: '2026-11-01T10:00:00Z', resumo: 'Resumo',
  imagem: null, secao: 'mercado', ...extra,
})
const edicao = (noticias: Noticia[]): Edicao => ({ numero: 2, data: '2026-11-01', geradoEm: '2026-11-01T09:00:00Z', noticias, fontes: [] })
const sub = (n: number) => ({ endpoint: `https://push.ex.com/${n}`, keys: { p256dh: 'p', auth: 'a' } })
const T0 = Date.parse('2026-11-01T12:00:00Z')

describe('Push do beOn Radar: um por entrada', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'push-'))
    process.env.PUSH_FILE_PATH = path.join(dir, 'push.json')
    process.env.VAPID_KEYS_PATH = path.join(dir, 'vapid.json')
  })
  afterEach(() => {
    delete process.env.PUSH_FILE_PATH; delete process.env.VAPID_KEYS_PATH
    rmSync(dir, { recursive: true, force: true })
  })

  it('manda uma notícia por entrada, nunca duas em 6 horas, e nunca repete a mesma notícia', async () => {
    inscrever('ana', sub(1))
    const enviados: string[] = []
    const enviar = async (_i: Inscricao, carga: string) => { enviados.push(JSON.parse(carga).body.split('\n')[0]) }
    const ed = edicao([noticia('a', { imagem: 'https://img.ex.com/a.jpg' }), noticia('b'), noticia('c')])
    const opc = (agora: number) => ({ querNoticias: true, agora, enviar })
    expect(await entrada('ana', ed, () => null, opc(T0))).toMatchObject({ canal: 'push', noticia: { id: 'a' } })
    expect(await entrada('ana', ed, () => null, opc(T0 + 3600_000))).toEqual({ canal: 'nenhum', motivo: 'recente' })
    expect(await entrada('ana', ed, () => null, opc(T0 + 7 * 3600_000))).toMatchObject({ canal: 'push', noticia: { id: 'b' } })
    expect(enviados).toEqual(['Notícia a', 'Notícia b'])
    expect(await entrada('ana', ed, () => null, { querNoticias: false, agora: T0 + 20 * 3600_000, enviar })).toEqual({ canal: 'nenhum', motivo: 'desligado' })
  })

  it('sem inscrição a notícia vai para o cartão do app; inscrição expirada é apagada', async () => {
    const ed = edicao([noticia('a')])
    expect(await entrada('bia', ed, () => null, { querNoticias: true, agora: T0 })).toMatchObject({ canal: 'app', noticia: { id: 'a' } })
    inscrever('caio', sub(2))
    const r = await entrada('caio', ed, () => null, { querNoticias: true, agora: T0, enviar: async () => { throw Object.assign(new Error('gone'), { statusCode: 410 }) } })
    expect(r.canal).toBe('app')
    expect(inscricoesDe('caio')).toEqual([])
    expect(await entrada('dani', edicao([]), () => null, { querNoticias: true, agora: T0 })).toEqual({ canal: 'nenhum', motivo: 'sem-noticia' })
  })

  it('o conteúdo traz seção, manchete, fonte com repercussão, provocação, foto e o link da discussão', () => {
    const n = noticia('a', { imagem: 'https://img.ex.com/a.jpg', outrasFontes: ['BBC', 'FT'], secao: 'vale' })
    const post = normalizePost(discussaoDaNoticia(n, 'Você apostaria nisso?', new Date(T0)))
    const c = conteudoDoPush(n, post, T0)
    expect(c).toMatchObject({ title: 'beOn Radar · Vale do Silício', image: 'https://img.ex.com/a.jpg', url: '/jira/comunidade/post/radar%3Aa', fonte: 'https://ex.com/a', icon: '/jira/radar-push-icone.png' })
    expect(c.body.split('\n')).toEqual(['Notícia a', 'NYT + 2 veículos · há 2 h', '💬 Você apostaria nisso?'])
    expect(conteudoDoPush(noticia('h', { imagem: 'http://inseguro/x.jpg' }), null, T0).image).toBeUndefined()
    expect(noticiaDaEntrada(edicao([noticia('x'), noticia('y', { imagem: 'https://i/y.jpg' })]), [])!.id).toBe('y')
  })

  it('valida inscrições, passa o navegador para quem entrou nele e gera as chaves VAPID uma vez', () => {
    expect(validarInscricao({ endpoint: 'http://inseguro', keys: { p256dh: 'p', auth: 'a' } })).toBeNull()
    expect(validarInscricao({ endpoint: 'https://ok', keys: { p256dh: 'p' } })).toBeNull()
    inscrever('ana', sub(1)); inscrever('bia', sub(1))
    expect(inscricoesDe('ana')).toEqual([])
    expect(inscricoesDe('bia')).toHaveLength(1)
    const k = chavesVapid()
    expect(k.publicKey.length).toBeGreaterThan(40)
    expect(chavesVapid()).toEqual(k)
  })
})
