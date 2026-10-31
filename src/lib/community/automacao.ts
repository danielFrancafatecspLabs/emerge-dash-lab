// Contas de automação que publicam na Comunidade (sem dependências de servidor: vale na tela e na API).

/** "Sinais FT - beOn Labs": publica no fórum os sinais encontrados pelo Radar OSINT (ver sinais-osint.ts). */
export const AUTOMACAO_SINAIS = {
  id: 'sinais-ft',
  username: 'sinais-ft',
  nome: 'Sinais FT - beOn Labs',
  lab: 'Automação OSINT',
  avatar: '/jira/logobeonlabs.png',
  /** Para onde o nome e a foto levam (a automação não tem perfil de pessoa). */
  href: '/osint',
} as const

export const ehAutomacaoDeSinais = (username: string) => username === AUTOMACAO_SINAIS.username
