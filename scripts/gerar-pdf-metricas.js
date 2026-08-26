/**
 * Gera um PDF com o sumário detalhado de métricas da aba Estratégia.
 * Uso: node scripts/gerar-pdf-metricas.js
 * 
 * Gera o PDF em: docs/sumario-metricas-estrategia.pdf
 */
const fs = require('fs')
const path = require('path')
const { jsPDF } = require('jspdf')
const { applyPlugin } = require('jspdf-autotable')
applyPlugin(jsPDF)

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 18
const CONTENT_W = PAGE_W - 2 * MARGIN
let y = MARGIN

// ── Cores ──
const RED = [139, 0, 0]
const DARK = [31, 41, 55]
const GRAY = [107, 114, 128]

function addText(text, opts = {}) {
  const { size = 10, color = DARK, bold = false, maxW = CONTENT_W, indent = 0 } = opts
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...color)
  const lines = doc.splitTextToSize(text, maxW - indent)
  const h = lines.length * size * 0.38
  if (y + h > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN }
  doc.text(lines, MARGIN + indent, y + 3)
  y += h + 2
}

function addTitle(text) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...RED)
  if (y > MARGIN + 3) y += 3
  doc.text(text, MARGIN, y)
  y += 2
  doc.setDrawColor(...RED)
  doc.setLineWidth(0.7)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 5
}

function addSection(text) {
  if (y > PAGE_H - 35) { doc.addPage(); y = MARGIN }
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...RED)
  doc.setFillColor(...RED)
  doc.rect(MARGIN, y - 0.5, 3, 6, 'F')
  doc.text(text, MARGIN + 6, y + 4)
  y += 9
}

function addSubsection(text) {
  if (y > PAGE_H - 25) { doc.addPage(); y = MARGIN }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.text(text, MARGIN, y)
  y += 5
}

function addTable(headers, rows, opts = {}) {
  const { fontSize = 8.5 } = opts
  doc.autoTable({
    startY: y,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize, textColor: DARK },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
  })
  y = doc.lastAutoTable.finalY + 5
}

