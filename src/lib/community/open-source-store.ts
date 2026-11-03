import { randomUUID } from 'crypto'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import { REPOS_INICIAIS, slugDoRepo, type RepoInput, type RepoOss } from './open-source'

// Repositórios do World Open Source em data/open-source.json. Os do catálogo da beOn Labs (REPOS_INICIAIS) entram
// também quando o arquivo já existe: cada um que ainda não estiver lá aparece no fim da vitrine, sem mexer no que a
// comunidade publicou ou editou. Um repositório do catálogo removido por um admin vai para
// data/open-source-removidos.json e não volta.

const caminho = () => jsonStorePath('OPEN_SOURCE_FILE_PATH', 'open-source.json')
const caminhoRemovidos = () => jsonStorePath('OPEN_SOURCE_REMOVED_PATH', 'open-source-removidos.json')

const chave = (slug: string) => slug.toLowerCase()

export function loadRepos(): RepoOss[] {
  const salvos = readJsonStore<RepoOss[] | null>(caminho(), null) ?? []
  const removidos = new Set(readJsonStore<string[]>(caminhoRemovidos(), []).map(chave))
  const presentes = new Set(salvos.map(r => chave(r.slug)))
  // Cópia: editar não pode alterar o catálogo em memória.
  const doCatalogo = REPOS_INICIAIS.filter(r => !presentes.has(chave(r.slug)) && !removidos.has(chave(r.slug)))
  return [...salvos, ...structuredClone(doCatalogo)]
}

function saveRepos(repos: RepoOss[]) {
  writeJsonStore(caminho(), repos)
}

type Pessoa = { username: string; nome: string }

export function publicarRepo(input: RepoInput, autor: Pessoa, agora = new Date()): RepoOss | 'duplicado' {
  const repos = loadRepos()
  const slug = slugDoRepo(input.url) as string
  if (repos.some(r => r.slug.toLowerCase() === slug.toLowerCase())) return 'duplicado'
  const repo: RepoOss = { id: randomUUID(), slug, ...input, publicadoPor: autor, publicadoEm: agora.toISOString() }
  saveRepos([repo, ...repos])
  return repo
}

/** Qualquer pessoa edita; o registro guarda quem editou por último. */
export function editarRepo(id: string, input: RepoInput, autor: Pessoa, agora = new Date()): RepoOss | 'nao-encontrado' | 'duplicado' {
  const repos = loadRepos()
  const repo = repos.find(r => r.id === id)
  if (!repo) return 'nao-encontrado'
  const slug = slugDoRepo(input.url) as string
  if (repos.some(r => r.id !== id && r.slug.toLowerCase() === slug.toLowerCase())) return 'duplicado'
  Object.assign(repo, input, { slug, editadoPor: autor, editadoEm: agora.toISOString() })
  saveRepos(repos)
  return repo
}

/** Remove (só quem publicou ou um admin). */
export function removerRepo(id: string, quem: { username: string; admin: boolean }): 'ok' | 'nao-encontrado' | 'proibido' {
  const repos = loadRepos()
  const repo = repos.find(r => r.id === id)
  if (!repo) return 'nao-encontrado'
  if (!quem.admin && repo.publicadoPor.username !== quem.username) return 'proibido'
  saveRepos(repos.filter(r => r.id !== id))
  if (REPOS_INICIAIS.some(r => chave(r.slug) === chave(repo.slug))) {
    const removidos = readJsonStore<string[]>(caminhoRemovidos(), [])
    writeJsonStore(caminhoRemovidos(), [...new Set([...removidos, repo.slug])])
  }
  return 'ok'
}
