import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { comAdaptador, lerArquivoDoApp, pastaDoApp, pastaDoBundle, versaoDoApp } from './app-files'

describe('arquivos do app OSINT', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'osint-app-'))
    mkdirSync(path.join(dir, 'release', 'assets'), { recursive: true })
    writeFileSync(path.join(dir, 'release', 'index.html'), '<html><head><title>x</title></head><body>nova versão</body></html>')
    writeFileSync(path.join(dir, 'release', '.osint-revision'), 'abc1234def\n')
    writeFileSync(path.join(dir, 'release', 'assets', 'app-abc.js'), 'console.log(1)')
    writeFileSync(path.join(dir, 'segredo.txt'), 'não pode sair')
    symlinkSync(path.join(dir, 'release'), path.join(dir, 'current'))
  })
  afterEach(() => {
    delete process.env.OSINT_APP_DIR
    delete process.env.OSINT_DEPLOY_STATUS
    rmSync(dir, { recursive: true, force: true })
  })

  it('usa a versão publicada pelo deploy quando existe e a cópia do código quando não', () => {
    expect(pastaDoApp()).toBe(pastaDoBundle())
    process.env.OSINT_APP_DIR = path.join(dir, 'current')
    expect(pastaDoApp()).toBe(path.join(dir, 'release'))
    expect(lerArquivoDoApp([])?.corpo.toString()).toContain('nova versão')
    expect(lerArquivoDoApp(['assets', 'app-abc.js'])).toMatchObject({ tipo: 'text/javascript; charset=utf-8', imutavel: true })
    expect(lerArquivoDoApp(['index.html'])?.imutavel).toBe(false)
  })

  it('não sai da pasta do app', () => {
    process.env.OSINT_APP_DIR = path.join(dir, 'current')
    expect(lerArquivoDoApp(['..', 'segredo.txt'])).toBeNull()
    expect(lerArquivoDoApp(['%2e%2e', 'segredo.txt'])).toBeNull()
    expect(lerArquivoDoApp(['assets', 'nao-existe.js'])).toBeNull()
    expect(lerArquivoDoApp(['index.php'])).toBeNull()
  })

  it('a cópia do código tem o index.html', () => {
    expect(lerArquivoDoApp([], pastaDoBundle())?.tipo).toBe('text/html; charset=utf-8')
  })

  it('o index.html sai com o adaptador antes de qualquer script do app, e o adaptador é servido', () => {
    process.env.OSINT_APP_DIR = path.join(dir, 'current')
    const html = lerArquivoDoApp([])!.corpo.toString()
    expect(html).toMatch(/^<html><head><script src="\.\/__jira-embed\.js"><\/script><title>/)
    expect(comAdaptador(html)).toBe(html)
    expect(comAdaptador('<p>sem head</p>')).toBe('<script src="./__jira-embed.js"></script><p>sem head</p>')
    const adaptador = lerArquivoDoApp(['__jira-embed.js'])
    expect(adaptador?.tipo).toBe('text/javascript; charset=utf-8')
    expect(adaptador?.corpo.toString()).toContain("'/jira/api/osint/data/'")
  })

  it('o adaptador leva /data e /api da própria origem para as rotas do Jira Viewer', async () => {
    const chamadas: string[] = []
    const janela = {
      location: { href: 'https://host/jira/osint-app/index.html', origin: 'https://host' },
      fetch: (u: unknown) => { chamadas.push(String(u)); return Promise.resolve() },
    } as Record<string, unknown>
    class XHR { open(...a: unknown[]) { chamadas.push(`xhr ${String(a[1])}`) } }
    const lerAdaptador = (await import('./app-files')).ADAPTADOR
    new Function('window', 'location', 'XMLHttpRequest', 'URL', lerAdaptador)(janela, janela.location, XHR, URL)
    const f = janela.fetch as (u: string) => Promise<void>
    await f('/data/signals.geojson')
    await f('/api/health?x=1')
    await f('/jira/api/osint/data/graph.json')
    await f('https://outro.site/data/x')
    new XHR().open('GET', '/data/graph.json')
    expect(chamadas).toEqual([
      '/jira/api/osint/data/signals.geojson', '/jira/api/osint/health?x=1', '/jira/api/osint/data/graph.json',
      'https://outro.site/data/x', 'xhr /jira/api/osint/data/graph.json',
    ])
  })

  it('informa a versão no ar e o último status do deploy', () => {
    expect(versaoDoApp().origem).toBe('embutida')
    process.env.OSINT_APP_DIR = path.join(dir, 'current')
    process.env.OSINT_DEPLOY_STATUS = path.join(dir, 'status.json')
    writeFileSync(process.env.OSINT_DEPLOY_STATUS, JSON.stringify({ checkedAt: '2026-11-03T10:00:00Z', result: 'error', step: 'build', targetSha: 'f', activeSha: 'a', message: 'Node 18 é antigo' }))
    const v = versaoDoApp()
    expect(v).toMatchObject({ origem: 'publicada', revisao: 'abc1234def', deploy: { result: 'error', step: 'build', message: 'Node 18 é antigo' } })
    writeFileSync(process.env.OSINT_DEPLOY_STATUS, '{quebrado')
    expect(versaoDoApp().deploy).toBeNull()
  })
})
