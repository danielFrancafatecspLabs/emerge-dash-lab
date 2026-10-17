import { describe, expect, it } from 'vitest'
import { CONVERSA_INICIAL, conversaReducer, lerBlocosSse, rotaCientista, type EstadoCientista } from '@/lib/community/cientista'

const estado = (over: Partial<EstadoCientista> = {}): EstadoCientista => ({
  id: 's1', nome: 'Ana', papel: 'solicitante', status: 'conversa', ficha: {}, pendencias: [], ficha_gerada: false, ficha_versao: 0,
  mapa: { cobertura: 0, pronto: false, sintese: null, sintese_confirmada: false, pergunta_atual: null, dimensoes: [] },
  desenho_pendencias: null, encaminhamento: null, feedback_lab: null, transcricao: [], ...over,
})

describe('rotaCientista', () => {
  it('libera só a conversa e as consultas públicas', () => {
    expect(rotaCientista('GET', ['papeis'])).toEqual({ tipo: 'publica' })
    expect(rotaCientista('POST', ['sessoes'])).toEqual({ tipo: 'criar_sessao' })
    expect(rotaCientista('POST', ['sessoes', 'abc', 'mensagens'])).toEqual({ tipo: 'sessao', sid: 'abc' })
    expect(rotaCientista('GET', ['sessoes', 'abc', 'kit.zip'])).toEqual({ tipo: 'sessao', sid: 'abc' })
  })

  it('bloqueia o painel do Lab, do Sponsor, a bancada e caminhos estranhos', () => {
    expect(rotaCientista('GET', ['experimentos'])).toBeNull()
    expect(rotaCientista('POST', ['experimentos', 'abc', 'revisao'])).toBeNull()
    expect(rotaCientista('POST', ['sessoes', 'abc', 'bancada'])).toBeNull()
    expect(rotaCientista('GET', ['recursos', 'pedidos'])).toBeNull()
    expect(rotaCientista('GET', ['sessoes', '..', 'kit'])).toBeNull()
    expect(rotaCientista('POST', ['sessoes', 'abc', 'mensagens', 'x'])).toBeNull()
  })
})

describe('lerBlocosSse', () => {
  it('devolve eventos completos e guarda o pedaço incompleto', () => {
    const r = lerBlocosSse('data: {"type":"text","delta":"Oi"}\n\ndata: {"type":"chips","options":["a"]}\n\ndata: {"type":"te')
    expect(r.eventos).toEqual([{ type: 'text', delta: 'Oi' }, { type: 'chips', options: ['a'] }])
    expect(r.resto).toBe('data: {"type":"te')
  })
})

describe('conversaReducer', () => {
  it('monta a fala do Cientista com texto, porquê e cards, e fecha no done', () => {
    let s = conversaReducer(CONVERSA_INICIAL, { t: 'carregado', estado: estado() })
    s = conversaReducer(s, { t: 'pensando' })
    s = conversaReducer(s, { t: 'evento', e: { type: 'text', delta: 'Quando ' } })
    s = conversaReducer(s, { t: 'evento', e: { type: 'text', delta: 'acontece?' } })
    s = conversaReducer(s, { t: 'evento', e: { type: 'porque', dimensao: 'caso_concreto', tecnica: 'caso', por_que: 'Um caso real ajuda.' } })
    s = conversaReducer(s, { t: 'evento', e: { type: 'chips', options: ['Toda semana'] } })
    expect(s.ocupado).toBe(true)
    expect(s.itens).toHaveLength(1)
    expect(s.itens[0]).toMatchObject({ de: 'cientista', texto: 'Quando acontece?', porque: { por_que: 'Um caso real ajuda.' }, aberto: true })

    s = conversaReducer(s, { t: 'evento', e: { type: 'done', state: estado({ ficha: { titulo: 'Busca FAQ' } }) } })
    expect(s.ocupado).toBe(false)
    expect(s.itens[0].aberto).toBe(false)
    expect(s.estado?.ficha.titulo).toBe('Busca FAQ')

    s = conversaReducer(s, { t: 'pessoa', texto: 'Toda semana' })
    expect(s.chips).toEqual([])
    expect(s.itens.map(i => i.de)).toEqual(['cientista', 'pessoa'])
  })

  it('mostra o erro como mensagem do sistema e libera o envio', () => {
    let s = conversaReducer({ ...CONVERSA_INICIAL, ocupado: true }, { t: 'evento', e: { type: 'error', message: 'Modelo indisponível' } })
    expect(s.ocupado).toBe(false)
    expect(s.itens.at(-1)).toMatchObject({ de: 'sistema', erro: true, texto: 'Modelo indisponível' })
    s = conversaReducer(s, { t: 'evento', e: { type: 'done', state: estado() } })
    expect(s.itens.at(-1)?.de).toBe('sistema')
  })
})