function addHighlight(text) {
  if (y > PAGE_H - 25) { doc.addPage(); y = MARGIN }
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(245, 158, 11)
  const lines = doc.splitTextToSize(text, CONTENT_W - 14)
  const h = lines.length * 9 * 0.35 + 10
  doc.rect(MARGIN, y, CONTENT_W, h, 'F')
  doc.setDrawColor(245, 158, 11)
  doc.rect(MARGIN, y, CONTENT_W, h, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(lines, MARGIN + 7, y + 5)
  y += h + 5
}

function addCard(title, body) {
  if (y > PAGE_H - 30) { doc.addPage(); y = MARGIN }
  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(209, 213, 219)
  const lines = doc.splitTextToSize(body, CONTENT_W - 14)
  const h = lines.length * 9 * 0.35 + 12
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, 'F')
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(title, MARGIN + 5, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(lines, MARGIN + 5, y + 9)
  y += h + 5
}

function addCode(text) {
  if (y > PAGE_H - 25) { doc.addPage(); y = MARGIN }
  doc.setFillColor(243, 244, 246)
  doc.setDrawColor(209, 213, 219)
  const lines = doc.splitTextToSize(text, CONTENT_W - 12)
  const h = lines.length * 8 * 0.35 + 8
  doc.rect(MARGIN, y, CONTENT_W, h, 'F')
  doc.rect(MARGIN, y, CONTENT_W, h, 'S')
  doc.setFont('courier', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...DARK)
  doc.text(lines, MARGIN + 5, y + 4)
  y += h + 5
  doc.setFont('helvetica', 'normal')
}

// ═══════════════════════════════════════════════════════════════
// CONTEÚDO
// ═══════════════════════════════════════════════════════════════

addTitle('Dashboard Estratégico — BeOn Lab')
addText('Sumário detalhado de métricas da aba Estratégia • Pipeline de Inovação • Experimentos • Lead Time', { size: 9, color: GRAY })
y += 2

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 1 — RESUMO EXECUTIVO
// ═══════════════════════════════════════════════════════════════
addSection('1. Resumo Executivo')

addSubsection('1.1 Metas Estratégicas (EBITDA, Receita, NPS)')

addText('Cada Epic do board 2735 recebe uma classificacao de meta via LLM (Azure OpenAI). O modelo analisa o summary (titulo) e o dominio do Epic para determinar se ele contribui para EBITDA, Receita ou NPS.', { size: 9 })

addText('Fluxo de classificacao:', { bold: true, size: 9 })
addText('1. No servidor (page.tsx), os Epics sao extraidos do Jira via fetchDashboardRaw()', { size: 9, indent: 4 })
addText('2. Para cada Epic, extrai-se key + summary + dominio -> envia para classifyPortfolios()', { size: 9, indent: 4 })
addText('3. classifyPortfolios() chama a LLM (Azure OpenAI) que retorna { chave: "EBITDA"|"Receita"|"NPS"|null }', { size: 9, indent: 4 })
addText('4. O resultado e armazenado em portfolioClassification: Record<string, MetaCategoria>', { size: 9, indent: 4 })
addText('5. buildDashboardData() aplica essa classificacao a cada EpicDetail via metaCategoria', { size: 9, indent: 4 })

addText('Calculo das Metas Agregadas (metasAgregadas):', { bold: true, size: 9 })
addCode(
`// Algoritmo em mappers.ts (buildDashboardData)
const metasAgregadas = {
  EBITDA: {count:0, valor:0},
  NPS: {count:0, valor:0},
  Receita: {count:0, valor:0}
}

for each Iniciativa:
  seenMetas = set()
  for each Epic da Iniciativa:
    meta = epic.metaCategoria
    if meta AND meta NOT in seenMetas:
      seenMetas.add(meta)
      metasAgregadas[meta].count++
      metasAgregadas[meta].valor +=
        iniciativa.beneficioQuantitativoTotal

// Exibicao no ResumoExecutivo.tsx:
totalMetasValor = EBITDA.valor + Receita.valor + NPS.valor
pct = (meta.valor / totalMetasValor) * 100`)

addText('Detalhes importantes:', { bold: true, size: 9 })
addText('- count = numero de Iniciativas (nao de Epics) que possuem pelo menos um Epic com aquela meta', { size: 9, indent: 4 })
addText('- valor = soma do beneficioQuantitativoTotal da Iniciativa (soma de todos os seus Epics)', { size: 9, indent: 4 })
addText('- Uma Iniciativa pode contribuir para multiplas metas se tiver Epics de categorias diferentes', { size: 9, indent: 4 })
addText('- A barra de progresso mostra pct = (valor da meta / total das 3 metas) * 100', { size: 9, indent: 4 })

addSubsection('1.2 Pipeline de Conversao')

addText('Beneficio Potencial Total:', { bold: true, size: 9 })
addCode(
`// Em buildDashboardData() - mappers.ts
epicsComBeneficio = allEpicDetails
  .filter(e => (e.beneficioQuantitativo ?? 0) > 0)
beneficioTotal = epicsComBeneficio
  .reduce((s, e) => s + (e.beneficioQuantitativo ?? 0), 0)
beneficioMedio = epicsComBeneficio.length > 0
  ? beneficioTotal / epicsComBeneficio.length
  : 0

// Fonte: customfield_30216 (campo "Beneficio Quantitativo")
// Preenchido manualmente pelo usuario ao cadastrar o experimento`)

addText('Conversao para Escala:', { bold: true, size: 9 })
addCode(
`// No ResumoExecutivo.tsx
totalExperimentos = allEpics
  .filter(e => e.status.id !== '10015').length
  // Exclui apenas cancelados (10015)
emEscala = pipeline['EM ESCALA']
taxaEscala = totalExperimentos > 0
  ? Math.round((emEscala / totalExperimentos) * 100)
  : 0

// Exemplo: 3 em escala de 199 totais -> taxaEscala = 1.5%`)

addText('Conversao para Piloto:', { bold: true, size: 9 })
addCode(
`// No ResumoExecutivo.tsx
emPilotoEscala = pipeline['EM PILOTO']
  + pipeline['EM ESCALA']
taxaPiloto = totalExperimentos > 0
  ? Math.round((emPilotoEscala / totalExperimentos) * 100)
  : 0`)

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 2 — PORTFOLIO POR MERCADO
// ═══════════════════════════════════════════════════════════════
addSection('2. Portfolio por Mercado')

addText('Cada Epic e classificado em um dos 3 segmentos de mercado via LLM (Azure OpenAI), analisando o campo dominio do Epic.', { size: 9 })

addText('Fluxo de classificacao de segmento:', { bold: true, size: 9 })
addText('1. Extrai-se key + summary + dominio de cada Epic -> envia para classifySegmentos()', { size: 9, indent: 4 })
addText('2. A LLM retorna { chave: "Consumo"|"Corporativo"|"PME/GE/GOV" }', { size: 9, indent: 4 })
addText('3. Resultado armazenado em segmentoClassification: Record<string, SegmentoMercado>', { size: 9, indent: 4 })
addText('4. Fallback: dominio "Empresarial" ou "PME" -> "PME/GE/GOV", senao "Consumo"', { size: 9, indent: 4 })

addText('Calculo dos agregados por segmento (mercadosSegmento):', { bold: true, size: 9 })
addCode(
`// Em buildDashboardData() - mappers.ts
SEGMENTOS = ['Consumo', 'Corporativo', 'PME/GE/GOV']
segMap = new Map(SEGMENTOS.map(s => [s, []]))

for each EpicDetail e:
  seg = segmentoClassification[e.key]
    ?? getSegmentoFallback(dominioByKey.get(e.key))
  segMap.get(seg).push(e)

for each segmento:
  qtdExperimentos = epics.length
  valorPotencial = SUM(e.beneficioQuantitativo ?? 0)
  dominios = top 4 dominios mais frequentes
    pct = (count / total) * 100
  alertas:
    bloqueadosIA = epics with motivoBloqueio
    aguardandoDelivery = epics status 10067
    semSponsor = epics without sponsor`)

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 3 — FUNIL DE EXPERIMENTOS
// ═══════════════════════════════════════════════════════════════
addSection('3. Funil de Experimentos')

addText('O funil combina dados dos dois boards Jira. As camadas 1 a 5 usam o board 2735 (Epics/experimentos). As camadas 6 e 7 usam o board 2734 (Iniciativas) para medir a transicao para Piloto e Escala.', { size: 9 })

addText('Calculo detalhado de cada camada:', { bold: true, size: 9 })
addCode(
`// No FunilExperimentos.tsx - board 2735 (Epics)
totalExperimentos = allEpics.length
cancelados = allEpics.filter(e => e.status.id === '10015').length
emAndamento = allEpics.filter(e => e.status.id === '3').length
emValidacao = allEpics.filter(e => e.status.id === '10204').length
concluidos = allEpics.filter(e =>
  e.status.id === '10003' || e.status.id === '10019').length

// Board 2734 (Iniciativas) - pipeline counts
pilotos = pipeline['EM PILOTO']
escala = pipeline['EM ESCALA']

// Taxas de conversao:
taxaCancelamento = (cancelados / total) * 100
taxaAndamento    = (emAndamento / total) * 100
taxaValidacao    = (emValidacao / emAndamento) * 100
taxaConclusao    = (concluidos / emValidacao) * 100
taxaPiloto       = (pilotos / concluidos) * 100
taxaEscala       = (escala / pilotos) * 100`)

addText('Exemplo numerico:', { bold: true, size: 9 })
addHighlight(
'Com 199 experimentos totais, 20 cancelados, 50 em andamento, 8 em validacao, 15 concluidos, 3 pilotos, 1 escala:\n' +
'- Cancelamento: 20/199 = 10%  |  Andamento: 50/199 = 25%  |  Validacao: 8/50 = 16%\n' +
'- Conclusao: 15/8 = 187% (pode superar 100% se concluidos incluem itens que pularam validacao)\n' +
'- Piloto: 3/15 = 20%  |  Escala: 1/3 = 33%'
)

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 4 — TOP 5 EXPERIMENTOS
// ═══════════════════════════════════════════════════════════════
addSection('4. Top 5 Experimentos')

addText('Seleciona os 5 experimentos com maior beneficio quantitativo estimado (R$).', { size: 9 })

addCode(
`// Em buildDashboardData() - mappers.ts
top5Epics = allEpicDetails
  .filter(e => (e.beneficioQuantitativo ?? 0) > 0)
  .sort((a, b) =>
    (b.beneficioQuantitativo ?? 0)
    - (a.beneficioQuantitativo ?? 0))
  .slice(0, 5)

// Ordenacao secundaria: por prioridade
// PRIORITY_ORDER = ['High', 'Medium', 'Low']`)

addText('Colunas exibidas no componente Top5Experimentos.tsx:', { size: 9 })
addText('- Experimento (nome + key)', { size: 9, indent: 4 })
addText('- Lab Responsavel (customfield_31438 ou customfield_30357)', { size: 9, indent: 4 })
addText('- Dominio (customfield_30021 ou fallbacks)', { size: 9, indent: 4 })
addText('- Valor Potencial (beneficioQuantitativo formatado em R$)', { size: 9, indent: 4 })

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 5 — BURNUP (CRESCIMENTO)
// ═══════════════════════════════════════════════════════════════
addSection('5. Crescimento da Experimentacao (Burnup)')

addText('O burnup mostra o acumulado mes a mes de experimentos concluidos e seu beneficio total. E calculado por buildMonitoramentoData() em mappers.ts.', { size: 9 })

addCode(
`// Algoritmo simplificado de buildMonitoramentoData()
// Para cada mes desde a data mais antiga ate hoje:
for each mes:
  realizado[mes] = COUNT de Epics com status 10003
    E concluidoEm <= fim do mes
  beneficio[mes] = SUM(beneficioQuantitativo)
    desses Epics

// Acumulado: cada mes soma o valor do mes anterior
// Ex: Jan=2, Fev=3, Mar=1 -> acum: Jan=2, Fev=5, Mar=6

// Metricas derivadas:
experimentosConcluidos = total Epics status 10003
taxaConversao = experimentosConcluidos
  / total experimentos * 100`)

addText('A data de conclusao (concluidoEm) e extraida do changelog:', { size: 9 })
addText('- Varre o changelog do Epic em ordem cronologica', { size: 9, indent: 4 })
addText('- Encontra a primeira entrada onde status mudou para "Concluido" (10003) ou "FINALIZADO" (10019)', { size: 9, indent: 4 })
addText('- Usa a data (created) dessa entrada como concluidoEm', { size: 9, indent: 4 })

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 6 — JORNADA DE ADOCAO (LEAD TIME)
// ═══════════════════════════════════════════════════════════════
addSection('6. Jornada de Adocao (Lead Time)')

addSubsection('6.1 Timeline - 4 Fases')

addText('A Jornada de Adocao mede o tempo medio (em dias) que um experimento leva para percorrer cada fase do pipeline. O Backlog e excluido do total - a jornada comeca na Experimentacao.', { size: 9 })

addText('Fase 1 - Experimentacao:', { bold: true, size: 9 })
addCode(
`// calculateCycleTimeExperimentacaoDetalhado()
// Apenas Epics CONCLUIDOS (status 10019)
EXPERIMENTACAO_NAMES = {
  'Em andamento', 'In Progress', 'EM VALIDACAO'
}

for each Epic concluido:
  changelog = epicChangelogs[epic.key]
  sorted = changelog.sort(created ASC)

  // Encontra periodos em experimentacao
  periodos = []
  entrouEm = null
  for each entry in sorted:
    for each item in entry.items:
      if item.field === 'status':
        if item.toString in EXPERIMENTACAO_NAMES
           AND item.fromString NOT in:
          entrouEm = entry.created
        if item.fromString in EXPERIMENTACAO_NAMES
           AND item.toString NOT in:
          periodos.push({
            inicio: entrouEm,
            fim: entry.created
          })
          entrouEm = null

  // Subtrai periodos bloqueados
  bloqueios = getPeriodosBloqueio(epic.key)
  cycleTime = subtrairBloqueios(periodos, bloqueios)

// Media final:
cycleTimeGeral = SUM(cycleTime) / qtdEpics`)

addText('Fase 2 - Transicao para Piloto:', { bold: true, size: 9 })
addCode(
`// Media de dias das Iniciativas no status
// AGUARDANDO PILOTO (board 2734)
// Usa changelog das Iniciativas`)

addText('Fase 3 - Piloto:', { bold: true, size: 9 })
addCode(
`// Media de dias das Iniciativas no status
// EM PILOTO (board 2734)`)

addText('Fase 4 - Escala:', { bold: true, size: 9 })
addCode(
`// Media de dias das Iniciativas no status
// EM ESCALA (board 2734)
// Se nao houver dados, a fase e omitida`)

addText('Agregacao final (calculateLeadTimeJornada):', { bold: true, size: 9 })
addCode(
`// No mappers.ts
totalDias = experimentacaoDias
  + transicaoPilotoDias
  + pilotoDias
  + (escalaDias > 0 ? escalaDias : 0)

pct = (diasFase / totalDias) * 100

// Bottleneck: fase com maior numero de dias
bottleneck = fases.sort(desc por dias)[0]

// Decomposicao:
tempoGeracaoValorDias = experimentacaoDias + pilotoDias
tempoEsperaTransicaoDias = backlogDias + transicaoPilotoDias
tempoImplantacaoEscalaDias = escalaDias`)

addSubsection('6.2 Cycle Time por Complexidade')

addText('O cycle time de experimentacao e quebrado por porte (complexidade do Epic), usando o campo customfield_30358.', { size: 9 })

addCode(
`// calculateCycleTimeExperimentacaoDetalhado()
PORTE_MAP = {
  'Baixa': 'P', 'Media': 'M', 'Alta': 'G',
  'P': 'P', 'M': 'M', 'G': 'G'
}

for each Epic concluido:
  cycleTime = calcularCycleTime(epic)
  complexidadeRaw = epic.fields.customfield_30358
  porte = PORTE_MAP[complexidadeRaw] ?? 'Sem porte'
  porteCycleTimes[porte].push(cycleTime)

// Para cada porte:
media = SUM(dias) / count
mediana = valor do meio do array ordenado
blockedTimeMedio = SUM(dias bloqueados) / count

// Ordem: P (Baixa) -> M (Media) -> G (Alta)`)

addSubsection('6.3 Blocked Time')

addText('O Blocked Time mede quantos dias, em media, os experimentos concluidos ficaram bloqueados (com motivo de bloqueio preenchido) durante seu ciclo de vida.', { size: 9 })

addCode(
`// calculateLeadTimeJornada() - mappers.ts
// Apenas Epics CONCLUIDOS (status 10019)
for each Epic concluido:
  changelog = epicChangelogs[epic.key]
  sorted = changelog.sort(created ASC)

  // Encontra data de conclusao
  fimCiclo = Date.now() // fallback
  for each entry in sorted:
    for each item in entry.items:
      if item.field === 'status'
         AND item.toString === '10019':
        fimCiclo = entry.created

  totalDias = (fimCiclo - criadoEm)
    / (1000*60*60*24)
  lifecycleTotals.push(totalDias)

  // Rastreia bloqueios
  bloqueioInicio = null
  blockedDias = 0
  for each entry in sorted:
    for each item in entry.items:
      if item.fieldId === 'customfield_13406':
        if estavaVazio AND ficouPreenchido:
          bloqueioInicio = entry.created
        if estavaPreenchido AND ficouVazio:
          blockedDias += (entry.created
            - bloqueioInicio) / (1000*60*60*24)
          bloqueioInicio = null

  // Se ainda bloqueado no fim
  if bloqueioInicio !== null:
    blockedDias += (fimCiclo - bloqueioInicio)
      / (1000*60*60*24)
  blockedTotals.push(blockedDias)

// Medias finais:
blockedTimeDias = SUM(blockedTotals)
  / blockedTotals.length
mediaTotalDias = SUM(lifecycleTotals)
  / lifecycleTotals.length
blockedTimePct = (blockedTimeDias
  / mediaTotalDias) * 100`)

addText('Exemplo:', { bold: true, size: 9 })
addHighlight(
'Se um Epic levou 90 dias no total (criacao -> conclusao) e ficou bloqueado por 15 dias:\n' +
'- blockedTimeDias = 15  |  blockedTimePct = 15/90 = 16.7%\n' +
'- Isso significa que ~17% do ciclo de vida foi desperdicado em bloqueios'
)

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 7 — FILTRO POR PERIODO
// ═══════════════════════════════════════════════════════════════
addSection('7. Filtro por Periodo')

addText('O filtro de periodo (Header) refaz todos os calculos do dashboard filtrando os dados pela data de criacao. A funcao filtrarDashboardData() em EstrategiaClient.tsx e responsavel por isso.', { size: 9 })

addCode(
`// Em EstrategiaClient.tsx - filtrarDashboardData()
// 1. Filtra iniciativas por criadoEm
iniciativasFiltradas = iniciativas
  .filter(ini => isDataNoPeriodo(ini.criadoEm, periodo))

// 2. Para cada iniciativa, filtra seus Epics
ini.epics = ini.epics
  .filter(epic => isDataNoPeriodo(epic.criadoEm, periodo))

// 3. Recalcula beneficioQuantitativoTotal
ini.beneficioQuantitativoTotal = SUM(
  epicsFiltrados.beneficioQuantitativo)

// 4. Reagrega dominios, sponsors, segmentos
ini.dominios = Array.from(new Set(
  epicsFiltrados.map(e => e.dominio)))
ini.sponsors = Array.from(new Set(
  epicsFiltrados.map(e => e.sponsor)))

// 5. Recalcula pipeline (contagem por coluna)
// 6. Recalcula beneficioTotal, beneficioMedio
// 7. Recalcula mercados, mercadosSegmento,
//    top5Epics, topSponsors
// 8. Recalcula statusDistribuicao (donut),
//    metasAgregadas, iniciativasPorMeta

// Opcoes de periodo:
// 'tudo' | 'ultimos12' | 'ultimos6'
// | 'ultimos3' | 'ultimoMes' | personalizado`)

// ═══════════════════════════════════════════════════════════════
// SEÇÃO 8 — ORIGEM DOS DADOS
// ═══════════════════════════════════════════════════════════════
addSection('8. Origem dos Dados')

addTable(
  ['Board', 'ID Jira', 'Issue Type', 'Funcao', 'Qtd Aprox.'],
  [
    ['P&D - Ideacao', '2734', 'Iniciativa', 'Pipeline de inovacao (Backlog -> Escala)', '~186'],
    ['P&D - Experimentacao/Piloto', '2735', 'Epic', 'Experimentos com beneficio, complexidade, sponsor', '~199'],
  ],
  { fontSize: 8.5 }
)

addText('Campos customizados do Jira utilizados:', { bold: true, size: 9 })
addTable(
  ['Campo', 'ID', 'Uso'],
  [
    ['Beneficio Quantitativo', 'customfield_30216', 'Valor em R$ do experimento'],
    ['Complexidade', 'customfield_30358', 'Porte P/M/G para cycle time'],
    ['Sponsor', 'customfield_30394', 'Patrocinador do experimento'],
    ['Lab Responsavel', 'customfield_31438 / 30357', 'Time que executa o experimento'],
    ['Dominio', 'customfield_30021 / 11987 / 11991', 'Area de negocio'],
    ['Motivo de Bloqueio', 'customfield_13406', 'Causa do bloqueio (para blocked time)'],
    ['Segmento', 'customfield_30445', 'Segmento de mercado'],
    ['Portfolio', 'customfield_30110', 'Classificacao de portfolio'],
  ],
  { fontSize: 8 }
)

addText('Classificacao LLM:', { bold: true, size: 9 })
addText('- Portfolio (EBITDA/Receita/NPS): Azure OpenAI - analisa summary + dominio de cada Epic', { size: 9, indent: 4 })
addText('- Segmento (Consumo/Corporativo/PME): Azure OpenAI - analisa summary + dominio de cada Epic', { size: 9, indent: 4 })
addText('- Cache: Resultados armazenados em .portfolio-cache.json e .segmento-cache-v2.json', { size: 9, indent: 4 })

// ── Footer ──
y = PAGE_H - 12
doc.setFont('helvetica', 'normal')
doc.setFontSize(7.5)
doc.setTextColor(156, 163, 175)
doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}  BeOn Lab - Claro Brasil  Projeto jira-viewer`, MARGIN, y)

// ── Salvar ──
const outputPath = path.join(__dirname, '..', 'docs', 'sumario-metricas-estrategia.pdf')
const buf = Buffer.from(doc.output('arraybuffer'))
fs.writeFileSync(outputPath, buf)
console.log('PDF gerado: ' + outputPath)
console.log('Tamanho: ' + (buf.length / 1024).toFixed(1) + ' KB')