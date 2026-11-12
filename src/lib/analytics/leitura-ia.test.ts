import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { RelatorioConsistencia } from './consistencia'
import { conferirResposta, decidirGeracao, diaEmSaoPaulo, montarFatos, montarPedido, type LeituraGuardada } from './leitura-ia'
import { estadoDaLeitura, gerarLeituraDoDia } from './leitura-ia-servidor'

// Um relatório pequeno, com uma divergência (bloqueados: 5 × 18), uma conferência que bate e um alerta de cadastro.
const rel = {
  geradoEm: '2026-11-12T10:00:00.000Z',
  parecer: { nivel: 'atencao', titulo: 'Uma conferência diverge: bloqueados' },
  telas: [{ tela: 'Portfólio', situacao: 'destoa', conferencias: 4, divergencias: 1 }],
  verificacoes: [
    {
      id: 'bloqueados', titulo: 'Bloqueados', ok: false, pergunta: 'Quantos experimentos estão bloqueados?', natureza: 'telas',
      veredito: 'O Portfólio conta 18 e o Semanal conta 5.', valores: { Semanal: 5, Portfólio: 18 }, destoam: ['Portfólio'],
      explicacao: ['O Portfólio conta como bloqueado tudo que está em Em validação.'], impacto: 'O número de bloqueados do Portfólio fica inflado.',
      acoes: [{ onde: 'App', texto: 'Alinhar a regra de bloqueio.' }],
      diagnostico: { diferencas: [{ conta: 'Portfólio', naoConta: 'Semanal', itens: [{ key: 'GL-275', nome: 'Livia', status: 'EM VALIDAÇÃO', mae: 'GL-366', beneficio: 12_000_000 }] }] },
    },
    { id: 'validadas', titulo: 'Validadas', ok: true, veredito: 'Todas as telas contam 4 hipóteses validadas.', valores: { Semanal: 4 } },
  ],
  alertas: [{ id: 'sem-mae', titulo: 'Experimentos sem iniciativa-mãe', quantidade: 3, gravidade: 'corrigir', impacto: 'Ficam fora do funil.', porQueImporta: 'x', oQueFazer: 'Vincular no Jira.', exemplos: ['GL-17'] }],
  movimento: null,
} as unknown as RelatorioConsistencia

const resposta = (o: Record<string, unknown>) => '```json\n' + JSON.stringify({ manchete: 'Bloqueados divergem entre Portfólio e Semanal', situacao: 'ok', pontos: [], mudancas: null, perguntas: [], ...o }) + '\n```'
const ponto = (o: Record<string, unknown> = {}) => ({ titulo: 'Bloqueados inflados no Portfólio', explicacao: 'O Portfólio conta 18 e o Semanal 5 porque Em validação vira bloqueio.', prioridade: 'alta', evidencias: ['GL-275', 'bloqueados'], acao: { onde: 'App', texto: 'Alinhar a regra.' }, ...o })

describe('leitura da IA: quando gerar', () => {
  const agora = new Date('2026-11-12T15:00:00Z')
  const hoje = diaEmSaoPaulo(agora)
  it('gera uma vez por dia', () => {
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: null, tentativas: null })).toEqual({ gerar: true })
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: { dia: hoje } as LeituraGuardada, tentativas: null })).toEqual({ gerar: false, motivo: 'ja-gerada-hoje' })
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: { dia: '2026-11-11' } as LeituraGuardada, tentativas: null })).toEqual({ gerar: true })
  })
  it('sem IA configurada, não gera', () => {
    expect(decidirGeracao({ agora, iaConfigurada: false, guardada: null, tentativas: null })).toEqual({ gerar: false, motivo: 'sem-ia' })
  })
  it('se falhar, espera 2 horas e desiste depois de 3 tentativas no dia', () => {
    const ha1h = new Date(agora.getTime() - 3600_000).toISOString(), ha3h = new Date(agora.getTime() - 3 * 3600_000).toISOString()
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: null, tentativas: { dia: hoje, vezes: 1, ultimaEm: ha1h } })).toEqual({ gerar: false, motivo: 'aguardando-nova-tentativa' })
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: null, tentativas: { dia: hoje, vezes: 2, ultimaEm: ha3h } })).toEqual({ gerar: true })
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: null, tentativas: { dia: hoje, vezes: 3, ultimaEm: ha3h } })).toEqual({ gerar: false, motivo: 'tentativas-esgotadas' })
    // Tentativas de ontem não contam.
    expect(decidirGeracao({ agora, iaConfigurada: true, guardada: null, tentativas: { dia: '2026-11-11', vezes: 3, ultimaEm: ha1h } })).toEqual({ gerar: true })
  })
  it('o dia é o de Brasília', () => {
    expect(diaEmSaoPaulo(new Date('2026-11-13T02:00:00Z'))).toBe('2026-11-12')
  })
})

describe('leitura da IA: o pedido', () => {
  it('leva os fatos da auditoria, não as telas inteiras', () => {
    const f = montarFatos(rel)
    expect(f.placar).toEqual({ conferencias: 2, batem: 1, divergem: 1 })
    expect(f.divergencias[0].itens[0]).toMatchObject({ key: 'GL-275', conta: 'Portfólio', naoConta: 'Semanal' })
    expect(f.cadastro[0]).toMatchObject({ id: 'sem-mae', quantidade: 3 })
    const [sistema, usuario] = montarPedido(rel)
    expect(sistema.role).toBe('system')
    expect(sistema.content).toContain('SOMENTE os fatos')
    expect(usuario.content).toContain('GL-275')
  })
})

