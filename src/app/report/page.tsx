import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import ReportContent from '@/components/report/ReportContent'

export const dynamic = 'force-dynamic'

const PRIORITY_ORDER: Record<string, number> = {
  'Highest': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
  'Lowest': 4,
}

interface IniciativaDelivery {
  nome: string
  experimento: string
  situacaoAtual: string
  proximosPassos: string
  sponsor: string
  dominio: string
}

const iniciativasDelivery: IniciativaDelivery[] = [
  {
    nome: 'Reajuste Telmex',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando GO/No Go para OK de Delivery com recurso da Carla Tiemi.',
    proximosPassos: 'Tomar decisão para delivery, estimar custos de infra e subir a iniciativa para produção.',
    sponsor: 'Carla Tiemi',
    dominio: 'Empresarial',
  },
  {
    nome: 'Integridade do Produto',
    experimento: 'Sim',
    situacaoAtual: 'Contratação de Recursos e definição do plano em conjunto a Kamila Tairine.',
    proximosPassos: 'Começar o desenvolvimento a partir da segunda semana de Agosto.',
    sponsor: 'Patricia Mofato',
    dominio: 'Financeiro',
  },
  {
    nome: 'Logoff para WhatsApp',
    experimento: 'Sim',
    situacaoAtual: 'Execução de testes.',
    proximosPassos: 'Adquirir um hub USB de melhor qualidade; Contratar uma solução VPN; Aquisição de mais 22 aparelhos; Alocação de um desenvolvedor dedicado.',
    sponsor: 'Rodrigo Assad',
    dominio: 'TI',
  },
  {
    nome: 'Processamento de Manifestos',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando Go/No Go para Delivery.',
    proximosPassos: 'Executar Piloto.',
    sponsor: 'Felipe Takashi',
    dominio: 'Ouvidoria',
  },
  {
    nome: 'Automação para Resposta de Editais',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Decisão de Go para Delivery.',
    proximosPassos: 'Definir plano para rodar no Delivery.',
    sponsor: 'Heloisa Vieira',
    dominio: 'Engenharia',
  },
  {
    nome: 'Antispam',
    experimento: 'Sim',
    situacaoAtual: 'Realizar ajustes no App a partir da segunda quinzena de agosto.',
    proximosPassos: 'Realizar testes em conjunto ao Imusica.',
    sponsor: 'Gabriel Portugal',
    dominio: 'SVA',
  },
  {
    nome: 'Controle Parental',
    experimento: 'Não',
    situacaoAtual: 'Não definido plano para desenvolvimento.',
    proximosPassos: 'Definir plano para desenvolver em Delivery.',
    sponsor: 'Gabriel Portugal',
    dominio: 'SVA',
  },
]

