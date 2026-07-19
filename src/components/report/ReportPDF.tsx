import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ── Tipos locais ──
interface EpicDetailPDF {
  key: string
  nome: string
  status: { name: string }
  sponsor: string | null
  prioridade?: string | null
  dominio: string | null
  beneficioQuantitativo: number | null
}

interface FunilStagePDF {
  label: string
  value: number
  color: string
}

interface DominioSummaryPDF {
  nome: string
  total: number
  emAndamento: number
  emPiloto: number
  concluidos: number
  beneficioTotal: number
  topEpics: EpicDetailPDF[]
}

interface ReportPDFProps {
  dataHora: string
  totalIniciativas: number
  qtdExperimentos: number
  conversao: string
  beneficioPotencial: number
  funilStages: FunilStagePDF[]
  funilMax: number
  top5Dominios: DominioSummaryPDF[]
  emAndamento: EpicDetailPDF[]
  dominiosComAtividade: DominioSummaryPDF[]
}

// ── Cores ──
const COLORS = {
  primary: '#1E293B',
  secondary: '#64748B',
  white: '#FFFFFF',
  border: '#E2E8F0',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  slate: '#334155',
}

const accentColors = [
  '#6366F1', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6',
]

// ── Helpers ──
function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function getPriorityColor(p: string): string {
  const map: Record<string, string> = {
    'Highest': '#7F1D1D', 'High': '#CC0000', 'Medium': '#D97706',
    'Low': '#6B7280', 'Lowest': '#9CA3AF',
  }
  return map[p] ?? '#6B7280'
}

// ── Styles ──
const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', fontSize: 9, color: COLORS.slate, lineHeight: 1.4 },
  header: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 16, marginBottom: 16 },
  headerLabel: { fontSize: 7, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 16, color: COLORS.white, fontFamily: 'Helvetica-Bold' },
  headerText: { fontSize: 8, color: '#CBD5E1', marginTop: 6, lineHeight: 1.5 },
  headerDate: { fontSize: 7, color: '#64748B', marginTop: 4 },
  bigNumbersRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  bigNumberCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 10 },
  bigNumberLabel: { fontSize: 6, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  bigNumberValue: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  bigNumberSub: { fontSize: 6, color: COLORS.secondary, marginTop: 2 },
  section: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  twoCol: { flexDirection: 'row', gap: 12 },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },
  // Funil
  funilRow: { marginBottom: 5 },
  funilLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  funilLabel: { fontSize: 7, color: COLORS.slate },
  funilValue: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.slate },
  funilBarBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  funilBarFill: { height: 12, borderRadius: 6, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 6 },
  funilBarText: { fontSize: 6, color: COLORS.white, fontFamily: 'Helvetica-Bold' },
  funilComment: { fontSize: 6, color: COLORS.secondary, fontStyle: 'italic', marginTop: 6 },
  // Domínio card
  dominioCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 10, marginBottom: 8 },
  dominioHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dominioIcon: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  dominioIconText: { fontSize: 10, color: COLORS.white, fontFamily: 'Helvetica-Bold' },
  dominioNome: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.primary, flex: 1 },
  dominioTotal: { fontSize: 7, color: COLORS.secondary },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 },
  dominioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dominioBadges: { flexDirection: 'row', gap: 6 },
  dominioBadge: { fontSize: 6, color: COLORS.secondary },
  dominioBeneficio: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.slate },
  dominioTopEpics: { marginTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 4 },
  dominioTopEpicRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 6, marginBottom: 1 },
  dominioTopEpicKey: { color: COLORS.secondary, width: 40 },
  dominioTopEpicNome: { color: COLORS.slate, flex: 1, marginHorizontal: 4 },
  dominioTopEpicValor: { color: COLORS.green, fontFamily: 'Helvetica-Bold' },
  // Destaques
  destaqueCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8, marginBottom: 6 },
  destaqueIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  destaqueIconText: { fontSize: 10, color: COLORS.white, fontFamily: 'Helvetica-Bold' },
  destaqueInfo: { flex: 1 },
  destaqueNome: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 3 },
  destaqueBarBg: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  destaqueBarFill: { height: 4, borderRadius: 2 },
  destaqueSubs: { flexDirection: 'row', justifyContent: 'space-between' },
  destaqueSubText: { fontSize: 6, color: COLORS.secondary },
  destaqueCount: { fontSize: 7, color: COLORS.secondary, marginLeft: 8 },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 4, paddingHorizontal: 6 },
  tableHeaderCell: { fontSize: 6, color: COLORS.secondary, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 3, paddingHorizontal: 6 },
  tableCell: { fontSize: 7, color: COLORS.slate },
  colKey: { width: '16%' },
  colNome: { width: '32%' },
  colPrioridade: { width: '14%' },
  colStatus: { width: '14%' },
  colSponsor: { width: '14%' },
  colDominio: { width: '10%' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 6, color: '#94A3B8', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6 },
  comment: { fontSize: 6, color: COLORS.secondary, fontStyle: 'italic', marginTop: 4 },
})

