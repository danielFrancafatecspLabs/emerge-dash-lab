import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import GenerateImageButton from '@/components/report/GenerateImageButton'
import ReportContent from '@/components/report/ReportContent'
import { iniciativasDelivery } from '@/lib/report-data'
import {
  formatBeneficioMM,
  limparDescricao,
  estaBloqueadoAgora,
  PRIORIDADE_LABEL,
  PRIORITY_ORDER,
  CANDIDATAS_DELIVERY_NOMES,
  STATUS_ANDAMENTO_VALIDACAO,
} from '@/lib/report-utils'
import { BLOQUEIOS_DATA } from '@/lib/bloqueios-data'
import type {
  IniciativaSlideRow,
  IniciativaCandidataRow,
  BloqueadoSlideRow,
} from '@/lib/types'
import type { ChangelogEntry } from '@/lib/jira'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  let data
  let error: string | null = null
  let epicChangelogs: Record<string, ChangelogEntry[]> = {}

  try {
    const raw = await fetchDashboardRaw()
    epicChangelogs = raw.epicChangelogs
    const epicInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const segmentoInputs = raw.epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
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
  const emAndamento = data.allEpics
    .filter(e => STATUS_ANDAMENTO_VALIDACAO.has(e.status.name ?? ''))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.prioridade ?? ''] ?? 99
      const pb = PRIORITY_ORDER[b.prioridade ?? ''] ?? 99
      return pa - pb
    })

  // ── Slides "Experimentos em Andamento" (Iniciativas Gerais) ──
  // Lab Responsável vem sempre da Iniciativa-mãe (não do próprio Epic).
  const labResponsavelPorEpic = new Map<string, string>()
  for (const ini of data.iniciativas) {
    for (const epic of ini.epics) {
      // Prioriza o `timeResponsavel` do próprio epic (pode ter sido propagado do pai),
      // em seguida usa o time da iniciativa mãe como fallback.
      const lab = epic.timeResponsavel ?? ini.timeResponsavel ?? '—'
      labResponsavelPorEpic.set(epic.key, lab)
    }
  }

  // Usa a MESMA lista de emAndamento (todos os experimentos ativos) para os slides
  const EXCLUIR_DO_SLIDE = new Set(['Personas Sintéticas', 'Leads PME - 2º Ciclo', 'Claro Box x OTTs'])
  const EXCLUIR = EXCLUIR_DO_SLIDE

  // ── Slides "Experimentos Bloqueados" (construímos primeiro para ser a fonte de verdade)
  // Mapeia key -> categoria (motivo) a partir dos dados do slide de bloqueios (quadrantes)
  const bloqueiosPorKey = new Map<string, string>()
  const bloqueiosPorNome = new Map<string, string>()
  const bloqueiosItems: { key: string; nome: string; titulo: string }[] = []
  for (const cat of BLOQUEIOS_DATA.categorias) {
    // Ignorar motivo "BENEFÍCIO POTENCIAL NÃO MAPEADO" conforme solicitado
    if (cat.titulo === 'BENEFÍCIO POTENCIAL NÃO MAPEADO') continue
    for (const item of cat.items) {
      // armazenar por key e por nome normalizado para fallback
      const nomeNorm = (item.nome ?? '').trim()
      bloqueiosPorKey.set(item.key, cat.titulo)
      bloqueiosPorNome.set(nomeNorm.toLowerCase(), cat.titulo)
      bloqueiosItems.push({ key: item.key, nome: nomeNorm, titulo: cat.titulo })
    }
  }

  function findMotivoQuadrante(epicKey: string, epicNome?: string): string | undefined {
    if (bloqueiosPorKey.has(epicKey)) return bloqueiosPorKey.get(epicKey)
    const nome = (epicNome ?? '').trim()
    if (!nome) return undefined
    const nomeLower = nome.toLowerCase()
    if (bloqueiosPorNome.has(nomeLower)) return bloqueiosPorNome.get(nomeLower)
    // Fallback: substring matching (item nome contained in epic nome ou vice-versa)
    for (const it of bloqueiosItems) {
      const itemNome = it.nome.toLowerCase()
      if (itemNome && (nomeLower.includes(itemNome) || itemNome.includes(nomeLower))) return it.titulo
    }
    return undefined
  }

  const bloqueados: BloqueadoSlideRow[] = emAndamento
    .filter(e => Boolean(findMotivoQuadrante(e.key, e.nome) ?? e.motivoBloqueio) || estaBloqueadoAgora(e.key, epicChangelogs))
    .map(e => ({
      key: e.key,
      nome: e.nome,
      fase: e.status?.name ?? '—',
      // Primeiro, buscar o motivo nos quadrantes (por key, por nome ou por substring); se não houver, fallback para campo Jira
      motivoBloqueio: findMotivoQuadrante(e.key, e.nome) ?? e.motivoBloqueio ?? '—',
      dataLimite: e.duedate ?? null,
      descricao: limparDescricao(e.descricao),
      sponsor: e.sponsor ?? '—',
      diretoria: e.dominio ?? '—',
      beneficioLabel: formatBeneficioMM(e.beneficioQuantitativo),
      labResponsavel: labResponsavelPorEpic.get(e.key) ?? '—',
    }))

  // Fonte de verdade para bloquear nas iniciativas em andamento: os itens do slide de bloqueados
  const setBloqueados = new Set(bloqueados.map(b => b.key))
  const bloqueadoMap = new Map(bloqueados.map(b => [b.key, b.motivoBloqueio]))

  const iniciativasSlides: IniciativaSlideRow[] = emAndamento
    .filter(e => !EXCLUIR.has(e.nome))
    .map(e => ({
      key: e.key,
      nome: e.nome,
      fase: e.status?.name ?? '—',
      dataLimite: e.duedate ?? null,
      bloqueado: setBloqueados.has(e.key),
      motivoBloqueio: bloqueadoMap.get(e.key) ?? e.motivoBloqueio ?? null,
      descricao: limparDescricao(e.descricao),
      sponsor: e.sponsor ?? '—',
      diretoria: e.dominio ?? '—',
      beneficioLabel: formatBeneficioMM(e.beneficioQuantitativo),
      labResponsavel: labResponsavelPorEpic.get(e.key) ?? '—',
    }))

  // ── Slides "Iniciativas Concluídas / Candidatas a Delivery" ──
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
    // Sponsor e BO vêm diretamente da Iniciativa
    const sponsors = ini.sponsor ? [ini.sponsor] : []
    const bo = ini.bo ?? '—'
    // Resumo (Solução): descrição da Iniciativa, fallback para descrição do primeiro Epic
    const resumo = ini.descricao ?? ini.epics.find(e => e.descricao)?.descricao ?? '—'
    novosNaEsteira.push({
      key: ini.key,
      nome: ini.nome,
      status: ini.status.name,
      sponsors,
      dominios: ini.dominios.length > 0 ? ini.dominios : (ini.dominio ? [ini.dominio] : []),
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
          bloqueados={bloqueados}
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