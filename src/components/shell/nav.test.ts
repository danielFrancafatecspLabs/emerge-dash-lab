import { describe, expect, it } from 'vitest'
import { decideAccess } from '@/lib/auth/access-policy'
import type { AuthSessionRole } from '@/lib/auth/session'
import { COMMUNITY_SHORTCUTS, FUTURE_THINKING, communityAreasFor, portalGroupsFor } from './nav'

const PERFIS: AuthSessionRole[] = ['admin', 'executivo', 'financeiro', 'viewer', 'community']

describe('menu', () => {
  it.each(PERFIS)('só mostra ao perfil %s itens que ele pode abrir', role => {
    const itens = [...communityAreasFor(role), ...COMMUNITY_SHORTCUTS, ...FUTURE_THINKING.items, ...portalGroupsFor(role).flatMap(g => g.items)]
    const bloqueados = itens.filter(i => decideAccess(i.href, 'GET', { role }).type !== 'allow').map(i => i.href)
    expect(bloqueados).toEqual([])
  })

  it('o OSINT aparece para todos os perfis', () => {
    for (const role of PERFIS) expect(communityAreasFor(role).map(i => i.href)).toContain('/osint')
  })
})
