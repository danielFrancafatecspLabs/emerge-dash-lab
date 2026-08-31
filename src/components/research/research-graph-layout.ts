import type { ResearchDocument, ResearchEdge } from './types'

export interface PositionedResearchNode {
  id: string
  x: number
  y: number
  radius: number
  document: ResearchDocument
}

export interface PositionedResearchEdge extends ResearchEdge {
  sourceNode: PositionedResearchNode
  targetNode: PositionedResearchNode
}

export interface ResearchGraphLayout {
  width: number
  height: number
  nodes: PositionedResearchNode[]
  edges: PositionedResearchEdge[]
}

const NODE_RADIUS: Record<ResearchDocument['type'], number> = {
  category: 13,
  topic: 9,
  concept: 5,
  paper: 5.5,
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function topicKey(document: Pick<ResearchDocument, 'category' | 'topic'>) {
  return `${document.category}\u0000${document.topic ?? ''}`
}

export function layoutResearchGraph(
  documents: ResearchDocument[],
  edges: ResearchEdge[],
  width: number,
  height: number,
): ResearchGraphLayout {
  const completedTopics = documents.filter(document => document.type === 'topic')
  const completedTopicKeys = new Set(completedTopics.map(topicKey))
  const completedCategories = new Set(completedTopics.map(document => document.category))
  const visibleDocuments = documents
    .filter(document => {
      if (document.type === 'category') return completedCategories.has(document.category)
      if (document.type === 'topic') return true
      return completedTopicKeys.has(topicKey(document))
    })
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))

  const categories = Array.from(completedCategories).sort((left, right) => left.localeCompare(right, 'pt-BR'))
  const minimumDimension = Math.min(width, height)
  const centerX = width / 2
  const centerY = height / 2
  const categoryOrbit = categories.length <= 1 ? 0 : minimumDimension * 0.35
  const categoryCenters = new Map<string, { x: number; y: number }>()

  categories.forEach((category, index) => {
    const angle = categories.length <= 1
      ? 0
      : -Math.PI / 2 + (index / categories.length) * Math.PI * 2
    categoryCenters.set(category, {
      x: centerX + Math.cos(angle) * categoryOrbit,
      y: centerY + Math.sin(angle) * categoryOrbit,
    })
  })

  const positions = new Map<string, { x: number; y: number }>()
  for (const category of categories) {
    const center = categoryCenters.get(category)!
    const categoryDocument = visibleDocuments.find(document => (
      document.type === 'category' && document.category === category
    ))
    if (categoryDocument) positions.set(categoryDocument.id, center)

    const topics = completedTopics
      .filter(document => document.category === category)
      .sort((left, right) => left.id.localeCompare(right.id, 'en'))
    const topicOrbit = Math.min(150, 78 + topics.length * 9)

    topics.forEach((topic, topicIndex) => {
      const offset = (stableHash(topic.id) % 360) * (Math.PI / 180)
      const angle = offset + (topicIndex / Math.max(topics.length, 1)) * Math.PI * 2
      const topicPosition = topics.length === 1
        ? { x: center.x + 72, y: center.y }
        : {
            x: center.x + Math.cos(angle) * topicOrbit,
            y: center.y + Math.sin(angle) * topicOrbit,
          }
      positions.set(topic.id, topicPosition)

      const supporting = visibleDocuments
        .filter(document => (
          (document.type === 'concept' || document.type === 'paper')
          && topicKey(document) === topicKey(topic)
        ))
        .sort((left, right) => left.id.localeCompare(right.id, 'en'))
      const supportOrbit = Math.min(76, 30 + supporting.length * 2.2)
      supporting.forEach((document, supportIndex) => {
        const supportOffset = (stableHash(document.id) % 180) * (Math.PI / 180)
        const supportAngle = supportOffset
          + (supportIndex / Math.max(supporting.length, 1)) * Math.PI * 2
        positions.set(document.id, {
          x: topicPosition.x + Math.cos(supportAngle) * supportOrbit,
          y: topicPosition.y + Math.sin(supportAngle) * supportOrbit,
        })
      })
    })
  }

  const nodes = visibleDocuments.map(document => {
    const radius = NODE_RADIUS[document.type]
    const position = positions.get(document.id) ?? { x: centerX, y: centerY }
    return {
      id: document.id,
      x: round(Math.max(radius, Math.min(width - radius, position.x))),
      y: round(Math.max(radius, Math.min(height - radius, position.y))),
      radius,
      document,
    }
  })
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const positionedEdges = edges.flatMap(edge => {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)
    return sourceNode && targetNode ? [{ ...edge, sourceNode, targetNode }] : []
  })

  return { width, height, nodes, edges: positionedEdges }
}
