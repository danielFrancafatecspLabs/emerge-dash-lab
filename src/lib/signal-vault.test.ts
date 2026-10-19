import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearSignalVaultCache,
  loadSignalDocument,
  loadSignalVault,
  SignalDocumentNotFoundError,
  SignalVaultUnavailableError,
} from './signal-vault'

let root = ''

async function write(relativePath: string, content: string) {
  const target = path.join(root, relativePath)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content, 'utf8')
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'signal-vault-'))
  await write('modules/leo.md', `---
type: module
slug: leo
title: LEO / satellite
---
%%generated-start%%
# Module 12 — LEO

- [[subthemes/leo--d2d|D2D]]
- [[signals/leo/2026-09-01-s01-orphan|Orphan]]
%%generated-end%%
`)
  await write('subthemes/leo--d2d.md', `---
type: subtheme
module: leo
label: D2D
---
- [[signals/leo/2026-09-10-s14-ariane|Ariane]]
- [[watchlist/leo/w1-watch|Watch]]
`)
  await write('signals/leo/2026-09-10-s14-ariane.md', `---
type: signal
module: leo
title: "Ariane: six more"
date: 2026-09-10
domain: Economic
subtheme: D2D
stakeholder_relevance: High
tags:
  - type/signal
---
# Ariane

Body with [[orgs/amazon|Amazon]].
`)
  await write('signals/leo/2026-09-01-s01-orphan.md', `---
type: signal
module: leo
title: Orphan
date: 2026-09-01
---
Body
`)
  await write('watchlist/leo/w1-watch.md', `---
type: watch
module: leo
title: Watch item
---
Body
`)
})

afterEach(async () => {
  clearSignalVaultCache()
  await rm(root, { recursive: true, force: true })
})

describe('loadSignalVault', () => {
  it('indexes documents, hierarchy and counts', async () => {
    const vault = await loadSignalVault(root)
    expect(vault.revision).toBe('local')
    expect(vault.signalCount).toBe(2)
    expect(vault.watchCount).toBe(1)

    const byTitle = Object.fromEntries(vault.documents.map(d => [d.title, d]))
    expect(byTitle['Ariane: six more']).toMatchObject({
      type: 'signal',
      parent: 'subthemes/leo--d2d.md',
      moduleTitle: 'LEO / satellite',
      relevance: 'High',
      date: '2026-09-10',
    })
    expect(byTitle['Orphan'].parent).toBe('modules/leo.md')
    expect(byTitle['Watch item'].parent).toBe('subthemes/leo--d2d.md')
    expect(vault.edges).toContainEqual({
      source: 'subthemes/leo--d2d.md',
      target: 'signals/leo/2026-09-10-s14-ariane.md',
      kind: 'hierarchy',
    })
  })

  it('returns bodies without generated markers or frontmatter and rejects unknown paths', async () => {
    const vault = await loadSignalVault(root)
    const { content } = await loadSignalDocument(vault, 'modules/leo.md')
    expect(content).not.toContain('%%generated')
    expect(content).not.toContain('slug:')
    await expect(loadSignalDocument(vault, '../../etc/passwd')).rejects.toBeInstanceOf(SignalDocumentNotFoundError)
  })

  it('throws unavailable for a missing or empty vault', async () => {
    await expect(loadSignalVault(path.join(root, 'nope'))).rejects.toBeInstanceOf(SignalVaultUnavailableError)
    const empty = await mkdtemp(path.join(tmpdir(), 'signal-empty-'))
    await expect(loadSignalVault(empty)).rejects.toBeInstanceOf(SignalVaultUnavailableError)
    await rm(empty, { recursive: true, force: true })
  })
})
