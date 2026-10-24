import { formatarValor } from '../portfolio/filtros'
import {
  dentro, porDimensao, principal, resumir, trecho, variacao,
  type Comparacao, type ComparativoDados, type Experimento, type Indicador, type IndicadorId, type IniciativaResumo, type Janela,
} from './resumo'

/**
 * Conteúdo do report executivo do Comparativo (o documento para baixar em PDF): números macro do período base × o
 * atual (anos, trimestres ou meses), a exploração de iniciativas, o funil, os resultados, a velocidade do processo, as
 * áreas, o valor gerado e uma leitura em texto. Usa os mesmos períodos da tela.
 */

export type Par = [number | null, number | null]
export type Formato = 'numero' | 'reais' | 'dias' | 'pct'

export interface Kpi { id: string; titulo: string; valores: Par; formato: Formato; melhor: 'maior' | 'menor'; nota: string }
export interface EtapaFunil { id: string; titulo: string; descricao: string; valores: [number, number] }
export interface Destaque { key: string; nome: string; detalhe: string }

export interface ReportExecutivo {
  /** Rótulos dos dois períodos (base, atual) e o trecho de cada um que entra na conta. */
  rotulos: [string, string]
  periodo: string
  kpis: Kpi[]
  exploracao: {
    registradas: [number, number]
    viraramExperimento: [number, number]   // da safra do ano, quantas já chegaram a Experimentação
    leadMediana: Par
    emExploracaoHoje: number
    chegaramLonge: Destaque[]              // até 5 iniciativas que entraram em Piloto ou Escala no período atual
  }
  funil: EtapaFunil[]
  resultados: { concluidos: [number, number]; validadas: [number, number]; refutadas: [number, number]; cancelados: [number, number] }
  tempos: { titulo: string; valores: Par }[]
  areas: { nome: string; validadas: [number, number]; concluidos: [number, number]; beneficio: [number, number] }[]
  valor: { total: [number, number]; top: Destaque[] }
  emAndamentoHoje: number
  leitura: string[]
}

const contar = <T>(lista: T[], data: (x: T) => string | null | undefined, c: Comparacao): [number, number] =>
  [lista.filter(x => dentro(data(x), c.base)).length, lista.filter(x => dentro(data(x), c.atual)).length]

export function formatar(v: number | null, f: Formato): string {
  if (v === null) return '—'
  if (f === 'reais') return formatarValor(v)
  if (f === 'pct') return `${v}%`
  if (f === 'dias') return `${v.toLocaleString('pt-BR')} ${v === 1 ? 'dia' : 'dias'}`
  return v.toLocaleString('pt-BR')
}

/** Variação da base para o atual em %, e se é boa (para tempos, cair é bom). Nula sem base. */
export function variacaoPar([a, b]: Par, melhor: 'maior' | 'menor'): { pct: number; boa: boolean | null } | null {
  if (a === null || b === null || a === 0) return null
  const pct = Math.round(((b - a) / a) * 100)
  return { pct, boa: pct === 0 ? null : melhor === 'maior' ? pct > 0 : pct < 0 }
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null)
const ETAPA_LABEL: Record<string, string> = { piloto: 'Piloto', escala: 'Escala' }

