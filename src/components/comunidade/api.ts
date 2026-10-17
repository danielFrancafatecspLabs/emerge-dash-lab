// Cliente HTTP da Comunidade: prefixa o basePath e transforma erros do servidor em mensagens legíveis.

export const BASE_PATH = '/jira'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  let res: Response
  try {
    res = await fetch(`${BASE_PATH}/api${path}`, {
      credentials: 'include',
      ...rest,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...rest.headers } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique sua rede e tente novamente.', 0)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível concluir a ação.'
    throw new ApiError((data && typeof data.error === 'string' && data.error) || fallback, res.status)
  }
  return data as T
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
}
