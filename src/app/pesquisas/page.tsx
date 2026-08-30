'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen, ChevronRight, ChevronDown, FileText, Lightbulb,
  GraduationCap, Search, ExternalLink, Loader2, FolderOpen,
} from 'lucide-react'

interface ResearchItem {
  name: string
  path: string
  type: 'category' | 'topic' | 'concept' | 'paper'
  title: string
  tags: string[]
  children?: ResearchItem[]
}

interface FileContent {
  title: string
  tags: string[]
  content: string
  raw: string
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'category': return <BookOpen size={16} className="text-amber-600" />
    case 'topic': return <FolderOpen size={16} className="text-blue-600" />
    case 'concept': return <Lightbulb size={16} className="text-purple-500" />
    case 'paper': return <GraduationCap size={16} className="text-green-600" />
    default: return <FileText size={16} className="text-gray-400" />
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'category': return 'Categoria'
    case 'topic': return 'Tópico'
    case 'concept': return 'Conceito'
    case 'paper': return 'Paper'
    default: return ''
  }
}

function renderMarkdown(text: string) {
  // Simple markdown rendering
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Wikilinks [[Page]] -> styled span
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">$1 <span class="text-blue-300">↗</span></span>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 rounded text-xs font-mono">$1</code>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="text-gray-700 ml-4 list-disc text-sm">$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 py-1 my-2 text-gray-600 italic text-sm">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      if (match.includes('---')) return ''
      const cells = match.split('|').filter(c => c.trim())
      if (cells.length <= 1) return match
      return `<tr>${cells.map(c => `<td class="px-3 py-1.5 text-sm text-gray-700 border border-gray-200">${c.trim()}</td>`).join('')}</tr>`
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-gray-700 text-sm leading-relaxed mb-2">')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1 <ExternalLink size={10} /></a>')

  return `<p class="text-gray-700 text-sm leading-relaxed mb-2">${html}</p>`
}

function TreeNode({ item, depth, onSelect, selectedPath }: {
  item: ResearchItem
  depth: number
  onSelect: (path: string) => void
  selectedPath: string | null
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedPath === item.path

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          if (item.type === 'concept' || item.type === 'paper') {
            onSelect(item.path)
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors rounded-sm
          ${isSelected ? 'bg-red-50 text-red-800' : 'hover:bg-gray-50 text-gray-700'}
          ${depth === 0 ? 'font-semibold text-sm' : depth === 1 ? 'font-medium text-sm' : 'text-sm'}`}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
            : <ChevronRight size={14} className="shrink-0 text-gray-400" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {getTypeIcon(item.type)}
        <span className="truncate flex-1">{item.title || item.name}</span>
        {item.type !== 'category' && item.type !== 'topic' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0
            ${item.type === 'concept' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
            {getTypeLabel(item.type)}
          </span>
        )}
        {hasChildren && (
          <span className="text-[10px] text-gray-400 font-medium">
            {item.children!.length}
          </span>
        )}
      </button>
      {hasChildren && expanded && (
        <div>
          {item.children!.map((child, i) => (
            <TreeNode
              key={`${child.path}-${i}`}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PesquisasPage() {
  const [tree, setTree] = useState<ResearchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<FileContent | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/jira/api/pesquisas', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }
        setTree(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        setError('Erro ao carregar pesquisas: ' + err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedFile) return
    setContentLoading(true)
    setFileContent(null)
    fetch(`/jira/api/pesquisas?file=${encodeURIComponent(selectedFile)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setContentLoading(false)
          return
        }
        setFileContent(data)
        setContentLoading(false)
      })
      .catch(err => {
        setContentLoading(false)
      })
  }, [selectedFile])

  // Filter tree based on search
  const filterTree = (items: ResearchItem[], query: string): ResearchItem[] => {
    if (!query) return items
    return items
      .map(item => {
        const matches = item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        const filteredChildren = item.children ? filterTree(item.children, query) : []
        if (matches || filteredChildren.length > 0) {
          return { ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children }
        }
        return null
      })
      .filter(Boolean) as ResearchItem[]
  }

  const filteredTree = searchQuery ? filterTree(tree, searchQuery) : tree

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Carregando pesquisas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar de navegação */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-red-700" />
            <h2 className="text-sm font-bold text-gray-800">Research Vault</h2>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pesquisas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredTree.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Nenhum resultado encontrado.</p>
          ) : (
            filteredTree.map((item, i) => (
              <TreeNode
                key={`${item.path}-${i}`}
                item={item}
                depth={0}
                onSelect={setSelectedFile}
                selectedPath={selectedFile}
              />
            ))
          )}
        </div>
        <div className="p-2 border-t border-gray-100">
          <a
            href="https://github.com/Colab-Claro/research-obsidian"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink size={10} />
            Abrir vault no GitHub
          </a>
        </div>
      </div>

      {/* Área de conteúdo */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <BookOpen size={48} className="text-gray-200" />
            <p className="text-sm">Selecione um conceito ou paper na árvore ao lado</p>
            <p className="text-xs">Navegue pelas categorias de pesquisa do Colab Claro</p>
          </div>
        ) : contentLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : fileContent ? (
          <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{fileContent.title}</h1>
              {fileContent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fileContent.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className="prose prose-sm max-w-none
                prose-headings:text-gray-900 prose-headings:font-semibold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-li:text-gray-700
                prose-strong:text-gray-900
                prose-code:text-red-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:text-gray-500
                prose-a:text-blue-600 prose-a:underline
                prose-hr:border-gray-200"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent.content) }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">Erro ao carregar conteúdo.</p>
          </div>
        )}
      </div>
    </div>
  )
}