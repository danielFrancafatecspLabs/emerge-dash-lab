import { NextResponse } from 'next/server'

const GITHUB_RAW = 'https://raw.githubusercontent.com/Colab-Claro/research-obsidian/main'
const GITHUB_API = 'https://api.github.com/repos/Colab-Claro/research-obsidian/contents'

interface ResearchItem {
  name: string
  path: string
  type: 'category' | 'topic' | 'concept' | 'paper'
  title: string
  tags: string[]
  children?: ResearchItem[]
}

// Cache em memória
let cachedTree: ResearchItem[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

async function fetchWithCache(url: string) {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3.raw' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

function extractFrontmatter(content: string): { title: string; tags: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { title: '', tags: [] }

  const frontmatter = match[1]
  const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/)
  const title = titleMatch ? titleMatch[1].trim() : ''

  const tags: string[] = []
  const tagSection = frontmatter.match(/tags:\n((?:\s+- .+\n?)*)/)
  if (tagSection) {
    const tagLines = tagSection[1].match(/- (.+)/g)
    if (tagLines) {
      tagLines.forEach(t => tags.push(t.replace('- ', '').trim().replace(/"/g, '')))
    }
  }
  // Also check inline tags
  const inlineTags = frontmatter.match(/tags:\s*\[([^\]]+)\]/)
  if (inlineTags) {
    inlineTags[1].split(',').forEach(t => tags.push(t.trim().replace(/"/g, '')))
  }

  return { title, tags }
}

async function buildTree(): Promise<ResearchItem[]> {
  const items: ResearchItem[] = []

  try {
    // Fetch the Researches Index to get categories
    const indexContent = await fetch(`https://raw.githubusercontent.com/Colab-Claro/research-obsidian/main/Researches%20Index.md`, {
      next: { revalidate: 300 },
    }).then(r => r.text())

    // Extract category links from the index
    const categoryLinks = indexContent.match(/\[\[([^\]]+)\]\]/g) || []
    const categoryNames = categoryLinks
      .map(l => l.replace(/\[\[|\]\]/g, '').trim())
      .filter(name => name !== 'Researches Index')

    for (const categoryName of categoryNames) {
      const categoryPath = `Researchs/${categoryName}/${categoryName}.md`
      const encodedPath = categoryPath.replace(/ /g, '%20')

      try {
        const catContent = await fetch(`${GITHUB_RAW}/${encodedPath}`, {
          next: { revalidate: 300 },
        }).then(r => r.text())

        const { title, tags } = extractFrontmatter(catContent)

        // Get subdirectories (topics) inside this category
        const apiPath = `Researchs/${categoryName}`.replace(/ /g, '%20')
        const contents = await fetch(`${GITHUB_API}/${apiPath}`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
          next: { revalidate: 300 },
        }).then(r => r.json())

        const topics: ResearchItem[] = []

        if (Array.isArray(contents)) {
          for (const item of contents) {
            if (item.type === 'dir' && item.name !== 'Concepts' && item.name !== 'Papers') {
              // It's a topic folder
              const topicName = item.name
              const topicIndexPath = `Researchs/${categoryName}/${topicName}/${topicName}.md`
              const encodedTopicPath = topicIndexPath.replace(/ /g, '%20')

              let topicTitle = topicName
              let topicTags: string[] = []

              try {
                const topicContent = await fetch(`${GITHUB_RAW}/${encodedTopicPath}`, {
                  next: { revalidate: 300 },
                }).then(r => r.text())
                const fm = extractFrontmatter(topicContent)
                topicTitle = fm.title || topicName
                topicTags = fm.tags
              } catch {
                // Topic index file might not exist
              }

              // Get concepts and papers inside this topic
              const concepts: ResearchItem[] = []
              const papers: ResearchItem[] = []

              try {
                const topicContents = await fetch(`${GITHUB_API}/Researchs/${categoryName}/${topicName}`, {
                  headers: { Accept: 'application/vnd.github.v3+json' },
                  next: { revalidate: 300 },
                }).then(r => r.json())

                if (Array.isArray(topicContents)) {
                  for (const sub of topicContents) {
                    if (sub.type === 'dir') {
                      if (sub.name === 'Concepts') {
                        const conceptItems = await fetch(`${GITHUB_API}/Researchs/${categoryName}/${topicName}/Concepts`, {
                          headers: { Accept: 'application/vnd.github.v3+json' },
                          next: { revalidate: 300 },
                        }).then(r => r.json())

                        if (Array.isArray(conceptItems)) {
                          for (const c of conceptItems) {
                            if (c.name.endsWith('.md')) {
                              const conceptContent = await fetch(`${GITHUB_RAW}/Researchs/${categoryName}/${topicName}/Concepts/${encodeURIComponent(c.name)}`, {
                                next: { revalidate: 300 },
                              }).then(r => r.text())
                              const fm = extractFrontmatter(conceptContent)
                              concepts.push({
                                name: c.name.replace('.md', ''),
                                path: `Researchs/${categoryName}/${topicName}/Concepts/${c.name}`,
                                type: 'concept',
                                title: fm.title || c.name.replace('.md', ''),
                                tags: fm.tags,
                              })
                            }
                          }
                        }
                      } else if (sub.name === 'Papers') {
                        const paperItems = await fetch(`${GITHUB_API}/Researchs/${categoryName}/${topicName}/Papers`, {
                          headers: { Accept: 'application/vnd.github.v3+json' },
                          next: { revalidate: 300 },
                        }).then(r => r.json())

                        if (Array.isArray(paperItems)) {
                          for (const p of paperItems) {
                            if (p.name.endsWith('.md')) {
                              const paperContent = await fetch(`${GITHUB_RAW}/Researchs/${categoryName}/${topicName}/Papers/${encodeURIComponent(p.name)}`, {
                                next: { revalidate: 300 },
                              }).then(r => r.text())
                              const fm = extractFrontmatter(paperContent)
                              papers.push({
                                name: p.name.replace('.md', ''),
                                path: `Researchs/${categoryName}/${topicName}/Papers/${p.name}`,
                                type: 'paper',
                                title: fm.title || p.name.replace('.md', ''),
                                tags: fm.tags,
                              })
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } catch {
                // ignore
              }

              topics.push({
                name: topicName,
                path: topicIndexPath,
                type: 'topic',
                title: topicTitle,
                tags: topicTags,
                children: [...concepts, ...papers],
              })
            }
          }
        }

        items.push({
          name: categoryName,
          path: categoryPath,
          type: 'category',
          title: title || categoryName,
          tags,
          children: topics,
        })
      } catch {
        // Category index file might not exist
      }
    }
  } catch (e) {
    console.error('Error building research tree:', e)
  }

  return items
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')

  // If a specific file is requested, return its content
  if (file) {
    try {
      const encodedPath = file.replace(/ /g, '%20')
      const content = await fetch(`${GITHUB_RAW}/${encodedPath}`, {
        next: { revalidate: 300 },
      }).then(r => r.text())

      const { title, tags } = extractFrontmatter(content)
      // Remove frontmatter from content for display
      const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')

      return NextResponse.json({ title, tags, content: body, raw: content })
    } catch (e) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  // Otherwise return the full tree
  const now = Date.now()
  if (!cachedTree || now - cacheTimestamp > CACHE_TTL) {
    cachedTree = await buildTree()
    cacheTimestamp = now
  }

  return NextResponse.json(cachedTree)
}