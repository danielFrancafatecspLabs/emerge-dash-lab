import type {
  ResearchDocument,
  ResearchTreeNode,
  ResearchTreeNodeKind,
} from './types'

export type { ResearchDocument, ResearchTreeNode } from './types'

export type ResearchLinkIndex = Map<string, ResearchDocument>

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function compareLabels(left: ResearchTreeNode, right: ResearchTreeNode) {
  return left.label.localeCompare(right.label, 'pt-BR', { sensitivity: 'base' })
}

function documentSearchText(document: ResearchDocument) {
  return normalize([
    document.title,
    document.name,
    document.path,
    document.category,
    document.topic ?? '',
    ...document.tags,
  ].join(' '))
}

function documentNode(document: ResearchDocument): ResearchTreeNode {
  return {
    id: document.id,
    label: document.title || document.name,
    kind: document.type,
    document,
    children: [],
    searchText: documentSearchText(document),
  }
}

function groupNode(
  topic: ResearchDocument,
  kind: Extract<ResearchTreeNodeKind, 'group'>,
  label: string,
  children: ResearchTreeNode[],
): ResearchTreeNode {
  return {
    id: `${topic.id}::${normalize(label)}`,
    label,
    kind,
    document: null,
    children: children.sort(compareLabels),
    searchText: normalize(label),
  }
}

export function buildResearchTree(documents: ResearchDocument[]): ResearchTreeNode[] {
  const categories = new Map<string, ResearchDocument | null>()
  const completedTopics = documents.filter(document => document.type === 'topic')

  for (const document of documents) {
    if (!categories.has(document.category)) categories.set(document.category, null)
    if (document.type === 'category') categories.set(document.category, document)
  }

  const tree: ResearchTreeNode[] = []
  for (const [categoryName, categoryDocument] of categories) {
    const topicNodes = completedTopics
      .filter(document => document.category === categoryName)
      .map(topic => {
        const supportingDocuments = documents.filter(document => (
          document.category === categoryName
          && document.topic === topic.topic
          && (document.type === 'concept' || document.type === 'paper')
        ))
        const concepts = supportingDocuments
          .filter(document => document.type === 'concept')
          .map(documentNode)
        const papers = supportingDocuments
          .filter(document => document.type === 'paper')
          .map(documentNode)
        const children: ResearchTreeNode[] = []
        if (concepts.length > 0) children.push(groupNode(topic, 'group', 'Conceitos', concepts))
        if (papers.length > 0) children.push(groupNode(topic, 'group', 'Papers', papers))

        return { ...documentNode(topic), children }
      })
      .sort(compareLabels)

    if (topicNodes.length === 0) continue
    tree.push({
      id: categoryDocument?.id ?? `category:${categoryName}`,
      label: categoryDocument?.title || categoryName,
      kind: 'category',
      document: categoryDocument,
      children: topicNodes,
      searchText: categoryDocument ? documentSearchText(categoryDocument) : normalize(categoryName),
    })
  }

  return tree.sort(compareLabels)
}

export function filterResearchTree(nodes: ResearchTreeNode[], query: string): ResearchTreeNode[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return nodes

  const filterNode = (node: ResearchTreeNode): ResearchTreeNode | null => {
    if (node.searchText.includes(normalizedQuery)) return node

    const children = node.children
      .map(filterNode)
      .filter((child): child is ResearchTreeNode => child !== null)

    return children.length > 0 ? { ...node, children } : null
  }

  return nodes
    .map(filterNode)
    .filter((node): node is ResearchTreeNode => node !== null)
}

export function buildResearchLinkIndex(documents: ResearchDocument[]): ResearchLinkIndex {
  const index: ResearchLinkIndex = new Map()

  for (const document of documents) {
    const pathWithoutExtension = document.path.replace(/\.md$/i, '')
    for (const candidate of [document.name, document.title, pathWithoutExtension]) {
      const key = normalize(candidate)
      if (key && !index.has(key)) index.set(key, document)
    }
  }

  return index
}

export function resolveResearchLink(index: ResearchLinkIndex, rawTarget: string) {
  const target = rawTarget.split('|', 1)[0].split('#', 1)[0]
  return index.get(normalize(target)) ?? null
}

export function prepareResearchMarkdown(content: string) {
  return content.replace(/!?\[\[([^\]]+)\]\]/g, (_match, rawLink: string) => {
    const [rawTarget, rawLabel] = rawLink.split('|', 2)
    const target = rawTarget.trim()
    const label = (rawLabel || target).trim()
    return `[${label}](#research:${encodeURIComponent(target)})`
  })
}
