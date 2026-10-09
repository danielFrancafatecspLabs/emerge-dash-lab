'use client'

import type { ReactNode } from 'react'
import { CornerUpLeft, Star } from 'lucide-react'
import type { SemanalRow, SemanalSecaoId } from '@/lib/semanal'
import { formatBeneficioMM } from '@/lib/report-utils'
import { SLIDE_H, SLIDE_W } from './SlideArt'

// Slide de lista ("Em escala", "Aguardando Piloto", ...): uma linha por
// experimento e, na coluna Laboratório, uma caixa por sequência de linhas do
// mesmo laboratório — como no deck do Comitê.

const TITLE_RED = '#A30000'
const INK = '#1F2328'
const MUTED = '#6B7280'
const BORDER = '#E3E5E8'

export const LINHAS_POR_PAGINA: Record<SemanalSecaoId, number> = {
  escala: 8, aguardando: 8, piloto: 8, andamento: 10, backlog: 8,
}

/** Cor do laboratório responsável (mesma legenda do deck). */
export function corDoLab(lab: string | null): string {
  const l = (lab ?? '').toLowerCase()
  if (l.includes('hitss')) return '#0E9AA7'
  if (l.includes('engenharia')) return '#E8838A'
  if (l.includes('dados')) return '#E67E22'
  if (l.includes('coe')) return '#D4A017'
  if (l.includes('neg')) return '#8B0000'
  if (l.includes('beon')) return '#CC0000'
  return '#94A3B8'
}

type Coluna = { id: string; label: string; w: number }

function colunasDa(secao: SemanalSecaoId): Coluna[] {
  const fim: Coluna[] = [
    { id: 'lab', label: 'Laboratório', w: 120 }, { id: 'diretor', label: 'Diretor/ Ponto focal', w: 122 },
    { id: 'area', label: 'Área', w: 86 }, { id: 'beneficio', label: 'Benefício potencial', w: 80 },
  ]
  if (secao === 'escala') {
    return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 }, { id: 'descricao', label: 'Descrição', w: 440 },
      { id: 'observacao', label: 'Observação', w: 140 }, ...fim]
  }
  if (secao === 'andamento') {
    return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 }, { id: 'descricao', label: 'Descrição', w: 284 },
      { id: 'fase', label: 'Fase / Pendências', w: 186 }, { id: 'previsao', label: 'Previsão de conclusão', w: 110 }, ...fim]
  }
  return [{ id: 'nome', label: 'Nome da iniciativa', w: 224 },
    { id: 'descricao', label: secao === 'backlog' ? 'Objetivo' : 'Descrição', w: 330 },
    { id: 'situacao', label: 'Sit. atual / Pendências', w: 250 }, ...fim]
}

function formatData(iso: string | null): string {
  if (!iso) return 'TBD'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return d && m && a ? `${d}/${m}/${a}` : 'TBD'
}

function chipCor(texto: string): { bg: string; fg: string } {
  const t = texto.toLowerCase()
  if (t.includes('suspens')) return { bg: '#EEF0F3', fg: '#4B5563' }
  if (t.includes('pendente') || t.includes('falta') || t.includes('bloque') || t.includes('aguard')) return { bg: '#FDF3D7', fg: '#7A5A00' }
  return { bg: '#DCEEF7', fg: '#1F4E66' }
}

const clamp = (linhas: number): React.CSSProperties => ({
  display: '-webkit-box', WebkitLineClamp: linhas, WebkitBoxOrient: 'vertical', overflow: 'hidden',
})

function Celula({ coluna, row, rowH }: { coluna: Coluna; row: SemanalRow; rowH: number }): ReactNode {
  const linhas = Math.max(2, Math.floor((rowH - 10) / 15))
  switch (coluna.id) {
    case 'nome':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {row.estrategico && <Star size={22} color="#CC0000" strokeWidth={1.6} style={{ flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.25, ...clamp(2) }}>{row.nome}</div>
            <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>{row.key}</div>
          </div>
        </div>
      )
    case 'descricao':
      return <div style={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.35, ...clamp(Math.min(4, linhas)) }}>{row.descricao}</div>
    case 'observacao':
      return <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.3, ...clamp(3) }}>{row.situacao ?? 'Sem visibilidade'}</div>
    case 'situacao':
      return (
        <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.3, ...clamp(Math.min(4, linhas)) }}>
          <b style={{ color: row.situacao ? INK : '#CC0000' }}>Sit. Atual:</b> {row.situacao ?? 'Não informada'}<br />
          <b>Pendência:</b> {row.pendencia ?? '—'}
        </div>
      )
    case 'fase': {
      const texto = row.pendencia ?? row.fase
      const c = chipCor(texto)
      return (
        <div style={{ background: c.bg, color: c.fg, fontSize: 9.5, borderRadius: 999, padding: '5px 10px', textAlign: 'center', ...clamp(2) }}>{texto}</div>
      )
    }
    case 'previsao':
      return <div style={{ fontSize: 10.5, color: '#374151', textAlign: 'center' }}>{formatData(row.previsao)}</div>
    case 'diretor':
      return (
        <div style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.3, ...clamp(3) }}>
          {[row.diretor, row.pontoFocal].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ') || '—'}
        </div>
      )
    case 'area':
      return <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.3, ...clamp(2) }}>{row.area ?? '—'}</div>
    case 'beneficio': {
      const label = formatBeneficioMM(row.beneficio)
      const mapeado = row.beneficio !== null
      return <div style={{ fontSize: mapeado ? 12 : 10.5, fontWeight: mapeado ? 700 : 400, color: mapeado ? INK : '#B5BAC1', lineHeight: 1.25 }}>{label}</div>
    }
    default:
      return null
  }
}

