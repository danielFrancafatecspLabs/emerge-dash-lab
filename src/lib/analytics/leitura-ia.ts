import type { RelatorioConsistencia } from './consistencia'

/**
 * Leitura da IA do Auditor de Analytics: uma vez por dia, a IA lê o relatório do Auditor (divergências, pistas,
 * cadastro e o que mudou no Jira) e escreve a leitura executiva, curta e organizada: a manchete, os pontos que
 * importam em ordem de prioridade, o que mudou desde ontem e as perguntas que o time deveria responder.
 *
 * O Auditor continua fazendo as contas (são determinísticas e testadas). A IA só interpreta. Para ela não inventar:
 * - recebe só os fatos do relatório, já calculados, e a instrução de não usar nada além deles;
 * - responde num JSON de formato fixo, que é validado;
 * - cada ponto é conferido contra o relatório: chave do Jira que não existe ou número que não aparece nos fatos
 *   derruba o ponto (ele é descartado e contado, nunca mostrado).
 *
 * Este módulo é puro (monta o pedido, confere a resposta e decide se é hora de gerar). A chamada à IA e o arquivo
 * ficam em ./leitura-ia-servidor.ts.
 */

export type Prioridade = 'alta' | 'media' | 'baixa'

export interface PontoDaLeitura {
  titulo: string
  explicacao: string
  prioridade: Prioridade
  /** Chaves do Jira ou ids de conferência que sustentam o ponto. */
  evidencias: string[]
  acao?: { onde: 'Jira' | 'App'; texto: string }
}

export interface LeituraIA {
  manchete: string
  situacao: 'ok' | 'atencao' | 'critico'
  pontos: PontoDaLeitura[]
  /** O que mudou desde a leitura anterior do Jira, em uma ou duas frases (null quando não há comparação). */
  mudancas: string | null
  /** Perguntas que o time deveria responder. */
  perguntas: string[]
}

export interface LeituraGuardada {
  /** Dia da geração (AAAA-MM-DD, horário de Brasília): a leitura vale o dia todo. */
  dia: string
  geradaEm: string
  modelo: string
  /** Qual auditoria a IA leu. */
  auditoriaDe: string
  leitura: LeituraIA
  /** Pontos que a IA escreveu e a conferência descartou (citavam algo que não está no relatório). */
  descartados: number
}

/** Tentativas do dia, para não insistir quando a IA falha. */
export interface Tentativas { dia: string; vezes: number; ultimaEm: string; erro?: string }

export const MAX_TENTATIVAS_POR_DIA = 3
export const ESPERA_ENTRE_TENTATIVAS_MS = 2 * 3600_000
const MAX_PONTOS = 5
const MAX_PERGUNTAS = 3

export const diaEmSaoPaulo = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

// ── Quando gerar ──────────────────────────────────────────────────────────────────────────────

export type Decisao = { gerar: true } | { gerar: false; motivo: 'sem-ia' | 'ja-gerada-hoje' | 'aguardando-nova-tentativa' | 'tentativas-esgotadas' }

/** Uma leitura por dia; se a IA falhar, até 3 tentativas no dia, com 2 horas entre elas. */
export function decidirGeracao(o: { agora: Date; iaConfigurada: boolean; guardada: LeituraGuardada | null; tentativas: Tentativas | null }): Decisao {
  if (!o.iaConfigurada) return { gerar: false, motivo: 'sem-ia' }
  const hoje = diaEmSaoPaulo(o.agora)
  if (o.guardada?.dia === hoje) return { gerar: false, motivo: 'ja-gerada-hoje' }
  const t = o.tentativas?.dia === hoje ? o.tentativas : null
  if (t && t.vezes >= MAX_TENTATIVAS_POR_DIA) return { gerar: false, motivo: 'tentativas-esgotadas' }
  if (t && o.agora.getTime() - Date.parse(t.ultimaEm) < ESPERA_ENTRE_TENTATIVAS_MS) return { gerar: false, motivo: 'aguardando-nova-tentativa' }
  return { gerar: true }
}

// ── O pedido ──────────────────────────────────────────────────────────────────────────────────

const corta = (s: string | undefined, n: number) => (!s ? undefined : s.length > n ? `${s.slice(0, n - 1)}…` : s)

/**
 * Os fatos que a IA recebe: o relatório do Auditor, enxuto. Só o que explica (vereditos, pistas, impacto, itens de
 * exemplo), sem as conferências que batem em detalhe (vão só como placar e títulos).
 */
