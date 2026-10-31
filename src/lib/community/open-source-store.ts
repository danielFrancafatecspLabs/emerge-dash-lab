import { randomUUID } from 'crypto'
import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import { REPOS_INICIAIS, slugDoRepo, type RepoInput, type RepoOss } from './open-source'

// Repositórios do World Open Source em data/open-source.json; sem o arquivo, a vitrine começa com REPOS_INICIAIS.

const caminho = () => jsonStorePath('OPEN_SOURCE_FILE_PATH', 'open-source.json')

export function loadRepos(): RepoOss[] {
  // Cópia: editar não pode alterar os repositórios iniciais em memória.
  return readJsonStore<RepoOss[] | null>(caminho(), null) ?? structuredClone(REPOS_INICIAIS)
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
  return 'ok'
}
