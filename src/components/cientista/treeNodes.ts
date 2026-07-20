import { ChatNode } from './decisionTree'
import { formatBRL } from '@/lib/mappers'

export const visaoGeralNodes: Record<string, ChatNode> = {
  visao_geral: {
    id: 'visao_geral',
    message: '**Visão Geral do Portfólio** — Principais métricas consolidadas:',
    question: 'O que deseja ver?',
    options: [
      { label: '📋 Experimentos em Andamento', nextId: 'qtd_experimentos_ativos' },
      { label: '🎯 Experimentos por Prioridade', nextId: 'experimentos_priorizados' },
      { label: '📈 Total de Iniciativas no Pipeline', nextId: 'total_iniciativas' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  qtd_experimentos_ativos: {
    id: 'qtd_experimentos_ativos', isLeaf: true, message: '',
    options: [{ label: '🔙 Visão Geral', nextId: 'visao_geral' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const ativos = d.allEpics.filter(e => !['Concluído','Cancelado'].includes(e.status.name))
      const concluidos = d.allEpics.filter(e => e.status.name === 'Concluído').length
      const total = d.allEpics.length
      return `**📋 Experimentos em Andamento**\n\n**${ativos.length} ativos** de ${total} no total.\n\n• Concluídos: **${concluidos}**\n• Cancelados: **${d.allEpics.filter(e => e.status.name === 'Cancelado').length}**\n• Taxa de conclusão: **${total > 0 ? Math.round(concluidos/total*100) : 0}%**`
    },
  },

  experimentos_priorizados: {
    id: 'experimentos_priorizados', isLeaf: true, message: '',
    options: [{ label: '🔙 Visão Geral', nextId: 'visao_geral' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const high = d.allEpics.filter(e => e.prioridade === 'High').length
      const med = d.allEpics.filter(e => e.prioridade === 'Medium').length
      const low = d.allEpics.filter(e => e.prioridade === 'Low').length
      const sem = d.allEpics.filter(e => !e.prioridade).length
      const t = d.allEpics.length
      return `**🎯 Experimentos por Prioridade** (${t} total)\n\n🔴 High: ${high} (${Math.round(high/t*100)}%)\n🟡 Medium: ${med} (${Math.round(med/t*100)}%)\n🟢 Low: ${low} (${Math.round(low/t*100)}%)\n⚪ Sem prioridade: ${sem} (${Math.round(sem/t*100)}%)`
    },
  },

  total_iniciativas: {
    id: 'total_iniciativas', isLeaf: true, message: '',
    options: [{ label: '🔙 Visão Geral', nextId: 'visao_geral' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const comEpics = d.iniciativas.filter(i => i.epics.length > 0).length
      return `**📈 Iniciativas no Pipeline**\n\nTotal: **${d.iniciativas.length}**\n\n• Com experimentos: **${comEpics}**\n• Sem experimentos: **${d.iniciativas.length - comEpics}**\n• Aguardando Piloto: **${d.iniciativasAguardandoPiloto}**\n• Em Piloto: **${d.iniciativasEmPiloto}**`
    },
  },
}
export const metricasFinanceirasNodes: Record<string, ChatNode> = {
  metricas_financeiras: {
    id: 'metricas_financeiras',
    message: '**💰 Métricas Financeiras** — Benefícios e custos do portfólio:',
    question: 'Qual métrica?',
    options: [
      { label: '💎 Potencial Total do Portfólio (R$)', nextId: 'potencial_total' },
      { label: '📊 Benefício Médio por Experimento', nextId: 'beneficio_medio' },
      { label: '🏆 Top 5 Maiores Benefícios', nextId: 'top5_beneficios' },
      { label: '💵 Custo Estimado Total', nextId: 'custo_total' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  potencial_total: {
    id: 'potencial_total', isLeaf: true, message: '',
    options: [{ label: '🔙 Métricas Financeiras', nextId: 'metricas_financeiras' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => `**💎 Potencial Total do Portfólio**\n\nBenefício potencial: **${formatBRL(d.beneficioTotal)}**\n\nPor meta:\n• EBITDA: ${formatBRL(d.metasAgregadas.EBITDA.valor)} (${d.metasAgregadas.EBITDA.count} iniciativas)\n• Receita: ${formatBRL(d.metasAgregadas.Receita.valor)} (${d.metasAgregadas.Receita.count} iniciativas)\n• NPS: ${formatBRL(d.metasAgregadas.NPS.valor)} (${d.metasAgregadas.NPS.count} iniciativas)`,
  },

  beneficio_medio: {
    id: 'beneficio_medio', isLeaf: true, message: '',
    options: [{ label: '🔙 Métricas Financeiras', nextId: 'metricas_financeiras' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => `**📊 Benefício Médio**\n\nMédia: **${formatBRL(d.beneficioMedio)}** por experimento\n\n• Experimentos com benefício: **${d.allEpics.filter(e => (e.beneficioQuantitativo ?? 0) > 0).length}**\n• Benefício total: **${formatBRL(d.beneficioTotal)}**`,
  },

  top5_beneficios: {
    id: 'top5_beneficios', isLeaf: true, message: '',
    options: [{ label: '🔙 Métricas Financeiras', nextId: 'metricas_financeiras' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      let r = '**🏆 Top 5 Maiores Benefícios**\n\n'
      d.top5Epics.forEach((e, i) => { r += `${i+1}. **${e.nome}** — ${formatBRL(e.beneficioQuantitativo ?? 0)}\n   Sponsor: ${e.sponsor ?? 'N/A'} | ${e.status.name}\n\n` })
      r += `💰 Soma: ${formatBRL(d.top5Epics.reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0))}`
      return r
    },
  },

  custo_total: {
    id: 'custo_total', isLeaf: true, message: '',
    options: [{ label: '🔙 Métricas Financeiras', nextId: 'metricas_financeiras' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const comCusto = d.allEpics.filter(e => (e.custoEstimado ?? 0) > 0)
      const custo = comCusto.reduce((s, e) => s + (e.custoEstimado ?? 0), 0)
      const roi = custo > 0 ? (d.beneficioTotal / custo).toFixed(1) : 'N/A'
      return `**💵 Custo Estimado Total**\n\nCusto: **${formatBRL(custo)}**\n\n• Experimentos com custo: **${comCusto.length}**/${d.allEpics.length}\n• ROI Potencial: **${roi}x**`
    },
  },
}
function makeMetaLeaf(meta: 'EBITDA' | 'Receita' | 'NPS', icon: string): ChatNode {
  const labels: Record<string, string> = { EBITDA: 'EBITDA', Receita: 'Receita', NPS: 'NPS' }
  return {
    id: `iniciativas_${meta.toLowerCase()}`,
    isLeaf: true,
    message: '',
    options: [{ label: '🔙 Metas & Impacto', nextId: 'metas_impacto' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const list = d.iniciativasPorMeta[meta]
      let r = `**${icon} Iniciativas de ${labels[meta]}** (${list.length})\n\n`
      list.slice(0, 10).forEach((i, idx) => {
        r += `${idx+1}. **${i.nome}** — ${formatBRL(i.beneficioQuantitativoTotal)}\n   Status: ${i.status.name} | Epics: ${i.epics.length}\n\n`
      })
      if (list.length > 10) r += `...e mais ${list.length - 10} iniciativa(s).`
      return r
    },
  }
}

export const metasImpactoNodes: Record<string, ChatNode> = {
  metas_impacto: {
    id: 'metas_impacto',
    message: '**🎯 Metas & Impacto** — Distribuição por categoria:',
    question: 'O que analisar?',
    options: [
      { label: '📊 Distribuição por Impacto', nextId: 'distribuicao_impacto' },
      { label: '💼 Iniciativas de EBITDA', nextId: 'iniciativas_ebitda' },
      { label: '💰 Iniciativas de Receita', nextId: 'iniciativas_receita' },
      { label: '⭐ Iniciativas de NPS', nextId: 'iniciativas_nps' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  distribuicao_impacto: {
    id: 'distribuicao_impacto', isLeaf: true, message: '',
    options: [{ label: '🔙 Metas & Impacto', nextId: 'metas_impacto' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const t = d.metasAgregadas.EBITDA.count + d.metasAgregadas.NPS.count + d.metasAgregadas.Receita.count
      return `**📊 Distribuição por Impacto (Iniciativas)**\n\n🔵 EBITDA: ${d.metasAgregadas.EBITDA.count} (${t>0?Math.round(d.metasAgregadas.EBITDA.count/t*100):0}%) — ${formatBRL(d.metasAgregadas.EBITDA.valor)}\n🟢 Receita: ${d.metasAgregadas.Receita.count} (${t>0?Math.round(d.metasAgregadas.Receita.count/t*100):0}%) — ${formatBRL(d.metasAgregadas.Receita.valor)}\n🔴 NPS: ${d.metasAgregadas.NPS.count} (${t>0?Math.round(d.metasAgregadas.NPS.count/t*100):0}%) — ${formatBRL(d.metasAgregadas.NPS.valor)}\n\n📌 Total: **${t}** iniciativas`
    },
  },

  iniciativas_ebitda: makeMetaLeaf('EBITDA', '💼'),
  iniciativas_receita: makeMetaLeaf('Receita', '💰'),
  iniciativas_nps: makeMetaLeaf('NPS', '⭐'),
}
export const pipelineStatusNodes: Record<string, ChatNode> = {
  pipeline_status: {
    id: 'pipeline_status',
    message: '**🏗️ Pipeline & Status** — Fluxo das iniciativas:',
    question: 'Qual visão?',
    options: [
      { label: '📊 Status do Pipeline (funil)', nextId: 'status_pipeline' },
      { label: '⏱️ Lead Time Médio', nextId: 'lead_time' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  status_pipeline: {
    id: 'status_pipeline', isLeaf: true, message: '',
    options: [{ label: '🔙 Pipeline & Status', nextId: 'pipeline_status' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const p = d.pipeline
      const items: [string, number][] = [
        ['BACKLOG', p.BACKLOG],
        ['EM REFINAMENTO', p['EM REFINAMENTO']],
        ['PRONTO PARA EXECUÇÃO', p['PRONTO PARA EXECUÇÃO']],
        ['AGUARDANDO PILOTO', p['AGUARDANDO PILOTO']],
        ['EM EXPERIMENTAÇÃO', p['EM EXPERIMENTAÇÃO']],
        ['EM PILOTO', p['EM PILOTO']],
        ['EM ESCALA', p['EM ESCALA']],
        ['FINALIZADO', p.FINALIZADO],
        ['CANCELADO', p.CANCELADO],
      ]
      const total = items.reduce((s, [, v]) => s + v, 0)
      let r = `**📊 Status do Pipeline** (${total} iniciativas)\n\n`
      items.forEach(([k, v]) => { if (v > 0) r += `• ${k}: **${v}**\n` })
      return r
    },
  },

  lead_time: {
    id: 'lead_time', isLeaf: true, message: '',
    options: [{ label: '🔙 Pipeline & Status', nextId: 'pipeline_status' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => `**⏱️ Lead Time**\n\n• Lead time total (iniciativas ativas): **${d.leadTime.leadtimeTotalDias} dias**\n• Lead time concluídas: **${d.leadTime.leadtimeConcluidasDias} dias**\n• Cycle time experimentação: **${d.leadTime.cycleTimeExperimentacaoDias} dias**\n• Tempo bloqueado (médio): **${d.leadTime.blockedTimeDias} dias**`,
  },
}
export const sponsorsTimesNodes: Record<string, ChatNode> = {
  sponsors_times: {
    id: 'sponsors_times',
    message: '**👥 Sponsors & Times** — Quem está tocando o portfólio:',
    question: 'O que ver?',
    options: [
      { label: '🏅 Top 5 Sponsors', nextId: 'top_sponsors' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  top_sponsors: {
    id: 'top_sponsors', isLeaf: true, message: '',
    options: [{ label: '🔙 Sponsors & Times', nextId: 'sponsors_times' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      let r = '**🏅 Top 5 Sponsors**\n\n'
      d.topSponsors.forEach((s, i) => { r += `${i+1}. **${s.nome}** — ${s.count} experimentos\n` })
      return r
    },
  },
}
export const alertasRiscosNodes: Record<string, ChatNode> = {
  alertas_riscos: {
    id: 'alertas_riscos',
    message: '**⚠️ Alertas & Riscos** — Pontos de atenção no portfólio:',
    question: 'Qual alerta?',
    options: [
      { label: '🚨 Experimentos Bloqueados', nextId: 'bloqueados' },
      { label: '⏳ Aguardando Delivery', nextId: 'aguardando_delivery' },
      { label: '❓ Sem Sponsor', nextId: 'sem_sponsor' },
      { label: '🔄 Voltar', nextId: 'root' },
    ],
  },

  bloqueados: {
    id: 'bloqueados', isLeaf: true, message: '',
    options: [{ label: '🔙 Alertas & Riscos', nextId: 'alertas_riscos' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const bloqueados = d.allEpics.filter(e => !!e.motivoBloqueio)
      let r = `**🚨 Experimentos Bloqueados**: **${bloqueados.length}**\n\n`
      bloqueados.slice(0, 10).forEach(e => {
        r += `• **${e.nome}** — ${e.motivoBloqueio ?? 'Sem motivo'}\n`
      })
      if (bloqueados.length > 10) r += `\n...e mais ${bloqueados.length - 10} bloqueado(s).`
      if (bloqueados.length === 0) r += '✅ Nenhum experimento bloqueado no momento.'
      return r
    },
  },

  aguardando_delivery: {
    id: 'aguardando_delivery', isLeaf: true, message: '',
    options: [{ label: '🔙 Alertas & Riscos', nextId: 'alertas_riscos' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const aguardando = d.allEpics.filter(e => e.status.name === 'AGUARDANDO PILOTO' || e.status.name === 'PRONTO PARA EXECUÇÃO')
      let r = `**⏳ Aguardando Delivery**: **${aguardando.length}**\n\n`
      aguardando.slice(0, 10).forEach(e => { r += `• **${e.nome}** — ${e.status.name} | Sponsor: ${e.sponsor ?? 'N/A'}\n` })
      if (aguardando.length > 10) r += `\n...e mais ${aguardando.length - 10} aguardando.`
      if (aguardando.length === 0) r += '✅ Nenhum experimento aguardando delivery.'
      return r
    },
  },

  sem_sponsor: {
    id: 'sem_sponsor', isLeaf: true, message: '',
    options: [{ label: '🔙 Alertas & Riscos', nextId: 'alertas_riscos' }, { label: '🏠 Menu Principal', nextId: 'root' }],
    computeAnswer: (d) => {
      const sem = d.allEpics.filter(e => !e.sponsor || e.sponsor.trim() === '')
      let r = `**❓ Experimentos Sem Sponsor**: **${sem.length}**\n\n`
      sem.slice(0, 10).forEach(e => { r += `• **${e.nome}** — ${e.status.name}\n` })
      if (sem.length > 10) r += `\n...e mais ${sem.length - 10} sem sponsor.`
      if (sem.length === 0) r += '✅ Todos os experimentos têm sponsor definido.'
      return r
    },
  },
}