describe('leitura da IA: conferência da resposta', () => {
  it('aceita o ponto sustentado pelos fatos e filtra as evidências', () => {
    const { leitura, descartados } = conferirResposta(resposta({ pontos: [ponto({ evidencias: ['GL-275', 'bloqueados', 'GL-999', 'inventado'] })] }), rel)
    expect(descartados).toBe(0)
    expect(leitura.pontos).toHaveLength(1)
    expect(leitura.pontos[0].evidencias).toEqual(['GL-275', 'bloqueados'])
    expect(leitura.manchete).toBe('Bloqueados divergem entre Portfólio e Semanal')
  })
  it('descarta o ponto que cita chave do Jira ou número que não está nos fatos', () => {
    const { leitura, descartados } = conferirResposta(resposta({
      pontos: [ponto(), ponto({ titulo: 'Chave inventada', explicacao: 'O GL-999 está parado.' }), ponto({ titulo: 'Número inventado', explicacao: 'São 37 experimentos bloqueados.' })],
    }), rel)
    expect(leitura.pontos.map(p => p.titulo)).toEqual(['Bloqueados inflados no Portfólio'])
    expect(descartados).toBe(2)
  })
  it('aceita valores em milhões escritos como "R$ 12 mi"', () => {
    const { leitura } = conferirResposta(resposta({ pontos: [ponto({ explicacao: 'O GL-275 tem R$ 12 mi de benefício.' })] }), rel)
    expect(leitura.pontos).toHaveLength(1)
  })
  it('a situação é a do Auditor, e manchete sem sustentação vira a do parecer', () => {
    const { leitura } = conferirResposta(resposta({ manchete: 'Há 99 problemas graves' }), rel)
    expect(leitura.situacao).toBe('atencao')
    expect(leitura.manchete).toBe('Uma conferência diverge: bloqueados')
  })
  it('ordena por prioridade, limita a 5 pontos e ignora "mudanças" sem leitura anterior', () => {
    const muitos = ['baixa', 'media', 'alta', 'baixa', 'alta', 'media', 'alta'].map((p, i) => ponto({ titulo: `Ponto ${'abcdefg'[i]}`, prioridade: p }))
    const { leitura } = conferirResposta(resposta({ pontos: muitos, mudancas: 'Nada mudou.' }), rel)
    expect(leitura.pontos).toHaveLength(5)
    expect(leitura.pontos.map(p => p.prioridade)).toEqual(['alta', 'alta', 'media', 'baixa', 'baixa'])
    expect(leitura.mudancas).toBeNull()
  })
  it('resposta sem JSON é erro', () => {
    expect(() => conferirResposta('não consegui', rel)).toThrow()
  })
})

describe('leitura da IA no servidor', () => {
  let dir: string
  const env = { ...process.env }
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leitura-ia-'))
    process.env.JIRA_CACHE_DIR = dir
    process.env.LLM_API_KEY = 'teste'
    process.env.LLM_API_BASE = 'http://ia.invalid'
    delete process.env.AUDITOR_IA
  })
  afterEach(() => {
    process.env = { ...env }
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('chama a IA uma vez por dia e guarda a leitura', async () => {
    let chamadas = 0
    const chamar = async () => { chamadas++; return { texto: resposta({ pontos: [ponto()] }), modelo: 'modelo-teste' } }
    const agora = new Date('2026-11-12T15:00:00Z')
    const g = await gerarLeituraDoDia(rel, { agora, chamar })
    expect(g).toMatchObject({ dia: '2026-11-12', modelo: 'modelo-teste', auditoriaDe: rel.geradoEm, descartados: 0 })
    expect(await gerarLeituraDoDia(rel, { agora: new Date('2026-11-12T20:00:00Z'), chamar })).toBeNull()
    expect(chamadas).toBe(1)
    const e = estadoDaLeitura(new Date('2026-11-12T21:00:00Z'))
    expect(e).toMatchObject({ estado: 'pronta', deHoje: true })
    // No dia seguinte, a de ontem continua visível até sair a nova.
    expect(estadoDaLeitura(new Date('2026-11-13T15:00:00Z'))).toMatchObject({ estado: 'pronta', deHoje: false })
  })

  it('falha da IA não derruba nada e fica registrada para a próxima tentativa', async () => {
    const agora = new Date('2026-11-12T15:00:00Z')
    expect(await gerarLeituraDoDia(rel, { agora, chamar: async () => { throw new Error('tempo esgotado') } })).toBeNull()
    expect(estadoDaLeitura(new Date('2026-11-12T15:30:00Z'))).toEqual({ estado: 'aguardando', motivo: 'aguardando-nova-tentativa', erro: 'tempo esgotado' })
  })

  it('sem IA configurada, a página diz isso', () => {
    delete process.env.LLM_API_KEY
    expect(estadoDaLeitura()).toEqual({ estado: 'sem-ia' })
    process.env.LLM_API_KEY = 'teste'
    process.env.AUDITOR_IA = '0'
    expect(estadoDaLeitura()).toEqual({ estado: 'sem-ia' })
  })
})
