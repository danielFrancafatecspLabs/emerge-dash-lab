import { jsonStorePath, readJsonStore, writeJsonStore } from '@/lib/storage/json-store'
import type { LinksDoExperimento } from './experimentos-ativos'

// Links da ficha e do relatório de cada Experimento, cadastrados pelos admins para a Comunidade abrir.
// Ficam em data/experimentos-links.json, pela chave do Epic no Jira.

const caminho = () => jsonStorePath('EXPERIMENTOS_LINKS_PATH', 'experimentos-links.json')

export const lerLinks = (): Record<string, LinksDoExperimento> => readJsonStore<Record<string, LinksDoExperimento>>(caminho(), {})

export const ehChaveDeEpic = (chave: string) => /^[A-Z][A-Z0-9]{0,9}-\d{1,7}$/.test(chave)

function url(valor: unknown): string | null | 'invalido' {
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'string') return 'invalido'
  const v = valor.trim()
  if (!v) return null
  if (v.length > 2000) return 'invalido'
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : 'invalido'
  } catch {
    return 'invalido'
  }
}

/** Valida o pedido: cada link é uma URL http(s) ou vazio (vazio remove). */
export function validarLinks(body: unknown): { ficha: string | null; relatorio: string | null } | { erro: string } {
  const b = (body ?? {}) as { ficha?: unknown; relatorio?: unknown }
  const ficha = url(b.ficha)
  const relatorio = url(b.relatorio)
  if (ficha === 'invalido') return { erro: 'O link da ficha precisa ser um endereço http:// ou https://' }
  if (relatorio === 'invalido') return { erro: 'O link do relatório precisa ser um endereço http:// ou https://' }
  return { ficha, relatorio }
}

export function salvarLinks(chave: string, links: { ficha: string | null; relatorio: string | null }, quem: string, agora = new Date()): LinksDoExperimento {
  const todos = lerLinks()
  const novo: LinksDoExperimento = {
    ...(links.ficha ? { ficha: links.ficha } : {}),
    ...(links.relatorio ? { relatorio: links.relatorio } : {}),
    atualizadoPor: quem,
    atualizadoEm: agora.toISOString(),
  }
  if (!novo.ficha && !novo.relatorio) delete todos[chave]
  else todos[chave] = novo
  writeJsonStore(caminho(), todos)
  return novo
}