export function montarFatos(rel: RelatorioConsistencia) {
  const falhas = rel.verificacoes.filter(v => !v.ok)
  return {
    auditadoEm: rel.geradoEm,
    parecer: rel.parecer ? { nivel: rel.parecer.nivel, titulo: rel.parecer.titulo } : undefined,
    placar: { conferencias: rel.verificacoes.length, batem: rel.verificacoes.length - falhas.length, divergem: falhas.length },
    telas: (rel.telas ?? []).map(t => ({ tela: t.tela, situacao: t.situacao, conferencias: t.conferencias, divergencias: t.divergencias })),
    divergencias: falhas.map(v => ({
      id: v.id,
      pergunta: v.pergunta,
      natureza: v.natureza,
      veredito: v.veredito,
      valores: v.valores,
      destoam: v.destoam,
      explicacao: v.explicacao?.map(p => corta(p, 400)),
      impacto: corta(v.impacto, 300),
      acoes: v.acoes,
      itens: (v.diagnostico?.diferencas ?? []).flatMap(d => d.itens.slice(0, 5).map(i => ({ key: i.key, nome: corta(i.nome, 60), status: i.status, mae: i.mae, beneficio: i.beneficio, conta: d.conta, naoConta: d.naoConta }))),
    })),
    conferenciasQueBatem: rel.verificacoes.filter(v => v.ok).map(v => ({ id: v.id, veredito: corta(v.veredito, 160) })),
    cadastro: rel.alertas.map(a => ({
      id: a.id, titulo: a.titulo, quantidade: a.quantidade, gravidade: a.gravidade, impacto: a.impacto,
      porQueImporta: corta(a.porQueImporta, 240), oQueFazer: a.oQueFazer, exemplos: a.exemplos.slice(0, 5),
    })),
    movimento: rel.movimento ? {
      de: rel.movimento.de, ate: rel.movimento.ate, saldo: rel.movimento.saldo, total: rel.movimento.mudancas.length,
      mudancas: rel.movimento.mudancas.slice(0, 15).map(m => ({ tipo: m.tipo, entidade: m.entidade, key: m.key, nome: corta(m.nome, 60), de: m.de, para: m.para })),
    } : null,
  }
}

export const INSTRUCOES = `Você é o Auditor de Analytics do beOn Labs, o laboratório de inovação da Claro. Você escreve, uma vez por dia, a leitura executiva da auditoria dos painéis de experimentação. Quem lê é o líder do lab: quer saber em um minuto se pode confiar nos números, o que está distorcido e o que fazer.

Contexto do domínio:
- Iniciativa é a ideia (board de Ideação). Experimento (Epic) é a execução de uma iniciativa (board de Experimentação). Uma iniciativa pode ter vários experimentos.
- Hipótese validada: experimento concluído cuja iniciativa-mãe está em Aguardando piloto, Em piloto ou Em escala (Finalizado conta como Em escala). Refutada: concluído com a iniciativa fora dessas etapas.
- Benefício potencial: soma do benefício dos experimentos, sem os cancelados.
- O Auditor recalcula cada número com as funções de cada tela (Semanal, Estratégia, Portfólio, Operacional, Comparativo, Crescimento) e compara item por item, além de comparar a regra do app com as colunas do board no Jira.

Regras:
1. Use SOMENTE os fatos do JSON enviado. Não invente número, chave, nome nem causa. Toda chave do Jira (ex.: GL-123) e todo número que você citar tem de estar nos fatos.
2. Interprete, não repita: junte divergências que têm a mesma causa, diga o que isso significa para quem usa os painéis e o que fazer primeiro. Se tudo bate, diga isso em uma frase e use os pontos para o cadastro e o que mudou.
3. Seja sucinto: manchete com até 140 caracteres; cada explicação com até 2 frases; no máximo ${MAX_PONTOS} pontos, do mais importante para o menos; no máximo ${MAX_PERGUNTAS} perguntas.
4. Prioridade: "alta" quando um número dos painéis está diferente entre telas ou distorcido; "media" quando a regra do app discorda do Jira ou o cadastro distorce um número; "baixa" para o que só vale conferir.
5. Português do Brasil, frases diretas, sem jargão técnico, sem markdown.

Responda APENAS com um JSON neste formato:
{"manchete": "...", "situacao": "ok" | "atencao" | "critico", "pontos": [{"titulo": "...", "explicacao": "...", "prioridade": "alta" | "media" | "baixa", "evidencias": ["GL-123" ou id da conferência], "acao": {"onde": "Jira" | "App", "texto": "..."}}], "mudancas": "..." ou null, "perguntas": ["..."]}`

export function montarPedido(rel: RelatorioConsistencia) {
  return [
    { role: 'system' as const, content: INSTRUCOES },
    { role: 'user' as const, content: `Fatos da auditoria de hoje:\n${JSON.stringify(montarFatos(rel))}` },
  ]
}

// ── A resposta: formato e conferência contra os fatos ─────────────────────────────────────────

const PRIORIDADES: Prioridade[] = ['alta', 'media', 'baixa']
const texto = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? corta(v.trim().replace(/\s+/g, ' '), max) : undefined)

/** O primeiro objeto JSON da resposta (tolera texto ou cercas de código em volta). */
function extrairJson(bruto: string): unknown {
  const ini = bruto.indexOf('{'), fim = bruto.lastIndexOf('}')
  if (ini < 0 || fim <= ini) throw new Error('a resposta da IA não traz um JSON')
  return JSON.parse(bruto.slice(ini, fim + 1))
}

