import { NextResponse } from 'next/server'
import { fetchDashboardRaw } from '@/lib/jira'
import { buildDashboardData } from '@/lib/mappers'
import { classifyPortfolios } from '@/lib/portfolio-classifier'
import { classifySegmentos } from '@/lib/segmento-classifier'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const { iniciativas, epics, board2734Config, epicChangelogs, iniciativaChangelogs } = await fetchDashboardRaw()

    const epicInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_11987?.value ?? null,
    }))
    const segmentoInputs = epics.map(e => ({
      key: e.key,
      summary: e.fields.summary,
      dominio: e.fields.customfield_30014 ?? null,
    }))

    const [portfolioClassification, segmentoClassification] = await Promise.all([
      classifyPortfolios(epicInputs),
      classifySegmentos(segmentoInputs),
    ])

    const data = buildDashboardData(
      iniciativas, epics, portfolioClassification, segmentoClassification,
      board2734Config, epicChangelogs, iniciativaChangelogs
    )

    // ── Calcular métricas de destaque ──

    const agora = new Date()
    const mesAlvo = 7 // agosto (0-based)
    const anoAlvo = 2026
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ── 1. Iniciativas novas criadas em agosto/2026 ──
    const iniciativasAgosto = data.iniciativas.filter(ini => {
      if (!ini.criadoEm) return false
      const d = new Date(ini.criadoEm)
      return d.getMonth() === mesAlvo && d.getFullYear() === anoAlvo
    })

    // ── 2. Experimentos (Epics) concluídos EM AGOSTO/2026 ──
    // Apenas experimentos que entraram na coluna "Concluído" do board de experimentação (board 2707, status ID 10003)
    // Usa exclusivamente concluidoEm (data do changelog quando mudou para o status de conclusão)
    const experimentosConcluidosAgosto = data.allEpics.filter(epic => {
      if (!epic.concluidoEm) return false
      const d = new Date(epic.concluidoEm)
      return d.getMonth() === mesAlvo && d.getFullYear() === anoAlvo
    })

    // ── 3. Novo Laboratório de Experimentação ──
    // Hardcoded: Laboratório Grandes Empresas
    const novoLaboratorioNome = 'Laboratório Grandes Empresas'

    // ── 4. Benefício Quantitativo incrementado nos últimos 30 dias ──
    // Filtra epics com beneficioQuantitativo que foram concluídos nos últimos 30 dias
    const epicsComBeneficio30d = data.allEpics.filter(epic => {
      if (!epic.beneficioQuantitativo || epic.beneficioQuantitativo <= 0) return false
      const ref = epic.concluidoEm ?? epic.criadoEm
      if (!ref) return false
      return new Date(ref) >= trintaDiasAtras
    })
    const beneficioIncrementado30d = epicsComBeneficio30d.reduce(
      (acc, e) => acc + (e.beneficioQuantitativo ?? 0), 0
    )

    return NextResponse.json({
      // Card 1: Iniciativas novas
      iniciativasNovasAgosto: {
        quantidade: iniciativasAgosto.length,
        nomes: iniciativasAgosto.map(i => i.nome),
      },
      // Card 2: Experimentos concluídos em agosto
      experimentosConcluidosAgosto: {
        quantidade: experimentosConcluidosAgosto.length,
        nomes: experimentosConcluidosAgosto.map(e => e.nome),
      },
      // Card 3: Novo laboratório
      novoLaboratorio: {
        criado: true,
        nome: novoLaboratorioNome,
      },
      // Card 4: Benefício incrementado (últimos 30 dias)
      beneficioIncrementado30d: {
        valor: beneficioIncrementado30d,
        epics: epicsComBeneficio30d.map(e => ({
          nome: e.nome,
          valor: e.beneficioQuantitativo,
        })),
      },
      // Metadados
      _metadados: {
        mesReferencia: `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}`,
        periodoBeneficio: `Últimos 30 dias (desde ${trintaDiasAtras.toLocaleDateString('pt-BR')})`,
        totalIniciativas: data.iniciativas.length,
        totalEpics: data.allEpics.length,
      },
    })
  } catch (err) {
    console.error('[destaques API]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}