// ── Documento ──
export default function ReportPDF({
  dataHora,
  totalIniciativas,
  qtdExperimentos,
  conversao,
  beneficioPotencial,
  funilStages,
  funilMax,
  top5Dominios,
  emAndamento,
  dominiosComAtividade,
}: ReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Relatório Executivo de Inovação</Text>
          <Text style={styles.headerTitle}>BeOn Lab — Panorama do Portfólio</Text>
          <Text style={styles.headerText}>
            O pipeline de inovação conta atualmente com {totalIniciativas} iniciativas no funil,
            das quais {qtdExperimentos} já evoluíram para experimentos ativos.
            A taxa de conversão de experimentos para piloto é de {conversao},
            com um benefício potencial estimado em {formatCurrency(beneficioPotencial)}.
          </Text>
          <Text style={styles.headerDate}>Gerado em {dataHora}</Text>
        </View>

        {/* BIG NUMBERS */}
        <View style={styles.bigNumbersRow}>
          <View style={styles.bigNumberCard}>
            <Text style={styles.bigNumberLabel}>Total Iniciativas</Text>
            <Text style={[styles.bigNumberValue, { color: COLORS.amber }]}>{totalIniciativas}</Text>
            <Text style={styles.bigNumberSub}>no pipeline de inovação</Text>
          </View>
          <View style={styles.bigNumberCard}>
            <Text style={styles.bigNumberLabel}>Em Experimentação</Text>
            <Text style={[styles.bigNumberValue, { color: COLORS.blue }]}>{qtdExperimentos}</Text>
            <Text style={styles.bigNumberSub}>experimentos ativos</Text>
          </View>
          <View style={styles.bigNumberCard}>
            <Text style={styles.bigNumberLabel}>Conversão → Piloto</Text>
            <Text style={[styles.bigNumberValue, { color: COLORS.green }]}>{conversao}</Text>
            <Text style={styles.bigNumberSub}>da experimentação ao piloto</Text>
          </View>
          <View style={styles.bigNumberCard}>
            <Text style={styles.bigNumberLabel}>Benefício Potencial</Text>
            <Text style={[styles.bigNumberValue, { color: COLORS.purple, fontSize: 14 }]}>{formatCurrency(beneficioPotencial)}</Text>
            <Text style={styles.bigNumberSub}>estimado do portfólio</Text>
          </View>
        </View>

        {/* TWO COLUMNS */}
        <View style={styles.twoCol}>
          {/* LEFT */}
          <View style={styles.colLeft}>
            {/* Funil */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Funil de Iniciativas</Text>
              {funilStages.map((stage) => {
                const pct = funilMax > 0 ? (stage.value / funilMax) * 100 : 0
                return (
                  <View key={stage.label} style={styles.funilRow}>
                    <View style={styles.funilLabelRow}>
                      <Text style={styles.funilLabel}>{stage.label}</Text>
                      <Text style={styles.funilValue}>{stage.value}</Text>
                    </View>
                    <View style={styles.funilBarBg}>
                      <View style={[styles.funilBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color }]}>
                        <Text style={styles.funilBarText}>{stage.value}</Text>
                      </View>
                    </View>
                  </View>
                )
              })}
              <Text style={styles.funilComment}>
                O funil mostra a distribuição das iniciativas ao longo das etapas do pipeline de inovação.
              </Text>
            </View>

            {/* Domínios */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfólio por Domínio</Text>
              {top5Dominios.map((dom, i) => {
                const total = dom.total || 1
                const pctAndamento = (dom.emAndamento / total) * 100
                const pctPiloto = (dom.emPiloto / total) * 100
                const pctConcluido = (dom.concluidos / total) * 100
                const cor = accentColors[i % accentColors.length]
                return (
                  <View key={dom.nome} style={styles.dominioCard}>
                    <View style={styles.dominioHeader}>
                      <View style={[styles.dominioIcon, { backgroundColor: cor }]}>
                        <Text style={styles.dominioIconText}>{dom.nome.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.dominioNome}>{dom.nome}</Text>
                      <Text style={styles.dominioTotal}>{dom.total} iniciativas</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={{ width: `${pctAndamento}%`, height: 6, backgroundColor: COLORS.blue }} />
                      <View style={{ width: `${pctPiloto}%`, height: 6, backgroundColor: COLORS.red }} />
                      <View style={{ width: `${pctConcluido}%`, height: 6, backgroundColor: COLORS.green }} />
                    </View>
                    <View style={styles.dominioFooter}>
                      <View style={styles.dominioBadges}>
                        <Text style={styles.dominioBadge}>● {dom.emAndamento} ativo</Text>
                        <Text style={styles.dominioBadge}>● {dom.emPiloto} piloto</Text>
                        <Text style={styles.dominioBadge}>● {dom.concluidos} concluído</Text>
                      </View>
                      <Text style={styles.dominioBeneficio}>{formatCurrency(dom.beneficioTotal)}</Text>
                    </View>
                    {dom.topEpics.length > 0 && (
                      <View style={styles.dominioTopEpics}>
                        {dom.topEpics.slice(0, 3).map((epic) => (
                          <View key={epic.key} style={styles.dominioTopEpicRow}>
                            <Text style={styles.dominioTopEpicKey}>{epic.key}</Text>
                            <Text style={styles.dominioTopEpicNome}>
                              {epic.nome.length > 35 ? epic.nome.slice(0, 35) + '\u2026' : epic.nome}
                            </Text>
                            <Text style={styles.dominioTopEpicValor}>
                              {epic.beneficioQuantitativo != null ? formatCurrency(epic.beneficioQuantitativo) : '—'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </View>

          {/* RIGHT */}
          <View style={styles.colRight}>
            {/* Destaques por Domínio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destaques por Domínio</Text>
              {dominiosComAtividade.length > 0 ? dominiosComAtividade.map((d, i) => {
                const totalAtivo = d.emAndamento + d.emPiloto
                const barraPct = d.total > 0 ? (totalAtivo / d.total) * 100 : 0
                const cor = accentColors[i % accentColors.length]
                return (
                  <View key={d.nome} style={styles.destaqueCard}>
                    <View style={[styles.destaqueIcon, { backgroundColor: cor }]}>
                      <Text style={styles.destaqueIconText}>{d.nome.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.destaqueInfo}>
                      <Text style={styles.destaqueNome}>{d.nome}</Text>
                      <View style={styles.destaqueBarBg}>
                        <View style={[styles.destaqueBarFill, { width: `${Math.max(barraPct, 4)}%`, backgroundColor: cor }]} />
                      </View>
                      <View style={styles.destaqueSubs}>
                        <Text style={styles.destaqueSubText}>
                          ● {d.emAndamento} and.  ● {d.emPiloto} pil.
                        </Text>
                        <Text style={styles.destaqueSubText}>{formatCurrency(d.beneficioTotal)}</Text>
                      </View>
                    </View>
                    <Text style={styles.destaqueCount}>{totalAtivo}/{d.total} ativos</Text>
                  </View>
                )
              }) : (
                <Text style={styles.comment}>Nenhum domínio com experimentos ativos.</Text>
              )}
              {dominiosComAtividade.length > 0 && (
                <Text style={styles.comment}>
                  {dominiosComAtividade.length} domínios com experimentos em andamento ou em piloto.
                </Text>
              )}
            </View>

            {/* Experimentos em Andamento */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experimentos em Andamento ({emAndamento.length})</Text>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colKey]}>Key</Text>
                <Text style={[styles.tableHeaderCell, styles.colNome]}>Nome</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrioridade]}>Prioridade</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                <Text style={[styles.tableHeaderCell, styles.colSponsor]}>Sponsor</Text>
                <Text style={[styles.tableHeaderCell, styles.colDominio]}>Domínio</Text>
              </View>
              {emAndamento.slice(0, 15).map((epic) => (
                <View key={epic.key} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colKey, { fontFamily: 'Helvetica-Bold' }]}>{epic.key}</Text>
                  <Text style={[styles.tableCell, styles.colNome]}>
                    {epic.nome.length > 30 ? epic.nome.slice(0, 30) + '\u2026' : epic.nome}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrioridade, { color: getPriorityColor(epic.prioridade ?? '') }]}>
                    {epic.prioridade ?? '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colStatus]}>{epic.status.name}</Text>
                  <Text style={[styles.tableCell, styles.colSponsor]}>{epic.sponsor ?? '—'}</Text>
                  <Text style={[styles.tableCell, styles.colDominio]}>{epic.dominio ?? '—'}</Text>
                </View>
              ))}
              {emAndamento.length > 15 && (
                <Text style={styles.comment}>... e mais {emAndamento.length - 15} experimentos</Text>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>
          BeOn Lab — Relatório Executivo de Inovação — {dataHora} — Confidencial
        </Text>
      </Page>
    </Document>
  )
}