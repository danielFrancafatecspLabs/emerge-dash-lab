import { DashboardData } from '@/lib/types'
import { formatBRL } from '@/lib/mappers'
import {
  visaoGeralNodes,
  metricasFinanceirasNodes,
  metasImpactoNodes,
  pipelineStatusNodes,
  sponsorsTimesNodes,
  alertasRiscosNodes,
} from './treeNodes'

export type NodeId = string

export interface ChatNode {
  id: NodeId
  message: string
  question?: string
  options: ChatOption[]
  isLeaf?: boolean
  computeAnswer?: (data: DashboardData) => string
}

export interface ChatOption {
  label: string
  nextId: NodeId
}

export interface ChatMessage {
  role: 'bot' | 'user'
  text: string
  nodeId?: NodeId
}

// ============================================================
// ÁRVORE DE DECISÃO HIERÁRQUICA (if/else)
// ============================================================

export const DECISION_TREE: Record<NodeId, ChatNode> = {

  // ======================== RAÍZ ========================
  root: {
    id: 'root',
    message: 'Olá! Eu sou a **Cientista BeOn Labs** 🧪\n\nSou sua assistente de análise de portfólio. Posso te ajudar com insights sobre iniciativas, experimentos, métricas financeiras e muito mais.\n\n**O que você gostaria de saber?**',
    question: 'Escolha uma categoria:',
    options: [
      { label: '📊 Visão Geral do Portfólio', nextId: 'visao_geral' },
      { label: '💰 Métricas Financeiras', nextId: 'metricas_financeiras' },
      { label: '🎯 Metas & Impacto', nextId: 'metas_impacto' },
      { label: '🏗️ Pipeline & Status', nextId: 'pipeline_status' },
      { label: '👥 Sponsors & Times', nextId: 'sponsors_times' },
      { label: '⚠️ Alertas & Riscos', nextId: 'alertas_riscos' },
    ],
  },

  // ======================== NÓS IMPORTADOS ========================
  ...visaoGeralNodes,
  ...metricasFinanceirasNodes,
  ...metasImpactoNodes,
  ...pipelineStatusNodes,
  ...sponsorsTimesNodes,
  ...alertasRiscosNodes,
}

// ── Helpers ────────────────────────────────────────────
// makeMetaLeaf foi movido para treeNodes.ts