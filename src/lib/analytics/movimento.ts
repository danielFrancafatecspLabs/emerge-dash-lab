import { epicCancelado } from '@/lib/mappers'
import type { DashboardData } from '@/lib/types'

/**
 * O que mudou no Jira de uma leitura para a outra. O agente guarda uma "foto" enxuta de cada leitura (chave, nome,
 * status e benefício) e compara com a anterior: quem entrou, quem saiu, quem mudou de status e de benefício. É o que
 * explica um número que mudou de ontem para hoje sem ninguém mexer no app.
 */

export interface ItemDaFoto { nome: string; status: string; beneficio: number; cancelado: boolean }

export interface Foto {
  /** Quando o Jira foi lido (ISO). */
  lidoEm: string
  experimentos: Record<string, ItemDaFoto>
  iniciativas: Record<string, ItemDaFoto>
}

export interface Mudanca {
  tipo: 'entrou' | 'saiu' | 'status' | 'beneficio'
  entidade: 'experimento' | 'iniciativa'
  key: string
  nome: string
  de?: string
  para?: string
}

export interface Movimento {
  de: string
  ate: string
  mudancas: Mudanca[]
  /** Efeito líquido nas contas: experimentos e benefício potencial (sem cancelados). */
  saldo: { experimentos: number; iniciativas: number; beneficio: number }
}

export function tirarFoto(data: DashboardData, lidoEm: string): Foto {
  return {
    lidoEm,
    experimentos: Object.fromEntries(data.allEpics.map(e => [e.key, {
      nome: e.nome, status: e.status?.name ?? '', beneficio: e.beneficioQuantitativo ?? 0, cancelado: epicCancelado(e),
    }])),
    iniciativas: Object.fromEntries(data.iniciativas.map(i => [i.key, { nome: i.nome, status: i.status?.name ?? '', beneficio: 0, cancelado: false }])),
  }
}

const reais = (v: number) => (Math.abs(v) >= 1_000_000
  ? `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : `R$ ${Math.round(v).toLocaleString('pt-BR')}`)

const beneficioPotencial = (f: Foto) => Object.values(f.experimentos).reduce((s, e) => s + (e.cancelado ? 0 : e.beneficio), 0)

export function compararFotos(antes: Foto, depois: Foto): Movimento {
  const mudancas: Mudanca[] = []
  const comparar = (entidade: Mudanca['entidade'], a: Record<string, ItemDaFoto>, d: Record<string, ItemDaFoto>) => {
    for (const [key, x] of Object.entries(d)) {
      const antigo = a[key]
      if (!antigo) { mudancas.push({ tipo: 'entrou', entidade, key, nome: x.nome, para: x.status }); continue }
      if (antigo.status !== x.status) mudancas.push({ tipo: 'status', entidade, key, nome: x.nome, de: antigo.status, para: x.status })
      if (entidade === 'experimento' && antigo.beneficio !== x.beneficio) mudancas.push({ tipo: 'beneficio', entidade, key, nome: x.nome, de: reais(antigo.beneficio), para: reais(x.beneficio) })
    }
    for (const [key, x] of Object.entries(a)) if (!d[key]) mudancas.push({ tipo: 'saiu', entidade, key, nome: x.nome, de: x.status })
  }
  comparar('experimento', antes.experimentos, depois.experimentos)
  comparar('iniciativa', antes.iniciativas, depois.iniciativas)
  return {
    de: antes.lidoEm,
    ate: depois.lidoEm,
    mudancas,
    saldo: {
      experimentos: Object.keys(depois.experimentos).length - Object.keys(antes.experimentos).length,
      iniciativas: Object.keys(depois.iniciativas).length - Object.keys(antes.iniciativas).length,
      beneficio: beneficioPotencial(depois) - beneficioPotencial(antes),
    },
  }
}

/** Guarda a leitura nova como atual e empurra a atual para anterior; a mesma leitura não mexe em nada. */
export function avancarFotos(guardado: { atual: Foto; anterior: Foto | null } | null, nova: Foto): { atual: Foto; anterior: Foto | null } {
  if (!guardado) return { atual: nova, anterior: null }
  if (nova.lidoEm > guardado.atual.lidoEm) return { atual: nova, anterior: guardado.atual }
  return guardado
}
