import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _limparMemoria, comCache, invalidarCache } from './cache-dados'

const OPCOES = { frescoPorMs: 60_000, maximoObsoletoMs: 3_600_000 }
let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-dados-'))
  process.env.JIRA_CACHE_DIR = dir
  _limparMemoria()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-24T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  delete process.env.JIRA_CACHE_DIR
  fs.rmSync(dir, { recursive: true, force: true })
})

const avancar = (ms: number) => vi.setSystemTime(Date.now() + ms)
const aguardarSegundoPlano = () => new Promise(r => setTimeout(r, 0))

describe('comCache', () => {
  it('serve do cache dentro do prazo e divide uma única busca entre pedidos simultâneos', async () => {
    const carregar = vi.fn(async () => ({ n: 1 }))
    const [a, b] = await Promise.all([comCache('k', carregar, OPCOES), comCache('k', carregar, OPCOES)])
    expect(a).toEqual({ n: 1 })
    expect(b).toBe(a)
    avancar(30_000)
    await comCache('k', carregar, OPCOES)
    expect(carregar).toHaveBeenCalledTimes(1)
  })

  it('vencido o prazo, responde na hora com a versão guardada e atualiza em segundo plano a partir dela', async () => {
    let versao = 1
    const carregar = vi.fn(async (anterior?: { v: number }) => ({ v: versao, base: anterior?.v }))
    await comCache('k', carregar, OPCOES)
    versao = 2
    avancar(61_000)
    expect(await comCache('k', carregar, OPCOES)).toEqual({ v: 1, base: undefined })
    await aguardarSegundoPlano()
    expect(carregar).toHaveBeenLastCalledWith({ v: 1, base: undefined })
    expect(await comCache('k', carregar, OPCOES)).toEqual({ v: 2, base: 1 })
  })

  it('invalidado, espera os dados novos; se a fonte falhar, devolve a última versão', async () => {
    const carregar = vi.fn(async () => ({ v: 1 }))
    await comCache('k', carregar, OPCOES)
    invalidarCache('k')
    carregar.mockResolvedValueOnce({ v: 2 })
    expect(await comCache('k', carregar, OPCOES)).toEqual({ v: 2 })

    invalidarCache('k')
    carregar.mockRejectedValueOnce(new Error('Jira fora'))
    expect(await comCache('k', carregar, OPCOES)).toEqual({ v: 2 })
  })

  it('sem nada guardado, a falha da fonte chega a quem pediu', async () => {
    await expect(comCache('k', async () => { throw new Error('Jira fora') }, OPCOES)).rejects.toThrow('Jira fora')
  })

  it('guarda em disco e retoma depois de um reinício do servidor', async () => {
    await comCache('k', async () => ({ v: 1 }), OPCOES)
    _limparMemoria()
    const carregar = vi.fn(async () => ({ v: 2 }))
    expect(await comCache('k', carregar, OPCOES)).toEqual({ v: 1 })
    expect(carregar).not.toHaveBeenCalled()
  })

  it('acima do limite de idade, espera a fonte em vez de servir a versão velha', async () => {
    await comCache('k', async () => ({ v: 1 }), OPCOES)
    avancar(OPCOES.maximoObsoletoMs + 1)
    expect(await comCache('k', async () => ({ v: 2 }), OPCOES)).toEqual({ v: 2 })
  })
})
