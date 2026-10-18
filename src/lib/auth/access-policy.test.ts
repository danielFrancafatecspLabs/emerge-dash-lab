import { describe, expect, it } from 'vitest'
import { decideAccess } from './access-policy'

const as = (role: 'admin' | 'executivo' | 'viewer' | 'financeiro' | 'community') => ({ role })

describe('decideAccess', () => {
  it('libera login e imagens públicas, e exige sessão para o resto', () => {
    expect(decideAccess('/login', 'GET', null)).toEqual({ type: 'allow' })
    expect(decideAccess('/logobeonlabs.png', 'GET', null)).toEqual({ type: 'allow' })
    expect(decideAccess('/api/auth/register', 'POST', null)).toEqual({ type: 'allow' })
    expect(decideAccess('/api/admin/users/x/aprovacao', 'POST', null)).toEqual({ type: 'unauthenticated' })
    expect(decideAccess('/api/auth/me', 'GET', null)).toEqual({ type: 'unauthenticated' })
    expect(decideAccess('/api/clear-cache', 'POST', null)).toEqual({ type: 'unauthenticated' })
    expect(decideAccess('/login-falso', 'GET', null)).toEqual({ type: 'unauthenticated' })
  })

  it('restringe administração, LLM e limpeza de cache por papel', () => {
    expect(decideAccess('/admin/stories', 'GET', as('executivo')).type).toBe('forbidden')
    expect(decideAccess('/api/cientista/llm', 'POST', as('executivo')).type).toBe('forbidden')
    expect(decideAccess('/api/cientista/llm', 'POST', as('admin')).type).toBe('allow')
    expect(decideAccess('/api/estrategia/insights', 'POST', as('executivo')).type).toBe('allow')
    expect(decideAccess('/api/clear-cache', 'POST', as('viewer')).type).toBe('forbidden')
    expect(decideAccess('/estrategia', 'GET', as('viewer')).type).toBe('allow')
  })

  it('mantém a role community dentro da Comunidade', () => {
    expect(decideAccess('/comunidade/trilha', 'GET', as('community'))).toEqual({ type: 'allow' })
    expect(decideAccess('/api/pesquisas', 'GET', as('community'))).toEqual({ type: 'allow' })
    expect(decideAccess('/api/pesquisas', 'POST', as('community')).type).toBe('forbidden')
    expect(decideAccess('/estrategia', 'GET', as('community'))).toMatchObject({ type: 'forbidden', redirectTo: '/comunidade' })
  })
})
