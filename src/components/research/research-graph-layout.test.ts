import { describe, expect, it } from 'vitest'
import type { ResearchDocument, ResearchEdge } from './types'
import { layoutResearchGraph } from './research-graph-layout'

function document(
  id: string,
  type: ResearchDocument['type'],
  category: string,
  topic: string | null,
): ResearchDocument {
  const name = id.split('/').at(-1)!.replace('.md', '')
  return {
    id,
    path: id,
    name,
    title: name,
    type,
    category,
    topic,
    tags: [],
    created: type === 'topic' ? '2026-08-31' : null,
    updated: type === 'topic' ? '2026-08-31' : null,
    links: [],
  }
}

const documents: ResearchDocument[] = [
  document('Researchs/Agents/Agents.md', 'category', 'Agents', null),
  document('Researchs/Agents/Adaptive/Adaptive.md', 'topic', 'Agents', 'Adaptive'),
  document('Researchs/Agents/Adaptive/Concepts/Memory.md', 'concept', 'Agents', 'Adaptive'),
  document('Researchs/Telecom/Telecom.md', 'category', 'Telecom', null),
  document('Researchs/Telecom/World Models/World Models.md', 'topic', 'Telecom', 'World Models'),
  document('Researchs/Telecom/World Models/Papers/Survey.md', 'paper', 'Telecom', 'World Models'),
  document('Researchs/Agents/Unfinished/Concepts/Draft.md', 'concept', 'Agents', 'Unfinished'),
]

const edges: ResearchEdge[] = [
  { source: documents[0].id, target: documents[1].id, kind: 'hierarchy' },
  { source: documents[1].id, target: documents[2].id, kind: 'hierarchy' },
  { source: documents[3].id, target: documents[4].id, kind: 'hierarchy' },
  { source: documents[4].id, target: documents[5].id, kind: 'hierarchy' },
  { source: documents[2].id, target: documents[5].id, kind: 'wikilink' },
  { source: documents[1].id, target: documents[6].id, kind: 'wikilink' },
]

describe('layoutResearchGraph', () => {
  it('produces stable bounded coordinates and drawable edges', () => {
    const first = layoutResearchGraph(documents, edges, 1000, 700)
    const second = layoutResearchGraph(documents, edges, 1000, 700)

    expect(second).toEqual(first)
    expect(first.nodes).toHaveLength(6)
    expect(first.edges).toHaveLength(5)
    for (const node of first.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(node.radius)
      expect(node.x).toBeLessThanOrEqual(1000 - node.radius)
      expect(node.y).toBeGreaterThanOrEqual(node.radius)
      expect(node.y).toBeLessThanOrEqual(700 - node.radius)
    }
  })

  it('keeps completed category clusters visually distinct', () => {
    const layout = layoutResearchGraph(documents, edges, 1000, 700)
    const categories = layout.nodes.filter(node => node.document.type === 'category')
    const distance = Math.hypot(
      categories[0].x - categories[1].x,
      categories[0].y - categories[1].y,
    )

    expect(categories).toHaveLength(2)
    expect(distance).toBeGreaterThan(250)
  })

  it('excludes supporting documents whose topic has no principal file', () => {
    const layout = layoutResearchGraph(documents, edges, 1000, 700)

    expect(layout.nodes.some(node => node.id.includes('Unfinished'))).toBe(false)
    expect(layout.edges.some(edge => edge.target.includes('Unfinished'))).toBe(false)
  })
})
