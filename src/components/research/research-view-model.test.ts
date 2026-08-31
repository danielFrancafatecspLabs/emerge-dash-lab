import { describe, expect, it } from 'vitest'
import {
  buildResearchLinkIndex,
  buildResearchTree,
  filterResearchTree,
  prepareResearchMarkdown,
  resolveResearchLink,
  type ResearchDocument,
} from './research-view-model'

const documents: ResearchDocument[] = [
  {
    id: 'Researchs/Agents/Agents.md',
    path: 'Researchs/Agents/Agents.md',
    name: 'Agents',
    title: 'Agent Architectures',
    type: 'category',
    category: 'Agents',
    topic: null,
    tags: ['index'],
    created: '2026-06-01',
    updated: '2026-06-01',
    links: [],
  },
  {
    id: 'Researchs/Agents/Zeta/Zeta.md',
    path: 'Researchs/Agents/Zeta/Zeta.md',
    name: 'Zeta',
    title: 'Zeta Research',
    type: 'topic',
    category: 'Agents',
    topic: 'Zeta',
    tags: ['planning'],
    created: '2026-08-31',
    updated: '2026-08-31',
    links: [],
  },
  {
    id: 'Researchs/Agents/Alpha/Alpha.md',
    path: 'Researchs/Agents/Alpha/Alpha.md',
    name: 'Alpha',
    title: 'Alpha Research',
    type: 'topic',
    category: 'Agents',
    topic: 'Alpha',
    tags: ['adaptive'],
    created: '2026-07-10',
    updated: '2026-07-12',
    links: [],
  },
  {
    id: 'Researchs/Agents/Alpha/Concepts/Memory.md',
    path: 'Researchs/Agents/Alpha/Concepts/Memory.md',
    name: 'Memory',
    title: 'Agent Memory',
    type: 'concept',
    category: 'Agents',
    topic: 'Alpha',
    tags: ['context'],
    created: '2026-07-11',
    updated: null,
    links: [],
  },
  {
    id: 'Researchs/Agents/Alpha/Papers/ReAct.md',
    path: 'Researchs/Agents/Alpha/Papers/ReAct.md',
    name: 'ReAct',
    title: 'ReAct Paper',
    type: 'paper',
    category: 'Agents',
    topic: 'Alpha',
    tags: ['reasoning'],
    created: '2026-07-11',
    updated: null,
    links: [],
  },
]

describe('buildResearchTree', () => {
  it('builds category, alphabetical completed topics and virtual supporting groups', () => {
    const tree = buildResearchTree(documents)

    expect(tree).toHaveLength(1)
    expect(tree[0]).toMatchObject({ label: 'Agent Architectures', kind: 'category' })
    expect(tree[0].children.map(child => child.label)).toEqual(['Alpha Research', 'Zeta Research'])
    expect(tree[0].children[0]).toMatchObject({
      kind: 'topic',
      document: { created: '2026-07-10', updated: '2026-07-12' },
    })
    expect(tree[0].children[0].children.map(child => [child.label, child.kind])).toEqual([
      ['Conceitos', 'group'],
      ['Papers', 'group'],
    ])
    expect(tree[0].children[0].children[0].children[0]).toMatchObject({
      label: 'Agent Memory',
      kind: 'concept',
    })
  })

  it('does not expose supporting files for a topic without a principal research file', () => {
    const orphan: ResearchDocument = {
      ...documents[3],
      id: 'Researchs/Agents/Unfinished/Concepts/Draft.md',
      path: 'Researchs/Agents/Unfinished/Concepts/Draft.md',
      topic: 'Unfinished',
    }

    const tree = buildResearchTree([...documents, orphan])

    expect(JSON.stringify(tree)).not.toContain('Unfinished')
    expect(JSON.stringify(tree)).not.toContain('Draft.md')
  })
})

describe('filterResearchTree', () => {
  it('matches tags and retains the category and topic ancestors', () => {
    const filtered = filterResearchTree(buildResearchTree(documents), 'context')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].label).toBe('Agent Architectures')
    expect(filtered[0].children).toHaveLength(1)
    expect(filtered[0].children[0].label).toBe('Alpha Research')
    expect(JSON.stringify(filtered)).toContain('Agent Memory')
    expect(JSON.stringify(filtered)).not.toContain('ReAct Paper')
    expect(JSON.stringify(filtered)).not.toContain('Zeta Research')
  })

  it('keeps descendants when their completed research title matches', () => {
    const filtered = filterResearchTree(buildResearchTree(documents), 'alpha research')

    expect(filtered[0].children[0].children).toHaveLength(2)
    expect(JSON.stringify(filtered)).toContain('Agent Memory')
    expect(JSON.stringify(filtered)).toContain('ReAct Paper')
  })
})

describe('research wikilinks', () => {
  it('turns Obsidian aliases into safe internal Markdown links', () => {
    expect(prepareResearchMarkdown('Leia [[Memory|memória do agente]] e [[ReAct]].')).toBe(
      'Leia [memória do agente](#research:Memory) e [ReAct](#research:ReAct).',
    )
  })

  it('resolves a wikilink by filename or title without matching a missing note', () => {
    const index = buildResearchLinkIndex(documents)

    expect(resolveResearchLink(index, 'Memory')?.title).toBe('Agent Memory')
    expect(resolveResearchLink(index, 'Agent Memory')?.name).toBe('Memory')
    expect(resolveResearchLink(index, 'Missing Note')).toBeNull()
  })
})
