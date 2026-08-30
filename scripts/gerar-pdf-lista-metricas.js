/**
 * Gera PDF com a lista de métricas do beOn Labs (aba Estratégia)
 * Uso: node scripts/gerar-pdf-lista-metricas.js
 * Requer: npm install jspdf
 */

const { jsPDF } = require('jspdf')
const path = require('path')
const fs = require('fs')

const metricas = [
  { nome: 'Benefício Potencial Total', desc: 'Soma de R$ de todos os experimentos' },
  { nome: 'Qtd de Experimentos em Experimentação', desc: 'Total de experimentos no estágio de experimentação' },
  { nome: 'Qtd de Experimentos em Piloto', desc: 'Total de experimentos em piloto' },
  { nome: 'Qtd de Experimentos em Escala', desc: 'Total de experimentos em escala' },
  { nome: 'Taxa de Conversão → Piloto', desc: '% dos experimentos que chegaram em piloto ou escala' },
  { nome: 'Taxa de Conversão → Escala', desc: '% dos experimentos que chegaram em escala' },
  { nome: 'Soma de Benefício por Meta (EBITDA)', desc: 'Benefício total dos experimentos ligados à meta de Eficiência Operacional' },
  { nome: 'Soma de Benefício por Meta (Receita)', desc: 'Benefício total dos experimentos ligados à meta de Receita' },
  { nome: 'Soma de Benefício por Meta (NPS)', desc: 'Benefício total dos experimentos ligados à meta de Experiência do Cliente' },
  { nome: 'Total de Experimentos Concluídos (acumulado mensal)', desc: 'Quantidade acumulada mês a mês de experimentos concluídos' },
  { nome: '% da Meta de Conclusão Atingida', desc: 'Percentual atingido em relação à meta de conclusão estabelecida' },
  { nome: 'Top 5 Experimentos por Maior Benefício', desc: 'Ranking dos 5 experimentos com maior benefício quantitativo' },
  { nome: 'Total de Experimentos (board todo)', desc: 'Total geral de experimentos registrados no board' },
  { nome: '% Cancelados', desc: 'Percentual de experimentos cancelados' },
  { nome: '% Em Andamento', desc: 'Percentual de experimentos em andamento' },
  { nome: '% Em Validação', desc: 'Percentual de experimentos em validação' },
  { nome: '% Concluídos', desc: 'Percentual de experimentos concluídos' },
  { nome: '% Pilotos', desc: 'Percentual de experimentos que chegaram à fase de piloto' },
  { nome: '% Escala', desc: 'Percentual de experimentos que chegaram à escala' },
  { nome: 'Lead Time Médio (dias)', desc: 'Tempo médio total do ciclo, da criação à conclusão' },
  { nome: 'Cycle Time Médio — Baixa (dias)', desc: 'Tempo médio em experimentação para experimentos de complexidade baixa' },
  { nome: 'Cycle Time Médio — Média (dias)', desc: 'Tempo médio em experimentação para experimentos de complexidade média' },
  { nome: 'Cycle Time Médio — Alta (dias)', desc: 'Tempo médio em experimentação para experimentos de complexidade alta' },
  { nome: 'Tempo Médio Bloqueado (dias)', desc: 'Média de dias que os experimentos ficaram bloqueados' },
  { nome: '% do Tempo Bloqueado', desc: 'Percentual do ciclo total representado por bloqueios' },
  { nome: 'Gargalo do Processo', desc: 'Fase mais demorada do pipeline de experimentação' },
  { nome: 'Qtd de Experimentos por Segmento (Consumo)', desc: 'Total de experimentos no segmento de consumo' },
  { nome: 'Qtd de Experimentos por Segmento (Corporativo)', desc: 'Total de experimentos no segmento corporativo' },
  { nome: 'Qtd de Experimentos por Segmento (PME/GE/GOV)', desc: 'Total de experimentos nos segmentos PME, GE e Governo' },
]

async function gerarPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Cores institucionais
  const corPrimaria = '#7A1212' // vermelho beOn
  const corSecundaria = '#4B5563' // cinza escuro
  const corLinha = '#F3F4F6'

  const pageWidth = 210
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight
  let y = 20

  function addHeader() {
    // Linha decorativa superior
    doc.setFillColor(122, 18, 18)
    doc.rect(marginLeft, y, contentWidth, 2, 'F')
    y += 8

    // Título
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(122, 18, 18)
    doc.text('Lista de Métricas', marginLeft, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(75, 83, 99)
    doc.text('beOn Labs · Claro Brasil', marginLeft, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175)
    const hoje = new Date().toLocaleDateString('pt-BR')
    doc.text(`Gerado em ${hoje} · Aba Estratégia`, marginLeft, y)
    y += 6

    // Linha decorativa inferior
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, y, pageWidth - marginRight, y)
    y += 8
  }

  function addFooter(pageNum) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Página ${pageNum}`, pageWidth - marginRight - 10, 292, { align: 'center' })
    doc.text('beOn Labs · Claro Brasil', marginLeft, 292)
  }

  let pageNum = 1
  addHeader()
  addFooter(pageNum)

  for (let i = 0; i < metricas.length; i++) {
    const m = metricas[i]

    // Verifica se precisa de nova página (espaço para título + desc + gap)
    if (y > 255) {
      doc.addPage()
      pageNum++
      y = 20
      addHeader()
      addFooter(pageNum)
    }

    // Número do item
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(122, 18, 18)
    const num = `${String(i + 1).padStart(2, '0')}`
    doc.text(num, marginLeft, y)

    // Nome da métrica
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text(m.nome, marginLeft + 10, y)

    // Descrição
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(m.desc, marginLeft + 10, y + 4.5)

    y += 12
  }

  // Salvar
  const outputDir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, 'lista-metricas-beonlabs.pdf')
  doc.save(outputPath)
  console.log(`PDF gerado: ${outputPath}`)
}

gerarPDF().catch(console.error)