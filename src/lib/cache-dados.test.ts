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

describe('leitura do Jira uma vez por dia', () => {
  it('vale o dia inteiro no horário de Brasília; no primeiro acesso do dia seguinte, serve o de ontem e lê de novo', async () => {
    const { POLITICA_DO_JIRA, lidoHoje } = await import('./jira')
    // 2026-10-24 às 12:00Z = 09:00 em Brasília
    expect(lidoHoje(Date.parse('2026-10-24T03:30:00Z'), Date.parse('2026-10-24T23:00:00Z'))).toBe(true) // 00:30 e 20:00 em SP
    expect(lidoHoje(Date.parse('2026-10-24T02:30:00Z'), Date.parse('2026-10-24T12:00:00Z'))).toBe(false) // 23:30 do dia 23 em SP
    let leitura = 0
    const carregar = vi.fn(async () => ({ leitura: ++leitura }))
    expect(await comCache('jira', carregar, POLITICA_DO_JIRA)).toEqual({ leitura: 1 })
    avancar(11 * 3600_000) // 20:00 em SP, mesmo dia
    for (let i = 0; i < 50; i++) await comCache('jira', carregar, POLITICA_DO_JIRA)
    expect(carregar).toHaveBeenCalledTimes(1)
    avancar(5 * 3600_000) // 01:00 do dia seguinte em SP
    expect(await comCache('jira', carregar, POLITICA_DO_JIRA)).toEqual({ leitura: 1 }) // quem chega primeiro não espera
    await aguardarSegundoPlano()
    expect(await comCache('jira', carregar, POLITICA_DO_JIRA)).toEqual({ leitura: 2 })
    expect(carregar).toHaveBeenCalledTimes(2)
  })

  it('com o Jira fora do ar: sem leitura guardada dá erro e espera 2 h para tentar de novo; com leitura guardada, ela continua valendo', async () => {
    const { POLITICA_DO_JIRA } = await import('./jira')
    const { FonteIndisponivel, situacaoDoCache } = await import('./cache-dados')
    const quebrado = vi.fn(async () => { throw new Error('Jira 503') })
    await expect(comCache('vazio', quebrado, POLITICA_DO_JIRA)).rejects.toThrow('Jira 503')
    await expect(comCache('vazio', quebrado, POLITICA_DO_JIRA)).rejects.toBeInstanceOf(FonteIndisponivel)
    expect(quebrado).toHaveBeenCalledTimes(1)
    expect(situacaoDoCache('vazio')).toMatchObject({ salvoEm: null, atualizando: false, falhouEm: expect.any(String) })
    avancar(2 * 3600_000 + 1)
    await expect(comCache('vazio', quebrado, POLITICA_DO_JIRA)).rejects.toThrow('Jira 503')
    expect(quebrado).toHaveBeenCalledTimes(2)

    await comCache('cheio', async () => ({ ok: 1 }), POLITICA_DO_JIRA)
    avancar(24 * 3600_000)
    expect(await comCache('cheio', quebrado, POLITICA_DO_JIRA)).toEqual({ ok: 1 })
    await aguardarSegundoPlano()
    const chamadas = quebrado.mock.calls.length
    for (let i = 0; i < 20; i++) expect(await comCache('cheio', quebrado, POLITICA_DO_JIRA)).toEqual({ ok: 1 })
    expect(quebrado).toHaveBeenCalledTimes(chamadas) // não insiste enquanto espera
    expect(situacaoDoCache('cheio')).toMatchObject({ salvoEm: '2026-10-24T14:00:00.001Z', falhouEm: expect.any(String) })
  })
})
