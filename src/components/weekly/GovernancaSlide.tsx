'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Star, Lock, Inbox, Search, Cog, CheckCircle2, FlaskConical, Rocket as StageRocket,
} from 'lucide-react'
import type { GovernancaData, GovernancaDot, TecnologiaCategoria } from '@/lib/governanca'
import type { EpicDetail } from '@/lib/types'
import { SlideDownloadButtons } from '@/components/report/slideExport'
import ExperimentoModal from '@/components/dashboard/ExperimentoModal'
import EpicModal from '@/components/dashboard/EpicModal'
import { CLARO_RED, CLARO_LIGHT, CLARO_LIGHTER, RAMP } from './palette'

export interface GovernancaTheme {
  accent: string
  accentLight: string
  accentLighter: string
  ramp: string[]
}

// Paleta categórica (4 séries) validada com a skill de dataviz para uso em
// "all-pairs" (chips espalhados livremente, não empilhados em ordem fixa):
// node scripts/validate_palette.js "#e34948,#4a3aa7,#1baf7a,#2a78d6" --mode light --pairs all
// → todos os checks passam (2 pares em WARN de CVD/contraste — por isso a
// legenda abaixo é sempre visível com texto, nunca só cor, e cada chip já
// mostra o nome do Epic ao lado do marcador).
const TECNOLOGIA_COLORS: Record<TecnologiaCategoria, string> = {
  'web3': '#e34948',
  'ia-analytics': '#4a3aa7',
  'future-network': '#1baf7a',
  'outras': '#2a78d6',
}
const TECNOLOGIA_LABELS: Record<TecnologiaCategoria, string> = {
  'web3': 'WEB 3',
  'ia-analytics': 'A.I e Analytics',
  'future-network': 'Future Network',
  'outras': 'Outras Tecnologias',
}
const TECNOLOGIA_ORDER: TecnologiaCategoria[] = ['web3', 'ia-analytics', 'future-network', 'outras']
const COLUMN_ICONS = [Inbox, Search, Cog, CheckCircle2, FlaskConical, StageRocket]

const CHIP_HEIGHT = 19
const CHIP_GAP = 2
const CELL_WIDTH = 172
const DOMAIN_COL_WIDTH = 132
const GRID_GAP = 5
const HEADER_H = 44

// Trunca em JS (não CSS text-overflow:ellipsis) — essa combinação já
// vazou texto por cima de vizinhos numa exportação anterior deste projeto
// quando o ancestral tem clip-path. Ver notas de exportação em PipelineSlide.
function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + '…'
}