export default function ListaSlide({ secao, titulo, subtitulo, rows, todas, pagina, onVoltar }: {
  secao: SemanalSecaoId
  titulo: string
  subtitulo?: string
  rows: SemanalRow[]       // linhas desta página
  todas: SemanalRow[]      // todas as linhas da seção (contador e legenda)
  pagina?: number
  onVoltar?: () => void
}) {
  const colunas = colunasDa(secao)
  const template = colunas.map(c => `${c.w}px`).join(' ')
  const labIdx = colunas.findIndex(c => c.id === 'lab')
  const porPagina = LINHAS_POR_PAGINA[secao]
  const TOP = 116, ALTURA_TABELA = 522
  const rowH = Math.floor(ALTURA_TABELA / porPagina)

  // Sequências de linhas do mesmo laboratório (uma caixa por sequência)
  const runs: { lab: string | null; ini: number; fim: number }[] = []
  rows.forEach((r, i) => {
    const ult = runs[runs.length - 1]
    if (ult && (ult.lab ?? '') === (r.lab ?? '')) ult.fim = i
    else runs.push({ lab: r.lab, ini: i, fim: i })
  })

  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: '#fff', color: INK,
      fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
      <div style={{ position: 'absolute', left: 34, top: 18, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: TITLE_RED }}>{titulo}</span>
        {subtitulo && <span style={{ fontSize: 19, fontWeight: 700, color: TITLE_RED }}>| {subtitulo}</span>}
      </div>
      <div style={{ position: 'absolute', left: 35, top: 54, fontSize: 13.5, color: TITLE_RED, letterSpacing: 1.5 }}>Lista de experimentos</div>
      <div style={{ position: 'absolute', right: 64, top: 36, display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: TITLE_RED }}>{todas.length}</span>
        <span style={{ fontSize: 22, color: '#8A8F98', letterSpacing: 6 }}>EXPERIMENTOS</span>
      </div>
      <button type="button" onClick={onVoltar} title="Voltar para a visão geral" style={{
        position: 'absolute', right: 18, top: 10, background: 'none', border: 'none', cursor: onVoltar ? 'pointer' : 'default', padding: 0,
      }}>
        <CornerUpLeft size={28} color="#CC0000" strokeWidth={2.6} />
      </button>

      {/* Cabeçalho */}
      <div style={{ position: 'absolute', left: 34, top: 88, display: 'grid', gridTemplateColumns: template, alignItems: 'end', height: 24 }}>
        {colunas.map(c => (
          <div key={c.id} style={{ fontSize: 9.5, color: '#6B7280', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px', lineHeight: 1.15,
            textAlign: ['lab', 'fase', 'previsao'].includes(c.id) ? 'center' : 'left' }}>{c.label}</div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{
        position: 'absolute', left: 26, top: TOP, width: 1228, height: rows.length * rowH + 8, border: `1px solid ${BORDER}`, borderRadius: 10,
      }} />
      <div style={{ position: 'absolute', left: 34, top: TOP + 4, display: 'grid', gridTemplateColumns: template, gridTemplateRows: `repeat(${rows.length}, ${rowH}px)` }}>
        {rows.map((row, i) => colunas.map((c, j) => c.id === 'lab' ? null : (
          <div key={`${row.key}-${c.id}`} style={{
            gridRow: i + 1, gridColumn: j + 1, padding: '0 8px', display: 'flex', alignItems: 'center', minWidth: 0,
            borderTop: i ? `1px solid #F0F1F3` : undefined, justifyContent: ['fase', 'previsao'].includes(c.id) ? 'center' : 'flex-start',
          }}>
            <div style={{ width: '100%' }}><Celula coluna={c} row={row} rowH={rowH} /></div>
          </div>
        )))}
        {labIdx >= 0 && runs.map(run => {
          const cor = corDoLab(run.lab)
          return (
            <div key={`lab-${run.ini}`} style={{ gridRow: `${run.ini + 1} / ${run.fim + 2}`, gridColumn: labIdx + 1, padding: '5px 6px' }}>
              <div style={{ height: '100%', border: `1.5px solid ${cor}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(15,23,42,0.08)', background: '#fff', padding: 4 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: cor, textAlign: 'center', lineHeight: 1.2 }}>{run.lab ?? 'Não definido'}</span>
              </div>
            </div>
          )
        })}
      </div>

      <Legenda rows={todas} />
      {pagina !== undefined && <span style={{ position: 'absolute', right: 10, bottom: 6, fontSize: 10, color: MUTED }}>{pagina}</span>}
    </div>
  )
}

function Legenda({ rows }: { rows: SemanalRow[] }) {
  const porLab = new Map<string, number>()
  for (const r of rows) porLab.set(r.lab ?? 'Não definido', (porLab.get(r.lab ?? 'Não definido') ?? 0) + 1)
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, borderTop: '1.5px solid #D9DCE1', display: 'flex', alignItems: 'stretch', fontSize: 10.5, color: '#6B7280' }}>
      <div style={{ width: 92, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>LEGENDAS:</div>
      <div style={{ borderLeft: '1px solid #E5E7EB', padding: '8px 18px' }}>
        Estratégico:
        <div style={{ marginTop: 6 }}><Star size={22} color="#4B5563" strokeWidth={1.4} /></div>
      </div>
      <div style={{ borderLeft: '1px solid #E5E7EB', padding: '8px 18px', flex: 1 }}>
        Qt. de Iniciativas + Laboratórios resp.:
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 6 }}>
          {[...porLab.entries()].sort((a, b) => b[1] - a[1]).map(([lab, n]) => (
            <span key={lab} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: corDoLab(lab) }}>
              <span style={{ width: 11, height: 11, border: `1.5px solid ${corDoLab(lab)}`, borderRadius: 3 }} />
              <b>{String(n).padStart(2, '0')}</b> {lab}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
