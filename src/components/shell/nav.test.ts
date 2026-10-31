import { describe, expect, it } from 'vitest'
import { decideAccess } from '@/lib/auth/access-policy'
import type { AuthSessionRole } from '@/lib/auth/session'
import { COMMUNITY_SHORTCUTS, communityAreasFor, portalGroupsFor } from './nav'

const PERFIS: AuthSessionRole[] = ['admin', 'executivo', 'financeiro', 'viewer', 'community']

describe('menu', () => {
  it.each(PERFIS)('só mostra ao perfil %s itens que ele pode abrir', role => {
    const itens = [...communityAreasFor(role), ...COMMUNITY_SHORTCUTS, ...portalGroupsFor(role).flatMap(g => g.items)]
    const bloqueados = itens.filter(i => decideAccess(i.href, 'GET', { role }).type !== 'allow').map(i => i.href)
    expect(bloqueados).toEqual([])
  })

  it('o OSINT aparece para admin e some para os demais', () => {
    expect(communityAreasFor('admin').map(i => i.href)).toContain('/osint')
    expect(communityAreasFor('community').map(i => i.href)).not.toContain('/osint')
  })
})