// Hash determinístico (mesma key -> mesma ordem sempre) só para decidir QUAIS
// chips aparecem primeiro numa célula lotada — sem depender de posição
// absoluta, que já quebrou em exportações anteriores combinada com clip-path.
function hashKey(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

// Quantos chips NOMEADOS cabem, de pé, numa célula desta altura — decide o
// corte entre "lista alguns pelo nome" e "resume num card único" (ver Cell).
// Isso é o que garante que a visão não quebra com uma célula tendo 2 épicos
// ou 40: o espaço ocupado por qualquer célula é sempre <= esse número de
// linhas, nunca cresce junto com a quantidade real de dados.
function capacidadeCelula(rowHeightPx: number): number {
  const usavel = rowHeightPx - 8
  return Math.max(1, Math.floor((usavel + CHIP_GAP) / (CHIP_HEIGHT + CHIP_GAP)))
}

// Slot de badges com largura FIXA (preenchida ou não) — assim o orçamento de
// caracteres do nome é sempre o mesmo, em vez de encolher chip a chip
// conforme tem ou não sub-status (o que deixava a coluna com truncamento
// irregular e nomes ilegíveis demais).
const BADGE_SLOT_WIDTH = 20

function Chip({ dot, showBloqueioBadge, onClick }: { dot: GovernancaDot; showBloqueioBadge: boolean; onClick: () => void }) {
  const color = TECNOLOGIA_COLORS[dot.tecnologia]
  return (
    <button
      onClick={onClick}
      title={`${dot.epic.key} · ${dot.epic.nome}`}
      style={{
        width: '100%', height: CHIP_HEIGHT, flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px', boxSizing: 'border-box',
        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 5, textAlign: 'left',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 9.5, fontWeight: 700, color: '#1F2937', lineHeight: 1, overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
        {truncate(dot.epic.nome, 20)}
      </span>
      <span style={{ width: BADGE_SLOT_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
        {dot.prioridade && (
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: '#FBBF24', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={6} color="#78350F" strokeWidth={3} fill="#78350F" />
          </span>
        )}
        {dot.bloqueio && showBloqueioBadge && (
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: '#111827', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={6} color="#FFFFFF" strokeWidth={3} />
          </span>
        )}
      </span>
    </button>
  )
}

// Card de resumo — usado quando uma célula tem mais épicos do que cabe
// nomeados (real em produção: uma fase/domínio concentrado pode facilmente
// ter dezenas). Em vez de listar 1-2 nomes soltos com um "+N mais" quase
// vazio de informação, mostra a contagem, a mistura de tecnologia e quantos
// têm prioridade/bloqueio — cabe no MESMO espaço de 1 chip, então o
// tamanho da célula nunca depende de quantos épicos ela realmente tem.
function SummaryTile({ dots, dominio, colunaLabel, theme, showBloqueioBadge, onClick }: {
  dots: GovernancaDot[]
  dominio: string
  colunaLabel: string
  theme: GovernancaTheme
  showBloqueioBadge: boolean
  onClick: () => void
}) {
  const porTecnologia = useMemo(() => {
    const counts = new Map<TecnologiaCategoria, number>()
    for (const d of dots) counts.set(d.tecnologia, (counts.get(d.tecnologia) ?? 0) + 1)
    return TECNOLOGIA_ORDER.filter(t => (counts.get(t) ?? 0) > 0).map(t => ({ t, n: counts.get(t)! }))
  }, [dots])
  const nPrioridade = dots.filter(d => d.prioridade).length
  const nBloqueio = showBloqueioBadge ? dots.filter(d => d.bloqueio).length : 0

  return (
    <button
      onClick={onClick}
      title={`${dominio} · ${colunaLabel} — ${dots.length} epics`}
      style={{
        width: '100%', height: CHIP_HEIGHT, flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5, padding: '0 5px', boxSizing: 'border-box',
        background: theme.accentLighter, border: `1px solid ${theme.accentLight}`, borderRadius: 5, textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, lineHeight: 1, flexShrink: 0 }}>
        {dots.length}
      </span>
      <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {porTecnologia.map(({ t, n }) => (
          <span key={t} style={{ width: 7, height: 7, borderRadius: '50%', background: TECNOLOGIA_COLORS[t] }} title={`${n} ${TECNOLOGIA_LABELS[t]}`} />
        ))}
      </span>
      {(nPrioridade > 0 || nBloqueio > 0) && (
        <span style={{ display: 'flex', gap: 4, fontSize: 8, fontWeight: 700, color: '#6B7280', marginLeft: 'auto', flexShrink: 0 }}>
          {nPrioridade > 0 && <span>★{nPrioridade}</span>}
          {nBloqueio > 0 && <span>⛔{nBloqueio}</span>}
        </span>
      )}
    </button>
  )
}

function Cell({
  dots, rowHeight, dominio, colunaLabel, theme, showBloqueioBadge, onSelectEpic, onSelectOverflow,
}: {
  dots: GovernancaDot[]
  rowHeight: number
  dominio: string
  colunaLabel: string
  theme: GovernancaTheme
  showBloqueioBadge: boolean
  onSelectEpic: (e: EpicDetail) => void
  onSelectOverflow: (title: string, epics: EpicDetail[]) => void
}) {
  const capacidade = capacidadeCelula(rowHeight)
  const ordenados = useMemo(() => [...dots].sort((a, b) => hashKey(a.epic.key) - hashKey(b.epic.key)), [dots])
  const wrapStyle = {
    width: CELL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' as const,
    gap: CHIP_GAP, padding: '3px 4px', boxSizing: 'border-box' as const, overflow: 'hidden', flexShrink: 0,
  }

  if (ordenados.length === 0) return <div style={wrapStyle} />

  if (ordenados.length <= capacidade) {
    return (
      <div style={wrapStyle}>
        {ordenados.map(dot => (
          <Chip key={dot.epic.key} dot={dot} showBloqueioBadge={showBloqueioBadge} onClick={() => onSelectEpic(dot.epic)} />
        ))}
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <SummaryTile
        dots={ordenados}
        dominio={dominio}
        colunaLabel={colunaLabel}
        theme={theme}
        showBloqueioBadge={showBloqueioBadge}
        onClick={() => onSelectOverflow(`${dominio} · ${colunaLabel}`, ordenados.map(d => d.epic))}
      />
    </div>
  )
}

const DEFAULT_THEME: GovernancaTheme = { accent: CLARO_RED, accentLight: CLARO_LIGHT, accentLighter: CLARO_LIGHTER, ramp: RAMP }

export default function GovernancaSlide({
  data,
  titulo = 'Governança',
  tituloDestaque = 'beOn Labs',
  totalLabel = 'Total de Epics',
  filename = 'weekly-governanca-beon-labs',
  theme = DEFAULT_THEME,
  showBloqueioBadge = true,
  emptyState,
  onMaximize,
}: {
  data: GovernancaData
  titulo?: string
  tituloDestaque?: string
  totalLabel?: string
  filename?: string
  theme?: GovernancaTheme
  showBloqueioBadge?: boolean
  emptyState?: string
  onMaximize?: () => void
}) {
  const slideRef = useRef<HTMLDivElement>(null)
  const [selectedEpic, setSelectedEpic] = useState<EpicDetail | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ title: string; epics: EpicDetail[] } | null>(null)

  // Altura de linha em px FIXO (não flex:1/flexBasis:0) de propósito: o
  // html2canvas usado no export não respeita flex-grow+maxHeight em linhas
  // dinâmicas — a altura sai certinha no navegador ao vivo, mas cada linha
  // "encolhe" no PNG exportado e sobra espaço em branco embaixo. Um valor em
  // px fixo, calculado a partir dos mesmos números usados no layout, reproduz
  // igual nos dois casos.
  const numRows = Math.max(1, data.domains.length)
  const rowsArea = 720 - 20 - 16 /* padding do slide */ - 57 /* cabeçalho, medido */ - 29 /* legenda, medida */ - HEADER_H - 8 * 3 /* gaps entre blocos */
  // Só o gap do flex entre linhas conta como altura extra — o paddingTop da
  // borda de separação NÃO soma (box-sizing:border-box faz o padding caber
  // dentro da altura fixa da própria linha, não crescer o container).
  const extraPorLinha = (numRows - 1) * GRID_GAP
  const rowHeight = Math.max(30, Math.floor((rowsArea - extraPorLinha) / numRows))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <SlideDownloadButtons targetRef={slideRef} filename={filename} onMaximize={onMaximize} />
      </div>

      {/* ═══ Slide 1280×720 (16:9 — dimensão de slide de PowerPoint) ═══ */}
      <div className="rounded-2xl shadow-xl" style={{ width: 1280, overflow: 'hidden', boxShadow: '0 12px 40px rgba(17,24,39,0.14)' }}>
        <div
          ref={slideRef}
          style={{
            width: 1280, height: 720, background: '#FFFFFF', padding: '20px 24px 16px',
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Jornada de Experimentação · Weekly
              </div>
              <div style={{ fontSize: 25, fontWeight: 800, color: '#111827', marginTop: 3, letterSpacing: -0.3 }}>
                {titulo} <span style={{ color: theme.accent }}>{tituloDestaque}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {totalLabel}
                </div>
                <div style={{ fontSize: 29, fontWeight: 800, color: theme.accent, lineHeight: 1 }}>
                  {data.totalEpics}
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: '#E5E7EB' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jira/logobeonlabs.png" alt="beOn Labs" style={{ height: 32, width: 'auto' }} />
            </div>
          </div>

          {/* Legendas: sub-status + tipo de tecnologia */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9.5, borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '6px 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9 }}>Sub-status</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={7} color="#78350F" strokeWidth={3} fill="#78350F" />
                </span>
                <span style={{ color: '#374151', fontWeight: 600 }}>Prioridade</span>
              </span>
              {showBloqueioBadge && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={7} color="#FFFFFF" strokeWidth={3} />
                  </span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>Bloqueio</span>
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9 }}>Tipo de Tecnologia</span>
              {TECNOLOGIA_ORDER.map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: TECNOLOGIA_COLORS[t], flexShrink: 0 }} />
                  <span style={{ color: '#374151', fontWeight: 600 }}>{TECNOLOGIA_LABELS[t]}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Esteira de experimentação — cabeçalho das colunas em formato de
              funil conectado (mesma técnica de chevron do slide de pipeline),
              deixando visualmente claro que é uma esteira única: as 3
              primeiras fases olham o status do próprio Epic (board de
              Experimentação); as 3 últimas, o status da Iniciativa-mãe no
              board de Ideação. */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: DOMAIN_COL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Domínio
              </span>
            </div>
            {data.columns.map((col, i) => {
              const notch = 10
              const isFirst = i === 0
              const isLast = i === data.columns.length - 1
              const clipPath = isFirst
                ? `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%)`
                : isLast
                  ? `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${notch}px 50%)`
                  : `polygon(0% 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, 0% 100%, ${notch}px 50%)`
              const Icon = COLUMN_ICONS[i]
              return (
                <div key={col.id} style={{
                  width: CELL_WIDTH, flexShrink: 0, marginLeft: isFirst ? 0 : -notch, clipPath,
                  background: theme.ramp[i], boxSizing: 'border-box',
                  paddingLeft: isFirst ? 10 : notch + 8, paddingRight: isLast ? 8 : notch + 10,
                  paddingTop: 5, paddingBottom: 5,
                  display: 'flex', alignItems: 'center', gap: 5, height: HEADER_H,
                }}>
                  <Icon size={15} color="#FFFFFF" strokeWidth={2.25} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, width: '100%', overflowWrap: 'break-word' }}>
                      {truncate(col.label, 16)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{col.total}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Linhas — uma por Domínio, altura fixa calculada acima. */}
          {data.domains.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, color: '#9CA3AF', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                {emptyState ?? 'Nenhum item nesta visão.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: GRID_GAP, overflow: 'hidden' }}>
              {data.domains.map((row, i) => (
                <div key={row.dominio} style={{
                  display: 'flex', gap: GRID_GAP, height: rowHeight, flexShrink: 0,
                  borderTop: i === 0 ? 'none' : '1px solid #F3F4F6', paddingTop: i === 0 ? 0 : GRID_GAP,
                }}>
                  <div style={{
                    width: DOMAIN_COL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 10.5, fontWeight: 800, color: '#111827', letterSpacing: 0.1,
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: theme.accentLight, color: theme.accent,
                      fontSize: 9.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {row.total}
                    </span>
                    <span style={{ overflowWrap: 'break-word', minWidth: 0 }}>{row.dominio}</span>
                  </div>
                  {row.columns.map(col => (
                    <Cell
                      key={col.id}
                      dots={col.dots}
                      rowHeight={rowHeight}
                      dominio={row.dominio}
                      colunaLabel={col.label}
                      theme={theme}
                      showBloqueioBadge={showBloqueioBadge}
                      onSelectEpic={setSelectedEpic}
                      onSelectOverflow={(title, epics) => setSelectedCell({ title, epics })}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEpic && <ExperimentoModal epic={selectedEpic} onClose={() => setSelectedEpic(null)} />}
      {selectedCell && (
        <EpicModal title={selectedCell.title} epics={selectedCell.epics} onClose={() => setSelectedCell(null)} />
      )}
    </div>
  )
}
