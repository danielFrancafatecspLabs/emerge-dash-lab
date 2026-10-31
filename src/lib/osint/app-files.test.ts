import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { lerArquivoDoApp, pastaDoApp, pastaDoBundle } from './app-files'

describe('arquivos do app OSINT', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'osint-app-'))
    mkdirSync(path.join(dir, 'release', 'assets'), { recursive: true })
    writeFileSync(path.join(dir, 'release', 'index.html'), '<html>nova versão</html>')
    writeFileSync(path.join(dir, 'release', 'assets', 'app-abc.js'), 'console.log(1)')
    writeFileSync(path.join(dir, 'segredo.txt'), 'não pode sair')
    symlinkSync(path.join(dir, 'release'), path.join(dir, 'current'))
  })
  afterEach(() => {
    delete process.env.OSINT_APP_DIR
    rmSync(dir, { recursive: true, force: true })
  })

  it('usa a versão publicada pelo deploy quando existe e a cópia do código quando não', () => {
    expect(pastaDoApp()).toBe(pastaDoBundle())
    process.env.OSINT_APP_DIR = path.join(dir, 'current')
    expect(pastaDoApp()).toBe(path.join(dir, 'release'))
    expect(lerArquivoDoApp([])?.corpo.toString()).toBe('<html>nova versão</html>')
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
})
