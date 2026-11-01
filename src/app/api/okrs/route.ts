import type { ChangelogEntry } from '@/lib/jira'
import { dashboardRawAtualizadoEm, fetchDashboardRaw } from '@/lib/jira'

// OKRs calculados sobre a leitura diária do Jira (fetchDashboardRaw): Epics, Iniciativas e o changelog das
// Iniciativas já vêm de lá. Esta rota não chama o Jira por conta própria.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ============================================================
// Tipos
// ============================================================

interface KR {
  label: string
  base: string
  meta: string
  atual: string
  pct: string
}

interface Objetivo {
  titulo: string
  krs: KR[]
}

interface OkrResponse {
  objetivos: Objetivo[]
  atualizadoEm: string
}

interface JiraIssueLight {
  key: string
  fields: {
    created?: string
    summary?: string
    status: { id: string; name: string }
    customfield_30216?: number  // Benefício Quantitativo (was customfield_13242)
    customfield_11987?: { value: string } | null  // was customfield_16400
  }
}

// ============================================================
// Helpers
// ============================================================

const MS_POR_DIA = 1000 * 60 * 60 * 24
function diasEntre(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (isNaN(da) || isNaN(db)) return 0
  return Math.round((db - da) / MS_POR_DIA)
}

function calcPct(base: number, meta: number, atual: number): string {
  if (meta === base) return '100%'
  const pct = ((atual - base) / (meta - base)) * 100
  return `${Math.max(0, Math.round(pct * 100) / 100).toFixed(1)}%`
}

// Para metas de redução (menor é melhor): % = (base - atual) / (base - meta) * 100
function calcPctReducao(base: number, meta: number, atual: number): string {
  if (base === meta) return '100%'
  const pct = ((base - atual) / (base - meta)) * 100
  return `${Math.max(0, Math.min(100, Math.round(pct * 100) / 100)).toFixed(1)}%`
}

function fmtMM(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} MM`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} mil`
  return String(v)
}

// ============================================================
// Cálculo dos KRs
// ============================================================

// Calcula o tempo médio (em dias) desde a entrada no board (primeiro changelog ou criação)
// até a primeira transição para status de piloto (12847 ou 12848).
// Base: baseline histórico (iniciativas que já chegaram ao piloto).
// Atual: mesmo cálculo, refletindo a situação corrente.
function calcTempoMedioIdeacaoPiloto(
  iniciativaChangelogs: Record<string, ChangelogEntry[]>,
  iniciativas: JiraIssueLight[]
): { mediaDias: number; count: number; baselineDias: number } {
  const PILOTO_IDS = new Set(['12847', '12848'])
  const dias: number[] = []

  for (const ini of iniciativas) {
    const changelog = iniciativaChangelogs[ini.key]
    if (!changelog || changelog.length === 0) continue

    // Ordena changelog por data (mais antigo primeiro)
    const sorted = [...changelog].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

    // Ponto de partida: data do primeiro changelog (entrada no board/backlog)
    // Se não houver changelog, usa a data de criação da issue
    const inicio = sorted[0]?.created ?? ini.fields.created
    if (!inicio) continue

    // Encontra a primeira transição PARA um status de piloto
    let entrouEm: string | null = null
    for (const entry of sorted) {
      for (const item of entry.items) {
        if (item.field !== 'status') continue
        if (PILOTO_IDS.has(item.toString ?? '')) {
          entrouEm = entry.created
          break
        }
      }
      if (entrouEm) break
    }

    // Se já está em piloto atualmente e não temos registro de entrada, usa hoje
    if (!entrouEm && PILOTO_IDS.has(ini.fields.status.id)) {
      entrouEm = new Date().toISOString()
    }

    if (entrouEm) {
      const d = diasEntre(inicio, entrouEm)
      if (d > 0) dias.push(d)
    }
  }

  if (dias.length === 0) return { mediaDias: 0, count: 0, baselineDias: 0 }

  // Ordena para calcular baseline (mediana das que já chegaram, excluindo outliers)
  const sortedDias = [...dias].sort((a, b) => a - b)
  const mediana = sortedDias[Math.floor(sortedDias.length / 2)]

  return {
    mediaDias: Math.round(dias.reduce((s, d) => s + d, 0) / dias.length),
    count: dias.length,
    baselineDias: mediana,
  }
}

