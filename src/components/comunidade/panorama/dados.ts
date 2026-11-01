'use client'

// Dados do panorama da home (Radar, acervo, experimentos e OSINT), lidos uma vez e divididos entre os stories e os
// blocos do feed: o mesmo pedido serve os dois por 5 minutos.

import { useEffect, useState } from 'react'
import type { Edicao } from '@/lib/newsletter/edicao'
import type { ExperimentoAtivo } from '@/lib/community/experimentos-ativos'
import type { ResearchVault } from '@/lib/research-vault'
import type { ResumoDoOsint } from '@/lib/community/sinais-osint'
import { api, errorMessage } from '../api'

export interface Dado<T> { data: T | null; erro: string | null }

const TTL = 5 * 60 * 1000
const pedidos = new Map<string, { em: number; p: Promise<unknown> }>()

function buscar<T>(caminho: string): Promise<T> {
  const atual = pedidos.get(caminho)
  if (atual && Date.now() - atual.em < TTL) return atual.p as Promise<T>
  const p = api<T>(caminho)
  pedidos.set(caminho, { em: Date.now(), p })
  p.catch(() => pedidos.delete(caminho))
  return p
}

function useDado<T>(caminho: string): Dado<T> {
  const [estado, setEstado] = useState<Dado<T>>({ data: null, erro: null })
  useEffect(() => {
    let vivo = true
    buscar<T>(caminho)
      .then(data => { if (vivo) setEstado({ data, erro: null }) })
      .catch(err => { if (vivo) setEstado({ data: null, erro: errorMessage(err) }) })
    return () => { vivo = false }
  }, [caminho])
  return estado
}

export interface ExperimentosResposta { itens: ExperimentoAtivo[]; atualizadoEm: string | null }

export const useEdicaoDoRadar = () => useDado<Edicao>('/community/newsletter')
export const useAcervo = () => useDado<ResearchVault>('/pesquisas')
export const useExperimentosAtivos = () => useDado<ExperimentosResposta>('/community/experimentos')
export const useResumoDoOsint = () => useDado<ResumoDoOsint>('/osint/resumo')

/** As pesquisas do acervo (tópicos), da mais recente para a mais antiga. */
export function pesquisasRecentes(vault: ResearchVault | null, quantas = 4) {
  if (!vault) return []
  return vault.documents
    .filter(d => d.type === 'topic')
    .sort((a, b) => (b.updated ?? b.created ?? '').localeCompare(a.updated ?? a.created ?? ''))
    .slice(0, quantas)
}

export const linkDaPesquisa = (path: string) => `/comunidade/pesquisas?doc=${encodeURIComponent(path)}`

/** A provocação que a automação do Radar escreveu na discussão (linha "Provocação: …"). */
export function provocacaoDoPost(content: string): string | null {
  return /^Provocação: (.+)$/m.exec(content)?.[1]?.trim() ?? null
}