const CHAVE_JIRA = /\b[A-Z][A-Z0-9]+-\d+\b/g
/** Números com significado (dois dígitos ou mais, ou com vírgula/ponto), como aparecem no texto. */
const NUMERO = /\d+(?:[.,]\d+)*/g
const soDigitos = (s: string) => s.replace(/\D/g, '')

/** O que existe nos fatos: chaves do Jira, ids de conferência e alerta, e os números (em várias grafias). */
function vocabulario(fatos: ReturnType<typeof montarFatos>) {
  const bruto = JSON.stringify(fatos)
  const chaves = new Set(bruto.match(CHAVE_JIRA) ?? [])
  const ids = new Set([...fatos.divergencias.map(d => d.id), ...fatos.conferenciasQueBatem.map(c => c.id), ...fatos.cadastro.map(a => a.id)])
  const numeros = new Set<string>()
  for (const m of bruto.match(NUMERO) ?? []) {
    numeros.add(soDigitos(m))
    const n = Number(m.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(n) && n >= 1_000_000) {
      // R$ 12.000.000 também aparece como "R$ 12 mi" ou "12,5 mi".
      const mi = n / 1_000_000
      numeros.add(soDigitos(String(Math.round(mi))))
      numeros.add(soDigitos(mi.toLocaleString('pt-BR', { maximumFractionDigits: 1 })))
    }
  }
  return { chaves, ids, numeros }
}

/** Um texto é sustentado pelos fatos quando toda chave do Jira e todo número com dois dígitos ou mais estão lá. */
function sustentado(t: string, voc: ReturnType<typeof vocabulario>): boolean {
  const chavesOk = (t.match(CHAVE_JIRA) ?? []).every(k => voc.chaves.has(k))
  const numerosOk = (t.replace(CHAVE_JIRA, '').match(NUMERO) ?? []).filter(m => soDigitos(m).length >= 2).every(m => voc.numeros.has(soDigitos(m)))
  return chavesOk && numerosOk
}

/**
 * Valida o formato e confere cada ponto contra os fatos. Ponto que cita chave ou número que não está no relatório é
 * descartado. Manchete sem sustentação vira a do parecer do Auditor.
 */
export function conferirResposta(bruto: string, rel: RelatorioConsistencia): { leitura: LeituraIA; descartados: number } {
  const r = extrairJson(bruto) as Record<string, unknown>
  const fatos = montarFatos(rel)
  const voc = vocabulario(fatos)
  const reserva = rel.parecer?.titulo ?? 'Auditoria concluída.'
  let descartados = 0

  const pontos: PontoDaLeitura[] = []
  for (const p of Array.isArray(r.pontos) ? r.pontos : []) {
    const o = (p ?? {}) as Record<string, unknown>
    const titulo = texto(o.titulo, 90), explicacao = texto(o.explicacao, 320)
    if (!titulo || !explicacao) { descartados++; continue }
    const acaoBruta = (o.acao ?? null) as Record<string, unknown> | null
    const acaoTexto = acaoBruta ? texto(acaoBruta.texto, 220) : undefined
    const acao = acaoTexto ? { onde: acaoBruta!.onde === 'Jira' ? 'Jira' as const : 'App' as const, texto: acaoTexto } : undefined
    if (![titulo, explicacao, acao?.texto ?? ''].every(t => sustentado(t, voc))) { descartados++; continue }
    const evidencias = (Array.isArray(o.evidencias) ? o.evidencias : [])
      .filter((e): e is string => typeof e === 'string')
      .map(e => e.trim())
      .filter(e => voc.chaves.has(e) || voc.ids.has(e))
      .slice(0, 6)
    pontos.push({ titulo, explicacao, prioridade: PRIORIDADES.includes(o.prioridade as Prioridade) ? o.prioridade as Prioridade : 'media', evidencias, ...(acao ? { acao } : {}) })
    if (pontos.length === MAX_PONTOS) break
  }
  pontos.sort((a, b) => PRIORIDADES.indexOf(a.prioridade) - PRIORIDADES.indexOf(b.prioridade))

  const manchete = texto(r.manchete, 160)
  const mudancas = texto(r.mudancas, 320)
  const perguntas = (Array.isArray(r.perguntas) ? r.perguntas : []).map(q => texto(q, 200)).filter((q): q is string => !!q && sustentado(q, voc)).slice(0, MAX_PERGUNTAS)
  const situacao = (['ok', 'atencao', 'critico'] as const).includes(r.situacao as 'ok') ? r.situacao as LeituraIA['situacao'] : rel.parecer?.nivel ?? 'atencao'
  return {
    leitura: {
      manchete: manchete && sustentado(manchete, voc) ? manchete : reserva,
      // A situação é a do Auditor: a IA explica, não rebaixa nem eleva o parecer.
      situacao: rel.parecer?.nivel ?? situacao,
      pontos,
      mudancas: rel.movimento && mudancas && sustentado(mudancas, voc) ? mudancas : null,
      perguntas,
    },
    descartados,
  }
}
