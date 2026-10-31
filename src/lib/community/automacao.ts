// Contas de automação que publicam na Comunidade (sem dependências de servidor: vale na tela e na API).

export interface ContaDeAutomacao {
  id: string
  username: string
  nome: string
  lab: string
  avatar: string
  /** Para onde o nome e a foto levam (a automação não tem perfil de pessoa). */
  href: string
  /** Texto do link para esse destino, no menu da publicação. */
  rotuloDoLink: string
}

/** "Sinais FT - beOn Labs": publica no fórum os sinais encontrados pelo Radar OSINT (ver sinais-osint.ts). */
export const AUTOMACAO_SINAIS = {
  id: 'sinais-ft',
  username: 'sinais-ft',
  nome: 'Sinais FT - beOn Labs',
  lab: 'Automação OSINT',
  avatar: '/jira/logobeonlabs.png',
  href: '/osint',
  rotuloDoLink: 'Abrir o Radar OSINT',
} as const satisfies ContaDeAutomacao

/** "beOn Radar - Newsletter": leva as notícias do dia para o fórum, cada uma com uma provocação (ver noticias-radar.ts). */
export const AUTOMACAO_RADAR = {
  id: 'beon-radar',
  username: 'beon-radar',
  nome: 'beOn Radar - Newsletter',
  lab: 'Automação Newsletter',
  avatar: '/jira/logobeonlabs.png',
  href: '/comunidade/newsletter',
  rotuloDoLink: 'Abrir o beOn Radar',
} as const satisfies ContaDeAutomacao

const CONTAS: ContaDeAutomacao[] = [AUTOMACAO_SINAIS, AUTOMACAO_RADAR]

export const ehAutomacaoDeSinais = (username: string) => username === AUTOMACAO_SINAIS.username
export const ehAutomacaoDoRadar = (username: string) => username === AUTOMACAO_RADAR.username

/** A conta de automação desse username, ou null se é uma pessoa. */
export const automacaoDe = (username: string): ContaDeAutomacao | null => CONTAS.find(c => c.username === username) ?? null
