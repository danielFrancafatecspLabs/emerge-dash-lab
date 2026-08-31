import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearResearchVaultCache } from '@/lib/research-vault'
import { GET } from './route'

let root = ''

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'research-route-'))
  const topic = path.join(root, 'Researchs/Agents/Adaptive Agents/Adaptive Agents.md')
  await mkdir(path.dirname(topic), { recursive: true })
  await writeFile(topic, `---
title: Adaptive Agents
tags: [agents]
created: 2026-08-31
updated: 2026-08-31
---
# Adaptive Agents

Research body.
`, 'utf8')
  process.env.RESEARCH_VAULT_PATH = root
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(async () => {
  clearResearchVaultCache()
  delete process.env.RESEARCH_VAULT_PATH
  vi.restoreAllMocks()
  if (root) await rm(root, { recursive: true, force: true })
})

describe('GET /api/pesquisas', () => {
  it('returns the locally indexed research vault', async () => {
    const response = await GET(new Request('http://localhost/jira/api/pesquisas'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      revision: 'local',
      completedResearchCount: 1,
    })
    expect(body.documents).toEqual([
      expect.objectContaining({
        path: 'Researchs/Agents/Adaptive Agents/Adaptive Agents.md',
        type: 'topic',
        created: '2026-08-31',
      }),
    ])
  })

  it('returns an indexed document body', async () => {
    const file = encodeURIComponent('Researchs/Agents/Adaptive Agents/Adaptive Agents.md')
    const response = await GET(new Request(`http://localhost/jira/api/pesquisas?file=${file}`))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.document.title).toBe('Adaptive Agents')
    expect(body.content).toContain('Research body.')
    expect(body.content).not.toContain('created:')
  })

  it('rejects an empty or unknown file without exposing filesystem paths', async () => {
    const emptyResponse = await GET(new Request('http://localhost/jira/api/pesquisas?file='))
    const unknownResponse = await GET(new Request('http://localhost/jira/api/pesquisas?file=..%2F.env'))
    const emptyBody = await emptyResponse.json()
    const unknownBody = await unknownResponse.json()

    expect(emptyResponse.status).toBe(400)
    expect(unknownResponse.status).toBe(404)
    expect(JSON.stringify([emptyBody, unknownBody])).not.toContain(root)
  })

  it('returns 503 with a generic error when the configured vault is unavailable', async () => {
    process.env.RESEARCH_VAULT_PATH = path.join(root, 'missing-vault')

    const response = await GET(new Request('http://localhost/jira/api/pesquisas'))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ error: 'Acervo de pesquisas temporariamente indisponível' })
    expect(JSON.stringify(body)).not.toContain(root)
  })
})
