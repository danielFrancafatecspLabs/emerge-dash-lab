// Base ILUSTRATIVA do painel de Exploração, enquanto o Discovery Flow 2.0 não tem fonte no Jira. Simula oportunidades
// andando pelas etapas (sempre a mesma, para a mesma data), então o fluxo, o funil e os indicadores são coerentes entre
// si. Nada aqui é dado real; a tela sinaliza isso.

import { ETAPAS, type DecisaoGate, type EtapaId, type Oportunidade } from './modelo'

const DIA = 86_400_000

const TEMAS = [
  'Atendimento por voz com IA', 'Triagem automática de chamados', 'Recomendação de planos', 'Cobrança preditiva',
  'Assistente para lojas', 'Antifraude na portabilidade', 'Onboarding digital PME', 'Manutenção preditiva de rede',
  'Assistente B2B', 'Precificação dinâmica', 'Leitura de NPS com IA', 'Roteirização de técnicos', 'Copiloto de vendas',
  'Análise de contratos com IA', 'Retenção no pré-pago', 'Eficiência energética em sites', 'Inventário por visão computacional',
  'Autoatendimento empresarial', 'Qualificação de leads', 'Segunda via inteligente',
]
const AREAS = ['Atendimento', 'Varejo', 'Rede', 'Empresarial', 'Finanças', 'Marketing']
const ESTEIRAS = ['Experimentação', 'Produto Digital', 'TI', 'Rede']

/** PRNG determinístico (mulberry32): a mesma semente gera sempre a mesma base. */
function aleatorio(semente: number) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sortear = <T,>(r: () => number, pesos: [T, number][]): T => {
  let x = r() * pesos.reduce((s, [, p]) => s + p, 0)
  for (const [v, p] of pesos) if ((x -= p) < 0) return v
  return pesos[pesos.length - 1][0]
}

export function oportunidadesDeExemplo(hoje = new Date(), quantidade = 64): Oportunidade[] {
  const r = aleatorio(2026)
  // Ancorada no dia (não na hora): a base não muda a cada recarga.
  const base = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  const iso = (t: number) => new Date(t).toISOString()
  const caminho = ETAPAS.filter(e => e.id !== 'gate' && e.id !== 'handoff').map(e => e.id)

  return Array.from({ length: quantidade }, (_, i) => {
    const identificada = base - Math.floor(r() * 180) * DIA - DIA
    const o: Oportunidade = {
      key: `OP-${101 + i}`,
      nome: `${TEMAS[i % TEMAS.length]}${i >= TEMAS.length ? ` ${Math.floor(i / TEMAS.length) + 1}` : ''}`,
      area: AREAS[Math.floor(r() * AREAS.length)],
      origem: r() < 0.6 ? 'prospeccao' : 'recebimento',
      etapa: 'identificar',
      identificadaEm: iso(identificada),
      naEtapaDesde: iso(identificada),
    }

    // Cada etapa leva de 3 a 12 dias; uma em cada oito empaca (30 a 50 dias).
    let t = identificada
    let etapa: EtapaId | null = null
    for (const id of caminho) {
      const dura = (r() < 0.125 ? 30 + r() * 20 : 3 + r() * 9) * DIA
      if (t + dura > base) { etapa = id; break }
      t += dura
    }
    if (r() < 0.7 && caminho.indexOf(etapa ?? 'direcionar') >= 2) o.beneficioEstimado = Math.round((0.2 + r() * 2.8) * 10) * 100_000
    if (etapa) return { ...o, etapa, naEtapaDesde: iso(t) }

    // Chegou ao Gate 1: aguarda a decisão de 2 a 12 dias.
    const chegada = t
    t += (2 + r() * 10) * DIA
    if (t > base) return { ...o, etapa: 'gate', naEtapaDesde: iso(chegada) }
    const decisoes: Oportunidade['decisoes'] = []
    let tipo = sortear<DecisaoGate>(r, [['aprovar', 62], ['ajustar', 14], ['pausar', 10], ['encerrar', 14]])
    if (tipo === 'ajustar') {
      // Volta ao Refinar e, depois do retrabalho, a uma nova decisão.
      decisoes.push({ tipo, em: iso(t) })
      const retrabalho = (5 + r() * 15) * DIA
      if (t + retrabalho > base) return { ...o, etapa: 'refinar', naEtapaDesde: iso(t), decisoes }
      t += retrabalho
      tipo = sortear<DecisaoGate>(r, [['aprovar', 70], ['pausar', 15], ['encerrar', 15]])
    }
    decisoes.push({ tipo, em: iso(t) })
    if (tipo !== 'aprovar') return { ...o, etapa: 'gate', naEtapaDesde: iso(t), decisoes }
    const respondeu = base - t > 10 * DIA
    return {
      ...o, etapa: 'handoff', naEtapaDesde: iso(t), decisoes,
      esteira: ESTEIRAS[Math.floor(r() * ESTEIRAS.length)],
      aceitaPelaEsteira: respondeu ? r() < 0.8 : undefined,
    }
  })
}
