import { describe, expect, it } from 'vitest'
import { isHttpUrl, isSafeLink } from './url'

describe('validação de URLs', () => {
  it('aceita http(s) e caminhos internos', () => {
    expect(isHttpUrl('https://claro.com.br/x')).toBe(true)
    expect(isSafeLink('/comunidade/trilha')).toBe(true)
  })

  it('recusa esquemas perigosos e URLs relativas a outro host', () => {
    for (const v of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', '/\\evil.com', 'ftp://x']) expect(isSafeLink(v)).toBe(false)
  })
})
