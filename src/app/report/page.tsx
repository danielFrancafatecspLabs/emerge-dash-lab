import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData, getPipelineStage } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import GenerateImageButton from '@/components/report/GenerateImageButton'
import ReportContent from '@/components/report/ReportContent'
import type { IniciativaSlideRow } from '@/components/report/IniciativasSlides'
import type { IniciativaCandidataRow } from '@/components/report/IniciativasCandidatasSlides'

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
    nome: 'Smart Capex',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando GO/No Go para OK de Delivery com recurso da Carla Tiemi.',
    proximosPassos: 'Tomar decisão para delivery, estimar custos de infra e subir a iniciativa para produção.',
    sponsor: 'Heloisa Ubrig',
    dominio: 'Diretoria Estratégia',
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
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_30014 ?? null,
    }))
    const [classification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])
    data = buildDashboardData(raw.iniciativas, raw.epics, classification, segmentoClassification, raw.board2734Config, raw.epicChangelogs, raw.iniciativaChangelogs)
  } catch (e) {
    error = String(e)
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: '#f0f0f0' }}>
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-lg">
          <p className="text-2xl font-bold mb-2" style={{ color: '#CC0000' }}>Erro ao carregar dados</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // ── Experimentos em Andamento ou Validação, ordenados por prioridade ──
  // Inclui apenas: Em andamento, EM VALIDAÇÃO, Em validação
  // Exclui: BACKLOG, Em refinamento, PRONTO PARA EXECUÇÃO, Concluído, Cancelado, FINALIZADO
  const STATUS_ANDAMENTO_VALIDACAO = new Set([
    'Em andamento', 'EM VALIDAÇÃO', 'Em validação',
  ])
  const emAndamento = data.allEpics
    .filter(e => STATUS_ANDAMENTO_VALIDACAO.has(e.status.name ?? ''))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.prioridade ?? ''] ?? 99
      const pb = PRIORITY_ORDER[b.prioridade ?? ''] ?? 99
      return pa - pb
    })

  // ── Slides "Experimentos em Andamento" (Iniciativas Gerais) ──
  // Nome da iniciativa = nome do Epic (board 2735) em Refinamento, Em andamento ou
  // Em validação. Lab Responsável vem sempre da Iniciativa-mãe (não do próprio Epic —
  // o Epic pode ter o campo vazio ou divergente, a Iniciativa é a fonte confiável aqui).
  const labResponsavelPorEpic = new Map<string, string>()
  for (const ini of data.iniciativas) {
    for (const epic of ini.epics) {
      labResponsavelPorEpic.set(epic.key, ini.timeResponsavel ?? '—')
    }
  }

  const PRIORIDADE_LABEL: Record<string, IniciativaSlideRow['prioridade']> = {
    'Highest': 'Alta', 'High': 'Alta',
    'Medium': 'Média',
    'Low': 'Baixa', 'Lowest': 'Baixa',
  }

  function formatBeneficioMM(valor: number | null): string {
    if (!valor) return 'Não Mapeado'
    const mm = valor / 1_000_000
    const casas = mm >= 10 || Number.isInteger(mm) ? 0 : 1
    return `R$ ${mm.toFixed(casas)} MM`
  }

  // Limpa a descrição: remove emojis e a palavra "Objetivo" (ou "**Objetivo**") do início
  function limparDescricao(raw: string | null): string {
    if (!raw) return '—'
    // Remove emojis (unicode pictographs, symbols, etc.)
    let texto = raw.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{23FF}]/gu, '').trim()
    // Remove "Objetivo" ou "**Objetivo**" do início (com ou sem markdown, case insensitive)
    texto = texto.replace(/^(?:\*\*)?Objetivo(?:\*\*)?:?\s*/i, '').trim()
    return texto || '—'
  }

  // Usa a MESMA lista de emAndamento (todos os experimentos ativos) para os slides
  const iniciativasSlides: IniciativaSlideRow[] = emAndamento
    .map(e => ({
      key: e.key,
      nome: e.nome,
      prioridade: PRIORIDADE_LABEL[e.prioridade ?? ''] ?? '—',
      descricao: limparDescricao(e.descricao),
      sponsor: e.sponsor ?? '—',
      diretoria: e.dominio ?? '—',
      beneficioLabel: formatBeneficioMM(e.beneficioQuantitativo),
      labResponsavel: labResponsavelPorEpic.get(e.key) ?? '—',
    }))

  // ── Slides "Iniciativas Concluídas / Candidatas a Delivery" ──
  // Lista fixa de iniciativas definida pelo time beOn Labs.
  // Para cada uma, busca o Epic filho concluído (status 10019 ou 10003) e extrai
  // benefício quantitativo, lab responsável (da iniciativa-mãe) e lead time pós-conclusão.
  const CANDIDATAS_DELIVERY_NOMES = new Set([
    'ARI Juridico',
    'Zelador',
    'Reajuste Telmex',
    'OCR do Solar',
    'Processamento de Manifestos',
    'Identificação de Chamadas de Spam',
    'Automação de Editais',
    'Qualificações de Segurança',
    'Tabulação Automática em Leitura de Contexto',
  ])

  function formatTempoDesdeConclusao(concluidoEm: string | null): string {
    if (!concluidoEm) return '—'
    const agora = new Date()
    const conclusao = new Date(concluidoEm)
    const diffMs = agora.getTime() - conclusao.getTime()
    if (diffMs < 0) return '—'
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDias < 1) return 'Hoje'
    if (diffDias === 1) return '1 dia'
    if (diffDias < 30) return `${diffDias} dias`
    const diffMeses = Math.floor(diffDias / 30)
    const diasResto = diffDias % 30
    if (diffMeses === 1) return diasResto > 0 ? `1 mês e ${diasResto}d` : '1 mês'
    return diasResto > 0 ? `${diffMeses} meses e ${diasResto}d` : `${diffMeses} meses`
  }

  const iniciativasCandidatas: IniciativaCandidataRow[] = data.iniciativas
    .filter(ini => CANDIDATAS_DELIVERY_NOMES.has(ini.nome.trim()))
    .map(ini => {
      const epicConcluido = ini.epics.find(e => e.status.id === '10019' || e.status.id === '10003')
      const concluida = !!epicConcluido
      const situacaoBadge: IniciativaCandidataRow['situacaoBadge'] =
        concluida ? 'CONCLUÍDO' : ini.epics.length === 0 ? 'N/A' : 'EM ANDAMENTO'
      const situacaoTexto = ini.epics.find(e => e.statusDetalhado)?.statusDetalhado ?? ''
      return {
        key: ini.key,
        nome: ini.nome,
        experimento: ini.epics.length > 0 ? 'Sim' : 'Não',
        situacaoBadge,
        situacaoTexto,
        proximosPassos: '',
        sponsor: ini.sponsor ?? ini.sponsors[0] ?? '—',
        diretoria: ini.dominios[0] ?? '—',
        beneficioQuantitativo: epicConcluido?.beneficioQuantitativo ?? null,
        labResponsavel: labResponsavelPorEpic.get(epicConcluido?.key ?? '') ?? ini.timeResponsavel ?? '—',
        concluidoEm: epicConcluido?.concluidoEm ?? null,
      }
    })

  // ── Novos Experimentos (últimos 15 dias) ──
  // Lista INICIATIVAS criadas nos últimos 15 dias com nome, resumo, BO, Sponsor e data de criação
  const agora = new Date()
  const corte = new Date(agora.getTime() - 15 * 24 * 60 * 60 * 1000)

  interface NovoNaEsteira {
    key: string
    nome: string
    status: string
    sponsors: string[]
    dominios: string[]
    criadoEm: string | null
    qtdExperimentos: number
    resumo: string
    bo: string
  }

  const seen = new Set<string>()
  const novosNaEsteira: NovoNaEsteira[] = []

  // Initiatives created in the last 15 days
  for (const ini of data.iniciativas) {
    if (!ini.criadoEm) continue
    const d = new Date(ini.criadoEm)
    if (d < corte) continue
    if (seen.has(ini.key)) continue
    seen.add(ini.key)
    // Use initiative-level sponsor as fallback when no experiment sponsors exist
    const sponsors = ini.sponsors.length > 0
      ? ini.sponsors
      : (ini.sponsor ? [ini.sponsor] : [])
    // Pega o BO do primeiro epic que tiver, ou '—'
    const bo = ini.epics.find(e => e.bo)?.bo ?? '—'
    // Pega o resumo da descrição do primeiro epic, ou '—'
    const resumo = ini.epics.find(e => e.descricao)?.descricao ?? '—'
    novosNaEsteira.push({
      key: ini.key,
      nome: ini.nome,
      status: ini.status.name,
      sponsors,
      dominios: ini.dominios,
      criadoEm: ini.criadoEm,
      qtdExperimentos: ini.epics.length,
      resumo,
      bo,
    })
  }

  // Sort by creation date (newest first)
  novosNaEsteira.sort((a, b) => {
    const da = a.criadoEm ? new Date(a.criadoEm).getTime() : 0
    const db = b.criadoEm ? new Date(b.criadoEm).getTime() : 0
    return db - da
  })

  // ── Funil de Inovação ──
  // Em Andamento: Experimentos (Epics do board 2735) com status "Em andamento"
  // Em Piloto: Iniciativas (board 2734) na coluna "EM PILOTO"
  // Concluídos: Experimentos (Epics do board 2735) com status "Concluído"
  // Em Escala: Iniciativas (board 2734) na coluna "EM ESCALA"
  const emAndamentoCount = data.allEpics.filter(e => e.status.id === '3').length
  const emPilotoCount = data.pipeline['EM PILOTO']
  const concluidosCount = data.allEpics.filter(e => e.status.id === '10019').length
  const emEscalaCount = data.pipeline['EM ESCALA']

  const funilStages = [
    { label: 'Em Andamento', value: emAndamentoCount, color: '#3B82F6' },
    { label: 'Em Piloto', value: emPilotoCount, color: '#EF4444' },
    { label: 'Concluídos', value: concluidosCount, color: '#134E4A' },
    { label: 'Em Escala', value: emEscalaCount, color: '#22C55E' },
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
          const statusName = epic.status?.name ?? ''
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
  const qtdExperimentosAtivos = data.allEpics.filter(
    e => e.status.name !== 'Concluído' && e.status.name !== 'Cancelado'
  ).length

  // Conversões (mesma lógica do PipelineInovacao):
  // % de iniciativas que chegaram a Piloto (EM PILOTO + EM ESCALA / total)
  // % de iniciativas que chegaram a Escala (EM ESCALA / total)
  const pilotoOuEscalaIds = new Set([...data.pilotoStatusIds, ...data.escalaStatusIds])
  const totalIniciativas = data.iniciativas.length

  const countEmPiloto = data.iniciativas.filter(i => data.pilotoStatusIds.includes(i.status.id)).length
  const countEmEscala = data.iniciativas.filter(i => data.escalaStatusIds.includes(i.status.id)).length

  const conversaoPiloto = totalIniciativas > 0
    ? `${Math.round(((countEmPiloto + countEmEscala) / totalIniciativas) * 100)}%`
    : '0%'
  const conversaoEscala = totalIniciativas > 0
    ? `${Math.round((countEmEscala / totalIniciativas) * 100)}%`
    : '0%'

  const iniciativasEmPilotoOuEscala = countEmPiloto + countEmEscala

  // Benefício Potencial Estimado: soma de todos os benefícios quantitativos dos epics
  const beneficioPotencialEstimado = data.allEpics.reduce((sum, e) => sum + (e.beneficioQuantitativo ?? 0), 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f0f0' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header fixo */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/jira/logobeonlabs.png" alt="BeOn Labs" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Report — Todos os Experimentos Ativos</h1>
              <p className="text-xs text-gray-500">{emAndamento.length} experimentos ordenados por prioridade (maior → menor)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/portfolio" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Ver lista completa
            </Link>
            <GenerateImageButton />
            <LogoutButton />
          </div>
        </header>

        <ReportContent
          iniciativasSlides={iniciativasSlides}
          iniciativasCandidatas={iniciativasCandidatas}
          emAndamento={emAndamento}
          novosNaEsteira={novosNaEsteira}
          iniciativasDelivery={iniciativasDelivery}
          funilStages={funilStages}
          funilMax={funilMax}
          top5Dominios={top5Dominios}
          qtdExperimentosAtivos={qtdExperimentosAtivos}
          iniciativasEmPilotoOuEscala={iniciativasEmPilotoOuEscala}
          conversaoPiloto={conversaoPiloto}
          conversaoEscala={conversaoEscala}
          beneficioPotencialEstimado={beneficioPotencialEstimado}
        />
      </main>
    </div>
  )
}