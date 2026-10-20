import { describe, expect, it } from 'vitest'
import { applyProfilePatch, emptyProfile } from '@/lib/community/profile'

describe('applyProfilePatch', () => {
  const base = emptyProfile('eu')
  const now = new Date('2026-10-17T12:00:00Z')

  it('aceita só campos permitidos e tópicos conhecidos', () => {
    const p = applyProfilePatch(base, { cargo: '  Cientista de dados ', interesses: ['ia', 'nao-existe'], username: 'outro' } as never, now)
    expect(p).toMatchObject({ username: 'eu', cargo: 'Cientista de dados', interesses: ['ia'] })
  })

  it('alterna salvos, pessoas e etapas da trilha, sem seguir a si mesmo', () => {
    let p = applyProfilePatch(base, { toggleSalvo: 'post-1', togglePessoa: 'ana', toggleEtapa: 'hipotese' }, now)
    p = applyProfilePatch(p, { toggleEtapa: 'boas-vindas', togglePessoa: 'eu' }, now)
    expect(p).toMatchObject({ salvos: ['post-1'], pessoasSeguidas: ['ana'], trilhaConcluida: ['boas-vindas', 'hipotese'] })
    p = applyProfilePatch(p, { toggleSalvo: 'post-1', toggleEtapa: 'nao-existe' }, now)
    p = applyProfilePatch(p, { toggleEtapa: 3 }, now)
    expect(p).toMatchObject({ salvos: [], trilhaConcluida: ['boas-vindas', 'hipotese'] })
    p = applyProfilePatch(p, { toggleEtapa: 'boas-vindas' }, now)
    expect(p.trilhaConcluida).toEqual(['hipotese'])
  })

  it('marca onboarding uma única vez e registra quando as notificações foram vistas', () => {
    const p = applyProfilePatch(base, { concluirOnboarding: true, marcarNotificacoesVistas: true, notificacoes: { comentarios: false, outra: true } }, now)
    expect(p).toMatchObject({ onboardedAt: now.toISOString(), notificacoesVistasEm: now.toISOString(), notificacoes: { comentarios: false, respostas: true, mensagens: true } })
    expect(applyProfilePatch(p, { concluirOnboarding: true }, new Date('2027-01-01')).onboardedAt).toBe(now.toISOString())
  })
})

describe('normalizarTrilha', () => {
  it('converte o progresso da trilha antiga (números) e mantém a ordem das etapas', async () => {
    const { normalizarTrilha } = await import('@/lib/community/trilha')
    expect(normalizarTrilha([8, 1, 'boas-vindas', 1, 42, 'x'])).toEqual(['boas-vindas', 'problema', 'aprendizado'])
    expect(normalizarTrilha(undefined)).toEqual([])
  })
})

describe('sessões do Cientista', () => {
  it('registra a sessão no topo, sem duplicar, e reconhece o dono', async () => {
    const { registrarSessaoCientista, isDonoSessaoCientista } = await import('@/lib/community/profile')
    let p = registrarSessaoCientista(emptyProfile('eu'), { id: 'a', papel: 'solicitante', criadaEm: '2026-10-17T10:00:00Z' })
    p = registrarSessaoCientista(p, { id: 'b', papel: 'desenvolvedor', criadaEm: '2026-10-17T11:00:00Z' })
    p = registrarSessaoCientista(p, { id: 'a', papel: 'solicitante', criadaEm: '2026-10-17T10:00:00Z' })
    expect(p.cientistaSessoes.map(s => s.id)).toEqual(['a', 'b'])
    expect(isDonoSessaoCientista(p, 'b')).toBe(true)
    expect(isDonoSessaoCientista(p, 'c')).toBe(false)
  })

  it('não deixa o PATCH do perfil mexer nas sessões', () => {
    const p = applyProfilePatch(emptyProfile('eu'), { cientistaSessoes: [{ id: 'x' }] } as never)
    expect(p.cientistaSessoes).toEqual([])
  })
})
