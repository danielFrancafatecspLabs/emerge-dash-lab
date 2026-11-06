import { pbkdf2Sync, timingSafeEqual } from 'crypto'

/**
 * Senhas que já circularam fora do app e não valem mais para entrar nem para cadastrar. Guardamos só uma impressão
 * de mão única (PBKDF2), nunca a senha. Quem tinha uma delas precisa receber uma senha nova de um admin.
 */
const SAL = 'beon-senhas-expostas-v1'
const EXPOSTAS: string[] = ["8c48c1b5b6e254e43531a6c461621f3180446e40eb7de27e8def87c8f23b6d79","e1b39331438c9ec21a3e131eb4266e3298a94cb39cfacedafb840ba1de37b20c"]

const impressao = (senha: string) => pbkdf2Sync(senha, SAL, 210000, 32, 'sha512')

export function senhaExposta(senha: unknown): boolean {
  if (typeof senha !== 'string' || !senha) return false
  const d = impressao(senha)
  return EXPOSTAS.some(h => {
    const b = Buffer.from(h, 'hex')
    return b.length === d.length && timingSafeEqual(b, d)
  })
}

export const MENSAGEM_SENHA_EXPOSTA = 'Esta senha não pode mais ser usada. Escolha outra.'
