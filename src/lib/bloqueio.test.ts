import { describe, expect, it } from 'vitest'
import { ehCampoDeBloqueio, epicBloqueado, sinaisDeBloqueio, textoDoValor } from './bloqueio'
import type { JiraIssueFields } from './types'

const base = (extra: Partial<JiraIssueFields> = {}): JiraIssueFields =>
  ({ summary: 'X', status: { id: '3', name: 'Em andamento' }, issuetype: { name: 'Epic' }, ...extra }) as JiraIssueFields

describe('textoDoValor', () => {
  it('lê texto, opção, lista de opções e documento ADF', () => {
    expect(textoDoValor([{ self: 'x', value: 'Impediment', id: '10019' }])).toBe('Impediment')
    expect(textoDoValor({ value: 'Aguardando dados' })).toBe('Aguardando dados')
    expect(textoDoValor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sem acesso à base' }] }] })).toBe('Sem acesso à base')
    expect(textoDoValor([])).toBe('')
    expect(textoDoValor(null)).toBe('')
  })
})

describe('sinaisDeBloqueio', () => {
  it('reconhece a flag de impedimento como a API devolve (lista de opções)', () => {
    const b = sinaisDeBloqueio(base({ customfield_10021: [{ value: 'Impediment', id: '10019' }] }))
    expect(b.flag).toBe(true)
    expect(b.sinais).toEqual(['Sinalizado com a flag de impedimento'])
  })

  it('usa os campos resolvidos pelo nome (ids novos da migração) e ignora valores negativos', () => {
    const b = sinaisDeBloqueio(base({
      customfield_13406: null,
      bloqueioCampos: [
        { id: 'customfield_31999', nome: 'Motivo de Bloqueio', valor: 'Dependência de TI' },
        { id: 'customfield_31998', nome: 'Tipo de Impedimento', valor: 'Interno' },
        { id: 'customfield_31997', nome: 'Bloqueado?', valor: 'Não' },
      ],
    }))
    expect(b.motivo).toBe('Dependência de TI')
    expect(b.tipo).toBe('Interno')
    expect(b.sinais).toEqual(['Motivo de Bloqueio: Dependência de TI', 'Tipo de Impedimento: Interno'])
  })

  it('reconhece status, etiqueta e vínculo "is blocked by" ainda aberto', () => {
    const b = sinaisDeBloqueio(base({
      status: { id: '999', name: 'BLOQUEADO' },
      labels: ['bloqueado-infra', 'ia'],
      issuelinks: [
        { type: { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' }, inwardIssue: { key: 'GL-9', fields: { summary: 'Liberar VPN', status: { statusCategory: { key: 'indeterminate' } } } } },
        { type: { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' }, inwardIssue: { key: 'GL-8', fields: { status: { statusCategory: { key: 'done' } } } } },
        { type: { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' }, outwardIssue: { key: 'GL-7' } },
      ],
    }))
    expect(b.sinais).toEqual(['Status no Jira: BLOQUEADO', 'Etiqueta: bloqueado-infra', 'Bloqueado por GL-9 (Liberar VPN)'])
  })

  it('sem campos resolvidos, cai nos ids conhecidos', () => {
    expect(sinaisDeBloqueio(base({ customfield_13406: { value: 'Inatividade do Ponto Focal' } })).motivo).toBe('Inatividade do Ponto Focal')
    expect(sinaisDeBloqueio(base()).sinais).toEqual([])
  })
})

describe('epicBloqueado', () => {
  it('só conta o que está aberto (o motivo também guarda o motivo de cancelamento)', () => {
    const sinais = ['Sinalizado com a flag de impedimento']
    expect(epicBloqueado({ status: { id: '3', name: 'Em andamento' }, motivoBloqueio: null, flagged: null, sinaisBloqueio: sinais })).toBe(true)
    expect(epicBloqueado({ status: { id: '10015', name: 'CANCELADO' }, motivoBloqueio: 'Despriorizado', flagged: null, sinaisBloqueio: sinais })).toBe(false)
    expect(epicBloqueado({ status: { id: '10019', name: 'Concluído' }, motivoBloqueio: null, flagged: true })).toBe(false)
    expect(epicBloqueado({ status: { id: '10004', name: 'BACKLOG' }, motivoBloqueio: null, flagged: null, sinaisBloqueio: [] })).toBe(false)
  })

  it('reconhece campos de bloqueio pelo nome', () => {
    expect(['Flagged', 'Motivo de Bloqueio', 'Tipo de Impedimento', 'Bloqueado?', 'Sinalizado'].every(ehCampoDeBloqueio)).toBe(true)
    expect(['Sponsor', 'Domínio', 'Tecnologia', 'Data do bloqueio', 'Dias bloqueado'].some(ehCampoDeBloqueio)).toBe(false)
  })
})
