import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearResearchVaultCache,
  loadResearchDocument,
  loadResearchVault,
} from './research-vault'

const temporaryRoots: string[] = []

async function createVault() {
  const root = await mkdtemp(path.join(tmpdir(), 'research-vault-'))
  temporaryRoots.push(root)

  const files: Record<string, string> = {
    '.research-revision': '1111111111111111111111111111111111111111\n',
    'Researches Index.md': '# Research Vault\n',
    'Researchs/Agent Architectures/Agent Architectures.md': `---
title: Agent Architectures
tags: [index, agents]
created: 2026-06-09
updated: 2026-06-09
---
# Agent Architectures
`,
    'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md': `---
title: Adaptive Agents (ALMAA)
tags:
  - index
  - adaptive-agents
created: 2026-06-12
updated: 2026-06-19
---
# Adaptive Agents

See [[Memory|agent memory]], [[ReAct]] and [[Missing Note]].
`,
    'Researchs/Agent Architectures/Adaptive Agents/Concepts/Memory.md': `---
title: Memory
tags: [concept]
created: 2026-06-13
---
# Memory
`,
    'Researchs/Agent Architectures/Adaptive Agents/Papers/ReAct.md': `---
title: ReAct
tags:
  - paper
created: 2026-06-14
---
# ReAct
`,
    'Researchs/AI for Telecommunications/AI for Telecommunications.md': `---
title: AI for Telecommunications
tags: [index]
created: 2026-07-02
updated: 2026-07-02
---
# AI for Telecommunications
`,
  }

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath)
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
  }

  return root
}

afterEach(async () => {
  clearResearchVaultCache()
  await Promise.all(temporaryRoots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('loadResearchVault', () => {
  it('discovers completed research by folder depth even when the principal filename differs', async () => {
    const root = await createVault()

    const vault = await loadResearchVault(root)

    expect(vault.revision).toBe('1111111111111111111111111111111111111111')
    expect(vault.completedResearchCount).toBe(1)
    expect(vault.documents.map(document => [document.path, document.type])).toEqual([
      ['Researchs/AI for Telecommunications/AI for Telecommunications.md', 'category'],
      ['Researchs/Agent Architectures/Agent Architectures.md', 'category'],
      ['Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md', 'topic'],
      ['Researchs/Agent Architectures/Adaptive Agents/Concepts/Memory.md', 'concept'],
      ['Researchs/Agent Architectures/Adaptive Agents/Papers/ReAct.md', 'paper'],
    ])
    expect(vault.documents[2]).toMatchObject({
      title: 'Adaptive Agents (ALMAA)',
      category: 'Agent Architectures',
      topic: 'Adaptive Agents',
      tags: ['index', 'adaptive-agents'],
      created: '2026-06-12',
      updated: '2026-06-19',
      links: ['Memory', 'ReAct', 'Missing Note'],
    })
  })

  it('creates hierarchy and resolved wikilink edges without inventing missing targets', async () => {
    const root = await createVault()

    const vault = await loadResearchVault(root)

    expect(vault.edges).toEqual(expect.arrayContaining([
      {
        source: 'Researchs/Agent Architectures/Agent Architectures.md',
        target: 'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md',
        kind: 'hierarchy',
      },
      {
        source: 'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md',
        target: 'Researchs/Agent Architectures/Adaptive Agents/Concepts/Memory.md',
        kind: 'hierarchy',
      },
      {
        source: 'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md',
        target: 'Researchs/Agent Architectures/Adaptive Agents/Concepts/Memory.md',
        kind: 'wikilink',
      },
    ]))
    expect(vault.edges.some(edge => edge.target.includes('Missing Note'))).toBe(false)
  })

  it('invalidates a revision-backed cache when the deployed revision changes', async () => {
    const root = await createVault()
    const first = await loadResearchVault(root)
    const newTopic = path.join(root, 'Researchs/Agent Architectures/New Topic/New Topic.md')
    await mkdir(path.dirname(newTopic), { recursive: true })
    await writeFile(newTopic, `---
title: New Topic
created: 2026-08-31
updated: 2026-08-31
---
# New Topic
`, 'utf8')
    await writeFile(path.join(root, '.research-revision'), '2222222222222222222222222222222222222222\n', 'utf8')

    const second = await loadResearchVault(root)

    expect(first.completedResearchCount).toBe(1)
    expect(second.revision).toBe('2222222222222222222222222222222222222222')
    expect(second.completedResearchCount).toBe(2)
  })
})

describe('loadResearchDocument', () => {
  it('returns the indexed Markdown body without frontmatter', async () => {
    const root = await createVault()
    const vault = await loadResearchVault(root)
    const topicPath = 'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md'

    const document = await loadResearchDocument(root, vault, topicPath)

    expect(document.document.path).toBe(topicPath)
    expect(document.content).toContain('# Adaptive Agents')
    expect(document.content).not.toContain('created:')
  })

  it.each(['../.env', '/etc/passwd', 'Researchs/not-indexed.md'])(
    'rejects a non-indexed path: %s',
    async requestedPath => {
      const root = await createVault()
      const vault = await loadResearchVault(root)

      await expect(loadResearchDocument(root, vault, requestedPath)).rejects.toMatchObject({
        name: 'ResearchDocumentNotFoundError',
      })
    },
  )

  it('rejects an indexed file replaced by a symlink outside the snapshot', async () => {
    const root = await createVault()
    const vault = await loadResearchVault(root)
    const topicPath = 'Researchs/Agent Architectures/Adaptive Agents/Adaptive Agents (ALMAA).md'
    const absoluteTopic = path.join(root, topicPath)
    const outsideFile = path.join(path.dirname(root), `${path.basename(root)}-outside.md`)
    temporaryRoots.push(outsideFile)
    await writeFile(outsideFile, 'outside the vault', 'utf8')
    await rm(absoluteTopic)
    await symlink(outsideFile, absoluteTopic)

    await expect(loadResearchDocument(root, vault, topicPath)).rejects.toMatchObject({
      name: 'ResearchDocumentNotFoundError',
    })
  })
})