export default async function ReportPage() {
  let data
  let error: string | null = null

  try {
    const raw = await fetchDashboardRaw()
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_16400?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11661 ?? null,
    }))
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2706Config)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Filter only "Em andamento" experiments, sorted by priority (High → Low)
  const emAndamento = data.allEpics
    .filter(e => e.status.name === 'Em andamento')
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.prioridade ?? ''] ?? 99
      const pb = PRIORITY_ORDER[b.prioridade ?? ''] ?? 99
      return pa - pb
    })

  // New entries in the pipeline — last 30 days
  // Two sources: (1) Initiatives created in last 30d → their epics
  //              (2) Epics created in last 30d (even if initiative is older)
  const agora = new Date()
  const corte = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)

  interface NovoNaEsteira {
    iniciativaKey: string
    iniciativaNome: string
    iniciativaCriadoEm: string | null
    epic: typeof data.allEpics[0]
    origem: 'iniciativa' | 'epic'  // which gate triggered this entry
  }

  const seen = new Set<string>() // epic key or iniciativa key for dedup
  const novosNaEsteira: NovoNaEsteira[] = []

  // Source 1: Initiatives created in the last 30 days
  for (const ini of data.iniciativas) {
    if (!ini.criadoEm) continue
    const d = new Date(ini.criadoEm)
    if (d < corte) continue
    for (const epic of ini.epics) {
      if (seen.has(epic.key)) continue
      seen.add(epic.key)
      novosNaEsteira.push({
        iniciativaKey: ini.key,
        iniciativaNome: ini.nome,
        iniciativaCriadoEm: ini.criadoEm,
        epic,
        origem: 'iniciativa',
      })
    }
    if (ini.epics.length === 0 && !seen.has(ini.key)) {
      seen.add(ini.key)
      novosNaEsteira.push({
        iniciativaKey: ini.key,
        iniciativaNome: ini.nome,
        iniciativaCriadoEm: ini.criadoEm,
        epic: null as any,
        origem: 'iniciativa',
      })
    }
  }

  // Source 2: Epics created in the last 30 days (regardless of initiative age)
  for (const epic of data.allEpics) {
    if (seen.has(epic.key)) continue
    if (!epic.criadoEm) continue
    const d = new Date(epic.criadoEm)
    if (d < corte) continue
    seen.add(epic.key)
    // Find parent initiative
    const parentIni = data.iniciativas.find(ini => ini.epics.some(e => e.key === epic.key))
    novosNaEsteira.push({
      iniciativaKey: parentIni?.key ?? '—',
      iniciativaNome: parentIni?.nome ?? '—',
      iniciativaCriadoEm: parentIni?.criadoEm ?? null,
      epic,
      origem: 'epic',
    })
  }

  // Sort by the most relevant date: epic created if from source 2, initiative created if from source 1
  novosNaEsteira.sort((a, b) => {
    const da = a.origem === 'epic' && a.epic?.criadoEm
      ? new Date(a.epic.criadoEm).getTime()
      : a.iniciativaCriadoEm ? new Date(a.iniciativaCriadoEm).getTime() : 0
    const db = b.origem === 'epic' && b.epic?.criadoEm
      ? new Date(b.epic.criadoEm).getTime()
      : b.iniciativaCriadoEm ? new Date(b.iniciativaCriadoEm).getTime() : 0
    return db - da
  })

  // ── Funil de Iniciativas (board 2706 — Ideação) ──
  const funilStages = [
    { label: 'Em Refinamento', value: data.pipeline['EM REFINAMENTO'], color: '#3B82F6' },
    { label: 'Em Experimentação', value: data.pipeline['EM EXPERIMENTAÇÃO'], color: '#FCD34D' },
    { label: 'Concluído', value: data.pipeline['FINALIZADO'], color: '#134E4A' },
    { label: 'Aguardando Piloto', value: data.pipeline['AGUARDANDO PILOTO'], color: '#A78BFA' },
    { label: 'Em Piloto', value: data.pipeline['EM PILOTO'], color: '#EF4444' },
    { label: 'Cancelado', value: data.pipeline['CANCELADO'], color: '#6B7280' },
  ]
  const funilMax = Math.max(...funilStages.map(s => s.value), 1)

  // ── Resumo por Domínio (Top 6, excluindo "Sem domínio") ──
  // Agrupa INICIATIVAS por domínio (campo dominios da Iniciativa), mas os insumos vêm dos Epics
  const dominioData = new Map<string, {
    iniciativas: typeof data.iniciativas
    epics: typeof data.allEpics
    totalIniciativas: number
    emAndamento: number
    emPiloto: number
    concluidos: number
    beneficioTotal: number
  }>()
  for (const ini of data.iniciativas) {
    const dominios = ini.dominios.length > 0 ? ini.dominios : ['Sem domínio']
    for (const d of dominios) {
      const dominioNome = d.trim()
      if (!dominioNome || dominioNome.toLowerCase() === 'sem domínio') continue
      if (!dominioData.has(dominioNome)) {
        dominioData.set(dominioNome, { iniciativas: [], epics: [], totalIniciativas: 0, emAndamento: 0, emPiloto: 0, concluidos: 0, beneficioTotal: 0 })
      }
      const s = dominioData.get(dominioNome)!
      // Evita duplicar a mesma iniciativa se ela tiver múltiplos domínios iguais
      if (!s.iniciativas.some(x => x.key === ini.key)) {
        s.iniciativas.push(ini)
        s.totalIniciativas++
      }
      // Adiciona os epics dessa iniciativa (evitando duplicatas)
      for (const epic of ini.epics) {
        if (!s.epics.some(x => x.key === epic.key)) {
          s.epics.push(epic)
          s.beneficioTotal += epic.beneficioQuantitativo ?? 0
          const statusName = epic.status.name
          if (statusName === 'Em andamento') s.emAndamento++
          if (statusName === 'EM PILOTO' || statusName === 'Em Piloto') s.emPiloto++
          if (statusName === 'Concluído' || statusName === 'FINALIZADO') s.concluidos++
        }
      }
    }
  }
  // Garante que "Operações Técnicas" sempre apareça como domínio
  if (!dominioData.has('Operações Técnicas')) {
    dominioData.set('Operações Técnicas', { iniciativas: [], epics: [], totalIniciativas: 0, emAndamento: 0, emPiloto: 0, concluidos: 0, beneficioTotal: 0 })
  }
  const top5Dominios = [...dominioData.entries()]
    .sort((a, b) => b[1].totalIniciativas - a[1].totalIniciativas)
    .slice(0, 7)
    .map(([nome, stats]) => ({
      nome,
      total: stats.totalIniciativas,
      emAndamento: stats.emAndamento,
      emPiloto: stats.emPiloto,
      concluidos: stats.concluidos,
      beneficioTotal: stats.beneficioTotal,
      epics: stats.epics,
      topEpics: [...stats.epics]
        .sort((a, b) => (b.beneficioQuantitativo ?? 0) - (a.beneficioQuantitativo ?? 0))
        .slice(0, 3),
    }))

  // ── Big Numbers ──
  const qtdExperimentos = data.allEpics.length

  // Conversão de Experimentos para Piloto:
  // % do total de iniciativas que estão em piloto ou em escala.
  // Usa os status IDs extraídos do boardConfig do board 2706.
  const pilotoOuEscalaIds = new Set([...data.pilotoStatusIds, ...data.escalaStatusIds])
  const totalIniciativas = data.iniciativas.length
  const iniciativasEmPilotoOuEscala = data.iniciativas.filter(ini =>
    pilotoOuEscalaIds.has(ini.status.id)
  )
  const conversaoExperimentacaoParaPiloto = totalIniciativas > 0
    ? `${Math.round((iniciativasEmPilotoOuEscala.length / totalIniciativas) * 100)}%`
    : '0%'

  // Benefício Potencial Estimado: soma de todos os benefícios quantitativos dos epics
  const beneficioPotencialEstimado = data.allEpics.reduce((sum, e) => sum + (e.beneficioQuantitativo ?? 0), 0)

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f0f0' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/jira/logobeonlabs.png" alt="BeOn Labs" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Report — Em Andamento</h1>
              <p className="text-xs text-gray-500">Experimentos em execução ordenados por prioridade</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/portfolio" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Ver lista completa
            </Link>
            <LogoutButton />
          </div>
        </header>

        <ReportContent
          emAndamento={emAndamento}
          novosNaEsteira={novosNaEsteira}
          iniciativasDelivery={iniciativasDelivery}
          funilStages={funilStages}
          funilMax={funilMax}
          top5Dominios={top5Dominios}
          qtdExperimentos={qtdExperimentos}
          conversaoExperimentacaoParaPiloto={conversaoExperimentacaoParaPiloto}
          beneficioPotencialEstimado={beneficioPotencialEstimado}
        />
      </main>
    </div>
  )
}