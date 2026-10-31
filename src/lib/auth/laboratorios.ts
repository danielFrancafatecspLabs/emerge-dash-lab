// Laboratórios que a pessoa escolhe em Meu perfil (sem dependências de servidor: vale na tela e na API).

export const LABORATORIOS = ['Hitss', 'Digital', 'Dados & IA', 'GE'] as const
export type Laboratorio = typeof LABORATORIOS[number]
