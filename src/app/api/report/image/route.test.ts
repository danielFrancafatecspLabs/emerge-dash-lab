import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchDashboardRaw: vi.fn(),
  classifyPortfolios: vi.fn(),
  classifySegmentos: vi.fn(),
  buildDashboardData: vi.fn(),
  legacyImageGenerate: vi.fn(),
}))

vi.mock('@/lib/jira', () => ({ fetchDashboardRaw: mocks.fetchDashboardRaw }))
vi.mock('@/lib/portfolio-classifier', () => ({ classifyPortfolios: mocks.classifyPortfolios }))
vi.mock('@/lib/segmento-classifier', () => ({ classifySegmentos: mocks.classifySegmentos }))
vi.mock('@/lib/mappers', () => ({ buildDashboardData: mocks.buildDashboardData }))
vi.mock('@/lib/llm', () => ({
  getAzureOpenAIClient: () => ({ images: { generate: mocks.legacyImageGenerate } }),
}))

import { GET } from './route'

const onePixelPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('GET /api/report/image', () => {
  beforeEach(() => {
    mocks.fetchDashboardRaw.mockResolvedValue({
      iniciativas: [],
      epics: [{
        key: 'GL-1',
        fields: {
          summary: 'Experimento de rede',
          customfield_16400: { value: 'Rede' },
          customfield_11661: 'Consumo',
        },
      }],
      board2706Config: {},
    })
    mocks.classifyPortfolios.mockResolvedValue({})
    mocks.classifySegmentos.mockResolvedValue({})
    mocks.buildDashboardData.mockReturnValue({
      iniciativas: [{ key: 'GL-100' }, { key: 'GL-101' }],
      allEpics: [
        { status: { name: 'Em andamento' }, beneficioQuantitativo: 1_500_000, dominio: 'Rede' },
        { status: { name: 'Concluído' }, beneficioQuantitativo: 500_000, dominio: 'Atendimento' },
      ],
    })
    mocks.legacyImageGenerate.mockResolvedValue({
      data: [{ b64_json: onePixelPng }],
    })
  })

  it('returns the existing JSON contract with a 1024x1536 PNG', async () => {
    const response = await GET()
    const body = await response.json()
    const png = Buffer.from(body.image, 'base64')

    expect(response.status).toBe(200)
    expect(body.format).toBe('png')
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    expect(png.toString('ascii', 12, 16)).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(1024)
    expect(png.readUInt32BE(20)).toBe(1536)
    expect(mocks.classifyPortfolios).not.toHaveBeenCalled()
    expect(mocks.classifySegmentos).not.toHaveBeenCalled()
    expect(mocks.legacyImageGenerate).not.toHaveBeenCalled()
  })

  it('does not expose internal error details', async () => {
    mocks.fetchDashboardRaw.mockRejectedValueOnce(new Error('credential detail'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Falha ao gerar imagem' })
    expect(JSON.stringify(body)).not.toContain('credential detail')
  })
})
