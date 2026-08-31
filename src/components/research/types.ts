export type ResearchDocumentType = 'category' | 'topic' | 'concept' | 'paper'

export interface ResearchDocument {
  id: string
  path: string
  name: string
  title: string
  type: ResearchDocumentType
  category: string
  topic: string | null
  tags: string[]
  created: string | null
  updated: string | null
  links: string[]
}

export interface ResearchEdge {
  source: string
  target: string
  kind: 'hierarchy' | 'wikilink'
}

export interface ResearchVault {
  revision: string
  generatedAt: string
  completedResearchCount: number
  documents: ResearchDocument[]
  edges: ResearchEdge[]
}

export interface ResearchDocumentContent {
  document: ResearchDocument
  content: string
}

export type ResearchTreeNodeKind = ResearchDocumentType | 'group'

export interface ResearchTreeNode {
  id: string
  label: string
  kind: ResearchTreeNodeKind
  document: ResearchDocument | null
  children: ResearchTreeNode[]
  searchText: string
}
