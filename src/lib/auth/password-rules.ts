// Regras de senha, sem dependências de servidor: valem no Admin, no cadastro e nos formulários.

export const MIN_PASSWORD_LENGTH = 10

/** Regra mínima para senhas (Admin e cadastro): tamanho e nada trivial. */
export function passwordProblem(password: unknown, username = ''): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
  const lower = password.toLowerCase()
  if (new Set(password).size < 4) return 'A senha é repetitiva demais'
  if (username && lower.includes(username.toLowerCase().split('@')[0])) return 'A senha não pode conter o nome de usuário'
  if (['password', 'senha', '123456', 'qwerty', 'admin', 'beonlabs', 'claro'].some(w => lower.includes(w))) return 'A senha é fácil de adivinhar'
  return null
}
