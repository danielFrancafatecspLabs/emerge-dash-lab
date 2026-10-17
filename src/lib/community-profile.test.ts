import { describe, expect, it } from 'vitest'
import { applyProfilePatch, emptyProfile } from './community-profile'

describe('applyProfilePatch', () => {
  const base = emptyProfile('eu')
  const now = new Date('2026-10-17T12:00:00Z')

  it('aceita só campos permitidos e tópicos conhecidos', () => {
    const p = applyProfilePatch(base, { cargo: '  Cientista de dados ', interesses: ['ia', 'nao-existe'], username: 'outro' } as never, now)
    expect(p).toMatchObject({ username: 'eu', cargo: 'Cientista de dados', interesses: ['ia'] })
  })

  it('alterna salvos, pessoas e etapas da trilha, sem seguir a si mesmo', () => {
    let p = applyProfilePatch(base, { toggleSalvo: 'post-1', togglePessoa: 'ana', toggleEtapa: 3 }, now)
    p = applyProfilePatch(p, { toggleEtapa: 1, togglePessoa: 'eu' }, now)
    expect(p).toMatchObject({ salvos: ['post-1'], pessoasSeguidas: ['ana'], trilhaConcluida: [1, 3] })
    p = applyProfilePatch(p, { toggleSalvo: 'post-1', toggleEtapa: 99 }, now)
    expect(p).toMatchObject({ salvos: [], trilhaConcluida: [1, 3] })
  })

  it('marca onboarding uma única vez e registra quando as notificações foram vistas', () => {
    const p = applyProfilePatch(base, { concluirOnboarding: true, marcarNotificacoesVistas: true, notificacoes: { comentarios: false, outra: true } }, now)
    expect(p).toMatchObject({ onboardedAt: now.toISOString(), notificacoesVistasEm: now.toISOString(), notificacoes: { comentarios: false, respostas: true, mensagens: true } })
    expect(applyProfilePatch(p, { concluirOnboarding: true }, new Date('2027-01-01')).onboardedAt).toBe(now.toISOString())
  })
})
