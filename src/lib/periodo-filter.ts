// ── Tipos de período para o filtro do dashboard ──

export type PeriodoFiltro =
  | { tipo: 'ultimos12' }
  | { tipo: 'semestre'; ano: number; semestre: 1 | 2 }
  | { tipo: 'ano'; ano: number }
  | { tipo: 'tudo' }

// ── Opções disponíveis no dropdown ──

export interface PeriodoOpcao {
  label: string
  value: PeriodoFiltro
}

/**
 * Gera a lista de opções de período com base no ano atual.
 * Inclui: Últimos 12 meses, semestres de 2025 e 2026, anos cheios, e Tudo.
 */
export function getPeriodoOpcoes(): PeriodoOpcao[] {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()

  const opcoes: PeriodoOpcao[] = [
    { label: 'Últimos 12 meses', value: { tipo: 'ultimos12' } },
  ]

  // Semestres de 2025 e 2026
  for (const ano of [2025, 2026]) {
    opcoes.push({ label: `1º Semes/${String(ano).slice(2)}`, value: { tipo: 'semestre', ano, semestre: 1 } })
    opcoes.push({ label: `2º Semes/${String(ano).slice(2)}`, value: { tipo: 'semestre', ano, semestre: 2 } })
  }

  // Anos cheios
  for (const ano of [2025, 2026]) {
    opcoes.push({ label: `Todo ${ano}`, value: { tipo: 'ano', ano } })
  }

  // Tudo
  opcoes.push({ label: 'Tudo', value: { tipo: 'tudo' } })

  return opcoes
}

/**
 * Retorna o label amigável para um PeriodoFiltro.
 */
export function getPeriodoLabel(filtro: PeriodoFiltro): string {
  const opcoes = getPeriodoOpcoes()
  const encontrada = opcoes.find(o => {
    if (o.value.tipo !== filtro.tipo) return false
    if (filtro.tipo === 'ultimos12' || filtro.tipo === 'tudo') return true
    if (filtro.tipo === 'semestre' && o.value.tipo === 'semestre') {
      return o.value.ano === filtro.ano && o.value.semestre === filtro.semestre
    }
    if (filtro.tipo === 'ano' && o.value.tipo === 'ano') {
      return o.value.ano === filtro.ano
    }
    return false
  })
  return encontrada?.label ?? 'Últimos 12 meses'
}

/**
 * Retorna o intervalo [dataInicio, dataFim] para um período.
 * dataFim é sempre hoje para períodos que incluem o presente.
 */
export function getPeriodoIntervalo(filtro: PeriodoFiltro): { inicio: Date; fim: Date } {
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 999)

  switch (filtro.tipo) {
    case 'ultimos12': {
      const inicio = new Date(hoje)
      inicio.setMonth(inicio.getMonth() - 12)
      inicio.setDate(1)
      inicio.setHours(0, 0, 0, 0)
      return { inicio, fim: hoje }
    }
    case 'semestre': {
      const mesInicio = filtro.semestre === 1 ? 0 : 6  // Jan ou Jul
      const mesFim = filtro.semestre === 1 ? 5 : 11     // Jun ou Dez
      const inicio = new Date(filtro.ano, mesInicio, 1, 0, 0, 0, 0)
      const fim = new Date(filtro.ano, mesFim + 1, 0, 23, 59, 59, 999) // último dia do mês
      return { inicio, fim }
    }
    case 'ano': {
      const inicio = new Date(filtro.ano, 0, 1, 0, 0, 0, 0)
      const fim = new Date(filtro.ano, 11, 31, 23, 59, 59, 999)
      return { inicio, fim }
    }
    case 'tudo': {
      return { inicio: new Date(2020, 0, 1), fim: hoje }
    }
  }
}

/**
 * Verifica se uma data ISO string está dentro do período.
 */
export function isDataNoPeriodo(dataIso: string | null | undefined, filtro: PeriodoFiltro): boolean {
  if (!dataIso) return false
  const data = new Date(dataIso)
  if (isNaN(data.getTime())) return false

  const { inicio, fim } = getPeriodoIntervalo(filtro)
  return data >= inicio && data <= fim
}