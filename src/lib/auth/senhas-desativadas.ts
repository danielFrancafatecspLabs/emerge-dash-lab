import { pbkdf2Sync, timingSafeEqual } from 'crypto'

/**
 * Senhas desativadas pelo admin: não valem para entrar nem para cadastrar. Guardamos só uma impressão (PBKDF2), nunca
 * a senha. Quem usava uma delas recebe uma senha nova de um admin.
 */
const SAL = 'beon-contas-v2'
const DESATIVADAS: string[] = ["7e620caee208a1d1dee90e0b33e0cea893df9606fffa073d996c434ccc389701","05d14b30e770d53123fb5759ccc8d06ac4ddee997809d7b09aa892621db17e35"]

const impressao = (senha: string) => pbkdf2Sync(senha, SAL, 210000, 32, 'sha512')

export function senhaDesativada(senha: unknown): boolean {
  if (typeof senha !== 'string' || !senha) return false
  const d = impressao(senha)
  return DESATIVADAS.some(h => {
    const b = Buffer.from(h, 'hex')
    return b.length === d.length && timingSafeEqual(b, d)
  })
}

export const MENSAGEM_SENHA_DESATIVADA = 'Esta senha não pode mais ser usada. Escolha outra.'
