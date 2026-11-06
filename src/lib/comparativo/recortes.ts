import { criarComparacao, MESES, periodosDisponiveis, PRIMEIRO_ANO, type Comparacao, type Janela, type Parte } from './resumo'

/**
 * Recortes do report executivo do Comparativo. Cada recorte compara o período escolhido com o período anterior
 * equivalente (a semana com a semana passada, o mês com o mês anterior, o trimestre com o anterior, o semestre com o
 * anterior, os últimos 12 meses com os 12 meses antes deles, o ano até agora com o mesmo trecho do ano anterior),
 * para mostrar o que cresceu. Período que ainda não terminou vai até hoje, e a base é cortada no mesmo ponto.
 */

export type Recorte = 'ultimos12' | 'ano' | 'semestre' | 'trimestre' | 'mes' | 'semana'

export const RECORTES: { id: Recorte; rotulo: string; base: string }[] = [
  { id: 'ultimos12', rotulo: 'Últimos 12 meses', base: 'os 12 meses anteriores' },
  { id: 'ano', rotulo: 'Ano', base: 'o mesmo período do ano anterior' },
  { id: 'semestre', rotulo: 'Semestre', base: 'o semestre anterior' },
  { id: 'trimestre', rotulo: 'Trimestre', base: 'o trimestre anterior' },
  { id: 'mes', rotulo: 'Mês', base: 'o mês anterior' },
  { id: 'semana', rotulo: 'Semana', base: 'a semana anterior' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const diaN = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000
const nDia = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
const fimDoMes = (ano: number, mes: number) => `${ano}-${pad(mes + 1)}-${pad(ultimoDia(ano, mes))}`
const dataCurta = (d: string) => `${Number(d.slice(8, 10))}/${MESES[Number(d.slice(5, 7)) - 1]}`

/** Janela de meses corridos a partir de (ano, mês), com um mês por parte (rótulo "nov/25" quando cruza o ano). */
function janelaDeMeses(id: string, rotulo: string, ano: number, mes: number, quantos: number): Janela {
  const partes: Parte[] = Array.from({ length: quantos }, (_, k) => {
    const a = ano + Math.floor((mes + k) / 12), m = (mes + k) % 12
    return { rotulo: `${MESES[m]}/${String(a).slice(2)}`, inicio: `${a}-${pad(m + 1)}-01`, fim: fimDoMes(a, m) }
  })
  const mesmoAno = partes[0].inicio.slice(0, 4) === partes[partes.length - 1].inicio.slice(0, 4)
  if (mesmoAno) for (const p of partes) p.rotulo = p.rotulo.slice(0, 3)
  return { id, rotulo, inicio: partes[0].inicio, fim: partes[partes.length - 1].fim, partes }
}

/** Semana de segunda a domingo que começa em `segunda` (AAAA-MM-DD), com um dia por parte. */
function janelaDaSemana(segunda: string, rotulo: string): Janela {
  const d0 = diaN(segunda)
  const nomes = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
  const partes = nomes.map((n, k) => ({ rotulo: n, inicio: nDia(d0 + k), fim: nDia(d0 + k) }))
  return { id: `S-${segunda}`, rotulo, inicio: partes[0].inicio, fim: partes[6].fim, partes }
}

const segundaDe = (dia: string) => {
  const n = diaN(dia)
  const semana = (new Date(n * 86_400_000).getUTCDay() + 6) % 7 // segunda = 0
  return nDia(n - semana)
}

/** Corta o atual em hoje e a base no mesmo número de dias decorridos (para comparar trechos iguais). */
function comparar(atualCheio: Janela, baseCheia: Janela, hoje: string, modo: Comparacao['modo']): Comparacao {
  const parcial = hoje < atualCheio.fim
  const atual = { ...atualCheio, fim: parcial ? hoje : atualCheio.fim }
  const fimBase = parcial ? nDia(Math.min(diaN(baseCheia.fim), diaN(baseCheia.inicio) + (diaN(atual.fim) - diaN(atual.inicio)))) : baseCheia.fim
  return { modo, base: { ...baseCheia, fim: fimBase }, atual, parcial, cortada: parcial }
}

const semestreDe = (dia: string) => `${dia.slice(0, 4)}-S${Number(dia.slice(5, 7)) <= 6 ? 1 : 2}`
const semestreAnterior = (id: string) => {
  const ano = Number(id.slice(0, 4)), s = Number(id.slice(6))
  return s === 1 ? `${ano - 1}-S2` : `${ano}-S1`
}
function janelaDoSemestre(id: string): Janela {
  const ano = Number(id.slice(0, 4)), s = Number(id.slice(6))
  return janelaDeMeses(id, `${s}º sem/${ano}`, ano, s === 1 ? 0 : 6, 6)
}

/** Períodos que dá para escolher em cada recorte, do mais recente ao mais antigo (o primeiro é o padrão). */
export function opcoesDoRecorte(recorte: Recorte, hoje: string): { id: string; rotulo: string }[] {
  const anoHoje = Number(hoje.slice(0, 4))
  switch (recorte) {
    case 'ultimos12':
      return [{ id: 'ultimos12', rotulo: 'Últimos 12 meses' }]
    case 'ano':
      return Array.from({ length: anoHoje - PRIMEIRO_ANO }, (_, k) => anoHoje - k)
        .map(a => ({ id: String(a), rotulo: a === anoHoje ? `${a} até agora` : String(a) }))
    case 'semestre': {
      const ids: string[] = []
      for (let id = semestreDe(hoje); Number(id.slice(0, 4)) >= PRIMEIRO_ANO; id = semestreAnterior(id)) ids.push(id)
      return ids.map(id => ({ id, rotulo: `${id.slice(6)}º semestre de ${id.slice(0, 4)}${id === semestreDe(hoje) ? ' (até agora)' : ''}` }))
    }
    case 'trimestre':
      return periodosDisponiveis('trimestral', hoje).map((o, k) => ({ ...o, rotulo: k === 0 ? `${o.rotulo} (até agora)` : o.rotulo }))
    case 'mes': {
      // O mês corrente acabou de começar: o padrão é o último mês fechado; o corrente fica como opção.
      const meses = periodosDisponiveis('mensal', hoje)
      const corrente = meses[0]
      return [...meses.slice(1), ...(corrente ? [{ ...corrente, rotulo: `${corrente.rotulo} (até agora)` }] : [])]
    }
    case 'semana': {
      const esta = segundaDe(hoje)
      // A última semana fechada primeiro; a corrente como opção; depois as 10 anteriores.
      const segundas = Array.from({ length: 12 }, (_, k) => nDia(diaN(esta) - 7 * k))
      const rotulo = (s: string) => `${dataCurta(s)} a ${dataCurta(nDia(diaN(s) + 6))}`
      return [
        { id: segundas[1], rotulo: `Semana passada (${rotulo(segundas[1])})` },
        { id: segundas[0], rotulo: `Esta semana (${rotulo(segundas[0])}, até agora)` },
        ...segundas.slice(2).map(s => ({ id: s, rotulo: rotulo(s) })),
      ]
    }
  }
}

/** A comparação do recorte: o período escolhido (atual) e o período anterior equivalente (base). */
export function comparacaoDoRecorte(recorte: Recorte, id: string, hoje: string): Comparacao {
  switch (recorte) {
    case 'ultimos12': {
      const ano = Number(hoje.slice(0, 4)), mes = Number(hoje.slice(5, 7)) - 1
      const ini = ano * 12 + mes - 11
      // Rótulo pelos meses ("dez/25 a nov/26"): lê bem nas frases do report ("em dez/25 a nov/26").
      const nome = (i: number) => `${MESES[i % 12]}/${String(Math.floor(i / 12)).slice(2)}`
      const atual = janelaDeMeses('ultimos12', `${nome(ini)} a ${nome(ini + 11)}`, Math.floor(ini / 12), ini % 12, 12)
      const base = janelaDeMeses('anteriores12', `${nome(ini - 12)} a ${nome(ini - 1)}`, Math.floor((ini - 12) / 12), (ini - 12) % 12, 12)
      // Os 12 meses vão até hoje; a base são os 12 meses antes deles, com o mesmo número de dias.
      return comparar(atual, base, hoje, 'anual')
    }
    case 'ano': {
      const c = criarComparacao({ modo: 'anual', id, base: 'anterior', mesmoPeriodo: true, hoje })
      return c.parcial
        ? { ...c, atual: { ...c.atual, rotulo: `${id} até agora` } }
        : c
    }
    case 'semestre':
      return comparar(janelaDoSemestre(id), janelaDoSemestre(semestreAnterior(id)), hoje, 'anual')
    case 'trimestre':
      return criarComparacao({ modo: 'trimestral', id, base: 'anterior', mesmoPeriodo: true, hoje })
    case 'mes':
      return criarComparacao({ modo: 'mensal', id, base: 'anterior', mesmoPeriodo: true, hoje })
    case 'semana': {
      const anterior = nDia(diaN(id) - 7)
      const rotulo = (s: string) => `${dataCurta(s)} a ${dataCurta(nDia(diaN(s) + 6))}`
      return comparar(janelaDaSemana(id, rotulo(id)), janelaDaSemana(anterior, rotulo(anterior)), hoje, 'mensal')
    }
  }
}

/** Nome do report no cabeçalho ("Report executivo · últimos 12 meses"). */
export const NOME_DO_RECORTE: Record<Recorte, string> = {
  ultimos12: 'últimos 12 meses', ano: 'anual', semestre: 'semestral', trimestre: 'trimestral', mes: 'mensal', semana: 'semanal',
}