// Conta iniciativas que estão ou passaram por status de piloto/experimentação
function calcTaxaEvolucaoPiloto(iniciativas: JiraIssueLight[]): { pct: number; countPiloto: number; total: number } {
  const PILOTO_STATUS_NAMES = new Set([
    'EM PILOTO',
    'Em experimentação',
    'Aguardando Piloto',
  ])
  const count = iniciativas.filter(i => PILOTO_STATUS_NAMES.has(i.fields.status.name)).length
  const total = iniciativas.length
  return { pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0, countPiloto: count, total }
}

function calcPctCasosIA(epics: JiraIssueLight[]): { pct: number; countIA: number; total: number } {
  const KW = ['ia', 'inteligência artificial', 'inteligencia artificial', 'machine learning', 'ml',
    'chatbot', 'llm', 'genai', 'gen ai', 'copilot', 'gpt', 'assistente', 'agente',
    'automação inteligente', 'nlp', 'computer vision', 'deep learning', 'rede neural']
  let count = 0
  for (const e of epics) {
    const texto = `${e.fields.customfield_11987?.value ?? ''} ${e.fields.summary ?? ''}`.toLowerCase()
    if (KW.some(kw => texto.includes(kw))) count++
  }
  const total = epics.length
  return { pct: total > 0 ? Math.round((count / total) * 10000) / 100 : 0, countIA: count, total }
}

// ============================================================
// GET handler
// ============================================================

export async function GET(): Promise<Response> {
  try {
    const raw = await fetchDashboardRaw()
    const epics = raw.epics as unknown as JiraIssueLight[]
    const iniciativas = raw.iniciativas as unknown as JiraIssueLight[]
    const iniciativaChangelogs: Record<string, ChangelogEntry[]> = raw.iniciativaChangelogs

    // Calcular KRs
    const tempoPiloto = calcTempoMedioIdeacaoPiloto(iniciativaChangelogs, iniciativas)
    const experimentosIniciados = epics.length
    const taxaPiloto = calcTaxaEvolucaoPiloto(iniciativas)
    const aprovadosProducao = epics.filter(e => e.fields.status.id === '10019').length
    const valorFinanceiro = epics.reduce((s, e) => s + (e.fields.customfield_30216 ?? 0), 0)
    const casosIA = calcPctCasosIA(epics)

    const objetivos: Objetivo[] = [
      {
        titulo: '1. Acelerar a velocidade de Experimentação do beOn Labs',
        krs: [
          { label: 'Reduzir o tempo médio entre Ideação e Piloto', base: `${tempoPiloto.baselineDias} dias`, meta: '150 dias', atual: `${tempoPiloto.mediaDias} dias`, pct: calcPctReducao(tempoPiloto.baselineDias, 150, tempoPiloto.mediaDias) },
          { label: 'Aumentar o número de Experimentos Iniciados', base: '211', meta: '230', atual: String(experimentosIniciados), pct: calcPct(211, 230, experimentosIniciados) },
        ],
      },
      {
        titulo: '2. Maximizar o impacto dos experimentos no negócio',
        krs: [
          { label: 'Pilotos executados', base: '34,9%', meta: '40%', atual: `${taxaPiloto.pct}%`, pct: calcPct(34.9, 40, taxaPiloto.pct) },
          { label: 'Experimentos aprovados para Produção', base: '0', meta: '1', atual: String(aprovadosProducao), pct: calcPct(0, 1, aprovadosProducao) },
          { label: 'Valor financeiro potencial identificado', base: '63 MM', meta: '150 MM', atual: fmtMM(valorFinanceiro), pct: calcPct(63_000_000, 150_000_000, valorFinanceiro) },
        ],
      },
      {
        titulo: '3. Expandir a adoção de IA',
        krs: [
          { label: 'Novos casos de IA iniciados', base: '58,25%', meta: '62,25%', atual: `${casosIA.pct}%`, pct: calcPct(58.25, 62.25, casosIA.pct) },
        ],
      },
    ]

    return Response.json({ objetivos, atualizadoEm: dashboardRawAtualizadoEm()?.toISOString() ?? new Date().toISOString() } satisfies OkrResponse)
  } catch (e) {
    console.error('Erro ao gerar OKRs:', e)
    return Response.json({ error: 'jira-indisponivel', detalhe: String(e) }, { status: 503 })
  }
}