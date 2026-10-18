// Ajudantes de sessão usados no navegador (login, moldura do portal e Comunidade).

import type { AuthSessionRole } from './session'

export const ROLE_LABEL: Record<AuthSessionRole, string> = {
  admin: 'Administrador',
  executivo: 'Executivo',
  viewer: 'Leitura',
  financeiro: 'Financeiro',
  community: 'Comunidade',
}

/** Página inicial de cada perfil depois do login. */
export function homeFor(role: AuthSessionRole): string {
  return role === 'community' ? '/comunidade' : '/estrategia'
}

/** Encerra a sessão e volta para o login (com recarga completa, para limpar o estado da página). */
export async function logout(): Promise<void> {
  try {
    // Restos de versões antigas, que guardavam o perfil no navegador.
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')
  } catch { /* armazenamento indisponível */ }
  await fetch('/jira/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.replace('/jira/login')
}