export function montarReport(dados: ComparativoDados, c: Comparacao): ReportExecutivo {
  const ind = (id: IndicadorId) => dados.indicadores.find(i => i.id === id)!
  const par = (i: Indicador): Par => [principal(i, resumir(i, c.base)), principal(i, resumir(i, c.atual))]
  const n = (i: Indicador): [number, number] => [resumir(i, c.base).n, resumir(i, c.atual).n]
  const rotulos: [string, string] = [c.base.rotulo, c.atual.rotulo]
  const inis = dados.iniciativas

  const concluidos = n(ind('concluidos')), validadas = n(ind('validadas')), refutadas = n(ind('refutadas')), cancelados = n(ind('cancelados'))
  const beneficio = par(ind('beneficio')).map(v => v ?? 0) as [number, number]
  const taxa: Par = [pct(validadas[0], concluidos[0]), pct(validadas[1], concluidos[1])]
  const leadExp = par(ind('leadExperimentacao'))
  const registradas = contar(inis, i => i.criadoEm, c)
  const safra = (j: Janela) => inis.filter(i => dentro(i.criadoEm, j))
  const viraram: [number, number] = [safra(c.base).filter(i => i.experimentacaoEm).length, safra(c.atual).filter(i => i.experimentacaoEm).length]

  const funil: EtapaFunil[] = [
    { id: 'ideias', titulo: 'Ideias registradas', descricao: 'Criadas no board de Ideação', valores: registradas },
    { id: 'experimento', titulo: 'Viraram experimento', descricao: 'Entraram em Experimentação', valores: contar(inis, i => i.experimentacaoEm, c) },
    { id: 'concluidos', titulo: 'Experimentos concluídos', descricao: 'Validadas ou refutadas', valores: concluidos },
    { id: 'validadas', titulo: 'Hipóteses validadas', descricao: 'A iniciativa seguiu adiante', valores: validadas },
    { id: 'piloto', titulo: 'Foram para piloto', descricao: 'Entraram em Piloto', valores: contar(inis, i => i.pilotoEm, c) },
    { id: 'escala', titulo: 'Chegaram à escala', descricao: 'Entraram em Escala', valores: contar(inis, i => i.escalaEm, c) },
  ]

  const longe = (i: IniciativaResumo) => (dentro(i.escalaEm, c.atual) ? 'escala' : dentro(i.pilotoEm, c.atual) ? 'piloto' : null)
  const chegaramLonge = inis.filter(i => longe(i))
    .sort((a, b) => (longe(b) === 'escala' ? 1 : 0) - (longe(a) === 'escala' ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 5)
    .map(i => ({ key: i.key, nome: i.nome, detalhe: ETAPA_LABEL[longe(i)!] }))

  const { linhas } = porDimensao(dados.experimentos, 'area', c)
  const areas = linhas.filter(l => l.informado)
    .sort((a, b) => b.porPeriodo[1].validadas - a.porPeriodo[1].validadas || b.porPeriodo[1].concluidos - a.porPeriodo[1].concluidos)
    .slice(0, 5)
    .map(l => ({
      nome: l.nome,
      validadas: [l.porPeriodo[0].validadas, l.porPeriodo[1].validadas] as [number, number],
      concluidos: [l.porPeriodo[0].concluidos, l.porPeriodo[1].concluidos] as [number, number],
      beneficio: [l.porPeriodo[0].beneficio, l.porPeriodo[1].beneficio] as [number, number],
    }))

  const validadasB = dados.experimentos.filter(e => e.situacao === 'validada' && dentro(e.concluidoEm, c.atual))
  const top = [...validadasB].sort((a, b) => (b.beneficio ?? 0) - (a.beneficio ?? 0)).filter(e => e.beneficio).slice(0, 5)
    .map((e: Experimento) => ({ key: e.key, nome: e.nome, detalhe: `${formatarValor(e.beneficio!)}${e.area ? ` · ${e.area}` : ''}` }))

  const tempos = (['leadExploracao', 'leadExperimentacao', 'aguardandoPiloto', 'piloto'] as IndicadorId[])
    .map(id => ({ titulo: ind(id).titulo, valores: par(ind(id)) }))

  const kpis: Kpi[] = [
    { id: 'ideias', titulo: 'Ideias registradas', valores: registradas, formato: 'numero', melhor: 'maior', nota: 'no board de Ideação' },
    { id: 'concluidos', titulo: 'Experimentos concluídos', valores: concluidos, formato: 'numero', melhor: 'maior', nota: 'validadas ou refutadas' },
    { id: 'taxa', titulo: 'Taxa de validação', valores: taxa, formato: 'pct', melhor: 'maior', nota: 'validadas / concluídos' },
    { id: 'beneficio', titulo: 'Benefício validado', valores: beneficio, formato: 'reais', melhor: 'maior', nota: 'potencial das validadas' },
    { id: 'lead', titulo: 'Tempo de experimentação', valores: leadExp, formato: 'dias', melhor: 'menor', nota: 'mediana, sem bloqueios' },
  ]

  const emExploracaoHoje = inis.filter(i => i.etapa === 'exploracao').length
  const emAndamentoHoje = dados.experimentos.filter(e => e.situacao === 'andamento').length

  return {
    rotulos,
    periodo: `${c.base.rotulo} (${trecho(c.base)}) × ${c.atual.rotulo} (${trecho(c.atual)})`,
    kpis,
    exploracao: { registradas, viraramExperimento: viraram, leadMediana: par(ind('leadExploracao')), emExploracaoHoje, chegaramLonge },
    funil,
    resultados: { concluidos, validadas, refutadas, cancelados },
    tempos,
    areas,
    valor: { total: beneficio, top },
    emAndamentoHoje,
    leitura: leitura({ concluidos, taxa, beneficio, leadExp, registradas, areas, emExploracaoHoje, emAndamentoHoje, ind: ind('concluidos'), rotulos }),
  }
}

/** Frases de leitura executiva, só com o que os números sustentam. */
function leitura(x: {
  concluidos: [number, number]; taxa: Par; beneficio: [number, number]; leadExp: Par; registradas: [number, number]
  areas: ReportExecutivo['areas']; emExploracaoHoje: number; emAndamentoHoje: number; ind: Indicador; rotulos: [string, string]
}): string[] {
  const [A, B] = x.rotulos
  const frases: string[] = []
  const mudou = (v: { pct: number } | null) => (!v || v.pct === 0 ? 'no mesmo nível de' : v.pct > 0 ? `${v.pct}% acima de` : `${Math.abs(v.pct)}% abaixo de`)
  const vConc = variacao(x.ind, x.concluidos[0], x.concluidos[1])
  frases.push(`Concluímos ${x.concluidos[1]} experimentos em ${B}, ${mudou(vConc)} ${A} (${x.concluidos[0]}).`)
  if (x.taxa[0] !== null && x.taxa[1] !== null) {
    const d = x.taxa[1] - x.taxa[0]
    frases.push(`A taxa de validação ${d === 0 ? 'se manteve em' : d > 0 ? `subiu ${d} pontos, para` : `caiu ${Math.abs(d)} pontos, para`} ${x.taxa[1]}%: ${d >= 0 ? 'mais' : 'menos'} hipóteses seguindo para piloto.`)
  }
  if (x.beneficio[1] > 0) frases.push(`As hipóteses validadas em ${B} somam ${formatarValor(x.beneficio[1])} de benefício potencial${x.beneficio[0] ? `, contra ${formatarValor(x.beneficio[0])} em ${A}` : ''}.`)
  if (x.leadExp[0] !== null && x.leadExp[1] !== null && x.leadExp[0] !== x.leadExp[1]) {
    frases.push(`Experimentar ficou mais ${x.leadExp[1] < x.leadExp[0] ? 'rápido' : 'lento'}: a mediana foi de ${x.leadExp[0]} para ${x.leadExp[1]} dias.`)
  }
  const area = x.areas.find(a => a.validadas[1] > 0)
  if (area) frases.push(`${area.nome} é a área com mais hipóteses validadas em ${B} (${area.validadas[1]}).`)
  frases.push(`Hoje, ${x.emExploracaoHoje} ideias estão em exploração e ${x.emAndamentoHoje} experimentos estão em andamento.`)
  return frases
}
